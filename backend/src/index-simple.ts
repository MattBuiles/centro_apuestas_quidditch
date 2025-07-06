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

// Mock data para teams
const generateMockTeams = () => {
  return [
    {
      id: 'gryffindor',
      name: 'Gryffindor',
      house: 'Gryffindor',
      fuerzaAtaque: 85,
      fuerzaDefensa: 80,
      attackStrength: 85,
      defenseStrength: 80,
      seekerSkill: 90,
      chaserSkill: 85,
      keeperSkill: 80,
      beaterSkill: 75,
      logo: '/images/gryffindor-logo.png',
      colors: {
        primary: '#740001',
        secondary: '#D3A625'
      },
      venue: 'Campo de Quidditch de Hogwarts',
      founded: 990,
      slogan: 'Coraje, valentía y determinación'
    },
    {
      id: 'slytherin',
      name: 'Slytherin',
      house: 'Slytherin',
      fuerzaAtaque: 90,
      fuerzaDefensa: 85,
      attackStrength: 90,
      defenseStrength: 85,
      seekerSkill: 85,
      chaserSkill: 90,
      keeperSkill: 85,
      beaterSkill: 80,
      logo: '/images/slytherin-logo.png',
      colors: {
        primary: '#1A472A',
        secondary: '#AAAAAA'
      },
      venue: 'Campo de Quidditch de Hogwarts',
      founded: 990,
      slogan: 'Astucia, ambición y liderazgo'
    },
    {
      id: 'ravenclaw',
      name: 'Ravenclaw',
      house: 'Ravenclaw',
      fuerzaAtaque: 80,
      fuerzaDefensa: 90,
      attackStrength: 80,
      defenseStrength: 90,
      seekerSkill: 95,
      chaserSkill: 80,
      keeperSkill: 85,
      beaterSkill: 70,
      logo: '/images/ravenclaw-logo.png',
      colors: {
        primary: '#0E1A40',
        secondary: '#946B2D'
      },
      venue: 'Campo de Quidditch de Hogwarts',
      founded: 990,
      slogan: 'Sabiduría, ingenio e inteligencia'
    },
    {
      id: 'hufflepuff',
      name: 'Hufflepuff',
      house: 'Hufflepuff',
      fuerzaAtaque: 75,
      fuerzaDefensa: 95,
      attackStrength: 75,
      defenseStrength: 95,
      seekerSkill: 80,
      chaserSkill: 75,
      keeperSkill: 95,
      beaterSkill: 85,
      logo: '/images/hufflepuff-logo.png',
      colors: {
        primary: '#ECB939',
        secondary: '#372E29'
      },
      venue: 'Campo de Quidditch de Hogwarts',
      founded: 990,
      slogan: 'Lealtad, trabajo duro y paciencia'
    },
    {
      id: 'chudley-cannons',
      name: 'Chudley Cannons',
      house: null,
      fuerzaAtaque: 70,
      fuerzaDefensa: 65,
      attackStrength: 70,
      defenseStrength: 65,
      seekerSkill: 75,
      chaserSkill: 70,
      keeperSkill: 65,
      beaterSkill: 70,
      logo: '/images/chudley-cannons-logo.png',
      colors: {
        primary: '#FFA500',
        secondary: '#000000'
      },
      venue: 'Cannon Stadium',
      founded: 1892,
      slogan: 'Let\'s all just keep our fingers crossed and hope for the best'
    },
    {
      id: 'holyhead-harpies',
      name: 'Holyhead Harpies',
      house: null,
      fuerzaAtaque: 88,
      fuerzaDefensa: 78,
      attackStrength: 88,
      defenseStrength: 78,
      seekerSkill: 85,
      chaserSkill: 90,
      keeperSkill: 75,
      beaterSkill: 80,
      logo: '/images/holyhead-harpies-logo.png',
      colors: {
        primary: '#008000',
        secondary: '#FFFFFF'
      },
      venue: 'Harpies Ground',
      founded: 1203,
      slogan: 'Soar to Victory'
    }
  ];
};

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
