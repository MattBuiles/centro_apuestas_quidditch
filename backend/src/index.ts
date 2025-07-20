import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { Database } from './database/Database';
import { WebSocketService } from './services/WebSocketService';
import { MatchSimulationService } from './services/MatchSimulationService';

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

// Debug: Check if JWT_SECRET is loaded
console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES' : 'NO');
console.log('Backend directory:', backendDir);

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for WebSocket
const server = createServer(app);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
  ],
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Quidditch Betting API',
    version: '1.0.0'
  });
});

// Extended health check with league time information
app.get('/health/extended', async (req, res) => {
  try {
    const { LeagueTimeService } = await import('./services/LeagueTimeService');
    const leagueTimeService = new LeagueTimeService();
    await leagueTimeService.initialize();
    const leagueTimeInfo = await leagueTimeService.getLeagueTimeInfo();
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Quidditch Betting API',
      version: '1.0.0',
      leagueTime: {
        currentDate: leagueTimeInfo.currentDate,
        activeSeason: leagueTimeInfo.activeSeason?.name || 'No active season',
        timeSpeed: leagueTimeInfo.timeSpeed,
        autoMode: leagueTimeInfo.autoMode
      }
    });
  } catch {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Quidditch Betting API',
      version: '1.0.0',
      leagueTime: 'Error loading league time information'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/seasons', seasonsRoutes);
app.use('/api/bets', betsRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/virtual-time', virtualTimeRoutes);
app.use('/api/league-time', leagueTimeRoutes);
app.use('/api/transactions', transactionsRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting Quidditch Betting API...');
    
    // Initialize database
    console.log('📦 Initializing database...');
    await Database.initialize();
    console.log('✅ Database initialized successfully');
    
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`🌐 HTTP Server running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
    });

    // Initialize WebSocket server
    const wsPort = parseInt(process.env.WS_PORT || '3002');
    const wss = new WebSocketServer({ port: wsPort });
    const wsService = new WebSocketService(wss);
    
    // Initialize match simulation service and connect with WebSocket
    const matchSimulationService = new MatchSimulationService();
    matchSimulationService.setWebSocketService(wsService);
    
    console.log(`🔌 WebSocket server running on port ${wsPort}`);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      server.close(() => {
        console.log('✅ HTTP server closed');
      });
      wss.close(() => {
        console.log('✅ WebSocket server closed');
      });
      await Database.close();
      console.log('✅ Database connection closed');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
