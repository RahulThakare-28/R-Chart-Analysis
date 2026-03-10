/**
 * Pattern Detection Engine
 * Main orchestrator for detecting all candlestick patterns
 */

import { Candle, CandlestickPattern, PatternDetectionResult, logger, PATTERN_CONFIG } from '@chartscanai/shared';
import {
  EngulfingDetector,
  HammerDetector,
  ShootingStarDetector,
  DojiDetector,
  BasePatternDetector,
} from './detectors';

export class PatternDetectionEngine {
  private detectors: BasePatternDetector[] = [];

  constructor() {
    // Initialize all pattern detectors
    this.detectors = [
      new EngulfingDetector(),
      new HammerDetector(),
      new ShootingStarDetector(),
      new DojiDetector(),
    ];
  }

  /**
   * Detect all patterns in candle data
   */
  async detectPatterns(candles: Candle[]): Promise<PatternDetectionResult> {
    if (!Array.isArray(candles) || candles.length === 0) {
      throw new Error('Invalid candles array');
    }

    const patterns: CandlestickPattern[] = [];
    const symbol = candles[0].symbol;
    const timeframe = candles[0].timeframe;

    // Run each detector
    for (const detector of this.detectors) {
      try {
        const pattern = detector.detect(candles);
        if (pattern && pattern.confidence >= PATTERN_CONFIG.MIN_CONFIDENCE_THRESHOLD) {
          patterns.push(pattern);
        }
      } catch (error) {
        logger.warn(`Error in pattern detector: ${error}`, { symbol, timeframe });
      }
    }

    return {
      patterns,
      timestamp: new Date(),
      symbol,
      timeframe,
    };
  }

  /**
   * Detect patterns for multiple candle sets (e.g., different timeframes)
   */
  async detectPatternsMultiple(
    candleSets: Candle[][]
  ): Promise<PatternDetectionResult[]> {
    const results: PatternDetectionResult[] = [];

    for (const candles of candleSets) {
      try {
        const result = await this.detectPatterns(candles);
        results.push(result);
      } catch (error) {
        logger.error(`Error detecting patterns for candleset: ${error}`);
      }
    }

    return results;
  }

  /**
   * Get all supported pattern names
   */
  getPatternNames(): string[] {
    return this.detectors.map(d => d['patternName']);
  }

  /**
   * Add a custom detector
   */
  addDetector(detector: BasePatternDetector): void {
    this.detectors.push(detector);
  }

  /**
   * Clear all detectors
   */
  clearDetectors(): void {
    this.detectors = [];
  }
}

// Export singleton instance
export const patternEngine = new PatternDetectionEngine();
