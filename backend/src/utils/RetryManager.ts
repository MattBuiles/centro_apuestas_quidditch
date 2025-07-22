export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

export class RetryManager {
  private static readonly DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    retryCondition: (error: any) => {
      // Retry on network errors, timeouts, and 5xx errors
      if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') return true;
      if (error?.response?.status >= 500) return true;
      if (error?.name === 'DatabaseError') return true;
      return false;
    }
  };

  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    let lastError: any;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        if (attempt > 1) {
          console.log(`✅ Operation succeeded on attempt ${attempt}`);
        }
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt === config.maxAttempts || !config.retryCondition(error)) {
          break;
        }

        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
          config.maxDelay
        );

        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`🔄 Operation failed (attempt ${attempt}/${config.maxAttempts}), retrying in ${delay}ms:`, errorMessage);
        
        await this.delay(delay);
      }
    }

    const lastErrorMessage = lastError instanceof Error ? lastError.message : String(lastError);
    console.error(`❌ Operation failed after ${config.maxAttempts} attempts:`, lastErrorMessage);
    throw lastError;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const withRetry = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: Partial<RetryOptions> = {}
) => {
  return async (...args: T): Promise<R> => {
    return RetryManager.executeWithRetry(() => fn(...args), options);
  };
};
