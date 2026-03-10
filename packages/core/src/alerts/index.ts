/**
 * Alert System
 * Detects patterns and generates alerts
 */

import { Candle, CandlestickPattern, Alert, AlertSubscription, logger, ALERT_CONFIG } from '@chartscanai/shared';
import { patternEngine } from '../patterns';
import { cache } from '../storage/cache';
import { fileDatabase } from '../storage/database';

export class AlertDetector {
  private deduplicationWindow: number = ALERT_CONFIG.DEDUP_WINDOW;
  private minConfidence: number = ALERT_CONFIG.MIN_CONFIDENCE;
  private recentAlerts: Map<string, Date> = new Map();

  /**
   * Detect alerts from candles
   */
  async detectAlerts(candles: Candle[]): Promise<Alert[]> {
    if (!Array.isArray(candles) || candles.length === 0) {
      return [];
    }

    try {
      // Detect patterns
      const result = await patternEngine.detectPatterns(candles);

      // Filter by confidence threshold
      const qualifyingPatterns = result.patterns.filter(
        (p) => p.confidence >= this.minConfidence
      );

      // Create alerts from patterns
      const alerts: Alert[] = [];

      for (const pattern of qualifyingPatterns) {
        // Check deduplication
        if (this.isDuplicate(pattern)) {
          logger.debug(`Skipping duplicate pattern: ${pattern.name} for ${pattern.symbol}`);
          continue;
        }

        const alert: Alert = {
          pattern,
          status: 'active',
          createdAt: new Date(),
          notificationsSent: false,
          priceAtCreation: pattern.candles[pattern.candles.length - 1].close,
        };

        alerts.push(alert);
        this.recordAlert(pattern);

        // Save to database
        await fileDatabase.saveAlert(alert);

        logger.info(`New alert created: ${pattern.name} for ${pattern.symbol} at ${pattern.timestamp}`);
      }

      return alerts;
    } catch (error) {
      logger.error(`Error detecting alerts: ${error}`);
      return [];
    }
  }

  /**
   * Check if pattern is a duplicate (within deduplication window)
   */
  private isDuplicate(pattern: CandlestickPattern): boolean {
    const key = `${pattern.symbol}-${pattern.name}-${pattern.timeframe}`;
    const lastAlert = this.recentAlerts.get(key);

    if (!lastAlert) {
      return false;
    }

    const timeSinceLastAlert = Date.now() - lastAlert.getTime();
    return timeSinceLastAlert < this.deduplicationWindow * 1000;
  }

  /**
   * Record an alert for deduplication
   */
  private recordAlert(pattern: CandlestickPattern): void {
    const key = `${pattern.symbol}-${pattern.name}-${pattern.timeframe}`;
    this.recentAlerts.set(key, new Date());

    // Clean up old entries after deduplication window
    this.cleanupOldAlerts();
  }

  /**
   * Clean up old alert records
   */
  private cleanupOldAlerts(): void {
    const now = Date.now();
    const window = this.deduplicationWindow * 1000;

    for (const [key, timestamp] of this.recentAlerts.entries()) {
      if (now - timestamp.getTime() > window) {
        this.recentAlerts.delete(key);
      }
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<Alert[]> {
    const alerts = await fileDatabase.getAlerts(1000);
    return alerts.filter((a) => a.status === 'active');
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(
    alertId: string,
    status: 'active' | 'triggered' | 'closed'
  ): Promise<void> {
    logger.info(`Alert ${alertId} status updated to ${status}`);
  }
}

/**
 * Alert Notifier
 * Sends notifications for detected alerts
 */
export class AlertNotifier {
  private notificationCallbacks: Array<(alert: Alert) => Promise<void>> = [];

  /**
   * Register a notification handler
   */
  registerNotificationHandler(handler: (alert: Alert) => Promise<void>): void {
    this.notificationCallbacks.push(handler);
  }

  /**
   * Send notification for an alert
   */
  async notify(alert: Alert): Promise<void> {
    try {
      const promises = this.notificationCallbacks.map((handler) =>
        handler(alert).catch((error) => {
          logger.warn(`Notification handler error: ${error}`);
        })
      );

      await Promise.all(promises);

      logger.info(`Notification sent for alert: ${alert.pattern.name}`);
    } catch (error) {
      logger.error(`Failed to send notification: ${error}`);
    }
  }

  /**
   * Send notifications for multiple alerts
   */
  async notifyMultiple(alerts: Alert[]): Promise<void> {
    const promises = alerts.map((alert) => this.notify(alert));
    await Promise.all(promises);
  }

  /**
   * Console notification handler (default)
   */
  static createConsoleNotifier(): (alert: Alert) => Promise<void> {
    return async (alert: Alert) => {
      const message = `
🔔 NEW ALERT: ${alert.pattern.action}
📊 Pattern: ${alert.pattern.name}
💰 Symbol: ${alert.pattern.symbol}
📈 Confidence: ${alert.pattern.confidence}%
🎯 Price: ${alert.pattern.candles[alert.pattern.candles.length - 1].close}
⏰ Time: ${alert.pattern.timestamp}
📝 Description: ${alert.pattern.description}
      `;

      console.log(message);
    };
  }

  /**
   * Email notification handler (stub)
   */
  static createEmailNotifier(recipients: string[]): (alert: Alert) => Promise<void> {
    return async (alert: Alert) => {
      logger.info(`Email notification would be sent to ${recipients.join(', ')} for pattern: ${alert.pattern.name}`);
      // TODO: Implement actual email sending
    };
  }

  /**
   * In-app notification handler (stub)
   */
  static createInAppNotifier(): (alert: Alert) => Promise<void> {
    return async (alert: Alert) => {
      // Cache the notification
      const notificationKey = `notification:${Date.now()}`;
      await cache.set(notificationKey, alert, 3600); // 1 hour TTL
      logger.info(`In-app notification cached for pattern: ${alert.pattern.name}`);
    };
  }
}

// Export singletons
export const alertDetector = new AlertDetector();
export const alertNotifier = new AlertNotifier();

// Register default console notifier
alertNotifier.registerNotificationHandler(AlertNotifier.createConsoleNotifier());
