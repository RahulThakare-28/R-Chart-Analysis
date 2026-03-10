/**
 * Core type definitions for ChartScanAI
 */

// Timeframe types
export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';

// Action types
export type TradeAction = 'BUY' | 'SELL' | 'NEUTRAL';

/**
 * Quote - Current market price data
 */
export interface Quote {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
  broker: string;
}

/**
 * Candle - OHLCV candlestick data
 */
export interface Candle {
  symbol: string;
  timeframe: Timeframe;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: Date;
  broker: string;
}

/**
 * Candlestick Pattern Detection Result
 */
export interface CandlestickPattern {
  id?: string;
  name: string;
  symbol: string;
  timeframe: Timeframe;
  confidence: number; // 0-100
  candles: Candle[];
  timestamp: Date;
  action: TradeAction;
  broker: string;
  description?: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

/**
 * Pattern interpretation from Gemini AI
 */
export interface PatternInterpretation {
  summary: string;
  keyPoints: string[];
  confidence: number;
  bullishFactors?: string[];
  bearishFactors?: string[];
  historicalAccuracy?: number;
  recommendedTimeframes?: Timeframe[];
  source: 'gemini' | 'fallback';
}

/**
 * Trade recommendation from Gemini AI
 */
export interface TradeRecommendation {
  action: TradeAction;
  confidence: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskRewardRatio?: number;
  riskLevel: 'low' | 'medium' | 'high';
  reasoning?: string;
  timeframe?: Timeframe;
  source: 'gemini' | 'fallback';
}

/**
 * Market sentiment analysis from Gemini AI
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
 * Alert for detected patterns
 */
export interface Alert {
  id?: string;
  pattern: CandlestickPattern;
  userId?: string;
  status: 'active' | 'triggered' | 'closed';
  createdAt: Date;
  triggeredAt?: Date;
  closedAt?: Date;
  notificationsSent: boolean;
  priceAtCreation: number;
  analysis?: PatternAnalysis;
  source?: 'pattern-detector' | 'gemini-conversation' | 'manual';
}

/**
 * Subscription for alert notifications
 */
export interface AlertSubscription {
  id?: string;
  userId?: string;
  symbol: string;
  patterns: string[]; // Pattern names to watch for
  minConfidence: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  notificationChannels: {
    email?: boolean;
    sms?: boolean;
    inApp?: boolean;
    push?: boolean;
  };
}

/**
 * Broker Adapter Interface
 */
export interface IBrokerAdapter {
  name: string;
  authenticate(): Promise<void>;
  getQuotes(symbols: string[]): Promise<Quote[]>;
  getCandles(symbol: string, timeframe: Timeframe, limit?: number): Promise<Candle[]>;
  subscribeToUpdates(symbols: string[], callback: (update: Quote | Candle) => void): Promise<void>;
  unsubscribe(): Promise<void>;
}

/**
 * Data Aggregator Interface
 */
export interface IDataAggregator {
  registerBroker(broker: IBrokerAdapter): void;
  getQuotes(symbols: string[]): Promise<Quote[]>;
  getCandles(symbol: string, timeframe: Timeframe): Promise<Candle[]>;
  subscribeToUpdates(symbols: string[], callback: (update: any) => void): Promise<void>;
}

/**
 * Pattern Detection Result
 */
export interface PatternDetectionResult {
  patterns: CandlestickPattern[];
  timestamp: Date;
  symbol: string;
  timeframe: Timeframe;
}

/**
 * Error Response
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

/**
 * API Response Wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
  timestamp: Date;
}

/**
 * Broker Status
 */
export interface BrokerStatus {
  name: string;
  connected: boolean;
  lastSync: Date;
  symbolsAvailable: number;
  errorMessage?: string;
}
