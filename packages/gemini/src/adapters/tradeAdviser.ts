import { Alert, TradeAction } from '@chartscanai/shared';
import { BaseGeminiAdapter, AnalysisInput } from './baseAdapter';
import { TradeRecommendation } from '../client/types';
import { logger } from '@chartscanai/shared';

interface MarketContext {
  currentPrice?: number;
  support?: number;
  resistance?: number;
  volatility?: number;
  trend?: 'bullish' | 'bearish' | 'neutral';
  [key: string]: any;
}

/**
 * TradeAdviserAdapter: Generates trade recommendations with Gemini
 * Provides recommendations including:
 * - Trade action (BUY, SELL, HOLD)
 * - Confidence level (0-100)
 * - Entry price
 * - Stop loss price
 * - Take profit price
 * - Risk/reward ratio
 * - Risk level (low/medium/high)
 */
export class TradeAdviserAdapter extends BaseGeminiAdapter {
  constructor(client: any, rateLimiter: any, cache: any, config: any) {
    super(client, rateLimiter, cache, config, 'TradeAdviserAdapter');
  }

  /**
   * Get trade recommendation for an alert
   */
  async recommend(alert: Alert, context: MarketContext = {}): Promise<TradeRecommendation> {
    const input: AnalysisInput = {
      type: 'trade_recommendation',
      data: { alert, context },
      cacheKeyData: {
        pattern: alert.pattern.name,
        symbol: alert.pattern.symbol,
        action: alert.pattern.tradeAction,
      },
    };

    const result = await this.analyze(input, 300); // Higher token cost for detailed recommendation
    return result as TradeRecommendation;
  }

  /**
   * Execute trade recommendation with Gemini API
   */
  protected async doAnalysis(input: AnalysisInput): Promise<TradeRecommendation> {
    const alert = input.data.alert as Alert;

    logger.debug(`[TradeAdviserAdapter] Getting trade recommendation for ${alert.pattern.name}`);

    try {
      const response = await this.client.getTradeSuggestions(alert);
      return this._parseRecommendationResponse(response.content);
    } catch (error) {
      logger.error(`[TradeAdviserAdapter] API call failed`, error);
      throw error;
    }
  }

  /**
   * Fallback recommendation when API unavailable
   */
  protected async getFallbackResponse(input: AnalysisInput): Promise<TradeRecommendation> {
    const alert = input.data.alert as Alert;
    const context = input.data.context as MarketContext;

    return {
      action: alert.pattern.tradeAction as TradeAction,
      confidence: Math.min(alert.pattern.confidence, 50), // Lower confidence for fallback
      entryPrice: context.currentPrice,
      riskLevel: 'medium',
      source: 'fallback',
      reasoning: 'AI service unavailable, using pattern default recommendation',
    };
  }

  /**
   * Private: Build prompt for trade recommendation
   */
  private _buildRecommendationPrompt(alert: Alert, context: MarketContext): string {
    const pattern = alert.pattern;

    return `
You are an expert forex/stock trader with 20+ years of experience.

Provide a trade recommendation based on the following pattern and market context:

Pattern Information:
- Pattern: ${pattern.name}
- Symbol: ${pattern.symbol}
- Timeframe: ${pattern.timeframe}
- Pattern Confidence: ${pattern.confidence}%
- Primary Action: ${pattern.tradeAction}

Market Context:
- Current Price: ${context.currentPrice || 'N/A'}
- Support Level: ${context.support || 'N/A'}
- Resistance Level: ${context.resistance || 'N/A'}
- Volatility: ${context.volatility || 'N/A'}
- Trend: ${context.trend || 'N/A'}

Please provide a JSON response with this structure:
{
  "action": "BUY" | "SELL" | "HOLD",
  "confidence": <0-100>,
  "entryPrice": <number or null>,
  "stopLoss": <number or null>,
  "takeProfit": <number or null>,
  "riskRewardRatio": <number or null>,
  "riskLevel": "low" | "medium" | "high",
  "reasoning": "<brief explanation>",
  "timeframe": "1m" | "5m" | "15m" | "1h" | "4h" | "1d",
  "entrySignal": "<specific condition for entry>"
}

Consider:
1. Pattern reliability for this symbol
2. Risk/reward ratio at suggested levels
3. Current market conditions and volatility
4. Position sizing based on risk level
5. Alternative exit strategies if pattern fails

Provide actionable entry, stop loss, and take profit levels.
`;
  }

  /**
   * Private: Parse trade recommendation from Gemini
   */
  private _parseRecommendationResponse(response: string): TradeRecommendation {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('[TradeAdviserAdapter] No JSON found in response');
        throw new Error('Invalid response format');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate action
      const validActions: TradeAction[] = ['BUY', 'SELL', 'HOLD'];
      const action = validActions.includes(parsed.action) ? parsed.action : 'HOLD';

      // Parse prices
      const entryPrice = parsed.entryPrice ? parseFloat(parsed.entryPrice) : undefined;
      const stopLoss = parsed.stopLoss ? parseFloat(parsed.stopLoss) : undefined;
      const takeProfit = parsed.takeProfit ? parseFloat(parsed.takeProfit) : undefined;
      const rrRatio = parsed.riskRewardRatio ? parseFloat(parsed.riskRewardRatio) : undefined;

      return {
        action,
        confidence: Math.min(Math.max(parseInt(parsed.confidence) || 50, 0), 100),
        entryPrice,
        stopLoss,
        takeProfit,
        riskRewardRatio: rrRatio,
        riskLevel: ['low', 'medium', 'high'].includes(parsed.riskLevel) ? (parsed.riskLevel as 'low' | 'medium' | 'high') : 'medium',
        reasoning: parsed.reasoning || 'Trade recommendation generated',
        timeframe: parsed.timeframe,
        source: 'gemini',
      };
    } catch (error: any) {
      logger.error('[TradeAdviserAdapter] Failed to parse response', error);
      throw new Error(`Failed to parse trade recommendation: ${error?.message || 'Unknown error'}`);
    }
  }
}
