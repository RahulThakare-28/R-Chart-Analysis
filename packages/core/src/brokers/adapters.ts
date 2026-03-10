/**
 * Broker Adapters - Standardized interfaces to integrate with different brokers
 */

import axios, { AxiosInstance } from 'axios';
import { IBrokerAdapter, Quote, Candle, Timeframe, logger } from '@chartscanai/shared';

/**
 * Base class for all broker adapters
 */
export abstract class BaseBrokerAdapter implements IBrokerAdapter {
  protected axiosInstance: AxiosInstance;
  protected apiKey: string;
  protected authenticated: boolean = false;
  abstract name: string;

  constructor(apiKey: string, endpoint: string) {
    this.apiKey = apiKey;
    this.axiosInstance = axios.create({
      baseURL: endpoint,
      timeout: 30000,
    });
  }

  abstract authenticate(): Promise<void>;
  abstract getQuotes(symbols: string[]): Promise<Quote[]>;
  abstract getCandles(symbol: string, timeframe: Timeframe, limit?: number): Promise<Candle[]>;
  abstract subscribeToUpdates(symbols: string[], callback: (update: Quote | Candle) => void): Promise<void>;
  abstract unsubscribe(): Promise<void>;

  protected async makeRequest(method: string, path: string, config?: any) {
    try {
      const response = await this.axiosInstance({
        method,
        url: path,
        ...config,
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Broker API error [${this.name}]: ${error.message}`);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }
}

/**
 * Grow Broker Adapter
 */
export class GrowAdapter extends BaseBrokerAdapter {
  name = 'grow';

  constructor(apiKey: string) {
    super(apiKey, 'https://api.grow.co.in/v1');
  }

  async authenticate(): Promise<void> {
    try {
      // Verify API key by making a test request
      await this.makeRequest('GET', '/user', {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      this.authenticated = true;
      logger.info('Successfully authenticated with Grow broker');
    } catch (error) {
      logger.error('Failed to authenticate with Grow broker');
      throw error;
    }
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    if (!this.authenticated) {
      await this.authenticate();
    }

    try {
      const quotes: Quote[] = [];

      for (const symbol of symbols) {
        const data = await this.makeRequest('GET', `/quotes/${symbol}`, {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        });

        quotes.push({
          symbol: data.symbol || symbol,
          price: parseFloat(data.lastPrice),
          bid: parseFloat(data.bid),
          ask: parseFloat(data.ask),
          change: parseFloat(data.change),
          changePercent: parseFloat(data.changePercent),
          volume: parseInt(data.volume),
          timestamp: new Date(data.timestamp || Date.now()),
          broker: this.name,
        });
      }

      return quotes;
    } catch (error) {
      logger.error(`Failed to get quotes from Grow: ${error}`);
      throw error;
    }
  }

  async getCandles(symbol: string, timeframe: Timeframe, limit: number = 100): Promise<Candle[]> {
    if (!this.authenticated) {
      await this.authenticate();
    }

    try {
      const data = await this.makeRequest('GET', `/candles/${symbol}`, {
        params: { interval: timeframe, limit },
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      return (data.candles || []).map((candle: any) => ({
        symbol,
        timeframe,
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseInt(candle.volume),
        timestamp: new Date(candle.timestamp),
        broker: this.name,
      }));
    } catch (error) {
      logger.error(`Failed to get candles from Grow: ${error}`);
      throw error;
    }
  }

  async subscribeToUpdates(symbols: string[], callback: (update: Quote | Candle) => void): Promise<void> {
    logger.info(`Grow broker streaming not yet implemented for symbols: ${symbols.join(',')}`);
    // TODO: Implement WebSocket subscription
  }

  async unsubscribe(): Promise<void> {
    logger.info('Unsubscribed from Grow broker');
  }
}

/**
 * Upstox Broker Adapter
 */
export class UpstoxAdapter extends BaseBrokerAdapter {
  name = 'upstox';
  private accessToken?: string;

  constructor(apiKey: string) {
    super(apiKey, 'https://api.upstox.com/v2');
  }

  async authenticate(): Promise<void> {
    try {
      // In production, this would handle OAuth flow
      // For now, we'll use the API key directly
      this.accessToken = this.apiKey;
      this.authenticated = true;
      logger.info('Successfully authenticated with Upstox broker');
    } catch (error) {
      logger.error('Failed to authenticate with Upstox broker');
      throw error;
    }
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    if (!this.authenticated) {
      await this.authenticate();
    }

    try {
      const quotes: Quote[] = [];

      for (const symbol of symbols) {
        const data = await this.makeRequest('GET', `/market-quote/ltp`, {
          params: { mode: 'LTP', symbol: `NSE_EQ|${symbol}` },
          headers: { Authorization: `Bearer ${this.accessToken}` },
        });

        const quoteData = data.data?.[`NSE_EQ|${symbol}`];
        if (quoteData) {
          quotes.push({
            symbol,
            price: quoteData.ltp,
            bid: quoteData.bid,
            ask: quoteData.ask,
            change: quoteData.lastPrice ? quoteData.ltp - quoteData.lastPrice : 0,
            changePercent: quoteData.changePercent || 0,
            volume: quoteData.volume || 0,
            timestamp: new Date(),
            broker: this.name,
          });
        }
      }

      return quotes;
    } catch (error) {
      logger.error(`Failed to get quotes from Upstox: ${error}`);
      throw error;
    }
  }

  async getCandles(symbol: string, timeframe: Timeframe, limit: number = 100): Promise<Candle[]> {
    if (!this.authenticated) {
      await this.authenticate();
    }

    try {
      const intervalMap = {
        '1m': '1minute',
        '5m': '5minute',
        '15m': '15minute',
        '30m': '30minute',
        '1h': '1hour',
        '4h': '4hour',
        '1d': '1day',
        '1w': '1week',
        '1M': '1month',
      };

      const data = await this.makeRequest('GET', `/historical-candle/NSE_EQ|${symbol}/${intervalMap[timeframe]}`, {
        params: { limit },
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      return (data.data?.candles || []).map((candle: any) => ({
        symbol,
        timeframe,
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
        timestamp: new Date(candle[0]),
        broker: this.name,
      }));
    } catch (error) {
      logger.error(`Failed to get candles from Upstox: ${error}`);
      throw error;
    }
  }

  async subscribeToUpdates(symbols: string[], callback: (update: Quote | Candle) => void): Promise<void> {
    logger.info(`Upstox broker streaming not yet implemented for symbols: ${symbols.join(',')}`);
    // TODO: Implement WebSocket subscription
  }

  async unsubscribe(): Promise<void> {
    logger.info('Unsubscribed from Upstox broker');
  }
}

/**
 * Ticker Tape Broker Adapter
 */
export class TickerTapeAdapter extends BaseBrokerAdapter {
  name = 'ticker-tape';

  constructor(apiKey: string) {
    super(apiKey, 'https://api.tickertape.in/api/v1');
  }

  async authenticate(): Promise<void> {
    try {
      await this.makeRequest('GET', '/user/profile', {
        headers: { 'X-API-Key': this.apiKey },
      });
      this.authenticated = true;
      logger.info('Successfully authenticated with Ticker Tape broker');
    } catch (error) {
      logger.error('Failed to authenticate with Ticker Tape broker');
      throw error;
    }
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    if (!this.authenticated) {
      await this.authenticate();
    }

    try {
      const symbolString = symbols.join(',');
      const data = await this.makeRequest('GET', '/market/quote', {
        params: { symbols: symbolString },
        headers: { 'X-API-Key': this.apiKey },
      });

      return symbols.map((symbol) => {
        const quote = data.data?.quotes?.[symbol] || {};
        return {
          symbol,
          price: quote.ltp || 0,
          bid: quote.bid || 0,
          ask: quote.ask || 0,
          change: quote.change || 0,
          changePercent: quote.changePercent || 0,
          volume: quote.volume || 0,
          timestamp: new Date(),
          broker: this.name,
        };
      });
    } catch (error) {
      logger.error(`Failed to get quotes from Ticker Tape: ${error}`);
      throw error;
    }
  }

  async getCandles(symbol: string, timeframe: Timeframe, limit: number = 100): Promise<Candle[]> {
    if (!this.authenticated) {
      await this.authenticate();
    }

    try {
      const data = await this.makeRequest('GET', `/market/candles/${symbol}`, {
        params: { from: '1d', range: timeframe, limit },
        headers: { 'X-API-Key': this.apiKey },
      });

      return (data.data?.candles || []).map((candle: any) => ({
        symbol,
        timeframe,
        open: candle.o,
        high: candle.h,
        low: candle.l,
        close: candle.c,
        volume: candle.v,
        timestamp: new Date(candle.t * 1000),
        broker: this.name,
      }));
    } catch (error) {
      logger.error(`Failed to get candles from Ticker Tape: ${error}`);
      throw error;
    }
  }

  async subscribeToUpdates(symbols: string[], callback: (update: Quote | Candle) => void): Promise<void> {
    logger.info(`Ticker Tape broker streaming not yet implemented for symbols: ${symbols.join(',')}`);
    // TODO: Implement WebSocket subscription
  }

  async unsubscribe(): Promise<void> {
    logger.info('Unsubscribed from Ticker Tape broker');
  }
}

/**
 * Create broker adapter factory
 */
export function createBrokerAdapter(brokerName: string, apiKey: string): BaseBrokerAdapter {
  switch (brokerName.toLowerCase()) {
    case 'grow':
      return new GrowAdapter(apiKey);
    case 'upstox':
      return new UpstoxAdapter(apiKey);
    case 'ticker-tape':
      return new TickerTapeAdapter(apiKey);
    default:
      throw new Error(`Unknown broker: ${brokerName}`);
  }
}
