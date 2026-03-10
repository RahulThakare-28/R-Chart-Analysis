/**
 * Logger Utility using Winston
 */

import * as fs from 'fs';
import * as path from 'path';

// Simple logger interface since we're not using winston in a complex way
export interface ILogger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: Error | any): void;
}

class Logger implements ILogger {
  private context: string;
  private logDir: string;

  constructor(context: string = 'ChartScanAI') {
    this.context = context;
    this.logDir = path.join(process.cwd(), 'logs');

    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = this.getTimestamp();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] [${this.context}] ${message}${metaStr}`;
  }

  private writeToFile(level: string, message: string): void {
    const logFile = path.join(this.logDir, `${level.toLowerCase()}.log`);
    try {
      fs.appendFileSync(logFile, message + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  debug(message: string, meta?: any): void {
    const formatted = this.formatMessage('DEBUG', message, meta);
    if (process.env.LOG_LEVEL === 'debug' || process.env.LOG_LEVEL === 'trace') {
      console.debug(formatted);
    }
    this.writeToFile('debug', formatted);
  }

  info(message: string, meta?: any): void {
    const formatted = this.formatMessage('INFO', message, meta);
    console.log(formatted);
    this.writeToFile('info', formatted);
  }

  warn(message: string, meta?: any): void {
    const formatted = this.formatMessage('WARN', message, meta);
    console.warn(formatted);
    this.writeToFile('warn', formatted);
  }

  error(message: string, error?: Error | any): void {
    const errorStr = error instanceof Error ? error.stack : JSON.stringify(error);
    const formatted = this.formatMessage('ERROR', message, { error: errorStr });
    console.error(formatted);
    this.writeToFile('error', formatted);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export factory function
export function createLogger(context: string): ILogger {
  return new Logger(context);
}
