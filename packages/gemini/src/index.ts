/**
 * Gemini AI Integration - Main Export
 *
 * Exports singleton services following the existing ChartScanAI pattern
 * (similar to patternEngine, dataAggregator from @chartscanai/core)
 */

import { GeminiClient } from './client/geminiClient';
import { geminiConfig } from './config/geminiConfig';
import { RateLimitManager } from './middleware/rateLimitManager';
import { CacheService } from './services/cacheService';
import { PatternInterpreterAdapter } from './adapters/patternInterpreter';
import { TradeAdviserAdapter } from './adapters/tradeAdviser';
import { SentimentAnalyzerAdapter } from './adapters/sentimentAnalyzer';
import { AlertEnhancementService } from './services/enhancementService';

// ============ SERVICE INITIALIZATION ============
// Following singleton pattern from core/patterns/engine.ts and core/brokers/aggregator.ts

// Get configuration
const gConfig = geminiConfig;
const configObject = gConfig.getConfig();

// Initialize Gemini client with API key from config
const client = new GeminiClient(configObject.apiKey || '', configObject.model);

// Initialize rate limiter with configured limits
const rateLimitConfig = configObject.rateLimits;
const rateLimiter = new RateLimitManager(
  rateLimitConfig.requestsPerMinute,
  rateLimitConfig.tokensPerMinute
);

// Initialize cache service with configured TTL
const cacheConfig = configObject.cache;
const cache = new CacheService(cacheConfig.ttl);

// Initialize concrete adapters with shared dependencies
const patternInterpreter = new PatternInterpreterAdapter(client, rateLimiter, cache, configObject);
const tradeAdviser = new TradeAdviserAdapter(client, rateLimiter, cache, configObject);
const sentimentAnalyzer = new SentimentAnalyzerAdapter(client, rateLimiter, cache, configObject);

// Initialize enhancement service orchestrator
export const enhancementService = new AlertEnhancementService(
  patternInterpreter,
  tradeAdviser,
  sentimentAnalyzer,
  configObject
);

// ============ EXPORTS ============

// Export types
export * from './client/types';

// Export configuration
export { GeminiConfigLoader, geminiConfig } from './config/geminiConfig';

// Export error handling
export { GeminiErrorHandler } from './middleware/geminiErrorHandler';

// Export middleware
export { RateLimitManager } from './middleware/rateLimitManager';

// Export adapters and services
export { BaseGeminiAdapter, type AnalysisInput, type AnalysisResult } from './adapters/baseAdapter';
export { CacheService } from './services/cacheService';
export { PatternInterpreterAdapter } from './adapters/patternInterpreter';
export { TradeAdviserAdapter } from './adapters/tradeAdviser';
export { SentimentAnalyzerAdapter } from './adapters/sentimentAnalyzer';
export { AlertEnhancementService } from './services/enhancementService';

// Export singleton instances (main services)
export { client as geminiClient, rateLimiter, cache };

// Export types for convenience
export type {
  GeminiConfig,
  GeminiSession,
  Message,
  PatternInterpretation,
  TradeRecommendation,
  SentimentAnalysis,
  PatternAnalysis,
  GeminiAnalysisResult,
  ConversationSession,
  StoredConversation,
} from './client/types';
