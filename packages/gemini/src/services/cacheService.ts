import { logger } from '@chartscanai/shared';
import * as fs from 'fs/promises';
import * as path from 'path';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * CacheService: Multi-layer cache (memory + file-based persistence)
 * - Memory layer: Fast in-process cache for hot data
 * - File layer: Persistent cache that survives restarts
 * - TTL validation: Automatic expiration of old entries
 */
export class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private fileCachePath: string;
  private defaultTtlSeconds: number;
  private cleanupInterval: NodeJS.Timer | null = null;

  constructor(defaultTtlSeconds: number = 3600, fileCachePath?: string) {
    this.defaultTtlSeconds = defaultTtlSeconds;
    this.fileCachePath = fileCachePath || path.join(process.cwd(), '.gemini_cache');

    // Ensure cache directory exists
    this._ensureCacheDirectory();

    // Start periodic cleanup of expired entries
    this._startCleanupInterval();

    logger.debug(`CacheService initialized (TTL: ${defaultTtlSeconds}s, path: ${this.fileCachePath})`);
  }

  /**
   * Get value from cache (checks memory first, then file)
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try memory layer first (fast)
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && !this._isExpired(memoryEntry)) {
        logger.debug(`[Cache] Memory hit: ${key}`);
        return memoryEntry.value as T;
      }

      // Try file layer (persistent)
      const fileEntry = await this._fileGet<T>(key);
      if (fileEntry && !this._isExpired(fileEntry)) {
        // Promote to memory cache for faster future access
        this.memoryCache.set(key, fileEntry);
        logger.debug(`[Cache] File hit (promoted to memory): ${key}`);
        return fileEntry.value as T;
      }

      logger.debug(`[Cache] Miss: ${key}`);
      return null;
    } catch (error) {
      logger.warn(`[Cache] Error retrieving ${key}`, error);
      return null;
    }
  }

  /**
   * Set value in cache (both memory and file)
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const ttl = ttlSeconds ?? this.defaultTtlSeconds;
      const entry: CacheEntry<T> = {
        value,
        expiresAt: Date.now() + ttl * 1000,
      };

      // Write to memory layer (fast)
      this.memoryCache.set(key, entry);

      // Write to file layer (persistent)
      await this._fileSet(key, entry);

      logger.debug(`[Cache] Set ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.warn(`[Cache] Error setting ${key}`, error);
      // Don't throw - cache failures shouldn't break the system
    }
  }

  /**
   * Delete entry from both cache layers
   */
  async delete(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key);
      await this._fileDelete(key);
      logger.debug(`[Cache] Deleted ${key}`);
    } catch (error) {
      logger.warn(`[Cache] Error deleting ${key}`, error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      this.memoryCache.clear();
      await this._fileClear();
      logger.debug('[Cache] Cleared all entries');
    } catch (error) {
      logger.warn('[Cache] Error clearing cache', error);
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): {
    memorySize: number;
    memoryUsage: number;
    fileCachePath: string;
  } {
    return {
      memorySize: this.memoryCache.size,
      memoryUsage: Math.round(Buffer.byteLength(JSON.stringify(this._getMemoryCacheDebugInfo()), 'utf8') / 1024),
      fileCachePath: this.fileCachePath,
    };
  }

  /**
   * Destroy cache service and stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.memoryCache.clear();
    logger.debug('[Cache] Service destroyed');
  }

  // ============ PRIVATE METHODS ============

  /**
   * Private: Check if cache entry is expired
   */
  private _isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Private: Get value from file cache
   */
  private async _fileGet<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const filePath = this._getCacheFilePath(key);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as CacheEntry<T>;
    } catch {
      return null;
    }
  }

  /**
   * Private: Set value in file cache
   */
  private async _fileSet(key: string, entry: CacheEntry<any>): Promise<void> {
    const filePath = this._getCacheFilePath(key);
    await fs.writeFile(filePath, JSON.stringify(entry), 'utf-8');
  }

  /**
   * Private: Delete file from cache
   */
  private async _fileDelete(key: string): Promise<void> {
    const filePath = this._getCacheFilePath(key);
    try {
      await fs.unlink(filePath);
    } catch {
      // File may not exist
    }
  }

  /**
   * Private: Clear all files in cache directory
   */
  private async _fileClear(): Promise<void> {
    try {
      const files = await fs.readdir(this.fileCachePath);
      await Promise.all(
        files
          .filter((f) => f.endsWith('.cache'))
          .map((f) => fs.unlink(path.join(this.fileCachePath, f)))
      );
    } catch {
      // Directory may not exist
    }
  }

  /**
   * Private: Get cache file path for key
   */
  private _getCacheFilePath(key: string): string {
    // Sanitize key to valid filename
    const safeKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
    return path.join(this.fileCachePath, `${safeKey}.cache`);
  }

  /**
   * Private: Ensure cache directory exists
   */
  private async _ensureCacheDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.fileCachePath, { recursive: true });
    } catch (error) {
      logger.warn(`Failed to create cache directory: ${this.fileCachePath}`, error);
    }
  }

  /**
   * Private: Start periodic cleanup of expired entries
   */
  private _startCleanupInterval(): void {
    // Run cleanup every 30 minutes
    this.cleanupInterval = setInterval(async () => {
      try {
        // Clean memory cache
        for (const [key, entry] of this.memoryCache.entries()) {
          if (this._isExpired(entry)) {
            this.memoryCache.delete(key);
          }
        }

        // Clean file cache
        try {
          const files = await fs.readdir(this.fileCachePath);
          for (const file of files) {
            if (!file.endsWith('.cache')) continue;
            const filePath = path.join(this.fileCachePath, file);
            const data = await fs.readFile(filePath, 'utf-8');
            const entry = JSON.parse(data) as CacheEntry<any>;
            if (this._isExpired(entry)) {
              await fs.unlink(filePath);
            }
          }
        } catch {
          // Cleanup errors are not critical
        }

        logger.debug(`[Cache] Cleanup completed (${this.memoryCache.size} memory entries)`);
      } catch (error) {
        logger.warn('[Cache] Cleanup failed', error);
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  /**
   * Private: Get debug info from memory cache
   */
  private _getMemoryCacheDebugInfo(): Record<string, any> {
    const entries: Record<string, { expiresAt: string; size: number }> = {};
    for (const [key, entry] of this.memoryCache.entries()) {
      entries[key] = {
        expiresAt: new Date(entry.expiresAt).toISOString(),
        size: JSON.stringify(entry.value).length,
      };
    }
    return entries;
  }
}
