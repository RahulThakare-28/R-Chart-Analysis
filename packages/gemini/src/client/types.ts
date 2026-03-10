/**
 * Gemini AI Client Types and Interfaces
 */

import { CandlestickPattern, Alert } from '@chartscanai/shared';

/**
 * Gemini API Configuration
 */
export interface GeminiConfig {
  apiKey?: string;
  enabled: boolean;
  model: string;
  cache: {
    enabled: boolean;
    ttl: number;
  };
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

/**
 * Live session with Gemini for streaming conversations
 */
export interface GeminiSession {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  streamUrl?: string;
  conversationHistory: Message[];
  metadata: SessionMetadata;
}

/**
 * Chat message in conversation
 */
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokensUsed?: number;
}

/**
 * Session metadata for tracking
 */
export interface SessionMetadata {
  userId?: string;
  type: 'live' | 'batch';
  alerts?: Alert[];
  marketContext?: Record<string, any>;
  startedAt: Date;
  lastActivityAt: Date;
  messageCount: number;
}

/**
 * Pattern analysis result from Gemini
 */
export interface PatternInterpretation {
  summary: string;
  keyPoints: string[];
  confidence: number;
  bullishFactors?: string[];
  bearishFactors?: string[];
  historicalAccuracy?: number;
  recommendedTimeframes?: string[];
  source: 'gemini' | 'fallback';
}

/**
 * Trade recommendation from Gemini
 */
export interface TradeRecommendation {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskRewardRatio?: number;
  riskLevel: 'low' | 'medium' | 'high';
  reasoning?: string;
  timeframe?: string;
  source: 'gemini' | 'fallback';
}

/**
 * Market sentiment analysis
 */
export interface SentimentAnalysis {
  overall: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  indicators: {
    name: string;
    value: number;
  }[];
  summary?: string;
  source: 'gemini' | 'fallback';
}

/**
 * Complete pattern analysis with all insights
 */
export interface PatternAnalysis {
  interpretation?: PatternInterpretation;
  recommendation?: TradeRecommendation;
  sentiment?: SentimentAnalysis;
  enhancedAt: Date;
}

/**
 * Gemini analysis result with metadata
 */
export interface GeminiAnalysisResult {
  content: string;
  confidence: number;
  timestamp: Date;
  tokensUsed: number;
}

/**
 * Conversation session for user interface
 */
export interface ConversationSession {
  id: string;
  createdAt: Date;
  streamUrl?: string;
  isActive: boolean;
}

/**
 * Conversation stored in database
 */
export interface StoredConversation {
  sessionId: string;
  userId?: string;
  messages: Message[];
  metadata: SessionMetadata;
  createdAt: Date;
  closedAt?: Date;
}

/**
 * Error response from Gemini API
 */
export interface GeminiError {
  code: string;
  message: string;
  status?: number;
  retryable: boolean;
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  requestsPerMinute: number;
  tokensPerMinute: number;
  currentUsage: {
    requests: number;
    tokens: number;
  };
}
