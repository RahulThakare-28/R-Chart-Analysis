import { BaseGeminiAdapter, AnalysisInput } from './baseAdapter';
import { SentimentAnalysis } from '../client/types';
import { logger } from '@chartscanai/shared';

interface MarketContext {
  symbol?: string;
  timeframe?: string;
  recentPriceChange?: number;
  volume?: number;
  news?: string[];
  [key: string]: any;
}

/**
 * SentimentAnalyzerAdapter: Analyzes market sentiment with Gemini
 * Provides sentiment analysis including:
 * - Overall sentiment (bullish/bearish/neutral)
 * - Confidence level (0-100)
 * - Supporting indicators and their values
 * - Summary of sentiment drivers
 */
export class SentimentAnalyzerAdapter extends BaseGeminiAdapter {
  constructor(client: any, rateLimiter: any, cache: any, config: any) {
    super(client, rateLimiter, cache, config, 'SentimentAnalyzerAdapter');
  }

  /**
   * Analyze market sentiment for given context
   */
  async analyzeSentiment(context: MarketContext = {}): Promise<SentimentAnalysis> {
    const input: AnalysisInput = {
      type: 'sentiment_analysis',
      data: { context },
      cacheKeyData: {
        symbol: context.symbol,
        timeframe: context.timeframe,
      },
    };

    const result = await this.analyze(input, 250); // Token cost for sentiment analysis
    return result as SentimentAnalysis;
  }

  /**
   * Execute sentiment analysis with Gemini API
   */
  protected async doAnalysis(input: AnalysisInput): Promise<SentimentAnalysis> {
    const context = input.data.context as MarketContext;

    logger.debug(`[SentimentAnalyzerAdapter] Analyzing sentiment for ${context.symbol || 'market'}`);

    try {
      const response = await this.client.analyzeSentiment(context);
      return this._parseSentimentResponse(response.content);
    } catch (error) {
      logger.error(`[SentimentAnalyzerAdapter] API call failed`, error);
      throw error;
    }
  }

  /**
   * Fallback sentiment when API unavailable
   */
  protected async getFallbackResponse(input: AnalysisInput): Promise<SentimentAnalysis> {
    return {
      overall: 'neutral',
      confidence: 40,
      indicators: [
        { name: 'Trend', value: 0 },
        { name: 'Volume', value: 0 },
        { name: 'Volatility', value: 0 },
      ],
      source: 'fallback',
      summary: 'AI sentiment analysis unavailable',
    };
  }

  /**
   * Private: Build prompt for sentiment analysis
   */
  private _buildSentimentPrompt(context: MarketContext): string {
    const newsContext = context.news?.length ? `\nRecent News:\n${context.news.join('\n')}` : '';

    return `
You are an expert market analyst specializing in sentiment analysis.

Analyze the current market sentiment based on the following information:

Market Context:
- Symbol: ${context.symbol || 'General Market'}
- Timeframe: ${context.timeframe || '1h'}
- Recent Price Change: ${context.recentPriceChange ? `${context.recentPriceChange}%` : 'N/A'}
- Volume: ${context.volume || 'N/A'}
${newsContext}

Please provide a JSON response with this structure:
{
  "overall": "bullish" | "bearish" | "neutral",
  "confidence": <0-100>,
  "indicators": [
    {"name": "indicator_name", "value": <-100 to 100>},
    {"name": "indicator_name", "value": <-100 to 100>}
  ],
  "summary": "<brief sentiment summary>",
  "drivers": ["driver 1", "driver 2", "driver 3"]
}

Consider:
1. Price action and recent changes
2. Volume patterns
3. Market structure (support/resistance)
4. News sentiment if provided
5. Broader market trends
6. Typical patterns for this symbol

Indicators should include:
- Price Trend (-100 bearish to +100 bullish)
- Volume Health
- Volatility Assessment
- Support/Resistance Strength
- Any other relevant technical indicators

Confidence should reflect how certain you are in this sentiment assessment.
`;
  }

  /**
   * Private: Parse sentiment response from Gemini
   */
  private _parseSentimentResponse(response: string): SentimentAnalysis {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('[SentimentAnalyzerAdapter] No JSON found in response');
        throw new Error('Invalid response format');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate sentiment
      const validSentiments: Array<'bullish' | 'bearish' | 'neutral'> = ['bullish', 'bearish', 'neutral'];
      const overall = validSentiments.includes(parsed.overall) ? parsed.overall : 'neutral';

      // Parse indicators
      const indicators = Array.isArray(parsed.indicators)
        ? parsed.indicators.map((ind: any) => ({
            name: ind.name || 'Unknown',
            value: Math.min(Math.max(parseInt(ind.value) || 0, -100), 100),
          }))
        : [];

      return {
        overall,
        confidence: Math.min(Math.max(parseInt(parsed.confidence) || 50, 0), 100),
        indicators,
        summary: parsed.summary || 'Sentiment analysis generated',
        source: 'gemini',
      };
    } catch (error: any) {
      logger.error('[SentimentAnalyzerAdapter] Failed to parse response', error);
      throw new Error(`Failed to parse sentiment analysis: ${error?.message || 'Unknown error'}`);
    }
  }
}
