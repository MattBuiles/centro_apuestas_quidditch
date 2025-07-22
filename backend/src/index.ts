import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { getCacheStats } from './middleware/cache';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { ProcessErrorHandler } from './middleware/processErrorHandler';
import { 
  generalRateLimit, 
  authRateLimit, 
  realtimeRateLimit, 
  adminRateLimit 
} from './middleware/rateLimiter';
import { Database } from './database/Database';
import { WebSocketService } from './services/WebSocketService';
import { MatchSimulationService } from './services/MatchSimulationService';
import { HealthService } from './services/HealthService';
import { logger, LogLevel } from './utils/Logger';
import { CircuitBreaker } from './utils/CircuitBreaker';
import { systemMonitor } from './utils/SystemMonitor';

// Routes
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import teamsRoutes from './routes/teams';
import matchesRoutes from './routes/matches';
import seasonsRoutes from './routes/seasons';
import betsRoutes from './routes/bets';
import predictionsRoutes from './routes/predictions';
import adminRoutes from './routes/admin';
import virtualTimeRoutes from './routes/virtual-time';
import leagueTimeRoutes from './routes/league-time';
import transactionsRoutes from './routes/transactions';

// Load environment variables from backend directory
const backendDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(backendDir, '.env') });

// Setup process error handlers
ProcessErrorHandler.setup();

// Configure logger
if (process.env.NODE_ENV === 'development') {
  logger.setLevel(LogLevel.DEBUG);
} else {
  logger.setLevel(LogLevel.INFO);
}

// Debug: Check if JWT_SECRET is loaded
logger.info('Backend starting', {
  jwtSecretLoaded: !!process.env.JWT_SECRET,
  backendDir,
  nodeEnv: process.env.NODE_ENV
});

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for WebSocket
const server = createServer(app);

// Circuit breaker for critical operations
const criticalOpsBreaker = new CircuitBreaker({
  failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || '5'),
  timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '30000'),
  monitorTimeout: parseInt(process.env.CIRCUIT_BREAKER_MONITOR_TIMEOUT || '60000')
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "ws://localhost:*", "wss://localhost:*"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(compression());

// Enhanced Morgan logging with custom format
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info('HTTP Request', { message: message.trim() });
    }
  }
}));

app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      logger.warn('Invalid JSON in request body', { 
        url: req.url, 
        method: req.method,
        contentType: req.headers['content-type']
      });
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ extended: true }));

// Apply rate limiting
app.use(generalRateLimit);

// Health check endpoints (before rate limiting for monitoring)
const healthService = HealthService.getInstance();

app.get('/health', async (req, res) => {
  try {
    const result = await healthService.performHealthCheck();
    const statusCode = result.status === 'healthy' ? 200 : 
                      result.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('Health check endpoint error', error instanceof Error ? error : new Error(String(error)));
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

app.get('/health/logs', (req, res) => {
  try {
    const level = req.query.level as string;
    const limit = parseInt(req.query.limit as string) || 100;
    
    const logs = level ? 
      logger.getLogs(LogLevel[level as keyof typeof LogLevel], limit) : 
      logger.getLogs(undefined, limit);
    
    const stats = logger.getStats();
    
    res.json({
      logs,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health logs endpoint error', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

app.get('/health/circuit-breaker', (req, res) => {
  res.json({
    circuitBreaker: criticalOpsBreaker.getStats(),
    timestamp: new Date().toISOString()
  });
});

app.get('/health/cache', (req, res) => {
  res.json({
    cache: getCacheStats(),
    timestamp: new Date().toISOString()
  });
});

// API Routes with specific rate limiting
app.use('/api/auth', authRoutes); // Auth routes now have their own specific rate limiting
app.use('/api/users', usersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/matches', realtimeRateLimit, matchesRoutes);
app.use('/api/seasons', seasonsRoutes);
app.use('/api/bets', betsRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/admin', adminRateLimit, adminRoutes);
app.use('/api/virtual-time', realtimeRateLimit, virtualTimeRoutes);
app.use('/api/league-time', realtimeRateLimit, leagueTimeRoutes);
app.use('/api/transactions', transactionsRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    logger.info('🚀 Starting Quidditch Betting API...');
    
    // Initialize database with circuit breaker
    logger.info('📦 Initializing database...');
    await criticalOpsBreaker.execute(async () => {
      await Database.initialize();
    });
    logger.info('✅ Database initialized successfully');
    
    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`🌐 HTTP Server running on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV,
        healthCheck: `http://localhost:${PORT}/health`
      });
    });

    // Initialize WebSocket server with error handling
    const wsPort = parseInt(process.env.WS_PORT || '3002');
    const wss = new WebSocketServer({ 
      port: wsPort,
      perMessageDeflate: false,
      maxPayload: 1024 * 1024 // 1MB limit
    });
    
    const wsService = new WebSocketService(wss);
    
    // Initialize match simulation service and connect with WebSocket
    const matchSimulationService = new MatchSimulationService();
    matchSimulationService.setWebSocketService(wsService);
    
    logger.info(`🔌 WebSocket server running on port ${wsPort}`, { wsPort });

    // Start system monitoring
    systemMonitor.start(60000); // Monitor every minute
    logger.info('🔍 System monitoring started');

    // Server event handlers
    server.on('error', (error: Error) => {
      logger.error('HTTP Server error', error);
    });

    wss.on('error', (error: Error) => {
      logger.error('WebSocket Server error', error);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      // Stop monitoring
      systemMonitor.stop();
      
      // Stop accepting new connections
      server.close(() => {
        logger.info('✅ HTTP server closed');
      });
      
      // Close WebSocket server
      wss.close(() => {
        logger.info('✅ WebSocket server closed');
      });
      
      // Close database connection
      try {
        await Database.close();
        logger.info('✅ Database connection closed');
      } catch (error) {
        logger.error('Error closing database', error instanceof Error ? error : new Error(String(error)));
      }
      
      // Exit process
      setTimeout(() => {
        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      }, 2000);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    logger.error('❌ Failed to start server', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  logger.error('❌ Unhandled error during server startup', error instanceof Error ? error : new Error(String(error)));
  process.exit(1);
});
