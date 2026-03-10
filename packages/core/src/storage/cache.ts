/**
 * Cache Layer
 * Provides caching functionality with Redis and file-based fallback
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger, CACHE_CONFIG } from '@chartscanai/shared';

export interface ICacheLayer {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * File-based cache (fallback)
 */
export class FileCache implements ICacheLayer {
  private cacheDir: string;

  constructor(cacheDir: string = path.join(process.cwd(), 'cache')) {
    this.cacheDir = cacheDir;

    // Create cache directory if it doesn't exist
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    // Sanitize key to be filesystem-safe
    const sanitized = key.replace(/[^a-zA-Z0-9-_]/g, '_');
    return path.join(this.cacheDir, `${sanitized}.json`);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const filePath = this.getFilePath(key);

      if (!fs.existsSync(filePath)) {
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Check if expired
      if (data.expiresAt && new Date() > new Date(data.expiresAt)) {
        await this.delete(key);
        return null;
      }

      return data.value as T;
    } catch (error) {
      logger.warn(`Cache get error: ${error}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = CACHE_CONFIG.DEFAULT_TTL): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      const expiresAt = new Date(Date.now() + ttl * 1000);

      const data = {
        value,
        expiresAt,
        createdAt: new Date(),
      };

      fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
    } catch (error) {
      logger.warn(`Cache set error: ${error}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      logger.warn(`Cache delete error: ${error}`);
    }
  }

  async clear(): Promise<void> {
    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        fs.unlinkSync(path.join(this.cacheDir, file));
      }
      logger.info('Cache cleared');
    } catch (error) {
      logger.warn(`Cache clear error: ${error}`);
    }
  }
}

/**
 * In-memory cache
 */
export class MemoryCache implements ICacheLayer {
  private store = new Map<string, { value: any; expiresAt: Date }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);

    if (!item) {
      return null;
    }

    // Check if expired
    if (new Date() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, ttl: number = CACHE_CONFIG.DEFAULT_TTL): Promise<void> {
    const expiresAt = new Date(Date.now() + ttl * 1000);
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
    logger.info('In-memory cache cleared');
  }

  getSize(): number {
    return this.store.size;
  }
}

/**
 * Composite cache with fallback
 */
export class CacheLayer implements ICacheLayer {
  private primary: ICacheLayer;
  private fallback: ICacheLayer;

  constructor(primaryCache?: ICacheLayer, fallbackCache?: ICacheLayer) {
    this.primary = primaryCache || new MemoryCache();
    this.fallback = fallbackCache || new FileCache();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Try primary cache first
      const value = await this.primary.get<T>(key);
      if (value !== null) {
        return value;
      }

      // Fall back to secondary cache
      const fallbackValue = await this.fallback.get<T>(key);
      if (fallbackValue !== null) {
        // Restore to primary cache
        await this.primary.set(key, fallbackValue);
      }

      return fallbackValue;
    } catch (error) {
      logger.warn(`Cache retrieval error: ${error}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await Promise.all([
        this.primary.set(key, value, ttl),
        this.fallback.set(key, value, ttl),
      ]);
    } catch (error) {
      logger.warn(`Cache storage error: ${error}`);
    }
  }

  async delete(key: string): Promise<void> {
    await Promise.all([this.primary.delete(key), this.fallback.delete(key)]);
  }

  async clear(): Promise<void> {
    await Promise.all([this.primary.clear(), this.fallback.clear()]);
  }
}

// Export singleton instances
export const memoryCache = new MemoryCache();
export const fileCache = new FileCache();
export const cache = new CacheLayer(memoryCache, fileCache);
