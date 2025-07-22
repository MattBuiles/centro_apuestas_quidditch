import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/Logger';

// Rate limiter configurations for different endpoint types
export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    keyGenerator: options.keyGenerator || ((req: Request) => req.ip || 'unknown'),
    
    // Enhanced logging when limit is reached
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit reached', {
        ip: req.ip,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        limit: options.max,
        windowMs: options.windowMs
      });
      
      res.status(429).json({
        success: false,
        error: options.message || 'Too many requests from this IP, please try again later.',
        timestamp: new Date().toISOString(),
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    },
    
    // Skip internal health checks
    skip: (req: Request) => {
      return req.url === '/health' || req.url.startsWith('/health/');
    }
  });
};

// General API rate limiter
export const generalRateLimit = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '300000'), // 5 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500'),
  skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true',
  skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED_REQUESTS === 'true'
});

// Strict rate limiter for auth endpoints (login, register, etc.)
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

// More lenient rate limiter for profile endpoints (like /me)
export const profileRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Allow more requests for profile checks
  skipSuccessfulRequests: true,
  message: 'Too many profile requests, please slow down.'
});

// Very lenient rate limiter for token refresh
export const refreshRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many token refresh attempts.'
});

// Lenient rate limiter for real-time endpoints
export const realtimeRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // Allow more requests for real-time features
  skipSuccessfulRequests: true,
  message: 'Too many real-time requests, please slow down.'
});

// Admin endpoints rate limiter
export const adminRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many admin requests, please wait.'
});

// WebSocket connection rate limiter
export const wsConnectionLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 new WebSocket connections per minute per IP
  message: 'Too many WebSocket connection attempts.'
});
