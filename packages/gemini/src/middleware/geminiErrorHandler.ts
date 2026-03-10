/**
 * Gemini Error Handler
 * Handles Gemini API errors with graceful degradation
 */

import { GeminiError, PatternInterpretation, TradeRecommendation, SentimentAnalysis } from '../client/types';
import { logger } from '@chartscanai/shared';
import { Alert, CandlestickPattern } from '@chartscanai/shared';

export class GeminiErrorHandler {
  /**
   * Determine if error is critical (should disable Gemini entirely)
   */
  static isCriticalError(error: any): boolean {
    if (!error) return false;

    // Invalid API key or authentication failure
    if (error.code === 'INVALID_API_KEY' || error.status === 403 || error.status === 401) {
      return true;
    }

    // API disabled or service unavailable long-term
    if (error.code === 'RESOURCE_EXHAUSTED' && error.status === 429) {
      return false; // Rate limit is retryable
    }

    return false;
  }

  /**
   * Determine if error is retryable
   */
  static isRetryable(error: any): boolean {
    if (!error) return false;

    // Rate limit (429)
    if (error.status === 429) return true;

    // Timeout
    if (error.code === 'TIMEOUT' || error.code === 'ECONNABORTED') return true;

    // Network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') return true;

    // Server errors (5xx)
    if (error.status && error.status >= 500) return true;

    // DNS errors
    if (error.code === 'GETADDRINFO') return true;

    return false;
  }

  /**
   * Get retry delay with exponential backoff
   */
  static getRetryDelay(attempt: number = 1): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, maxDelay);
  }

  /**
   * Handle analysis error and return fallback
   */
  static handleAnalysisError(
    error: any,
    errorType: 'interpret' | 'advise' | 'sentiment',
    context?: { pattern?: CandlestickPattern; alert?: Alert }
  ): PatternInterpretation | TradeRecommendation | SentimentAnalysis | null {
    logger.warn(`Gemini ${errorType} error: ${error?.message}`);

    if (this.isCriticalError(error)) {
      logger.error(`Critical Gemini error (${error?.code}), disabling further attempts`);
      return null;
    }

    if (this.isRetryable(error)) {
      logger.debug(`Retryable Gemini error (${error?.code}), will retry`);
    }

    // Return appropriate fallback based on error type
    switch (errorType) {
      case 'interpret':
        return this.getFallbackInterpretation(context?.pattern);
      case 'advise':
        return this.getFallbackRecommendation(context?.alert);
      case 'sentiment':
        return this.getFallbackSentiment();
      default:
        return null;
    }
  }

  /**
   * Get fallback pattern interpretation
   */
  static getFallbackInterpretation(pattern?: CandlestickPattern): PatternInterpretation {
    return {
      summary: pattern ? `${pattern.name} pattern detected on ${pattern.symbol}` : 'Pattern detected',
      keyPoints: [
        'Pattern detection available',
        'AI analysis temporarily unavailable',
        'Gemini service temporarily offline',
      ],
      confidence: pattern?.confidence || 60,
      source: 'fallback',
    };
  }

  /**
   * Get fallback trade recommendation
   */
  static getFallbackRecommendation(alert?: Alert): TradeRecommendation {
    return {
      action: alert?.pattern?.action || 'HOLD',
      confidence: alert?.pattern?.confidence || 60,
      riskLevel: 'medium',
      reasoning: 'AI analysis temporarily unavailable, using pattern detection only',
      source: 'fallback',
    };
  }

  /**
   * Get fallback sentiment analysis
   */
  static getFallbackSentiment(): SentimentAnalysis {
    return {
      overall: 'neutral',
      confidence: 50,
      indicators: [],
      summary: 'Sentiment analysis temporarily unavailable',
      source: 'fallback',
    };
  }

  /**
   * Parse error from Gemini API response
   */
  static parseError(response: any): GeminiError {
    let code = 'UNKNOWN_ERROR';
    let message = 'Unknown error occurred';
    let status = 500;
    let retryable = false;

    // Handle direct error object
    if (response?.error) {
      code = response.error.code || code;
      message = response.error.message || message;
    }

    // Handle HTTP response
    if (response?.status) {
      status = response.status;
      message = response.statusText || message;
    }

    // Handle axios error
    if (response?.response) {
      status = response.response.status;
      code = response.response.data?.error?.code || code;
      message = response.response.data?.error?.message || response.message || message;
    }

    // Determine if retryable
    retryable = this.isRetryable({ code, status });

    return { code, message, status, retryable };
  }

  /**
   * Log error with context
   */
  static logError(error: any, context: string): void {
    const parsed = this.parseError(error);
    logger.error(`[${context}] ${parsed.code}: ${parsed.message}`, {
      status: parsed.status,
      retryable: parsed.retryable,
      originalError: error?.message,
    });
  }
}
