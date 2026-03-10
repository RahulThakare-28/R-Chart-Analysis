import { CandlestickPattern } from '@chartscanai/shared';
import { BaseGeminiAdapter, AnalysisInput } from './baseAdapter';
import { PatternInterpretation } from '../client/types';
import { logger } from '@chartscanai/shared';

/**
 * PatternInterpreterAdapter: Analyzes candlestick patterns with Gemini
 * Provides interpretation including:
 * - Pattern summary and explanation
 * - Key points about the pattern
 * - Confidence level (0-100)
 * - Bullish/bearish factors
 * - Historical accuracy
 * - Recommended timeframes
 */
export class PatternInterpreterAdapter extends BaseGeminiAdapter {
  constructor(client: any, rateLimiter: any, cache: any, config: any) {
    super(client, rateLimiter, cache, config, 'PatternInterpreterAdapter');
  }

  /**
   * Interpret a candlestick pattern
   */
  async interpret(pattern: CandlestickPattern): Promise<PatternInterpretation> {
    const input: AnalysisInput = {
      type: 'pattern_interpretation',
      data: { pattern },
      cacheKeyData: {
        name: pattern.name,
        candles: pattern.candles.length,
        symbol: pattern.symbol,
      },
    };

    const result = await this.analyze(input, 200); // Typical token cost
    return result as PatternInterpretation;
  }

  /**
   * Execute pattern interpretation with Gemini API
   */
  protected async doAnalysis(input: AnalysisInput): Promise<PatternInterpretation> {
    const pattern = input.data.pattern as CandlestickPattern;

    logger.debug(`[PatternInterpreterAdapter] Analyzing pattern: ${pattern.name}`);

    try {
      const response = await this.client.analyzePattern(pattern);
      return this._parseInterpretationResponse(response.content);
    } catch (error) {
      logger.error(`[PatternInterpreterAdapter] API call failed`, error);
      throw error;
    }
  }

  /**
   * Fallback interpretation when API unavailable
   */
  protected async getFallbackResponse(input: AnalysisInput): Promise<PatternInterpretation> {
    const pattern = input.data.pattern as CandlestickPattern;
    return {
      summary: `${pattern.name} pattern detected on ${pattern.symbol}`,
      keyPoints: [
        `Pattern: ${pattern.name}`,
        `Timeframe: ${pattern.timeframe}`,
        `Confidence: ${pattern.confidence}%`,
        'AI analysis unavailable, consult documentation',
      ],
      confidence: Math.min(pattern.confidence, 60), // Lower confidence for fallback
      source: 'fallback',
    };
  }

  /**
   * Private: Build prompt for pattern interpretation
   */
  private _buildInterpretationPrompt(pattern: CandlestickPattern): string {
    const candleData = pattern.candles
      .map((c, i) => `Candle ${i}: O=${c.open}, H=${c.high}, L=${c.low}, C=${c.close}`)
      .join('\n');

    return `
You are an expert technical analyst specializing in candlestick pattern recognition.

Analyze the following ${pattern.name} candlestick pattern:
- Symbol: ${pattern.symbol}
- Timeframe: ${pattern.timeframe}
- Pattern: ${pattern.name}
- Confidence: ${pattern.confidence}%
- Trade Action: ${pattern.tradeAction}

Candle Data:
${candleData}

Please provide a JSON response with the following structure:
{
  "summary": "Brief 1-2 sentence explanation of the pattern",
  "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4"],
  "confidence": <0-100>,
  "bullishFactors": ["Factor 1", "Factor 2"],
  "bearishFactors": ["Factor 1", "Factor 2"],
  "historicalAccuracy": <0-100>,
  "recommendedTimeframes": ["timeframe1", "timeframe2"]
}

Focus on:
1. What makes this pattern bullish or bearish
2. Historical reliability of this pattern
3. Key price levels to watch
4. When traders typically see best results with this pattern
`;
  }

  /**
   * Private: Parse interpretation response from Gemini
   */
  private _parseInterpretationResponse(response: string): PatternInterpretation {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('[PatternInterpreterAdapter] No JSON found in response');
        throw new Error('Invalid response format');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        summary: parsed.summary || 'No summary available',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        confidence: Math.min(Math.max(parseInt(parsed.confidence) || 50, 0), 100),
        bullishFactors: Array.isArray(parsed.bullishFactors) ? parsed.bullishFactors : undefined,
        bearishFactors: Array.isArray(parsed.bearishFactors) ? parsed.bearishFactors : undefined,
        historicalAccuracy: parsed.historicalAccuracy ? Math.min(Math.max(parseInt(parsed.historicalAccuracy), 0), 100) : undefined,
        recommendedTimeframes: Array.isArray(parsed.recommendedTimeframes) ? parsed.recommendedTimeframes : undefined,
        source: 'gemini',
      };
    } catch (error: any) {
      logger.error('[PatternInterpreterAdapter] Failed to parse response', error);
      throw new Error(`Failed to parse pattern interpretation: ${error?.message || 'Unknown error'}`);
    }
  }
}
