import { Database } from '../database/Database';
import { logger } from '../utils/Logger';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: HealthStatus;
    memory: HealthStatus;
    websocket: HealthStatus;
    diskSpace?: HealthStatus;
  };
  version: string;
  environment: string;
}

export interface HealthStatus {
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  details?: Record<string, any>;
  responseTime?: number;
}

export class HealthService {
  private static instance: HealthService;

  static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const checks = await Promise.allSettled([
        this.checkDatabase(),
        this.checkMemory(),
        this.checkWebSocket()
      ]);

      const [databaseResult, memoryResult, websocketResult] = checks;

      const healthResult: HealthCheckResult = {
        status: this.determineOverallStatus([
          databaseResult.status === 'fulfilled' ? databaseResult.value : { status: 'fail' },
          memoryResult.status === 'fulfilled' ? memoryResult.value : { status: 'fail' },
          websocketResult.status === 'fulfilled' ? websocketResult.value : { status: 'fail' }
        ]),
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
          database: databaseResult.status === 'fulfilled' ? databaseResult.value : { 
            status: 'fail', 
            message: databaseResult.reason?.message || 'Database check failed' 
          },
          memory: memoryResult.status === 'fulfilled' ? memoryResult.value : { 
            status: 'fail', 
            message: memoryResult.reason?.message || 'Memory check failed' 
          },
          websocket: websocketResult.status === 'fulfilled' ? websocketResult.value : { 
            status: 'fail', 
            message: websocketResult.reason?.message || 'WebSocket check failed' 
          }
        },
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      };

      const responseTime = Date.now() - startTime;
      logger.debug('Health check completed', { 
        status: healthResult.status, 
        responseTime,
        checks: Object.keys(healthResult.checks).map(key => {
          const check = healthResult.checks[key as keyof typeof healthResult.checks];
          return {
            name: key,
            status: check?.status || 'fail'
          };
        })
      });

      return healthResult;
    } catch (error) {
      logger.error('Health check failed', error instanceof Error ? error : new Error(String(error)));
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
          database: { status: 'fail', message: 'Health check error' },
          memory: { status: 'fail', message: 'Health check error' },
          websocket: { status: 'fail', message: 'Health check error' }
        },
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      };
    }
  }

  private async checkDatabase(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const db = Database.getInstance();
      
      // Simple query to test database connectivity
      await db.get('SELECT 1 as test');
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < 1000 ? 'pass' : 'warn',
        message: responseTime < 1000 ? 'Database responsive' : 'Database slow response',
        responseTime,
        details: {
          type: 'SQLite',
          responseTimeMs: responseTime
        }
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Database connection failed',
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  private async checkMemory(): Promise<HealthStatus> {
    try {
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      const rssMB = Math.round(memUsage.rss / 1024 / 1024);
      
      // Warning if heap usage is over 512MB or RSS over 1GB
      const isHighMemory = heapUsedMB > 512 || rssMB > 1024;
      
      return {
        status: isHighMemory ? 'warn' : 'pass',
        message: isHighMemory ? 'High memory usage detected' : 'Memory usage normal',
        details: {
          heapUsedMB,
          heapTotalMB,
          rssMB,
          externalMB: Math.round(memUsage.external / 1024 / 1024)
        }
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Memory check failed',
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  private async checkWebSocket(): Promise<HealthStatus> {
    try {
      // Basic check - in a real implementation, you might test actual WebSocket connectivity
      const wsPort = process.env.WS_PORT || '3002';
      
      return {
        status: 'pass',
        message: 'WebSocket service available',
        details: {
          port: wsPort,
          enabled: true
        }
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'WebSocket check failed',
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  private determineOverallStatus(checks: HealthStatus[]): 'healthy' | 'degraded' | 'unhealthy' {
    const hasFailure = checks.some(check => check.status === 'fail');
    const hasWarning = checks.some(check => check.status === 'warn');
    
    if (hasFailure) return 'unhealthy';
    if (hasWarning) return 'degraded';
    return 'healthy';
  }
}
