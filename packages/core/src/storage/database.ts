/**
 * Database Layer
 * Handles persistence of candles, patterns, and alerts
 */

import * as fs from 'fs';
import * as path from 'path';
import { Candle, CandlestickPattern, Alert, logger } from '@chartscanai/shared';

export interface IDatabase {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  saveCandle(candle: Candle): Promise<void>;
  getCandles(symbol: string, limit?: number): Promise<Candle[]>;
  savePattern(pattern: CandlestickPattern): Promise<void>;
  getPatterns(symbol?: string, limit?: number): Promise<CandlestickPattern[]>;
  saveAlert(alert: Alert): Promise<void>;
  getAlerts(limit?: number): Promise<Alert[]>;
}

/**
 * File-based database (fallback)
 */
export class FileDatabase implements IDatabase {
  private dataDir: string;
  private candlesFile: string;
  private patternsFile: string;
  private alertsFile: string;

  constructor(dataDir: string = path.join(process.cwd(), 'data')) {
    this.dataDir = dataDir;
    this.candlesFile = path.join(dataDir, 'candles.jsonl');
    this.patternsFile = path.join(dataDir, 'patterns.jsonl');
    this.alertsFile = path.join(dataDir, 'alerts.jsonl');

    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Create files if they don't exist
    [this.candlesFile, this.patternsFile, this.alertsFile].forEach((file) => {
      if (!fs.existsSync(file)) {
        fs.writeFileSync(file, '');
      }
    });
  }

  async connect(): Promise<void> {
    logger.info('Connected to file-based database');
  }

  async disconnect(): Promise<void> {
    logger.info('Disconnected from file-based database');
  }

  async saveCandle(candle: Candle): Promise<void> {
    try {
      const line = JSON.stringify(candle) + '\n';
      fs.appendFileSync(this.candlesFile, line);
    } catch (error) {
      logger.error(`Failed to save candle: ${error}`);
    }
  }

  async getCandles(symbol: string, limit: number = 100): Promise<Candle[]> {
    try {
      const content = fs.readFileSync(this.candlesFile, 'utf-8');
      const lines = content.trim().split('\n').filter((l) => l.length > 0);

      return lines
        .slice(Math.max(0, lines.length - limit))
        .map((line) => JSON.parse(line))
        .filter((candle: Candle) => candle.symbol === symbol);
    } catch (error) {
      logger.warn(`Failed to read candles: ${error}`);
      return [];
    }
  }

  async savePattern(pattern: CandlestickPattern): Promise<void> {
    try {
      const line = JSON.stringify(pattern) + '\n';
      fs.appendFileSync(this.patternsFile, line);
    } catch (error) {
      logger.error(`Failed to save pattern: ${error}`);
    }
  }

  async getPatterns(symbol?: string, limit: number = 100): Promise<CandlestickPattern[]> {
    try {
      const content = fs.readFileSync(this.patternsFile, 'utf-8');
      const lines = content.trim().split('\n').filter((l) => l.length > 0);

      let patterns = lines.slice(Math.max(0, lines.length - limit)).map((line) => JSON.parse(line));

      if (symbol) {
        patterns = patterns.filter((p: CandlestickPattern) => p.symbol === symbol);
      }

      return patterns;
    } catch (error) {
      logger.warn(`Failed to read patterns: ${error}`);
      return [];
    }
  }

  async saveAlert(alert: Alert): Promise<void> {
    try {
      const line = JSON.stringify(alert) + '\n';
      fs.appendFileSync(this.alertsFile, line);
    } catch (error) {
      logger.error(`Failed to save alert: ${error}`);
    }
  }

  async getAlerts(limit: number = 100): Promise<Alert[]> {
    try {
      const content = fs.readFileSync(this.alertsFile, 'utf-8');
      const lines = content.trim().split('\n').filter((l) => l.length > 0);

      return lines.slice(Math.max(0, lines.length - limit)).map((line) => JSON.parse(line));
    } catch (error) {
      logger.warn(`Failed to read alerts: ${error}`);
      return [];
    }
  }
}

/**
 * In-memory database (for testing/development)
 */
export class InMemoryDatabase implements IDatabase {
  private candles: Candle[] = [];
  private patterns: CandlestickPattern[] = [];
  private alerts: Alert[] = [];

  async connect(): Promise<void> {
    logger.info('Connected to in-memory database');
  }

  async disconnect(): Promise<void> {
    logger.info('Disconnected from in-memory database');
  }

  async saveCandle(candle: Candle): Promise<void> {
    this.candles.push(candle);
  }

  async getCandles(symbol: string, limit: number = 100): Promise<Candle[]> {
    return this.candles
      .filter((c) => c.symbol === symbol)
      .slice(Math.max(0, this.candles.length - limit));
  }

  async savePattern(pattern: CandlestickPattern): Promise<void> {
    this.patterns.push(pattern);
  }

  async getPatterns(symbol?: string, limit: number = 100): Promise<CandlestickPattern[]> {
    let patterns = this.patterns;

    if (symbol) {
      patterns = patterns.filter((p) => p.symbol === symbol);
    }

    return patterns.slice(Math.max(0, patterns.length - limit));
  }

  async saveAlert(alert: Alert): Promise<void> {
    this.alerts.push(alert);
  }

  async getAlerts(limit: number = 100): Promise<Alert[]> {
    return this.alerts.slice(Math.max(0, this.alerts.length - limit));
  }

  // Test helper methods
  clearAll(): void {
    this.candles = [];
    this.patterns = [];
    this.alerts = [];
  }

  getCandlesCount(): number {
    return this.candles.length;
  }

  getPatternsCount(): number {
    return this.patterns.length;
  }

  getAlertsCount(): number {
    return this.alerts.length;
  }
}

// Export singleton instances
export const inMemoryDatabase = new InMemoryDatabase();
export const fileDatabase = new FileDatabase();
