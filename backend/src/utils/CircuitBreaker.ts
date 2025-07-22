export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  timeout: number;
  monitorTimeout: number;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime: Date | null = null;
  private successCount = 0;
  private readonly options: CircuitBreakerOptions;

  constructor(options: CircuitBreakerOptions) {
    this.options = options;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN;
        console.log('🔄 Circuit breaker moving to HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN - operation blocked');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.lastFailureTime = null;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= Math.floor(this.options.failureThreshold / 2)) {
        this.state = CircuitBreakerState.CLOSED;
        this.successCount = 0;
        console.log('✅ Circuit breaker reset to CLOSED state');
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      console.log(`🚫 Circuit breaker opened due to ${this.failureCount} failures`);
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime.getTime() > this.options.timeout;
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      successCount: this.successCount
    };
  }
}
