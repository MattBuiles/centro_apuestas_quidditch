import { HealthService } from '../services/HealthService';
import { logger } from '../utils/Logger';

export class SystemMonitor {
  private static instance: SystemMonitor;
  private isRunning = false;
  private monitorInterval: NodeJS.Timeout | null = null;
  private healthService: HealthService;
  private alertThresholds = {
    errorRate: 10, // errors per minute
    responseTime: 5000, // 5 seconds
    memoryUsage: 80, // percentage
    connectionCount: 900 // near max connections
  };

  private metrics = {
    lastErrorCount: 0,
    lastCheckTime: Date.now(),
    consecutiveFailures: 0
  };

  static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor();
    }
    return SystemMonitor.instance;
  }

  constructor() {
    this.healthService = HealthService.getInstance();
  }

  start(intervalMs = 60000): void { // Default: check every minute
    if (this.isRunning) {
      logger.warn('System monitor is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting system monitor', { intervalMs });

    this.monitorInterval = setInterval(async () => {
      await this.performMonitoringCheck();
    }, intervalMs);

    // Initial check
    this.performMonitoringCheck();
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    logger.info('System monitor stopped');
  }

  private async performMonitoringCheck(): Promise<void> {
    try {
      const healthResult = await this.healthService.performHealthCheck();
      const currentTime = Date.now();
      
      // Check error rate
      const logStats = logger.getStats();
      const errorsSinceLastCheck = logStats.byLevel.error - this.metrics.lastErrorCount;
      const timeDiff = (currentTime - this.metrics.lastCheckTime) / (60 * 1000); // minutes
      const errorRate = timeDiff > 0 ? errorsSinceLastCheck / timeDiff : 0;

      // Update metrics
      this.metrics.lastErrorCount = logStats.byLevel.error;
      this.metrics.lastCheckTime = currentTime;

      // Check health status
      if (healthResult.status === 'unhealthy') {
        this.metrics.consecutiveFailures++;
        logger.error('System health check failed', undefined, {
          consecutiveFailures: this.metrics.consecutiveFailures,
          healthResult
        });

        if (this.metrics.consecutiveFailures >= 3) {
          await this.handleCriticalFailure(healthResult);
        }
      } else {
        this.metrics.consecutiveFailures = 0;
      }

      // Check specific alerts
      await this.checkAlerts(healthResult, errorRate);

      logger.debug('Monitoring check completed', {
        status: healthResult.status,
        errorRate,
        consecutiveFailures: this.metrics.consecutiveFailures,
        uptime: healthResult.uptime
      });

    } catch (error) {
      logger.error('Error during monitoring check', error instanceof Error ? error : new Error(String(error)));
      this.metrics.consecutiveFailures++;
    }
  }

  private async checkAlerts(healthResult: any, errorRate: number): Promise<void> {
    const alerts: string[] = [];

    // Error rate alert
    if (errorRate > this.alertThresholds.errorRate) {
      alerts.push(`High error rate: ${errorRate.toFixed(2)} errors/minute`);
    }

    // Memory usage alert
    if (healthResult.checks.memory?.details?.rssMB > 1024) {
      const memoryMB = healthResult.checks.memory.details.rssMB;
      alerts.push(`High memory usage: ${memoryMB}MB`);
    }

    // Database response time alert
    if (healthResult.checks.database?.responseTime > this.alertThresholds.responseTime) {
      alerts.push(`Slow database response: ${healthResult.checks.database.responseTime}ms`);
    }

    // Log alerts
    if (alerts.length > 0) {
      logger.warn('System alerts detected', { alerts });
    }
  }

  private async handleCriticalFailure(healthResult: any): Promise<void> {
    logger.error('Critical system failure detected', undefined, {
      failureCount: this.metrics.consecutiveFailures,
      healthResult,
      action: 'Consider manual intervention'
    });

    // Here you could implement automatic recovery actions:
    // - Restart services
    // - Clear caches
    // - Send notifications to administrators
    // - Graceful degradation of features
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      metrics: this.metrics,
      thresholds: this.alertThresholds
    };
  }

  updateThresholds(newThresholds: Partial<typeof this.alertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...newThresholds };
    logger.info('Monitoring thresholds updated', { thresholds: this.alertThresholds });
  }
}

// Global monitor instance
export const systemMonitor = SystemMonitor.getInstance();
