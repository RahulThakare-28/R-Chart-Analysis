/**
 * Pattern Detection Algorithms
 * Each pattern detector implements the candlestick pattern recognition logic
 */

import { Candle, CandlestickPattern, TradeAction } from '@chartscanai/shared';

/**
 * Base class for pattern detection
 */
export abstract class BasePatternDetector {
  protected patternName: string = 'Base Pattern';
  protected minCandlesRequired: number = 2;

  /**
   * Detect if pattern exists in candles
   */
  abstract detect(candles: Candle[]): CandlestickPattern | null;

  /**
   * Calculate confidence score (0-100)
   */
  protected abstract calculateConfidence(candles: Candle[]): number;

  /**
   * Get trade action recommendation
   */
  protected abstract getTradeAction(candles: Candle[]): TradeAction;

  /**
   * Validate candles array
   */
  protected validateCandles(candles: Candle[]): boolean {
    if (!Array.isArray(candles) || candles.length < this.minCandlesRequired) {
      return false;
    }

    // Check that candles are in chronological order
    for (let i = 1; i < candles.length; i++) {
      if (candles[i].timestamp <= candles[i - 1].timestamp) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get body size percentage
   */
  protected getBodyPercent(candle: Candle): number {
    const range = candle.high - candle.low;
    if (range === 0) return 0;
    const body = Math.abs(candle.close - candle.open);
    return (body / range) * 100;
  }

  /**
   * Get upper shadow (wick) size
   */
  protected getUpperWickSize(candle: Candle): number {
    return candle.high - Math.max(candle.open, candle.close);
  }

  /**
   * Get lower shadow (wick) size
   */
  protected getLowerWickSize(candle: Candle): number {
    return Math.min(candle.open, candle.close) - candle.low;
  }

  /**
   * Get total range (high - low)
   */
  protected getTotalRange(candle: Candle): number {
    return candle.high - candle.low;
  }

  /**
   * Is candle bullish
   */
  protected isBullish(candle: Candle): boolean {
    return candle.close > candle.open;
  }

  /**
   * Is candle bearish
   */
  protected isBearish(candle: Candle): boolean {
    return candle.close < candle.open;
  }

  /**
   * Is candle a doji
   */
  protected isDoji(candle: Candle): boolean {
    const bodySize = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;
    return range > 0 && bodySize / range < 0.1; // Body is less than 10% of range
  }

  /**
   * Create pattern result
   */
  protected createPattern(
    candles: Candle[],
    action: TradeAction,
    confidence: number,
    description?: string
  ): CandlestickPattern {
    const lastCandle = candles[candles.length - 1];
    return {
      name: this.patternName,
      symbol: lastCandle.symbol,
      timeframe: lastCandle.timeframe,
      confidence,
      candles: [...candles],
      timestamp: lastCandle.timestamp,
      action,
      broker: lastCandle.broker,
      description,
    };
  }
}

/**
 * Engulfing Pattern Detector
 * A smaller candle is completely engulfed by a larger candle
 */
export class EngulfingDetector extends BasePatternDetector {
  protected patternName = 'Engulfing';
  protected minCandlesRequired = 2;

  detect(candles: Candle[]): CandlestickPattern | null {
    if (!this.validateCandles(candles) || candles.length < 2) {
      return null;
    }

    const prior = candles[candles.length - 2];
    const current = candles[candles.length - 1];

    // Bullish engulfing: prior bearish, current bullish
    if (this.isBearish(prior) && this.isBullish(current)) {
      if (current.open < prior.close && current.close > prior.open) {
        const confidence = this.calculateConfidence([prior, current]);
        return this.createPattern(
          [prior, current],
          'BUY',
          confidence,
          'Bullish Engulfing Pattern - Potential reversal up'
        );
      }
    }

    // Bearish engulfing: prior bullish, current bearish
    if (this.isBullish(prior) && this.isBearish(current)) {
      if (current.open > prior.close && current.close < prior.open) {
        const confidence = this.calculateConfidence([prior, current]);
        return this.createPattern(
          [prior, current],
          'SELL',
          confidence,
          'Bearish Engulfing Pattern - Potential reversal down'
        );
      }
    }

    return null;
  }

  protected calculateConfidence(candles: Candle[]): number {
    const prior = candles[0];
    const current = candles[1];

    // Confidence based on engulfing size
    const priorRange = prior.high - prior.low;
    const currentRange = current.high - current.low;
    const engulfRatio = currentRange / priorRange;

    // Perfect engulfing = 100% confidence, smaller ratios reduce confidence
    let confidence = Math.min(100, engulfRatio * 25);

    // Bonus for larger volume in current candle
    if (current.volume > prior.volume * 1.2) {
      confidence = Math.min(100, confidence + 10);
    }

    return Math.round(confidence);
  }

  protected getTradeAction(candles: Candle[]): TradeAction {
    if (this.isBullish(candles[1])) {
      return 'BUY';
    }
    return 'SELL';
  }
}

/**
 * Hammer Pattern Detector
 * Small body, long lower wick, little to no upper wick
 */
export class HammerDetector extends BasePatternDetector {
  protected patternName = 'Hammer';
  protected minCandlesRequired = 2;

  detect(candles: Candle[]): CandlestickPattern | null {
    if (!this.validateCandles(candles) || candles.length < 2) {
      return null;
    }

    const current = candles[candles.length - 1];
    const prior = candles[candles.length - 2];

    // Hammer has small body, long lower wick
    const range = this.getTotalRange(current);
    if (range === 0) return null;

    const bodySize = this.getBodyPercent(current);
    const lowerWick = this.getLowerWickSize(current);
    const upperWick = this.getUpperWickSize(current);

    // Criteria: small body (< 30%), lower wick at least 2x body, small upper wick
    if (bodySize < 30 && lowerWick > range * 0.5 && upperWick < range * 0.1 && this.isBearish(prior)) {
      const confidence = this.calculateConfidence([current]);
      return this.createPattern([current], 'BUY', confidence, 'Hammer Pattern - Bullish reversal signal');
    }

    return null;
  }

  protected calculateConfidence(candles: Candle[]): number {
    const candle = candles[0];
    const range = this.getTotalRange(candle);
    const lowerWick = this.getLowerWickSize(candle);
    const wickRatio = range > 0 ? lowerWick / range : 0;

    // Higher wick ratio = higher confidence (more hammer-like)
    let confidence = Math.min(100, wickRatio * 60);

    // Bonus if lower wick is at least 2-3x the body
    if (lowerWick > range * 0.7) {
      confidence = Math.min(100, confidence + 15);
    }

    return Math.round(confidence);
  }

  protected getTradeAction(): TradeAction {
    return 'BUY';
  }
}

/**
 * Shooting Star Pattern Detector
 * Opposite of hammer - small body, long upper wick, little to no lower wick
 */
export class ShootingStarDetector extends BasePatternDetector {
  protected patternName = 'Shooting Star';
  protected minCandlesRequired = 2;

  detect(candles: Candle[]): CandlestickPattern | null {
    if (!this.validateCandles(candles) || candles.length < 2) {
      return null;
    }

    const current = candles[candles.length - 1];
    const prior = candles[candles.length - 2];

    const range = this.getTotalRange(current);
    if (range === 0) return null;

    const bodySize = this.getBodyPercent(current);
    const upperWick = this.getUpperWickSize(current);
    const lowerWick = this.getLowerWickSize(current);

    // Criteria: small body (< 30%), upper wick at least 2x body, small lower wick
    if (bodySize < 30 && upperWick > range * 0.5 && lowerWick < range * 0.1 && this.isBullish(prior)) {
      const confidence = this.calculateConfidence([current]);
      return this.createPattern([current], 'SELL', confidence, 'Shooting Star Pattern - Bearish reversal signal');
    }

    return null;
  }

  protected calculateConfidence(candles: Candle[]): number {
    const candle = candles[0];
    const range = this.getTotalRange(candle);
    const upperWick = this.getUpperWickSize(candle);
    const wickRatio = range > 0 ? upperWick / range : 0;

    // Higher wick ratio = higher confidence
    let confidence = Math.min(100, wickRatio * 60);

    if (upperWick > range * 0.7) {
      confidence = Math.min(100, confidence + 15);
    }

    return Math.round(confidence);
  }

  protected getTradeAction(): TradeAction {
    return 'SELL';
  }
}

/**
 * Doji Pattern Detector
 * Open and close are nearly equal (small body)
 */
export class DojiDetector extends BasePatternDetector {
  protected patternName = 'Doji';
  protected minCandlesRequired = 1;

  detect(candles: Candle[]): CandlestickPattern | null {
    if (!this.validateCandles(candles) || candles.length < 1) {
      return null;
    }

    const current = candles[candles.length - 1];

    if (this.isDoji(current)) {
      const confidence = this.calculateConfidence([current]);
      return this.createPattern([current], 'NEUTRAL', confidence, 'Doji Pattern - Indecision signal');
    }

    return null;
  }

  protected calculateConfidence(): number {
    return 70; // Doji is fairly reliable at 70%
  }

  protected getTradeAction(): TradeAction {
    return 'NEUTRAL';
  }
}
