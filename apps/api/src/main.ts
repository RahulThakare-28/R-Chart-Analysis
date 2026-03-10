/**
 * REST API Server - Main Entry Point
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';
import compression from 'compression';

import config from '@chartscanai/config';
import { logger, ErrorResponse, ApiResponse, isValidSymbol, areValidSymbols } from '@chartscanai/shared';
import { patternEngine, dataAggregator, alertDetector, alertNotifier } from '@chartscanai/core';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.getCorsOrigins() }));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ============================================
// Health Check
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// ============================================
// Pattern Detection Endpoints
// ============================================

app.get('/api/patterns', async (req: Request, res: Response) => {
  try {
    // Return from database
    const { symbol, limit } = req.query;
    const dbPatterns = await require('@chartscanai/core').fileDatabase.getPatterns(
      symbol as string,
      parseInt(limit as string) || 100
    );

    res.json({
      success: true,
      data: dbPatterns,
      timestamp: new Date(),
    } as ApiResponse<any>);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message, timestamp: new Date() },
      timestamp: new Date(),
    } as ApiResponse<any>);
  }
});

app.post('/api/patterns/detect', async (req: Request, res: Response) => {
  try {
    const { symbol, candles } = req.body;

    if (!symbol || !isValidSymbol(symbol)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SYMBOL', message: 'Invalid symbol provided', timestamp: new Date() },
        timestamp: new Date(),
      });
    }

    if (!Array.isArray(candles) || candles.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Candles array is required', timestamp: new Date() },
        timestamp: new Date(),
      });
    }

    const result = await patternEngine.detectPatterns(candles);

    res.json({
      success: true,
      data: result,
      timestamp: new Date(),
    } as ApiResponse<any>);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'PATTERN_DETECTION_ERROR', message: error.message, timestamp: new Date() },
      timestamp: new Date(),
    });
  }
});

// ============================================
// Broker Data Endpoints
// ============================================

app.get('/api/quotes/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;

    if (!isValidSymbol(symbol)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SYMBOL', message: 'Invalid symbol provided', timestamp: new Date() },
        timestamp: new Date(),
      });
    }

    const quotes = await dataAggregator.getQuotes([symbol]);

    res.json({
      success: true,
      data: quotes[0] || null,
      timestamp: new Date(),
    } as ApiResponse<any>);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'BROKER_ERROR', message: error.message, timestamp: new Date() },
      timestamp: new Date(),
    });
  }
});

app.get('/api/candles/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { timeframe } = req.query;

    if (!isValidSymbol(symbol)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SYMBOL', message: 'Invalid symbol provided', timestamp: new Date() },
        timestamp: new Date(),
      });
    }

    const candles = await dataAggregator.getCandles(symbol, (timeframe as any) || '1d');

    res.json({
      success: true,
      data: candles,
      timestamp: new Date(),
    } as ApiResponse<any>);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'BROKER_ERROR', message: error.message, timestamp: new Date() },
      timestamp: new Date(),
    });
  }
});

app.get('/api/brokers', (req: Request, res: Response) => {
  try {
    const brokers = dataAggregator.getRegisteredBrokers();

    res.json({
      success: true,
      data: { brokers, count: brokers.length },
      timestamp: new Date(),
    } as ApiResponse<any>);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message, timestamp: new Date() },
      timestamp: new Date(),
    });
  }
});

// ============================================
// Alerts Endpoints
// ============================================

app.get('/api/alerts', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const { fileDatabase } = require('@chartscanai/core');
    const alerts = await fileDatabase.getAlerts(parseInt(limit as string) || 100);

    res.json({
      success: true,
      data: alerts,
      timestamp: new Date(),
    } as ApiResponse<any>);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message, timestamp: new Date() },
      timestamp: new Date(),
    });
  }
});

app.get('/api/alerts/active', async (req: Request, res: Response) => {
  try {
    const alerts = await alertDetector.getActiveAlerts();

    res.json({
      success: true,
      data: alerts,
      timestamp: new Date(),
    } as ApiResponse<any>);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message, timestamp: new Date() },
      timestamp: new Date(),
    });
  }
});

// ============================================
// Analysis Endpoints
// ============================================

app.get('/api/analysis/top-patterns', async (req: Request, res: Response) => {
  try {
    const { fileDatabase } = require('@chartscanai/core');
    const patterns = await fileDatabase.getPatterns(undefined, 100);

    // Group by pattern name and count
    const patternCounts = new Map<string, number>();
    patterns.forEach((p: any) => {
      const count = patternCounts.get(p.name) || 0;
      patternCounts.set(p.name, count + 1);
    });

    const topPatterns = Array.from(patternCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    res.json({
      success: true,
      data: topPatterns,
      timestamp: new Date(),
    } as ApiResponse<any>);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message, timestamp: new Date() },
      timestamp: new Date(),
    });
  }
});

// ============================================
// API Documentation
// ============================================

app.get('/api/docs', (req: Request, res: Response) => {
  res.json({
    name: 'ChartScanAI API',
    version: '0.1.0',
    endpoints: {
      patterns: {
        'GET /api/patterns': 'List all detected patterns',
        'POST /api/patterns/detect': 'Manually trigger pattern detection',
      },
      quotes: {
        'GET /api/quotes/:symbol': 'Get current quote for symbol',
      },
      candles: {
        'GET /api/candles/:symbol': 'Get candle data for symbol',
      },
      brokers: {
        'GET /api/brokers': 'List connected brokers',
      },
      alerts: {
        'GET /api/alerts': 'List all alerts',
        'GET /api/alerts/active': 'List active alerts',
      },
      analysis: {
        'GET /api/analysis/top-patterns': 'Get top detected patterns',
      },
    },
  });
});

// ============================================
// 404 Handler
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date(),
    },
    timestamp: new Date(),
  } as ApiResponse<any>);
});

// ============================================
// Error Handler
// ============================================

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Unhandled error: ${error.message}`, error);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date(),
    },
    timestamp: new Date(),
  } as ApiResponse<any>);
});

// ============================================
// Server Start
// ============================================

const PORT = config.getPort();

app.listen(PORT, () => {
  logger.info(`API Server running on port ${PORT}`);
  logger.info(`Environment: ${config.getEnvironment()}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API Docs: http://localhost:${PORT}/api/docs`);
});

export default app;
