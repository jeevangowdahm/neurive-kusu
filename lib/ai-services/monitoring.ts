'use client';

/**
 * Monitoring & Observability System
 * Tracks AI operations, performance metrics, and system health
 */

export interface OperationMetric {
  operationType: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  operationCount: number;
  averageResponseTime: number;
  errorRate: number;
  p99ResponseTime: number;
  successRate: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'latency' | 'error_rate' | 'memory' | 'queue_overflow';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: number;
  value: number;
  threshold: number;
  resolved: boolean;
}

/**
 * Metrics Collector
 */
export class MetricsCollector {
  private metrics: OperationMetric[] = [];
  private maxMetrics: number = 10000;
  private alerts: PerformanceAlert[] = [];
  private thresholds = {
    latency: 1000, // ms
    errorRate: 0.05, // 5%
    memoryUsage: 0.9, // 90%
  };

  recordOperation(
    operationType: string,
    duration: number,
    success: boolean,
    error?: string,
    metadata?: Record<string, any>
  ): void {
    const metric: OperationMetric = {
      operationType,
      duration,
      timestamp: Date.now(),
      success,
      error,
      metadata,
    };

    this.metrics.push(metric);

    // Keep memory bounded
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Check for alerts
    this.checkAlerts();
  }

  private checkAlerts(): void {
    // Check latency
    const avgLatency = this.getAverageLatency();
    if (avgLatency > this.thresholds.latency) {
      this.createAlert('latency', 'warning', `High latency detected: ${avgLatency}ms`, avgLatency);
    }

    // Check error rate
    const errorRate = this.getErrorRate();
    if (errorRate > this.thresholds.errorRate) {
      this.createAlert('error_rate', 'warning', `Error rate elevated: ${(errorRate * 100).toFixed(2)}%`, errorRate);
    }
  }

  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    value: number
  ): void {
    const threshold = this.thresholds[type === 'latency' ? 'latency' : type === 'error_rate' ? 'errorRate' : 'memoryUsage'];

    const alert: PerformanceAlert = {
      id: `${type}-${Date.now()}`,
      type,
      severity,
      message,
      timestamp: Date.now(),
      value,
      threshold,
      resolved: false,
    };

    this.alerts.push(alert);

    // Keep alerts bounded
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
  }

  getMetrics(): SystemMetrics {
    const recentMetrics = this.metrics.slice(-1000); // Last 1000 operations

    const avgDuration =
      recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
        : 0;

    const sortedDurations = recentMetrics.map((m) => m.duration).sort((a, b) => a - b);
    const p99 =
      recentMetrics.length > 0 ? sortedDurations[Math.floor(recentMetrics.length * 0.99)] || 0 : 0;

    const errorCount = recentMetrics.filter((m) => !m.success).length;
    const errorRate = recentMetrics.length > 0 ? errorCount / recentMetrics.length : 0;

    const memUsage = typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage() : null;

    return {
      operationCount: recentMetrics.length,
      averageResponseTime: avgDuration,
      errorRate,
      p99ResponseTime: p99,
      successRate: 1 - errorRate,
      memory: memUsage ? {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external || 0,
      } : { heapUsed: 0, heapTotal: 0, external: 0 },
    };
  }

  getAverageLatency(): number {
    if (this.metrics.length === 0) return 0;
    const recent = this.metrics.slice(-100);
    return recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
  }

  getErrorRate(): number {
    if (this.metrics.length === 0) return 0;
    const recent = this.metrics.slice(-100);
    const errors = recent.filter((m) => !m.success).length;
    return errors / recent.length;
  }

  getAlerts(): PerformanceAlert[] {
    return this.alerts.filter((a) => !a.resolved).slice(-50); // Last 50 unresolved
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  clearOldMetrics(olderThanMs: number): void {
    const cutoff = Date.now() - olderThanMs;
    this.metrics = this.metrics.filter((m) => m.timestamp > cutoff);
    this.alerts = this.alerts.filter((a) => a.timestamp > cutoff);
  }

  getOperationBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};

    for (const metric of this.metrics) {
      breakdown[metric.operationType] = (breakdown[metric.operationType] || 0) + 1;
    }

    return breakdown;
  }

  getOperationStats(operationType: string) {
    const ops = this.metrics.filter((m) => m.operationType === operationType);

    if (ops.length === 0) {
      return { count: 0, avgDuration: 0, errorRate: 0 };
    }

    const avgDuration = ops.reduce((sum, op) => sum + op.duration, 0) / ops.length;
    const errorCount = ops.filter((op) => !op.success).length;
    const errorRate = errorCount / ops.length;

    return {
      count: ops.length,
      avgDuration,
      errorRate,
    };
  }
}

/**
 * Global metrics collector instance
 */
export const metricsCollector = new MetricsCollector();

/**
 * Monitoring decorator for async functions
 */
export function monitorOperation(operationType: string) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - startTime;

        metricsCollector.recordOperation(operationType, duration, true, undefined, {
          method: propertyKey,
        });

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        metricsCollector.recordOperation(operationType, duration, false, errorMessage, {
          method: propertyKey,
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Health check system
 */
export class HealthChecker {
  private checks: Map<
    string,
    {
      status: 'healthy' | 'degraded' | 'unhealthy';
      lastCheck: number;
      message: string;
    }
  > = new Map();

  registerCheck(
    name: string,
    checker: () => Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; message: string }>
  ): void {
    // Store checker for periodic execution
    setInterval(async () => {
      try {
        const result = await checker();
        this.checks.set(name, {
          ...result,
          lastCheck: Date.now(),
        });
      } catch (error) {
        this.checks.set(name, {
          status: 'unhealthy',
          lastCheck: Date.now(),
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, 30000); // Check every 30 seconds
  }

  getStatus() {
    const checks: Record<string, any> = {};
    const unhealthy: Array<{ status: string; message: string }> = [];
    const degraded: Array<{ status: string; message: string }> = [];

    this.checks.forEach((value, key) => {
      checks[key] = value;
      if (value.status === 'unhealthy') unhealthy.push(value);
      if (value.status === 'degraded') degraded.push(value);
    });

    return {
      status: unhealthy.length > 0 ? 'unhealthy' : degraded.length > 0 ? 'degraded' : 'healthy',
      checks,
      unhealthyCount: unhealthy.length,
      degradedCount: degraded.length,
      timestamp: Date.now(),
    };
  }
}

/**
 * Global health checker
 */
export const healthChecker = new HealthChecker();

/**
 * Structured logging
 */
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  error?: string;
}

export class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 5000;

  log(
    level: LogEntry['level'],
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      error: error?.message,
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output for development
    console.log(`[${level.toUpperCase()}] ${message}`, context, error);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log('error', message, context, error);
  }

  getLogs(level?: LogEntry['level'], limit: number = 100): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter((l) => l.level === level);
    }

    return filtered.slice(-limit);
  }

  clearOldLogs(olderThanMs: number): void {
    const cutoff = Date.now() - olderThanMs;
    this.logs = this.logs.filter((l) => l.timestamp > cutoff);
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();
