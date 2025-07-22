import { Database } from '../database/Database';
import { CircuitBreaker } from '../utils/CircuitBreaker';
import { RetryManager } from '../utils/RetryManager';
import { logger } from '../utils/Logger';

export class RobustDatabaseService {
  private static instance: RobustDatabaseService;
  private db = Database.getInstance();
  private circuitBreaker: CircuitBreaker;
  private connectionPool: any[] = [];

  static getInstance(): RobustDatabaseService {
    if (!RobustDatabaseService.instance) {
      RobustDatabaseService.instance = new RobustDatabaseService();
    }
    return RobustDatabaseService.instance;
  }

  constructor() {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      timeout: 30000,
      monitorTimeout: 60000
    });
  }

  async executeQuery<T>(
    query: string, 
    params: any[] = [],
    options: { 
      useRetry?: boolean;
      timeout?: number;
      operationType?: 'read' | 'write';
    } = {}
  ): Promise<T> {
    const { useRetry = true, timeout = 10000, operationType = 'read' } = options;

    const operation = async (): Promise<T> => {
      return await this.circuitBreaker.execute(async () => {
        // Add timeout wrapper
        return await Promise.race([
          this.performQuery<T>(query, params),
          this.createTimeoutPromise<T>(timeout)
        ]);
      });
    };

    if (useRetry) {
      return await RetryManager.executeWithRetry(operation, {
        maxAttempts: operationType === 'read' ? 3 : 1, // Don't retry writes multiple times
        baseDelay: 1000,
        retryCondition: (error: any) => {
          // Only retry on connection errors, not data errors
          return error?.code === 'SQLITE_BUSY' || 
                 error?.code === 'SQLITE_LOCKED' ||
                 error?.message?.includes('database is locked');
        }
      });
    } else {
      return await operation();
    }
  }

  private async performQuery<T>(query: string, params: any[]): Promise<T> {
    try {
      logger.debug('Executing database query', { 
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        paramCount: params.length
      });

      const startTime = Date.now();
      
      let result: T;
      if (query.trim().toUpperCase().startsWith('SELECT')) {
        if (query.includes('LIMIT 1') || query.includes('WHERE id =')) {
          result = await this.db.get(query, params) as T;
        } else {
          result = await this.db.all(query, params) as T;
        }
      } else {
        result = await this.db.run(query, params) as T;
      }

      const duration = Date.now() - startTime;
      
      if (duration > 1000) {
        logger.warn('Slow database query detected', { 
          query: query.substring(0, 100),
          duration,
          paramCount: params.length
        });
      }

      return result;
    } catch (error) {
      logger.error('Database query failed', error instanceof Error ? error : new Error(String(error)), {
        query: query.substring(0, 100),
        paramCount: params.length
      });
      throw error;
    }
  }

  private createTimeoutPromise<T>(timeoutMs: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Database query timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  // Convenience methods with built-in robustness
  async safeGet<T>(query: string, params: any[] = []): Promise<T | null> {
    try {
      return await this.executeQuery<T>(query, params, { operationType: 'read' });
    } catch (error) {
      logger.error('Safe get query failed', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  async safeAll<T>(query: string, params: any[] = []): Promise<T[]> {
    try {
      return await this.executeQuery<T[]>(query, params, { operationType: 'read' }) || [];
    } catch (error) {
      logger.error('Safe all query failed', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  async safeRun(query: string, params: any[] = []): Promise<{ changes: number; lastID?: number } | null> {
    try {
      return await this.executeQuery<{ changes: number; lastID?: number }>(query, params, { 
        operationType: 'write',
        useRetry: false // Don't retry writes
      });
    } catch (error) {
      logger.error('Safe run query failed', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  // Transaction wrapper with automatic rollback
  async executeTransaction<T>(operations: (db: Database) => Promise<T>): Promise<T | null> {
    try {
      return await this.circuitBreaker.execute(async () => {
        await this.db.run('BEGIN TRANSACTION');
        
        try {
          const result = await operations(this.db);
          await this.db.run('COMMIT');
          logger.debug('Transaction completed successfully');
          return result;
        } catch (error) {
          await this.db.run('ROLLBACK');
          logger.error('Transaction rolled back due to error', error instanceof Error ? error : new Error(String(error)));
          throw error;
        }
      });
    } catch (error) {
      logger.error('Transaction execution failed', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  // Health check for the database
  async healthCheck(): Promise<{
    isHealthy: boolean;
    responseTime: number;
    errorMessage?: string;
  }> {
    const startTime = Date.now();
    
    try {
      await this.executeQuery('SELECT 1 as test', [], { 
        timeout: 5000,
        useRetry: false 
      });
      
      return {
        isHealthy: true,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        isHealthy: false,
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }

  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats();
  }
}

// Global robust database service
export const robustDb = RobustDatabaseService.getInstance();
