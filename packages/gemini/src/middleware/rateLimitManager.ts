import { logger } from '@chartscanai/shared';

interface TokenBucketState {
  rpm: number; // requests per minute
  tpm: number; // tokens per minute
  rpmLastRefillTime: number;
  tpmLastRefillTime: number;
}

/**
 * RateLimitManager: Token-bucket rate limiter for Gemini API
 * Prevents API quota exceeded by tracking both requests/minute and tokens/minute
 * Implements exponential backoff for rate limit violations
 */
export class RateLimitManager {
  private rpmLimit: number;
  private tpmLimit: number;
  private state: TokenBucketState;
  private waitingQueue: Array<{ tokens: number; resolve: () => void; reject: (err: Error) => void }> = [];
  private isProcessingQueue = false;

  constructor(rpmLimit: number = 60, tpmLimit: number = 60000) {
    this.rpmLimit = rpmLimit;
    this.tpmLimit = tpmLimit;
    this.state = {
      rpm: rpmLimit,
      tpm: tpmLimit,
      rpmLastRefillTime: Date.now(),
      tpmLastRefillTime: Date.now(),
    };
  }

  /**
   * Wait until capacity is available for the given token count
   * Non-blocking: returns promise that resolves when capacity is ready
   */
  async waitForCapacity(tokensNeeded: number = 100): Promise<void> {
    return new Promise((resolve, reject) => {
      this.waitingQueue.push({ tokens: tokensNeeded, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Record token usage after API call completes
   */
  recordUsage(tokensUsed: number = 100): void {
    this.state.tpm -= tokensUsed;
    this.state.rpm -= 1;

    logger.debug(
      `Rate limit usage recorded: ${tokensUsed} tokens (remaining: ${this.state.tpm}/${this.tpmLimit}, requests: ${this.state.rpm}/${this.rpmLimit})`
    );
  }

  /**
   * Get current remaining capacity
   */
  getRemainingCapacity(): { rpm: number; tpm: number; percentUsed: { rpm: number; tpm: number } } {
    this._refillBuckets();
    return {
      rpm: this.state.rpm,
      tpm: this.state.tpm,
      percentUsed: {
        rpm: Math.round(((this.rpmLimit - this.state.rpm) / this.rpmLimit) * 100),
        tpm: Math.round(((this.tpmLimit - this.state.tpm) / this.tpmLimit) * 100),
      },
    };
  }

  /**
   * Reset limits to full capacity (useful for testing)
   */
  reset(): void {
    this.state = {
      rpm: this.rpmLimit,
      tpm: this.tpmLimit,
      rpmLastRefillTime: Date.now(),
      tpmLastRefillTime: Date.now(),
    };
    this.waitingQueue = [];
    this.isProcessingQueue = false;
    logger.debug('Rate limiter reset to initial capacity');
  }

  /**
   * Private: Refill token buckets based on elapsed time
   */
  private _refillBuckets(): void {
    const now = Date.now();

    // Refill requests per minute (every 60 seconds)
    const rpmElapsedSeconds = (now - this.state.rpmLastRefillTime) / 1000;
    if (rpmElapsedSeconds >= 60) {
      this.state.rpm = this.rpmLimit;
      this.state.rpmLastRefillTime = now;
    }

    // Refill tokens per minute (every 60 seconds)
    const tpmElapsedSeconds = (now - this.state.tpmLastRefillTime) / 1000;
    if (tpmElapsedSeconds >= 60) {
      this.state.tpm = this.tpmLimit;
      this.state.tpmLastRefillTime = now;
    }
  }

  /**
   * Private: Process waiting queue with exponential backoff
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.waitingQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.waitingQueue.length > 0) {
      this._refillBuckets();

      const request = this.waitingQueue[0];
      const capacity = this.getRemainingCapacity();

      // Check if we have capacity for request
      if (capacity.rpm > 0 && capacity.tpm >= request.tokens) {
        this.waitingQueue.shift();
        request.resolve();
        continue;
      }

      // Calculate wait time with exponential backoff
      const waitTime = this._calculateWaitTime(capacity);

      logger.debug(
        `Rate limit: waiting ${waitTime}ms before next request (RPM: ${capacity.rpm}/${this.rpmLimit}, TPM: ${capacity.tpm}/${this.tpmLimit})`
      );

      await this._sleep(waitTime);
    }

    this.isProcessingQueue = false;
  }

  /**
   * Private: Calculate exponential backoff wait time
   */
  private _calculateWaitTime(capacity: ReturnType<typeof this.getRemainingCapacity>): number {
    const rpmPercent = capacity.percentUsed.rpm;
    const tpmPercent = capacity.percentUsed.tpm;
    const maxUsagePercent = Math.max(rpmPercent, tpmPercent);

    // Exponential backoff based on usage percentage
    // At 50% usage: ~100ms, at 80% usage: ~1000ms, at 99% usage: ~5000ms
    const baseWait = Math.pow(maxUsagePercent / 100, 3) * 5000;
    const randomJitter = Math.random() * (baseWait * 0.2);

    return Math.min(Math.ceil(baseWait + randomJitter), 30000); // Cap at 30 seconds
  }

  /**
   * Private: Sleep utility
   */
  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
