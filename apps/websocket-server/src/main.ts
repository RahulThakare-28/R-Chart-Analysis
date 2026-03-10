/**
 * WebSocket Server - Real-time Updates
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer } from 'http';

import config from '@chartscanai/config';
import { logger, Candle, CandlestickPattern, Alert } from '@chartscanai/shared';
import { dataAggregator, alertDetector, alertNotifier } from '@chartscanai/core';

// Create HTTP server for Socket.io
const httpServer = createServer();

// Initialize Socket.io
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.getCorsOrigins(),
    methods: ['GET', 'POST'],
  },
});

// Track active subscriptions
interface ClientSubscription {
  symbols: Set<string>;
  patterns: Set<string>;
  alerts: boolean;
}

const clientSubscriptions = new Map<string, ClientSubscription>();

// ============================================
// Connection Handler
// ============================================

io.on('connection', (socket: Socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Initialize subscription tracker for this client
  clientSubscriptions.set(socket.id, {
    symbols: new Set(),
    patterns: new Set(),
    alerts: false,
  });

  // ============================================
  // Quote Streaming
  // ============================================

  socket.on('subscribe:quotes', (symbols: string[]) => {
    try {
      const subscription = clientSubscriptions.get(socket.id);
      if (subscription) {
        symbols.forEach((symbol) => subscription.symbols.add(symbol.toUpperCase()));
      }

      logger.info(`Client ${socket.id} subscribed to quotes: ${symbols.join(',')}`);
      socket.emit('subscribe:quotes:ack', { status: 'subscribed', symbols });

      // Start polling for quotes
      pollQuotes(socket, symbols);
    } catch (error) {
      logger.error(`Error subscribing to quotes: ${error}`);
      socket.emit('error', { message: 'Failed to subscribe to quotes' });
    }
  });

  socket.on('unsubscribe:quotes', (symbols: string[]) => {
    const subscription = clientSubscriptions.get(socket.id);
    if (subscription) {
      symbols.forEach((symbol) => subscription.symbols.delete(symbol.toUpperCase()));
    }

    logger.info(`Client ${socket.id} unsubscribed from quotes: ${symbols.join(',')}`);
    socket.emit('unsubscribe:quotes:ack', { status: 'unsubscribed', symbols });
  });

  // ============================================
  // Candle Streaming
  // ============================================

  socket.on('subscribe:candles', (data: { symbols: string[]; timeframe: string }) => {
    try {
      const subscription = clientSubscriptions.get(socket.id);
      if (subscription) {
        data.symbols.forEach((symbol) => subscription.symbols.add(symbol.toUpperCase()));
      }

      logger.info(`Client ${socket.id} subscribed to candles: ${data.symbols.join(',')} (${data.timeframe})`);
      socket.emit('subscribe:candles:ack', {
        status: 'subscribed',
        symbols: data.symbols,
        timeframe: data.timeframe,
      });

      // Start polling for candles
      pollCandles(socket, data.symbols, data.timeframe as any);
    } catch (error) {
      logger.error(`Error subscribing to candles: ${error}`);
      socket.emit('error', { message: 'Failed to subscribe to candles' });
    }
  });

  socket.on('unsubscribe:candles', (symbols: string[]) => {
    const subscription = clientSubscriptions.get(socket.id);
    if (subscription) {
      symbols.forEach((symbol) => subscription.symbols.delete(symbol.toUpperCase()));
    }

    logger.info(`Client ${socket.id} unsubscribed from candles: ${symbols.join(',')}`);
    socket.emit('unsubscribe:candles:ack', { status: 'unsubscribed', symbols });
  });

  // ============================================
  // Alert Streaming
  // ============================================

  socket.on('subscribe:alerts', () => {
    try {
      const subscription = clientSubscriptions.get(socket.id);
      if (subscription) {
        subscription.alerts = true;
      }

      logger.info(`Client ${socket.id} subscribed to alerts`);
      socket.emit('subscribe:alerts:ack', { status: 'subscribed' });
    } catch (error) {
      logger.error(`Error subscribing to alerts: ${error}`);
      socket.emit('error', { message: 'Failed to subscribe to alerts' });
    }
  });

  socket.on('unsubscribe:alerts', () => {
    const subscription = clientSubscriptions.get(socket.id);
    if (subscription) {
      subscription.alerts = false;
    }

    logger.info(`Client ${socket.id} unsubscribed from alerts`);
    socket.emit('unsubscribe:alerts:ack', { status: 'unsubscribed' });
  });

  // ============================================
  // Disconnection Handler
  // ============================================

  socket.on('disconnect', () => {
    clientSubscriptions.delete(socket.id);
    logger.info(`Client disconnected: ${socket.id}`);
  });

  // ============================================
  // Error Handler
  // ============================================

  socket.on('error', (error: any) => {
    logger.error(`Socket error [${socket.id}]: ${error.message}`);
  });

  // Send welcome message
  socket.emit('connected', { message: 'Connected to ChartScanAI WebSocket server', clientId: socket.id });
});

// ============================================
// Polling Functions
// ============================================

async function pollQuotes(socket: Socket, symbols: string[]): Promise<void> {
  // Poll every 5 seconds
  const interval = setInterval(async () => {
    // Check if still connected
    if (!clientSubscriptions.has(socket.id)) {
      clearInterval(interval);
      return;
    }

    try {
      const quotes = await dataAggregator.getQuotes(symbols);

      socket.emit('quotes:update', {
        data: quotes,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.debug(`Error fetching quotes: ${error}`);
    }
  }, 5000);

  // Stop polling when client requests
  socket.on('unsubscribe:quotes', () => {
    clearInterval(interval);
  });
}

async function pollCandles(socket: Socket, symbols: string[], timeframe: any): Promise<void> {
  // Poll every 10 seconds
  const interval = setInterval(async () => {
    // Check if still connected
    if (!clientSubscriptions.has(socket.id)) {
      clearInterval(interval);
      return;
    }

    try {
      for (const symbol of symbols) {
        const candles = await dataAggregator.getCandles(symbol, timeframe);

        socket.emit('candles:update', {
          symbol,
          timeframe,
          data: candles,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      logger.debug(`Error fetching candles: ${error}`);
    }
  }, 10000);

  // Stop polling when client requests
  socket.on('unsubscribe:candles', () => {
    clearInterval(interval);
  });
}

// ============================================
// Alert Broadcasting
// ============================================

export function broadcastAlert(alert: Alert): void {
  io.emit('alerts:new', {
    data: alert,
    timestamp: new Date(),
  });

  logger.info(`Alert broadcast: ${alert.pattern.name} for ${alert.pattern.symbol}`);
}

// Register alert notifier to broadcast alerts
alertNotifier.registerNotificationHandler(async (alert: Alert) => {
  broadcastAlert(alert);
});

// ============================================
// Server Start
// ============================================

const WS_PORT = config.getWsPort();

httpServer.listen(WS_PORT, () => {
  logger.info(`WebSocket Server running on port ${WS_PORT}`);
  logger.info(`Environment: ${config.getEnvironment()}`);
  logger.info(`Clients connected: 0`);
});

// Track connection count
io.on('connection', () => {
  logger.info(`Active connections: ${io.engine.clientsCount}`);
});

export default io;
export { broadcastAlert };
