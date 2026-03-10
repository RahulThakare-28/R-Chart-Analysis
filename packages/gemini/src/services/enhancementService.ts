import { Alert, PatternAnalysis, logger } from '@chartscanai/shared';
import { GeminiConfig } from '../client/types';
import { PatternInterpreterAdapter } from './patternInterpreter';
import { TradeAdviserAdapter } from './tradeAdviser';
import { SentimentAnalyzerAdapter } from './sentimentAnalyzer';

interface MarketContext {
  currentPrice?: number;
  support?: number;
  resistance?: number;
  volatility?: number;
  trend?: 'bullish' | 'bearish' | 'neutral';
  [key: string]: any;
}

/**
 * AlertEnhancementService: Orchestrates all adapters to enhance alerts
 *
 * Runs all 3 adapters in parallel:
 * 1. PatternInterpreterAdapter - Explains the pattern
 * 2. TradeAdviserAdapter - Provides trading recommendations
 * 3. SentimentAnalyzerAdapter - Analyzes market sentiment
 *
 * Features:
 * - Non-blocking: Returns immediately, callers don't wait
 * - Parallel execution: All adapters run simultaneously
 * - Error isolation: One adapter failure doesn't affect others
 * - Graceful fallback: Returns alert unmodified if all adapters fail
 *
 * Usage:
 * ```typescript
 * const service = new AlertEnhancementService(interpreter, adviser, sentiment, config);
 * const alert = { pattern: {...}, };
 * const enhanced = await service.enhanceAlert(alert, marketContext);
 * ```
 */
export class AlertEnhancementService {
  private patternInterpreter: PatternInterpreterAdapter;
  private tradeAdviser: TradeAdviserAdapter;
  private sentimentAnalyzer: SentimentAnalyzerAdapter;
  private config: GeminiConfig;

  constructor(
    patternInterpreter: PatternInterpreterAdapter,
    tradeAdviser: TradeAdviserAdapter,
    sentimentAnalyzer: SentimentAnalyzerAdapter,
    config: GeminiConfig
  ) {
    this.patternInterpreter = patternInterpreter;
    this.tradeAdviser = tradeAdviser;
    this.sentimentAnalyzer = sentimentAnalyzer;
    this.config = config;
  }

  /**
   * Enhance an alert with AI analysis (all adapters in parallel)
   * Returns immediately if Gemini is disabled
   * Returns unmodified alert on errors (non-blocking failure)
   */
  async enhanceAlert(alert: Alert, context: MarketContext = {}): Promise<Alert> {
    // Quick path: Gemini disabled or not initialized
    if (!this.config.enabled) {
      logger.debug('[AlertEnhancementService] Gemini disabled, skipping enhancement');
      return alert;
    }

    try {
      logger.debug(`[AlertEnhancementService] Enhancing alert for ${alert.pattern.name}`);

      // Run all 3 adapters in parallel using Promise.all()
      const [interpretation, recommendation, sentiment] = await Promise.allSettled([
        this.patternInterpreter.interpret(alert.pattern),
        this.tradeAdviser.recommend(alert, context),
        this.sentimentAnalyzer.analyzeSentiment(context),
      ]).then((results) => [
        results[0].status === 'fulfilled' ? results[0].value : null,
        results[1].status === 'fulfilled' ? results[1].value : null,
        results[2].status === 'fulfilled' ? results[2].value : null,
      ]);

      // If at least one adapter succeeded, add analysis to alert
      if (interpretation || recommendation || sentiment) {
        alert.analysis = {
          interpretation: interpretation || undefined,
          recommendation: recommendation || undefined,
          sentiment: sentiment || undefined,
          enhancedAt: new Date(),
        };

        logger.debug(`[AlertEnhancementService] Alert enhanced successfully`);
      } else {
        logger.warn('[AlertEnhancementService] All adapters failed, returning alert without analysis');
      }

      return alert;
    } catch (error) {
      logger.error('[AlertEnhancementService] Unexpected error during enhancement', error);
      // Return alert unmodified on unexpected errors
      return alert;
    }
  }

  /**
   * Enhance multiple alerts in parallel (useful for batch processing)
   */
  async enhanceAlerts(alerts: Alert[], context: MarketContext = {}): Promise<Alert[]> {
    return Promise.all(alerts.map((alert) => this.enhanceAlert(alert, context)));
  }

  /**
   * Fire-and-forget enhancement (doesn't wait for completion)
   * Useful for non-blocking integration with alert detector
   */
  enhanceAlertAsync(alert: Alert, context: MarketContext = {}): void {
    // Start enhancement but don't wait for it
    this.enhanceAlert(alert, context).catch((error) => {
      logger.error('[AlertEnhancementService] Async enhancement failed', error);
    });
  }

  /**
   * Get service status for monitoring
   */
  getStatus(): Record<string, any> {
    return {
      service: 'AlertEnhancementService',
      enabled: this.config.enabled,
      adapters: {
        interpreter: this.patternInterpreter.getStatus(),
        adviser: this.tradeAdviser.getStatus(),
        sentiment: this.sentimentAnalyzer.getStatus(),
      },
    };
  }

  /**
   * Expose adapters for advanced usage
   */
  getAdapters() {
    return {
      interpreter: this.patternInterpreter,
      adviser: this.tradeAdviser,
      sentiment: this.sentimentAnalyzer,
    };
  }
}
