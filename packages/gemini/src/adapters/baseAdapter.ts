import { logger } from '@chartscanai/shared';
import { GeminiClient } from '../client/geminiClient';
import { GeminiConfig } from '../client/types';
import { RateLimitManager } from '../middleware/rateLimitManager';
import { CacheService } from './cacheService';
import crypto from 'crypto';

/**
 * Analysis request input structure
 */
export interface AnalysisInput {
  type: string;
  data: Record<string, any>;
  cacheKeyData?: Record<string, any>; // Optional custom cache key data
}

/**
 * Analysis result structure
 */
export interface AnalysisResult {
  source: 'gemini' | 'fallback';
  cached?: boolean;
  [key: string]: any;
}

/**
 * BaseGeminiAdapter: Abstract base class for all Gemini analysis adapters
 * Implements Template Method pattern with common logic:
 * - Caching with multi-layer storage
 * - Rate limit checking before API calls
 * - Error handling with graceful fallback
 * - Retry logic with exponential backoff
 * - Logging of all analysis attempts
 *
 * Concrete adapters should:
 * 1. Extend this class
 * 2. Implement the abstract doAnalysis() method
 * 3. Use analyze() to get the full workflow
 *
 * Example:
 * ```typescript
 * class MyAdapter extends BaseGeminiAdapter {
 *   protected async doAnalysis(input: AnalysisInput): Promise<AnalysisResult> {
 *     const prompt = this.buildPrompt(input.data);
 *     const response = await this.client.analyzePattern(prompt);
 *     return this.parseResponse(response);
 *   }
 * }
 * ```
 */
export abstract class BaseGeminiAdapter {
  protected client: GeminiClient;
  protected rateLimiter: RateLimitManager;
  protected cache: CacheService;
  protected config: GeminiConfig;
  protected adapterName: string;

  constructor(
    client: GeminiClient,
    rateLimiter: RateLimitManager,
    cache: CacheService,
    config: GeminiConfig,
    adapterName: string = 'BaseAdapter'
  ) {
    this.client = client;
    this.rateLimiter = rateLimiter;
    this.cache = cache;
    this.config = config;
    this.adapterName = adapterName;
  }

  /**
   * Main template method for analysis workflow
   * Orchestrates: cache check → rate limit → execute → parse → cache result
   */
  async analyze(input: AnalysisInput, tokenEstimate: number = 100): Promise<AnalysisResult> {
    try {
      // Step 1: Generate cache key
      const cacheKey = this.generateCacheKey(input);

      // Step 2: Check cache first
      const cached = await this.cache.get<AnalysisResult>(cacheKey);
      if (cached) {
        logger.debug(`[${this.adapterName}] Cache hit for ${input.type}`);
        return { ...cached, cached: true };
      }

      // Step 3: Check if Gemini is enabled
      if (!this.config.enabled || !this.client.isInitialized()) {
        logger.warn(`[${this.adapterName}] Gemini not available, using fallback`);
        const fallback = await this.getFallbackResponse(input);
        return { ...fallback, source: 'fallback' };
      }

      // Step 4: Wait for rate limit capacity
      await this.rateLimiter.waitForCapacity(tokenEstimate);

      // Step 5: Execute analysis with retry logic
      const result = await this.executeWithRetry(
        () => this.doAnalysis(input),
        3 // max retries
      );

      // Step 6: Record rate limit usage
      this.rateLimiter.recordUsage(tokenEstimate);

      // Step 7: Cache result
      const cacheResult = { ...result, source: 'gemini' as const };
      const ttl = this.config.cache?.ttl ?? 3600;
      await this.cache.set(cacheKey, cacheResult, ttl);

      logger.debug(`[${this.adapterName}] Analysis completed and cached for ${input.type}`);
      return cacheResult;
    } catch (error) {
      logger.error(`[${this.adapterName}] Analysis failed, attempting fallback`, error);
      const fallback = await this.getFallbackResponse(input);
      return { ...fallback, source: 'fallback' };
    }
  }

  /**
   * Abstract method that concrete adapters must implement
   * This is where the actual Gemini API call happens
   */
  protected abstract doAnalysis(input: AnalysisInput): Promise<AnalysisResult>;

  /**
   * Fallback response when Gemini is unavailable
   * Concrete adapters should override this for specific fallbacks
   */
  protected async getFallbackResponse(input: AnalysisInput): Promise<AnalysisResult> {
    logger.debug(`[${this.adapterName}] Using default fallback for ${input.type}`);
    return {
      source: 'fallback',
      message: 'Gemini analysis unavailable, please try again later',
    };
  }

  /**
   * Generate cache key from input data
   * Uses SHA256 hash for consistent key generation
   */
  protected generateCacheKey(input: AnalysisInput): string {
    const keyData = input.cacheKeyData ?? input.data;
    const dataString = JSON.stringify({ type: input.type, data: keyData });
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');
    return `${this.adapterName}:${hash}`;
  }

  /**
   * Execute function with exponential backoff retry logic
   */
  protected async executeWithRetry(
    fn: () => Promise<AnalysisResult>,
    maxRetries: number = 3,
    initialDelayMs: number = 1000
  ): Promise<AnalysisResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        const isRetryable = this.isRetryableError(lastError);
        const isLastAttempt = attempt === maxRetries;

        if (!isRetryable || isLastAttempt) {
          throw lastError;
        }

        // Exponential backoff: 1s, 2s, 4s, etc.
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        logger.warn(
          `[${this.adapterName}] Retry attempt ${attempt + 1}/${maxRetries} after ${delayMs}ms`,
          lastError.message
        );

        await this._sleep(delayMs);
      }
    }

    throw lastError;
  }

  /**
   * Determine if error is retryable (vs permanent failure)
   */
  protected isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Retryable errors:
    // - Network timeouts
    // - Rate limits (429)
    // - Server errors (5xx)
    // - Temporary failures

    if (message.includes('timeout') || message.includes('econnrefused')) {
      return true;
    }
    if (message.includes('429') || message.includes('rate limit')) {
      return true;
    }
    if (message.includes('503') || message.includes('service unavailable')) {
      return true;
    }
    if (message.includes('500') || message.includes('internal server')) {
      return true;
    }

    // Non-retryable errors:
    // - 401/403 auth failures
    // - 400 bad request
    if (message.includes('401') || message.includes('403') || message.includes('unauthorized')) {
      return false;
    }
    if (message.includes('400') || message.includes('bad request')) {
      return false;
    }

    // Default: assume retryable
    return true;
  }

  /**
   * Private: Sleep utility for delays
   */
  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get adapter status for debugging
   */
  getStatus(): Record<string, any> {
    return {
      adapter: this.adapterName,
      enabled: this.config.enabled,
      clientInitialized: this.client.isInitialized(),
      rateLimit: this.rateLimiter.getRemainingCapacity(),
    };
  }
}
