export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (level > this.logLevel) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with colors
    const levelStr = LogLevel[level];
    const timestamp = entry.timestamp.toISOString();
    
    let logFunction = console.log;
    let emoji = '📝';
    
    switch (level) {
      case LogLevel.ERROR:
        logFunction = console.error;
        emoji = '❌';
        break;
      case LogLevel.WARN:
        logFunction = console.warn;
        emoji = '⚠️';
        break;
      case LogLevel.INFO:
        logFunction = console.info;
        emoji = 'ℹ️';
        break;
      case LogLevel.DEBUG:
        logFunction = console.debug;
        emoji = '🔍';
        break;
    }

    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    const errorStr = error ? ` | Error: ${error.message}` : '';
    
    logFunction(`${emoji} [${timestamp}] ${levelStr}: ${message}${contextStr}${errorStr}`);
    
    if (error && error.stack && level === LogLevel.ERROR) {
      console.error('Stack trace:', error.stack);
    }
  }

  getLogs(level?: LogLevel, limit = 100): LogEntry[] {
    let filteredLogs = level !== undefined 
      ? this.logs.filter(log => log.level === level)
      : this.logs;
    
    return filteredLogs.slice(-limit);
  }

  clearLogs(): void {
    this.logs = [];
  }

  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {
        error: 0,
        warn: 0,
        info: 0,
        debug: 0
      }
    };

    this.logs.forEach(log => {
      switch (log.level) {
        case LogLevel.ERROR:
          stats.byLevel.error++;
          break;
        case LogLevel.WARN:
          stats.byLevel.warn++;
          break;
        case LogLevel.INFO:
          stats.byLevel.info++;
          break;
        case LogLevel.DEBUG:
          stats.byLevel.debug++;
          break;
      }
    });

    return stats;
  }
}

// Global logger instance
export const logger = Logger.getInstance();
