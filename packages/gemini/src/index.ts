/**
 * Gemini AI Integration - Main Export
 */

// Export types
export * from './client/types';

// Export client
export { GeminiClient } from './client/geminiClient';

// Export configuration
export { GeminiConfigLoader, geminiConfig } from './config/geminiConfig';

// Export error handling
export { GeminiErrorHandler } from './middleware/geminiErrorHandler';

// Re-export for convenience
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
