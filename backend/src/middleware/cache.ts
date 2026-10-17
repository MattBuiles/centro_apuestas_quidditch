import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/Logger';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxSize = 1000;

  set(key: string, data: any, ttlMs = 30000): void {
    // Clean old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.cleanExpired();
      if (this.cache.size >= this.maxSize) {
        // Remove oldest entries
        const oldestKeys = Array.from(this.cache.keys()).slice(0, Math.floor(this.maxSize * 0.2));
        oldestKeys.forEach(k => this.cache.delete(k));
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

const cache = new SimpleCache();

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  keyGenerator?: (req: AuthenticatedRequest) => string;
  skipCache?: (req: AuthenticatedRequest) => boolean;
}

export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 30000, // 30 seconds default
    keyGenerator = (req: AuthenticatedRequest) => `${req.method}:${req.originalUrl}:${req.user?.id || 'anonymous'}`,
    skipCache = () => false
  } = options;

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Skip cache for non-GET requests or if skipCache condition is met
    if (req.method !== 'GET' || skipCache(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      logger.debug('Cache hit', { key: cacheKey, url: req.originalUrl });
      return res.json(cachedData);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, ttl);
        logger.debug('Cache set', { key: cacheKey, url: req.originalUrl, ttl });
      }
      return originalJson(data);
    };

    next();
  };
};

// Specific cache middleware for profile data
export const profileCache = cacheMiddleware({
  ttl: 60000, // 1 minute cache for profile data
  keyGenerator: (req: AuthenticatedRequest) => `profile:${req.user?.id}`,
  skipCache: (req: AuthenticatedRequest) => !req.user?.id
});

// Clear cache for specific user when their data changes
export const clearUserCache = (userId: string) => {
  cache.delete(`profile:${userId}`);
};

// Get cache statistics
export const getCacheStats = () => cache.getStats();
