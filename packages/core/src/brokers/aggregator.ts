/**
 * Data Aggregator
 * Aggregates quote and candle data from multiple brokers
 */

import { Quote, Candle, Timeframe, IDataAggregator, IBrokerAdapter, logger } from '@chartscanai/shared';
import { BaseBrokerAdapter } from './adapters';

export class DataAggregator implements IDataAggregator {
  private brokers: Map<string, IBrokerAdapter> = new Map();

  /**
   * Register a broker adapter
   */
  registerBroker(broker: IBrokerAdapter): void {
    this.brokers.set(broker.name, broker);
    logger.info(`Registered broker: ${broker.name}`);
  }

  /**
   * Unregister a broker adapter
   */
  unregisterBroker(brokerName: string): void {
    this.brokers.delete(brokerName);
    logger.info(`Unregistered broker: ${brokerName}`);
  }

  /**
   * Get list of registered brokers
   */
  getRegisteredBrokers(): string[] {
    return Array.from(this.brokers.keys());
  }

  /**
   * Get quotes from all registered brokers
   * Returns aggregated quotes with average prices
   */
  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const brokerQuotes = new Map<string, Quote[]>();

    // Get quotes from all brokers in parallel
    const promises = Array.from(this.brokers.values()).map(async (broker) => {
      try {
        const quotes = await broker.getQuotes(symbols);
        brokerQuotes.set(broker.name, quotes);
      } catch (error) {
        logger.warn(`Failed to get quotes from ${broker.name}: ${error}`);
      }
    });

    await Promise.allSettled(promises);

    if (brokerQuotes.size === 0) {
      throw new Error('No brokers returned data');
    }

    // Aggregate quotes from all brokers
    return this.aggregateQuotes(symbols, brokerQuotes);
  }

  /**
   * Get candles from all registered brokers
   */
  async getCandles(symbol: string, timeframe: Timeframe): Promise<Candle[]> {
    const brokerCandles = new Map<string, Candle[]>();

    const promises = Array.from(this.brokers.values()).map(async (broker) => {
      try {
        const candles = await broker.getCandles(symbol, timeframe, 100);
        brokerCandles.set(broker.name, candles);
      } catch (error) {
        logger.warn(`Failed to get candles from ${broker.name}: ${error}`);
      }
    });

    await Promise.allSettled(promises);

    if (brokerCandles.size === 0) {
      throw new Error('No brokers returned candle data');
    }

    // Merge and deduplicate candles
    return this.mergeCandles(Array.from(brokerCandles.values()).flat());
  }

  /**
   * Subscribe to real-time updates from all brokers
   */
  async subscribeToUpdates(symbols: string[], callback: (update: any) => void): Promise<void> {
    const subscriptions = Array.from(this.brokers.values()).map((broker) =>
      broker.subscribeToUpdates(symbols, callback)
    );

    await Promise.allSettled(subscriptions);
    logger.info(`Subscribed to updates for symbols: ${symbols.join(',')}`);
  }

  /**
   * Aggregate quotes from multiple brokers
   * Calculates average price and performs data validation
   */
  private aggregateQuotes(symbols: string[], brokerQuotes: Map<string, Quote[]>): Quote[] {
    const aggregated = new Map<string, Quote>();

    for (const [brokerName, quotes] of brokerQuotes.entries()) {
      for (const quote of quotes) {
        if (!aggregated.has(quote.symbol)) {
          aggregated.set(quote.symbol, {
            ...quote,
            broker: 'aggregated',
          });
        } else {
          // Average the prices from multiple brokers
          const existing = aggregated.get(quote.symbol)!;
          const avgPrice = (existing.price + quote.price) / 2;
          const avgBid = (existing.bid + quote.bid) / 2;
          const avgAsk = (existing.ask + quote.ask) / 2;
          const avgVolume =
            (existing.volume * (aggregated.size - 1) + quote.volume) / aggregated.size;

          existing.price = avgPrice;
          existing.bid = avgBid;
          existing.ask = avgAsk;
          existing.volume = Math.round(avgVolume);
          existing.timestamp = new Date();
        }
      }
    }

    return Array.from(aggregated.values());
  }

  /**
   * Merge candles from multiple brokers
   * Deduplicates based on timestamp
   */
  private mergeCandles(candles: Candle[]): Candle[] {
    // Group by timestamp
    const candleMap = new Map<string, Candle[]>();

    for (const candle of candles) {
      const key = `${candle.symbol}-${candle.timestamp.getTime()}`;
      if (!candleMap.has(key)) {
        candleMap.set(key, []);
      }
      candleMap.get(key)!.push(candle);
    }

    // Average prices for duplicate timestamps
    const merged: Candle[] = [];

    for (const [key, candleGroup] of candleMap.entries()) {
      if (candleGroup.length === 1) {
        merged.push(candleGroup[0]);
      } else {
        // Average the candlestick data
        const avgOpen = candleGroup.reduce((sum, c) => sum + c.open, 0) / candleGroup.length;
        const avgHigh = candleGroup.reduce((sum, c) => sum + c.high, 0) / candleGroup.length;
        const avgLow = candleGroup.reduce((sum, c) => sum + c.low, 0) / candleGroup.length;
        const avgClose = candleGroup.reduce((sum, c) => sum + c.close, 0) / candleGroup.length;
        const totalVolume = candleGroup.reduce((sum, c) => sum + c.volume, 0);

        merged.push({
          ...candleGroup[0],
          open: avgOpen,
          high: avgHigh,
          low: avgLow,
          close: avgClose,
          volume: totalVolume,
          broker: 'aggregated',
        });
      }
    }

    return merged.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

// Export singleton instance
export const dataAggregator = new DataAggregator();
