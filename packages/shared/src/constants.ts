/**
 * Shared Constants
 */

// Candlestick Patterns
export const CANDLESTICK_PATTERNS = {
  ENGULFING: 'Engulfing',
  HAMMER: 'Hammer',
  SHOOTING_STAR: 'Shooting Star',
  DOJI: 'Doji',
  MORNING_STAR: 'Morning Star',
  EVENING_STAR: 'Evening Star',
  THREE_WHITE_SOLDIERS: 'Three White Soldiers',
  THREE_BLACK_CROWS: 'Three Black Crows',
  HARAMI: 'Harami',
} as const;

// Timeframes
export const TIMEFRAMES = {
  '1m': '1 minute',
  '5m': '5 minutes',
  '15m': '15 minutes',
  '30m': '30 minutes',
  '1h': '1 hour',
  '4h': '4 hours',
  '1d': '1 day',
  '1w': '1 week',
  '1M': '1 month',
} as const;

// Brokers
export const BROKERS = {
  GROW: 'grow',
  UPSTOX: 'upstox',
  TICKER_TAPE: 'ticker-tape',
} as const;

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  RATE_LIMIT_DELAY: 500, // 500ms between requests
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  QUOTE_TTL: 60, // 1 minute
  CANDLE_TTL: 300, // 5 minutes
  PATTERN_TTL: 3600, // 1 hour
  DEFAULT_TTL: 300,
} as const;

// Pattern Detection Configuration
export const PATTERN_CONFIG = {
  MIN_CONFIDENCE_THRESHOLD: 60,
  HISTORY_CANDLESGAP: 20,
  ENGULFING_THRESHOLD: 0.8,
  HAMMER_TAIL_RATIO: 2,
  SHOOTING_STAR_TAIL_RATIO: 2,
} as const;

// Alert Configuration
export const ALERT_CONFIG = {
  MIN_CONFIDENCE: 60,
  DEDUP_WINDOW: 300, // 5 minutes
  RETENTION_DAYS: 90,
} as const;

// Log Levels
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Codes
export const ERROR_CODES = {
  INVALID_SYMBOL: 'INVALID_SYMBOL',
  BROKER_CONNECTION_ERROR: 'BROKER_CONNECTION_ERROR',
  PATTERN_DETECTION_ERROR: 'PATTERN_DETECTION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
} as const;

// Default Symbols for Screening
export const DEFAULT_SYMBOLS = [
  'RELIANCE', 'TCS', 'INFY', 'WIPRO', 'BAJAJ-AUTO',
  'MARUTI', 'HDFC', 'ICICI', 'AXIS', 'KOTAK',
  'ADANIGREEN', 'ADANIENT', 'LT', 'HCLTECH', 'ASIANPAINT',
] as const;
