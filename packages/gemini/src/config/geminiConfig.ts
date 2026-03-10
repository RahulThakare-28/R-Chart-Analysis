/**
 * Gemini Configuration Loader
 * Loads Gemini settings from environment and provides default values
 */

import { GeminiConfig } from '../client/types';
import defaultConfig from './defaults.json';
import { logger } from '@chartscanai/shared';

export class GeminiConfigLoader {
  private config: GeminiConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Load Gemini configuration from environment and defaults
   */
  private loadConfig(): GeminiConfig {
    const config: GeminiConfig = {
      apiKey: process.env.GEMINI_API_KEY?.trim(),
      enabled: this.shouldEnable(),
      model: process.env.GEMINI_MODEL || defaultConfig.model,
      cache: {
        enabled: process.env.GEMINI_CACHE_ENABLED !== 'false',
        ttl: parseInt(process.env.GEMINI_CACHE_TTL || defaultConfig.cache.ttl.toString(), 10),
      },
      rateLimits: {
        requestsPerMinute: parseInt(
          process.env.GEMINI_RPM || defaultConfig.rateLimits.requestsPerMinute.toString(),
          10
        ),
        tokensPerMinute: parseInt(
          process.env.GEMINI_TPM || defaultConfig.rateLimits.tokensPerMinute.toString(),
          10
        ),
      },
    };

    // Validate configuration
    this.validateConfig(config);

    return config;
  }

  /**
   * Determine if Gemini should be enabled
   */
  private shouldEnable(): boolean {
    // Check explicit disable flag
    if (process.env.GEMINI_ENABLED === 'false') {
      return false;
    }

    // Check if API key is present
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim().length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Validate Gemini configuration
   */
  private validateConfig(config: GeminiConfig): void {
    if (!config.enabled) {
      logger.info('Gemini AI integration is disabled');
      return;
    }

    if (!config.apiKey) {
      logger.warn('Gemini API key not configured, disabling Gemini features');
      config.enabled = false;
      return;
    }

    if (config.cache.ttl < 60) {
      logger.warn('Gemini cache TTL too low (< 60s), setting to 300s minimum');
      config.cache.ttl = 300;
    }

    if (config.rateLimits.requestsPerMinute < 1) {
      logger.warn('Gemini RPM too low, setting to 1 request per minute');
      config.rateLimits.requestsPerMinute = 1;
    }

    logger.info(
      `Gemini AI enabled: model=${config.model}, cache=${config.cache.enabled}, rpm=${config.rateLimits.requestsPerMinute}`
    );
  }

  /**
   * Get complete Gemini configuration
   */
  getConfig(): GeminiConfig {
    return this.config;
  }

  /**
   * Check if Gemini is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get API key (returns undefined if not configured)
   */
  getApiKey(): string | undefined {
    return this.config.apiKey;
  }

  /**
   * Get model name
   */
  getModel(): string {
    return this.config.model;
  }

  /**
   * Get cache configuration
   */
  getCacheConfig() {
    return this.config.cache;
  }

  /**
   * Get rate limit configuration
   */
  getRateLimitConfig() {
    return this.config.rateLimits;
  }
}

// Create singleton instance
export const geminiConfig = new GeminiConfigLoader();
