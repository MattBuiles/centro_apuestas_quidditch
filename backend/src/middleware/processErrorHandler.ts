import { logger } from '../utils/Logger';

export class ProcessErrorHandler {
  static setup(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception detected', error, {
        type: 'uncaughtException',
        stack: error.stack
      });
      
      console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
      console.error('Error:', error);
      
      // Give the logger time to write
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      
      logger.error('Unhandled Promise Rejection detected', error, {
        type: 'unhandledRejection',
        reason: String(reason),
        promise: promise.toString()
      });
      
      console.error('💥 UNHANDLED PROMISE REJECTION! Shutting down...');
      console.error('Reason:', reason);
      
      // Give the logger time to write
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // Handle SIGTERM for graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Starting graceful shutdown...');
      console.log('👋 SIGTERM received. Starting graceful shutdown...');
      ProcessErrorHandler.gracefulShutdown();
    });

    // Handle SIGINT (Ctrl+C) for graceful shutdown
    process.on('SIGINT', () => {
      logger.info('SIGINT received. Starting graceful shutdown...');
      console.log('👋 SIGINT received. Starting graceful shutdown...');
      ProcessErrorHandler.gracefulShutdown();
    });

    // Handle warning events
    process.on('warning', (warning) => {
      logger.warn('Process warning', {
        name: warning.name,
        message: warning.message,
        stack: warning.stack
      });
    });

    logger.info('Process error handlers initialized');
  }

  private static gracefulShutdown(): void {
    // Allow ongoing requests to complete
    setTimeout(() => {
      logger.info('Graceful shutdown completed');
      process.exit(0);
    }, 5000);
  }

  static createAsyncErrorWrapper<T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        logger.error('Async function error', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    };
  }
}
