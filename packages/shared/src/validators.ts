/**
 * Validation Utilities for ChartScanAI
 */

import { Candle, Quote, Timeframe } from './types';
import { TIMEFRAMES } from './constants';

/**
 * Validate if a string is a valid symbol
 */
export function isValidSymbol(symbol: string): boolean {
  if (!symbol || typeof symbol !== 'string') return false;
  const symbolRegex = /^[A-Z0-9\-&]{1,20}$/;
  return symbolRegex.test(symbol.trim().toUpperCase());
}

/**
 * Validate if a string is a valid timeframe
 */
export function isValidTimeframe(timeframe: string): timeframe is Timeframe {
  return Object.keys(TIMEFRAMES).includes(timeframe);
}

/**
 * Validate candle data structure
 */
export function isValidCandle(candle: any): candle is Candle {
  if (!candle || typeof candle !== 'object') return false;

  return (
    typeof candle.symbol === 'string' &&
    isValidTimeframe(candle.timeframe) &&
    typeof candle.open === 'number' &&
    typeof candle.high === 'number' &&
    typeof candle.low === 'number' &&
    typeof candle.close === 'number' &&
    typeof candle.volume === 'number' &&
    candle.timestamp instanceof Date &&
    typeof candle.broker === 'string' &&
    // Validate OHLC relationships
    candle.high >= Math.max(candle.open, candle.close) &&
    candle.low <= Math.min(candle.open, candle.close) &&
    candle.open > 0 &&
    candle.high > 0 &&
    candle.low > 0 &&
    candle.close > 0 &&
    candle.volume >= 0
  );
}

/**
 * Validate quote data structure
 */
export function isValidQuote(quote: any): quote is Quote {
  if (!quote || typeof quote !== 'object') return false;

  return (
    typeof quote.symbol === 'string' &&
    typeof quote.price === 'number' &&
    typeof quote.bid === 'number' &&
    typeof quote.ask === 'number' &&
    typeof quote.change === 'number' &&
    typeof quote.changePercent === 'number' &&
    typeof quote.volume === 'number' &&
    quote.timestamp instanceof Date &&
    typeof quote.broker === 'string' &&
    quote.price > 0 &&
    quote.bid > 0 &&
    quote.ask > 0 &&
    quote.bid <= quote.ask
  );
}

/**
 * Validate confidence level (0-100)
 */
export function isValidConfidence(confidence: any): boolean {
  return typeof confidence === 'number' && confidence >= 0 && confidence <= 100;
}

/**
 * Validate array of symbols
 */
export function areValidSymbols(symbols: any): boolean {
  if (!Array.isArray(symbols)) return false;
  return symbols.length > 0 && symbols.every(s => isValidSymbol(s));
}

/**
 * Sanitize symbol (convert to uppercase, trim)
 */
export function sanitizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

/**
 * Sanitize symbols array
 */
export function sanitizeSymbols(symbols: string[]): string[] {
  return symbols.map(sanitizeSymbol).filter(s => isValidSymbol(s));
}

/**
 * Validate price (must be positive)
 */
export function isValidPrice(price: any): boolean {
  return typeof price === 'number' && price > 0 && isFinite(price);
}

/**
 * Validate volume (must be non-negative)
 */
export function isValidVolume(volume: any): boolean {
  return typeof volume === 'number' && volume >= 0 && isFinite(volume);
}

/**
 * Validate percentage (typically -100 to 100)
 */
export function isValidPercentage(percentage: any): boolean {
  return typeof percentage === 'number' && percentage >= -100 && percentage <= 100 && isFinite(percentage);
}

/**
 * Validate date
 */
export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate API response structure
 */
export function isValidApiResponse(response: any): boolean {
  return (
    response &&
    typeof response === 'object' &&
    typeof response.success === 'boolean' &&
    isValidDate(response.timestamp) &&
    (!response.error || typeof response.error === 'object')
  );
}
