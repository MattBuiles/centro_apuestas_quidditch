import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Database } from './database/Database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server
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
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

// Basic API routes
app.get('/api/teams', async (req, res) => {
  try {
    const db = Database.getInstance();
    const teams = await db.all('SELECT * FROM teams ORDER BY name');
    
    res.json({
      success: true,
      data: teams,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teams',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/matches - Obtener todos los partidos
app.get('/api/matches', async (req, res) => {
  try {
    const db = Database.getInstance();
    const matches = await db.getAllMatches();
    
    res.json({
      success: true,
      data: matches,
      message: 'Matches retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve matches',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/matches/:id - Obtener un partido específico
app.get('/api/matches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = Database.getInstance();
    const match = await db.getMatchById(id);

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found',
        message: `Match with ID ${id} does not exist`,
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      data: match,
      message: 'Match retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve match',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/matches/status/live - Obtener partidos en vivo
app.get('/api/matches/status/live', async (req, res) => {
  try {
    const db = Database.getInstance();
    const liveMatches = await db.getMatchesByStatus('live');
    
    res.json({
      success: true,
      data: liveMatches,
      message: 'Live matches retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching live matches:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve live matches',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/matches/status/upcoming - Obtener próximos partidos
app.get('/api/matches/status/upcoming', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const db = Database.getInstance();
    const upcomingMatches = await db.getUpcomingMatches(parseInt(limit as string));
    
    res.json({
      success: true,
      data: upcomingMatches,
      message: 'Upcoming matches retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve upcoming matches',
      timestamp: new Date().toISOString()
    });
  }
});

// Seasons API endpoints
// GET /api/seasons - Obtener todas las temporadas
app.get('/api/seasons', async (req, res) => {
  try {
    const db = Database.getInstance();
    const seasons = await db.getAllSeasons();

    res.json({
      success: true,
      data: seasons,
      count: seasons.length,
      message: 'Seasons retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching seasons:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve seasons',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/seasons/:id - Obtener una temporada específica
app.get('/api/seasons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = Database.getInstance();
    const season = await db.getSeasonById(id);
    
    if (!season) {
      return res.status(404).json({
        success: false,
        error: 'Season not found',
        message: `Season with ID ${id} does not exist`,
        timestamp: new Date().toISOString()
      });
    }

    // Get matches for this season
    const matches = await db.getSeasonMatches(id);
    
    const seasonData = {
      ...season,
      matches: matches
    };

    return res.json({
      success: true,
      data: seasonData,
      message: 'Season retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching season:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve season',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/seasons/current - Obtener la temporada actual
app.get('/api/seasons/current', async (req, res) => {
  try {
    const db = Database.getInstance();
    const currentSeason = await db.getCurrentSeason();
    
    if (!currentSeason) {
      return res.status(404).json({
        success: false,
        error: 'No active season found',
        message: 'There is no currently active season',
        timestamp: new Date().toISOString()
      });
    }

    // Get matches for current season
    const matches = await db.getSeasonMatches((currentSeason as any).id);
    
    const seasonData = {
      ...currentSeason,
      matches: matches
    };

    return res.json({
      success: true,
      data: seasonData,
      message: 'Current season retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching current season:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve current season',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/seasons/:id/standings - Obtener clasificación de una temporada
app.get('/api/seasons/:id/standings', async (req, res) => {
  try {
    const { id } = req.params;
    const db = Database.getInstance();
    const standings = await db.getSeasonStandings(id);

    return res.json({
      success: true,
      data: standings,
      count: standings.length,
      message: 'Season standings retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching season standings:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve season standings',
      timestamp: new Date().toISOString()
    });
  }
});

// Auth endpoints básicos para testing
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validación básica
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials',
        message: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }

    const db = Database.getInstance();
    const user = await db.getUserByEmail(email) as any;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
        timestamp: new Date().toISOString()
      });
    }

    // Verificar password con bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
        timestamp: new Date().toISOString()
      });
    }

    // Generar JWT token real
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          balance: user.balance
        },
        tokens: {
          accessToken: accessToken
        }
      },
      message: 'Login successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in login:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process login',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validación básica
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing fields',
        message: 'Username, email and password are required',
        timestamp: new Date().toISOString()
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Weak password',
        message: 'Password must be at least 6 characters long',
        timestamp: new Date().toISOString()
      });
    }

    const db = Database.getInstance();
    
    // Verificar si el usuario ya existe
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'A user with this email already exists',
        timestamp: new Date().toISOString()
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear nuevo usuario
    const userId = uuidv4();
    await db.createUser({
      id: userId,
      username,
      email,
      password: hashedPassword,
      role: 'user',
      balance: 1000
    });

    // Generar JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    const accessToken = jwt.sign(
      { 
        userId: userId, 
        email: email, 
        role: 'user' 
      },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: userId,
          username,
          email,
          role: 'user',
          balance: 1000
        },
        tokens: {
          accessToken: accessToken
        }
      },
      message: 'Registration successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in registration:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process registration',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authorization header is required',
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer "
    
    try {
      // Verificar JWT token real
      const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      const db = Database.getInstance();
      const user = await db.getUserById(decoded.userId) as any;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
          message: 'User associated with token no longer exists',
          timestamp: new Date().toISOString()
        });
      }
      
      return res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          balance: user.balance
        },
        message: 'Profile retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token is invalid or expired',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error getting profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve profile',
      timestamp: new Date().toISOString()
    });
  }
});

// ============== BETS ENDPOINTS ==============

// GET /api/bets - Obtener todas las apuestas (admin) o del usuario actual
app.get('/api/bets', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authorization header is required',
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      const db = Database.getInstance();
      
      let bets;
      if (decoded.role === 'admin') {
        bets = await db.getAllBets();
      } else {
        bets = await db.getBetsByUser(decoded.userId);
      }
      
      return res.json({
        success: true,
        data: bets,
        count: bets.length,
        message: 'Bets retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token is invalid or expired',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error fetching bets:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve bets',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/bets - Crear una nueva apuesta
app.post('/api/bets', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authorization header is required',
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      const { matchId, type, prediction, odds, amount } = req.body;
      
      // Validaciones
      if (!matchId || !type || !prediction || !odds || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'matchId, type, prediction, odds, and amount are required',
          timestamp: new Date().toISOString()
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid amount',
          message: 'Amount must be greater than 0',
          timestamp: new Date().toISOString()
        });
      }

      const db = Database.getInstance();
      
      // Verificar balance del usuario
      const user = await db.getUserById(decoded.userId) as any;
      if (!user || user.balance < amount) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient balance',
          message: 'User does not have enough balance for this bet',
          timestamp: new Date().toISOString()
        });
      }

      // Verificar que el partido existe y no ha terminado
      const match = await db.getMatchById(matchId) as any;
      if (!match) {
        return res.status(404).json({
          success: false,
          error: 'Match not found',
          message: 'The specified match does not exist',
          timestamp: new Date().toISOString()
        });
      }

      if (match.status === 'finished') {
        return res.status(400).json({
          success: false,
          error: 'Match finished',
          message: 'Cannot place bet on a finished match',
          timestamp: new Date().toISOString()
        });
      }

      const betId = uuidv4();
      const potentialWin = amount * odds;

      // Crear la apuesta
      await db.createBet({
        id: betId,
        userId: decoded.userId,
        matchId,
        type,
        prediction,
        odds,
        amount,
        potentialWin
      });

      // Actualizar balance del usuario
      await db.updateUserBalance(decoded.userId, user.balance - amount);

      return res.status(201).json({
        success: true,
        data: {
          id: betId,
          matchId,
          type,
          prediction,
          odds,
          amount,
          potentialWin,
          status: 'pending'
        },
        message: 'Bet placed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token is invalid or expired',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error creating bet:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create bet',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/matches/:id/bets - Obtener apuestas de un partido específico
app.get('/api/matches/:id/bets', async (req, res) => {
  try {
    const { id } = req.params;
    const db = Database.getInstance();
    const bets = await db.getBetsByMatch(id);

    return res.json({
      success: true,
      data: bets,
      count: bets.length,
      message: 'Match bets retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching match bets:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve match bets',
      timestamp: new Date().toISOString()
    });
  }
});

// ============== PREDICTIONS ENDPOINTS ==============

// GET /api/predictions - Obtener todas las predicciones (admin) o del usuario actual
app.get('/api/predictions', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authorization header is required',
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      const db = Database.getInstance();
      
      let predictions;
      if (decoded.role === 'admin') {
        predictions = await db.getAllPredictions();
      } else {
        predictions = await db.getPredictionsByUser(decoded.userId);
      }
      
      return res.json({
        success: true,
        data: predictions,
        count: predictions.length,
        message: 'Predictions retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token is invalid or expired',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve predictions',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/predictions - Crear una nueva predicción
app.post('/api/predictions', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authorization header is required',
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      const { matchId, prediction, confidence = 3 } = req.body;
      
      // Validaciones
      if (!matchId || !prediction) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'matchId and prediction are required',
          timestamp: new Date().toISOString()
        });
      }

      if (!['home', 'away', 'draw'].includes(prediction)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid prediction',
          message: 'Prediction must be "home", "away", or "draw"',
          timestamp: new Date().toISOString()
        });
      }

      if (confidence < 1 || confidence > 5) {
        return res.status(400).json({
          success: false,
          error: 'Invalid confidence',
          message: 'Confidence must be between 1 and 5',
          timestamp: new Date().toISOString()
        });
      }

      const db = Database.getInstance();
      
      // Verificar que el partido existe y no ha terminado
      const match = await db.getMatchById(matchId) as any;
      if (!match) {
        return res.status(404).json({
          success: false,
          error: 'Match not found',
          message: 'The specified match does not exist',
          timestamp: new Date().toISOString()
        });
      }

      if (match.status === 'finished') {
        return res.status(400).json({
          success: false,
          error: 'Match finished',
          message: 'Cannot make prediction on a finished match',
          timestamp: new Date().toISOString()
        });
      }

      // Verificar si ya existe una predicción del usuario para este partido
      const existingPrediction = await db.getUserPredictionForMatch(decoded.userId, matchId);
      if (existingPrediction) {
        return res.status(409).json({
          success: false,
          error: 'Prediction already exists',
          message: 'User already has a prediction for this match',
          timestamp: new Date().toISOString()
        });
      }

      const predictionId = uuidv4();

      // Crear la predicción
      await db.createPrediction({
        id: predictionId,
        userId: decoded.userId,
        matchId,
        prediction,
        confidence
      });

      return res.status(201).json({
        success: true,
        data: {
          id: predictionId,
          matchId,
          prediction,
          confidence,
          status: 'pending'
        },
        message: 'Prediction created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token is invalid or expired',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error creating prediction:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create prediction',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/matches/:id/predictions - Obtener predicciones de un partido específico
app.get('/api/matches/:id/predictions', async (req, res) => {
  try {
    const { id } = req.params;
    const db = Database.getInstance();
    const predictions = await db.getPredictionsByMatch(id);

    return res.json({
      success: true,
      data: predictions,
      count: predictions.length,
      message: 'Match predictions retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching match predictions:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve match predictions',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

app.use((error: Error, req: express.Request, res: express.Response) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting Quidditch Betting API...');
    
    // Initialize database
    console.log('📦 Initializing database...');
    await Database.initialize();
    console.log('✅ Database initialized successfully');
    
    server.listen(PORT, () => {
      console.log(`🌐 HTTP Server running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`🎯 Teams API: http://localhost:${PORT}/api/teams`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      server.close(() => {
        console.log('✅ HTTP server closed');
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
