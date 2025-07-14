import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { DatabaseConfig } from '../types';

interface TeamRow {
  id: string;
  [key: string]: unknown;
}

interface TeamStats {
  id: string;
  matches_played: number;
  wins: number;
  losses: number;
  draws: number;
  points_for: number;
  points_against: number;
  snitch_catches: number;
  [key: string]: unknown;
}

interface FinishedMatch {
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  snitch_caught_by: string | null;
  [key: string]: unknown;
}

interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  [key: string]: unknown;
}

export class Database {
  private static instance: Database;
  private db: sqlite3.Database | null = null;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public static async initialize(config?: DatabaseConfig): Promise<void> {
    const instance = Database.getInstance();
    await instance.connect(config);
    await instance.createTables();
    await instance.seedInitialData();
  }

  public static async close(): Promise<void> {
    const instance = Database.getInstance();
    if (instance.db) {
      const close = promisify(instance.db.close.bind(instance.db));
      await close();
      instance.db = null;
    }
  }

  private async connect(config?: DatabaseConfig): Promise<void> {
    // Always use backend directory database
    const backendDir = path.resolve(__dirname, '..');
    const defaultDbPath = path.join(backendDir, 'database', 'quidditch.db');
    const dbPath = config?.path || process.env.DATABASE_URL || defaultDbPath;
    
    // Ensure database directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database:', dbPath);
          
          if (config?.enableWAL) {
            this.db!.exec('PRAGMA journal_mode = WAL;');
          }
          
          if (config?.enableForeignKeys !== false) {
            this.db!.exec('PRAGMA foreign_keys = ON;');
          }
          
          resolve();
        }
      });
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    const createTablesSQL = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('user', 'admin')) DEFAULT 'user',
        balance REAL DEFAULT 1000.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Teams table
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        logo TEXT,
        founded INTEGER,
        description TEXT,
        stadium TEXT,
        colors TEXT, -- JSON array
        matches_played INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        draws INTEGER DEFAULT 0,
        points_for INTEGER DEFAULT 0,
        points_against INTEGER DEFAULT 0,
        snitch_catches INTEGER DEFAULT 0,
        -- Team Statistics for simulation and display
        attack_strength INTEGER DEFAULT 75,
        defense_strength INTEGER DEFAULT 75,
        seeker_skill INTEGER DEFAULT 75,
        keeper_skill INTEGER DEFAULT 75,
        chaser_skill INTEGER DEFAULT 75,
        beater_skill INTEGER DEFAULT 75,
        -- Additional team info for frontend
        slogan TEXT,
        history TEXT,
        titles INTEGER DEFAULT 0,
        achievements TEXT, -- JSON array
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Players table
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        team_id TEXT NOT NULL,
        position TEXT CHECK(position IN ('keeper', 'seeker', 'beater', 'chaser')) NOT NULL,
        skill_level INTEGER DEFAULT 75 CHECK(skill_level >= 1 AND skill_level <= 100),
        is_starting BOOLEAN DEFAULT FALSE,
        years_active INTEGER DEFAULT 1,
        number INTEGER,
        achievements TEXT, -- JSON array
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      );

      -- Seasons table
      CREATE TABLE IF NOT EXISTS seasons (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        status TEXT CHECK(status IN ('upcoming', 'active', 'finished')) DEFAULT 'upcoming',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Season teams (many-to-many)
      CREATE TABLE IF NOT EXISTS season_teams (
        season_id TEXT,
        team_id TEXT,
        PRIMARY KEY (season_id, team_id),
        FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      );

      -- Matches table
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        season_id TEXT NOT NULL,
        home_team_id TEXT NOT NULL,
        away_team_id TEXT NOT NULL,
        date DATETIME NOT NULL,
        status TEXT CHECK(status IN ('scheduled', 'live', 'finished', 'postponed')) DEFAULT 'scheduled',
        home_score INTEGER DEFAULT 0,
        away_score INTEGER DEFAULT 0,
        snitch_caught BOOLEAN DEFAULT FALSE,
        snitch_caught_by TEXT,
        duration INTEGER, -- in minutes
        odds_home_win REAL,
        odds_away_win REAL,
        odds_draw REAL,
        odds_total_over REAL,
        odds_total_under REAL,
        odds_snitch_home REAL,
        odds_snitch_away REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
        FOREIGN KEY (home_team_id) REFERENCES teams(id),
        FOREIGN KEY (away_team_id) REFERENCES teams(id)
      );

      -- Match events table
      CREATE TABLE IF NOT EXISTS match_events (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        minute INTEGER NOT NULL,
        type TEXT NOT NULL,
        team TEXT NOT NULL,
        player TEXT,
        description TEXT NOT NULL,
        points INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
      );

      -- Bets table
      CREATE TABLE IF NOT EXISTS bets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        match_id TEXT NOT NULL,
        type TEXT NOT NULL,
        prediction TEXT NOT NULL,
        odds REAL NOT NULL,
        amount REAL NOT NULL,
        potential_win REAL NOT NULL,
        status TEXT CHECK(status IN ('pending', 'won', 'lost', 'cancelled')) DEFAULT 'pending',
        placed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
      );

      -- Predictions table
      CREATE TABLE IF NOT EXISTS predictions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        match_id TEXT NOT NULL,
        prediction TEXT CHECK(prediction IN ('home', 'away', 'draw')) NOT NULL,
        confidence INTEGER CHECK(confidence >= 1 AND confidence <= 5) DEFAULT 3,
        points INTEGER DEFAULT 0,
        status TEXT CHECK(status IN ('pending', 'correct', 'incorrect')) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
        UNIQUE(user_id, match_id)
      );

      -- Historical seasons table (for keeping complete history across multiple seasons)
      CREATE TABLE IF NOT EXISTS historical_seasons (
        id TEXT PRIMARY KEY,
        original_season_id TEXT NOT NULL,
        name TEXT NOT NULL,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        status TEXT DEFAULT 'completed',
        archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_teams INTEGER DEFAULT 0,
        total_matches INTEGER DEFAULT 0,
        total_bets INTEGER DEFAULT 0,
        total_predictions INTEGER DEFAULT 0,
        total_revenue REAL DEFAULT 0,
        champion_team_id TEXT,
        champion_team_name TEXT,
        FOREIGN KEY (champion_team_id) REFERENCES teams(id)
      );

      -- Historical team statistics (aggregated across all seasons)
      CREATE TABLE IF NOT EXISTS historical_team_stats (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        team_name TEXT NOT NULL,
        total_seasons INTEGER DEFAULT 0,
        total_matches INTEGER DEFAULT 0,
        total_wins INTEGER DEFAULT 0,
        total_losses INTEGER DEFAULT 0,
        total_draws INTEGER DEFAULT 0,
        total_points_for INTEGER DEFAULT 0,
        total_points_against INTEGER DEFAULT 0,
        total_snitch_catches INTEGER DEFAULT 0,
        championships_won INTEGER DEFAULT 0,
        best_season_position INTEGER,
        worst_season_position INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id)
      );

      -- Historical user statistics (aggregated across all activity)
      CREATE TABLE IF NOT EXISTS historical_user_stats (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        total_bets INTEGER DEFAULT 0,
        total_amount_bet REAL DEFAULT 0,
        total_winnings REAL DEFAULT 0,
        total_losses REAL DEFAULT 0,
        best_winning_streak INTEGER DEFAULT 0,
        current_winning_streak INTEGER DEFAULT 0,
        favorite_team_id TEXT,
        favorite_bet_type TEXT,
        most_successful_bet_type TEXT,
        total_predictions INTEGER DEFAULT 0,
        correct_predictions INTEGER DEFAULT 0,
        prediction_accuracy REAL DEFAULT 0,
        account_created DATETIME,
        last_activity DATETIME,
        total_seasons_active INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (favorite_team_id) REFERENCES teams(id)
      );

      -- Expanded bet types for comprehensive betting system
      CREATE TABLE IF NOT EXISTS bet_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL, -- 'winner', 'score', 'special', 'duration', 'player'
        base_odds REAL DEFAULT 2.0,
        risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- User transactions history
      CREATE TABLE IF NOT EXISTS user_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT CHECK(type IN ('deposit', 'withdrawal', 'bet_placed', 'bet_won', 'bet_lost', 'refund', 'bonus')) NOT NULL,
        amount REAL NOT NULL,
        balance_before REAL NOT NULL,
        balance_after REAL NOT NULL,
        description TEXT,
        reference_id TEXT, -- bet_id, match_id, etc.
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Admin activity logs
      CREATE TABLE IF NOT EXISTS admin_logs (
        id TEXT PRIMARY KEY,
        admin_user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT, -- 'user', 'match', 'bet', 'season', 'system'
        target_id TEXT,
        description TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_user_id) REFERENCES users(id)
      );

      -- Standings table
      CREATE TABLE IF NOT EXISTS standings (
        season_id TEXT,
        team_id TEXT,
        position INTEGER,
        points INTEGER DEFAULT 0,
        matches_played INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        draws INTEGER DEFAULT 0,
        points_for INTEGER DEFAULT 0,
        points_against INTEGER DEFAULT 0,
        points_difference INTEGER DEFAULT 0,
        snitch_catches INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (season_id, team_id),
        FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      );

      -- Virtual time state table for centralized time management
      CREATE TABLE IF NOT EXISTS virtual_time_state (
        id TEXT PRIMARY KEY,
        current_date DATETIME NOT NULL,
        active_season_id TEXT,
        time_speed TEXT CHECK(time_speed IN ('slow', 'medium', 'fast')) DEFAULT 'medium',
        auto_mode BOOLEAN DEFAULT FALSE,
        last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (active_season_id) REFERENCES seasons(id)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
      CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
      CREATE INDEX IF NOT EXISTS idx_matches_season ON matches(season_id);
      CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_id);
      CREATE INDEX IF NOT EXISTS idx_bets_match ON bets(match_id);
      CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
      CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
      CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `;

    const exec = promisify(this.db.exec.bind(this.db));
    await exec(createTablesSQL);
    console.log('✅ Database tables created successfully');
  }

  private async seedInitialData(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    // Check if we already have data
    const existingUser = await this.get('SELECT COUNT(*) as count FROM users') as { count: number };
    
    if (existingUser.count > 0) {
      console.log('📦 Database already has data, skipping seed');
      return;
    }

    // Seed teams data (from your existing frontend data)
    const teamsData = [
      {
        id: 'gryffindor',
        name: 'Gryffindor',
        logo: '/images/gryffindor-logo.png',
        founded: 990,
        description: 'Casa conocida por su valentía y determinación',
        stadium: 'Campo de Quidditch de Hogwarts',
        colors: JSON.stringify(['#740001', '#D3A625']),
        slogan: 'Donde habitan los valientes de corazón',
        history: 'Fundado por Godric Gryffindor, conocido por su coraje y caballerosidad. Los Gryffindor son famosos por su valentía, osadía, temple y caballerosidad.',
        titles: 7,
        achievements: JSON.stringify(['Campeón de la Copa de las Casas (7 veces)', 'Récord de la captura más rápida de la Snitch Dorada', 'Mayor número de victorias consecutivas (23 partidos)']),
        attack_strength: 85,
        defense_strength: 82,
        seeker_skill: 90,
        keeper_skill: 88,
        chaser_skill: 85,
        beater_skill: 80
      },
      {
        id: 'slytherin',
        name: 'Slytherin',
        logo: '/images/slytherin-logo.png',
        founded: 990,
        description: 'Casa conocida por su astucia y ambición',
        stadium: 'Campo de Quidditch de Hogwarts',
        colors: JSON.stringify(['#1A472A', '#AAAAAA']),
        slogan: 'Ambición pura y astucia refinada',
        history: 'Fundado por Salazar Slytherin, este equipo es conocido por su estrategia astuta y su determinación feroz en el campo de Quidditch.',
        titles: 6,
        achievements: JSON.stringify(['Campeón de la Copa de las Casas (6 veces)', 'Mejor defensa en la historia de Hogwarts', 'Record de victorias consecutivas en casa']),
        attack_strength: 88,
        defense_strength: 92,
        seeker_skill: 85,
        keeper_skill: 93,
        chaser_skill: 87,
        beater_skill: 90
      },
      {
        id: 'ravenclaw',
        name: 'Ravenclaw',
        logo: '/images/ravenclaw-logo.png',
        founded: 990,
        description: 'Casa conocida por su sabiduría e ingenio',
        stadium: 'Campo de Quidditch de Hogwarts',
        colors: JSON.stringify(['#0E1A40', '#946B2D']),
        slogan: 'Sabiduría más allá de la medida es el mayor tesoro del hombre',
        history: 'Fundado por Rowena Ravenclaw, este equipo combina inteligencia estratégica con habilidades técnicas excepcionales en el aire.',
        titles: 4,
        achievements: JSON.stringify(['Campeón de la Copa de las Casas (4 veces)', 'Mejor promedio académico del equipo', 'Innovadores en tácticas de vuelo']),
        attack_strength: 80,
        defense_strength: 85,
        seeker_skill: 92,
        keeper_skill: 85,
        chaser_skill: 90,
        beater_skill: 75
      },
      {
        id: 'hufflepuff',
        name: 'Hufflepuff',
        logo: '/images/hufflepuff-logo.png',
        founded: 990,
        description: 'Casa conocida por su lealtad y trabajo duro',
        stadium: 'Campo de Quidditch de Hogwarts',
        colors: JSON.stringify(['#ECB939', '#372E29']),
        slogan: 'Estos pacientes, leales y justos nunca temen al trabajo pesado',
        history: 'Fundado por Helga Hufflepuff, este equipo demuestra que la dedicación y el trabajo en equipo pueden superar cualquier obstáculo.',
        titles: 2,
        achievements: JSON.stringify(['Campeón de la Copa de las Casas (2 veces)', 'Mejor espíritu deportivo', 'Record de fair play']),
        attack_strength: 75,
        defense_strength: 88,
        seeker_skill: 78,
        keeper_skill: 90,
        chaser_skill: 82,
        beater_skill: 85
      },
      {
        id: 'chudley-cannons',
        name: 'Chudley Cannons',
        logo: '/images/chudley-cannons-logo.png',
        founded: 1892,
        description: 'Equipo profesional inglés con sede en Chudley',
        stadium: 'Estadio Chudley',
        colors: JSON.stringify(['#FFA500', '#000000']),
        slogan: 'Cañones que nunca se rinden',
        history: 'Un equipo profesional con una historia turbulenta pero con fans leales. Conocidos por su estilo de juego impredecible y su pasión.',
        titles: 1,
        achievements: JSON.stringify(['Liga Profesional de Quidditch (1 vez)', 'Mejor remontada de la historia', 'Fanáticos más leales']),
        attack_strength: 70,
        defense_strength: 65,
        seeker_skill: 75,
        keeper_skill: 70,
        chaser_skill: 72,
        beater_skill: 78
      },
      {
        id: 'holyhead-harpies',
        name: 'Holyhead Harpies',
        logo: '/images/holyhead-harpies-logo.png',
        founded: 1203,
        description: 'Equipo profesional femenino de Gales',
        stadium: 'Estadio Holyhead',
        colors: JSON.stringify(['#006400', '#FFFFFF']),
        slogan: 'Arpías veloces como el viento',
        history: 'El equipo totalmente femenino más exitoso en la historia del Quidditch profesional. Conocidas por su velocidad y técnica excepcional.',
        titles: 5,
        achievements: JSON.stringify(['Liga Profesional de Quidditch (5 veces)', 'Primer equipo totalmente femenino campeón', 'Record de velocidad en vuelo']),
        attack_strength: 92,
        defense_strength: 78,
        seeker_skill: 95,
        keeper_skill: 80,
        chaser_skill: 95,
        beater_skill: 73
      }
    ];

    // Insert teams
    for (const team of teamsData) {
      await this.run(`
        INSERT INTO teams (id, name, logo, founded, description, stadium, colors, slogan, history, titles, achievements, 
                          attack_strength, defense_strength, seeker_skill, keeper_skill, chaser_skill, beater_skill)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [team.id, team.name, team.logo, team.founded, team.description, team.stadium, team.colors,
          team.slogan, team.history, team.titles, team.achievements,
          team.attack_strength, team.defense_strength, team.seeker_skill, team.keeper_skill, team.chaser_skill, team.beater_skill]);
    }

    // Seed players for each team
    await this.seedPlayers();

    // Create default admin user
    const bcrypt = await import('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await this.run(`
      INSERT INTO users (id, username, email, password, role, balance)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['admin-user', 'admin', 'admin@quidditch.com', adminPassword, 'admin', 10000]);

    console.log('🌱 Initial data seeded successfully');
    console.log('👤 Default admin user created: admin@quidditch.com / admin123');

    // Seed bet types
    await this.seedBetTypes();

    // Create a sample season
    await this.createSampleSeason();
  }

  private async seedBetTypes(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    console.log('🎲 Seeding bet types...');

    const betTypes = [
      // Winner bets
      { id: 'winner-home', name: 'Ganador Local', description: 'El equipo local gana el partido', category: 'winner', base_odds: 2.15, risk_level: 'low' },
      { id: 'winner-away', name: 'Ganador Visitante', description: 'El equipo visitante gana el partido', category: 'winner', base_odds: 1.90, risk_level: 'low' },
      { id: 'winner-draw', name: 'Empate', description: 'El partido termina en empate', category: 'winner', base_odds: 8.50, risk_level: 'high' },
      
      // Score bets
      { id: 'total-over-300', name: 'Más de 300 puntos', description: 'Puntuación total mayor a 300', category: 'score', base_odds: 1.75, risk_level: 'medium' },
      { id: 'total-under-200', name: 'Menos de 200 puntos', description: 'Puntuación total menor a 200', category: 'score', base_odds: 2.50, risk_level: 'medium' },
      { id: 'exact-score', name: 'Puntuación Exacta', description: 'Predicción exacta del marcador final', category: 'score', base_odds: 12.50, risk_level: 'high' },
      
      // Snitch bets
      { id: 'snitch-home', name: 'Snitch por Local', description: 'El equipo local captura la Snitch Dorada', category: 'special', base_odds: 1.85, risk_level: 'medium' },
      { id: 'snitch-away', name: 'Snitch por Visitante', description: 'El equipo visitante captura la Snitch Dorada', category: 'special', base_odds: 2.10, risk_level: 'medium' },
      
      // Duration bets
      { id: 'duration-short', name: 'Partido Corto', description: 'Duración menor a 30 minutos', category: 'duration', base_odds: 7.50, risk_level: 'high' },
      { id: 'duration-medium', name: 'Duración Media', description: 'Duración entre 30-60 minutos', category: 'duration', base_odds: 3.25, risk_level: 'medium' },
      { id: 'duration-long', name: 'Partido Largo', description: 'Duración mayor a 60 minutos', category: 'duration', base_odds: 2.10, risk_level: 'medium' },
      
      // Special events
      { id: 'expulsion', name: 'Expulsión', description: 'Un jugador será expulsado durante el partido', category: 'special', base_odds: 5.25, risk_level: 'high' },
      { id: 'broom-break', name: 'Escoba Rota', description: 'Se romperá una escoba durante el partido', category: 'special', base_odds: 4.50, risk_level: 'high' },
      { id: 'seeker-fall', name: 'Caída de Buscador', description: 'Un buscador caerá de su escoba', category: 'special', base_odds: 3.75, risk_level: 'medium' },
      { id: 'bludger-referee', name: 'Bludger al Árbitro', description: 'Una bludger golpeará al árbitro', category: 'special', base_odds: 12.50, risk_level: 'high' },
      { id: 'first-score', name: 'Primer Gol', description: 'Primer equipo en anotar', category: 'special', base_odds: 1.95, risk_level: 'low' }
    ];

    for (const betType of betTypes) {
      await this.run(`
        INSERT OR IGNORE INTO bet_types (id, name, description, category, base_odds, risk_level)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [betType.id, betType.name, betType.description, betType.category, betType.base_odds, betType.risk_level]);
    }

    console.log(`✅ Seeded ${betTypes.length} bet types`);
  }

  private async createSampleSeason(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    console.log('🏆 Creating sample season and matches...');

    // Create current season
    const currentYear = new Date().getFullYear();
    const seasonId = `season-${currentYear}`;
    
    await this.run(`
      INSERT INTO seasons (id, name, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?)
    `, [
      seasonId,
      `Liga Quidditch ${currentYear}`,
      `${currentYear}-01-01T00:00:00Z`,
      `${currentYear}-12-31T23:59:59Z`,
      'active'
    ]);

    // Add all teams to the season
    const teams = await this.all('SELECT id FROM teams') as TeamRow[];
    for (const team of teams) {
      await this.run(`
        INSERT INTO season_teams (season_id, team_id)
        VALUES (?, ?)
      `, [seasonId, team.id]);
    }

    // Generate sample matches (round-robin tournament)
    const teamIds = teams.map(t => t.id);
    const matches = [];
    
    // Create all possible match combinations
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        const homeTeam = teamIds[i];
        const awayTeam = teamIds[j];
        
        // Create match for both home/away combinations
        matches.push({ home: homeTeam, away: awayTeam });
        matches.push({ home: awayTeam, away: homeTeam });
      }
    }

    // Insert matches with realistic dates
    const baseDate = new Date();
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const matchDate = new Date(baseDate);
      matchDate.setDate(baseDate.getDate() + (i * 3)); // 3 days between matches
      
      const matchId = `match-${seasonId}-${i + 1}`;
      const status = i < 5 ? 'finished' : i < 8 ? 'live' : 'scheduled';
      
      // Generate realistic scores for finished matches
      let homeScore = 0;
      let awayScore = 0;
      let snitchCaught = false;
      let snitchCaughtBy = null;
      
      if (status === 'finished') {
        homeScore = Math.floor(Math.random() * 200) + 50;
        awayScore = Math.floor(Math.random() * 200) + 50;
        snitchCaught = true;
        snitchCaughtBy = Math.random() > 0.5 ? match.home : match.away;
        
        // Add snitch catch bonus
        if (snitchCaughtBy === match.home) {
          homeScore += 150;
        } else {
          awayScore += 150;
        }
      } else if (status === 'live') {
        homeScore = Math.floor(Math.random() * 100);
        awayScore = Math.floor(Math.random() * 100);
      }

      await this.run(`
        INSERT INTO matches (
          id, season_id, home_team_id, away_team_id, date, status,
          home_score, away_score, snitch_caught, snitch_caught_by,
          odds_home_win, odds_away_win, odds_draw, odds_total_over, odds_total_under
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        matchId, seasonId, match.home, match.away, matchDate.toISOString(), status,
        homeScore, awayScore, snitchCaught, snitchCaughtBy,
        (Math.random() * 2 + 1).toFixed(2), // Home win odds
        (Math.random() * 2 + 1).toFixed(2), // Away win odds  
        (Math.random() * 5 + 8).toFixed(2), // Draw odds (less likely)
        (Math.random() * 0.5 + 1.5).toFixed(2), // Over odds
        (Math.random() * 0.5 + 1.5).toFixed(2)  // Under odds
      ]);
    }

    // Update team statistics based on finished matches
    await this.updateTeamStatistics(seasonId);

    // Generate standings
    await this.generateStandings(seasonId);

    console.log(`✅ Created ${matches.length} matches for season ${seasonId}`);
  }

  private async updateTeamStatistics(seasonId: string): Promise<void> {
    const finishedMatches = await this.all(`
      SELECT * FROM matches 
      WHERE season_id = ? AND status = 'finished'
    `, [seasonId]) as FinishedMatch[];

    const teamStats: { [key: string]: TeamStats } = {};

    // Initialize team stats
    const teams = await this.all('SELECT id FROM teams') as TeamRow[];
    for (const team of teams) {
      teamStats[team.id] = {
        id: team.id,
        matches_played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        points_for: 0,
        points_against: 0,
        snitch_catches: 0
      };
    }

    // Calculate stats from finished matches
    for (const match of finishedMatches) {
      const homeTeam = match.home_team_id;
      const awayTeam = match.away_team_id;
      
      teamStats[homeTeam].matches_played++;
      teamStats[awayTeam].matches_played++;
      
      teamStats[homeTeam].points_for += match.home_score;
      teamStats[homeTeam].points_against += match.away_score;
      teamStats[awayTeam].points_for += match.away_score;
      teamStats[awayTeam].points_against += match.home_score;

      if (match.snitch_caught_by === homeTeam) {
        teamStats[homeTeam].snitch_catches++;
      } else if (match.snitch_caught_by === awayTeam) {
        teamStats[awayTeam].snitch_catches++;
      }

      // Determine winner
      if (match.home_score > match.away_score) {
        teamStats[homeTeam].wins++;
        teamStats[awayTeam].losses++;
      } else if (match.away_score > match.home_score) {
        teamStats[awayTeam].wins++;
        teamStats[homeTeam].losses++;
      } else {
        teamStats[homeTeam].draws++;
        teamStats[awayTeam].draws++;
      }
    }

    // Update team statistics in database
    for (const [teamId, stats] of Object.entries(teamStats)) {
      await this.run(`
        UPDATE teams SET 
          matches_played = ?, wins = ?, losses = ?, draws = ?,
          points_for = ?, points_against = ?, snitch_catches = ?
        WHERE id = ?
      `, [
        stats.matches_played, stats.wins, stats.losses, stats.draws,
        stats.points_for, stats.points_against, stats.snitch_catches, teamId
      ]);
    }
  }

  private async generateStandings(seasonId: string): Promise<void> {
    const teams = await this.all(`
      SELECT id, wins, losses, draws, points_for, points_against, snitch_catches
      FROM teams
    `) as TeamStats[];

    // Calculate league points (3 for win, 1 for draw)
    const standings = teams.map((team: TeamStats) => ({
      ...team,
      points: (team.wins * 3) + (team.draws * 1),
      points_difference: team.points_for - team.points_against,
      matches_played: team.wins + team.losses + team.draws
    }));

    // Sort by points, then by points difference, then by points for
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.points_difference !== a.points_difference) return b.points_difference - a.points_difference;
      return b.points_for - a.points_for;
    });

    // Insert standings
    for (let i = 0; i < standings.length; i++) {
      const team = standings[i];
      await this.run(`
        INSERT OR REPLACE INTO standings (
          season_id, team_id, position, points, matches_played,
          wins, losses, draws, points_for, points_against, 
          points_difference, snitch_catches
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        seasonId, team.id, i + 1, team.points, team.matches_played,
        team.wins, team.losses, team.draws, team.points_for, 
        team.points_against, team.points_difference, team.snitch_catches
      ]);
    }

    console.log('✅ Generated league standings');
  }

  public getDatabase(): sqlite3.Database {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  // Helper methods for common database operations
  public async get(sql: string, params: unknown[] = []): Promise<unknown> {
    if (!this.db) throw new Error('Database not connected');
    return new Promise((resolve, reject) => {
      this.db!.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  public async all(sql: string, params: unknown[] = []): Promise<unknown[]> {
    if (!this.db) throw new Error('Database not connected');
    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  public async run(sql: string, params: unknown[] = []): Promise<{ lastID?: number; changes?: number }> {
    if (!this.db) throw new Error('Database not connected');
    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  // ============== MATCHES METHODS ==============
  
  public async getAllTeams(): Promise<unknown[]> {
    const sql = `
      SELECT 
        id, name, logo, founded, description, stadium, colors,
        matches_played, wins, losses, draws, points_for, points_against, snitch_catches
      FROM teams
      ORDER BY name ASC
    `;
    return await this.all(sql);
  }

  public async getAllMatches(): Promise<unknown[]> {
    const sql = `
      SELECT 
        m.*,
        ht.name as homeTeamName,
        ht.logo as homeTeamLogo,
        at.name as awayTeamName,
        at.logo as awayTeamLogo,
        s.name as seasonName
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      ORDER BY m.date ASC
    `;
    return await this.all(sql);
  }

  public async getMatchById(id: string): Promise<unknown> {
    const sql = `
      SELECT 
        m.*,
        ht.name as homeTeamName,
        ht.logo as homeTeamLogo,
        at.name as awayTeamName,
        at.logo as awayTeamLogo,
        s.name as seasonName
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      WHERE m.id = ?
    `;
    return await this.get(sql, [id]);
  }

  public async getMatchesByStatus(status: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        m.*,
        ht.name as homeTeamName,
        ht.logo as homeTeamLogo,
        at.name as awayTeamName,
        at.logo as awayTeamLogo,
        s.name as seasonName
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      WHERE m.status = ?
      ORDER BY m.date ASC
    `;
    return await this.all(sql, [status]);
  }

  public async getUpcomingMatches(limit: number = 10): Promise<unknown[]> {
    const sql = `
      SELECT 
        m.*,
        ht.name as homeTeamName,
        ht.logo as homeTeamLogo,
        at.name as awayTeamName,
        at.logo as awayTeamLogo,
        s.name as seasonName
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      WHERE m.status = 'scheduled' AND m.date > datetime('now')
      ORDER BY m.date ASC
      LIMIT ?
    `;
    return await this.all(sql, [limit]);
  }

  public async getNextUnplayedMatch(currentVirtualTime: string): Promise<unknown> {
    const sql = `
      SELECT 
        m.*,
        ht.name as homeTeamName,
        ht.logo as homeTeamLogo,
        at.name as awayTeamName,
        at.logo as awayTeamLogo,
        s.name as seasonName
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      WHERE m.status = 'scheduled' 
        AND m.date >= ?
      ORDER BY m.date ASC
      LIMIT 1
    `;
    return await this.get(sql, [currentVirtualTime]);
  }

  public async getUnplayedMatchesUntil(targetTime: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        m.*,
        ht.name as homeTeamName,
        ht.logo as homeTeamLogo,
        at.name as awayTeamName,
        at.logo as awayTeamLogo,
        s.name as seasonName
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      WHERE m.status = 'scheduled' 
        AND m.date <= ?
      ORDER BY m.date ASC
    `;
    return await this.all(sql, [targetTime]);
  }

  // ============== SEASONS METHODS ==============
  
  public async getAllSeasons(): Promise<unknown[]> {
    const sql = `
      SELECT 
        s.*,
        COUNT(DISTINCT st.team_id) as teamsCount,
        COUNT(DISTINCT m.id) as matchesCount,
        COUNT(CASE WHEN m.status = 'finished' THEN 1 END) as finishedMatches,
        COUNT(CASE WHEN m.status = 'scheduled' THEN 1 END) as scheduledMatches
      FROM seasons s
      LEFT JOIN season_teams st ON s.id = st.season_id
      LEFT JOIN matches m ON s.id = m.season_id
      GROUP BY s.id
      ORDER BY s.start_date DESC
    `;
    return await this.all(sql);
  }

  public async getSeasonById(id: string): Promise<unknown> {
    const sql = `
      SELECT 
        s.*,
        COUNT(DISTINCT st.team_id) as teamsCount,
        COUNT(DISTINCT m.id) as matchesCount,
        COUNT(CASE WHEN m.status = 'finished' THEN 1 END) as finishedMatches,
        COUNT(CASE WHEN m.status = 'scheduled' THEN 1 END) as scheduledMatches
      FROM seasons s
      LEFT JOIN season_teams st ON s.id = st.season_id
      LEFT JOIN matches m ON s.id = m.season_id
      WHERE s.id = ?
      GROUP BY s.id
    `;
    return await this.get(sql, [id]);
  }

  public async getCurrentSeason(): Promise<unknown> {
    const sql = `
      SELECT 
        s.*,
        COUNT(DISTINCT st.team_id) as teamsCount,
        COUNT(DISTINCT m.id) as matchesCount,
        COUNT(CASE WHEN m.status = 'finished' THEN 1 END) as finishedMatches,
        COUNT(CASE WHEN m.status = 'scheduled' THEN 1 END) as scheduledMatches
      FROM seasons s
      LEFT JOIN season_teams st ON s.id = st.season_id
      LEFT JOIN matches m ON s.id = m.season_id
      WHERE s.status = 'active'
      GROUP BY s.id
      ORDER BY s.start_date DESC
      LIMIT 1
    `;
    return await this.get(sql);
  }

  public async getSeasonStandings(seasonId: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        st.*,
        t.name as teamName,
        t.logo as teamLogo,
        t.colors as teamColors
      FROM standings st
      JOIN teams t ON st.team_id = t.id
      WHERE st.season_id = ?
      ORDER BY st.points DESC, st.points_difference DESC, st.points_for DESC
    `;
    return await this.all(sql, [seasonId]);
  }

  public async getSeasonMatches(seasonId: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        m.*,
        ht.name as homeTeamName,
        ht.logo as homeTeamLogo,
        at.name as awayTeamName,
        at.logo as awayTeamLogo
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.season_id = ?
      ORDER BY m.date ASC
    `;
    return await this.all(sql, [seasonId]);
  }

  // ============== USERS/AUTH METHODS ==============
  
  public async getUserByEmail(email: string): Promise<unknown> {
    const sql = `
      SELECT id, username, email, password, role, balance, created_at, updated_at
      FROM users 
      WHERE email = ?
    `;
    return await this.get(sql, [email]);
  }

  public async getUserById(id: string): Promise<unknown> {
    const sql = `
      SELECT id, username, email, role, balance, created_at, updated_at
      FROM users 
      WHERE id = ?
    `;
    return await this.get(sql, [id]);
  }

  public async createUser(userData: {
    id: string;
    username: string;
    email: string;
    password: string;
    role?: string;
    balance?: number;
  }): Promise<{ lastID?: number; changes?: number }> {
    const sql = `
      INSERT INTO users (id, username, email, password, role, balance)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    return await this.run(sql, [
      userData.id,
      userData.username,
      userData.email,
      userData.password,
      userData.role || 'user',
      userData.balance || 1000
    ]);
  }

  public async updateUserBalance(userId: string, newBalance: number): Promise<{ lastID?: number; changes?: number }> {
    const sql = `
      UPDATE users 
      SET balance = ?, updated_at = datetime('now')
      WHERE id = ?
    `;
    return await this.run(sql, [newBalance, userId]);
  }

  // ============== BETS METHODS ==============
  
  public async createBet(betData: {
    id: string;
    userId: string;
    matchId: string;
    type: string;
    prediction: string;
    odds: number;
    amount: number;
    potentialWin: number;
  }): Promise<{ lastID?: number; changes?: number }> {
    // Get current virtual time
    let virtualTime: string;
    try {
      const { VirtualTimeService } = await import('../services/VirtualTimeService');
      const virtualTimeService = VirtualTimeService.getInstance();
      await virtualTimeService.initialize();
      const currentState = await virtualTimeService.getCurrentState();
      virtualTime = currentState.currentDate.toISOString();
    } catch (error) {
      console.error('Error getting virtual time for bet, using real time:', error);
      virtualTime = new Date().toISOString();
    }

    const sql = `
      INSERT INTO bets (id, user_id, match_id, type, prediction, odds, amount, potential_win, status, placed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `;
    return await this.run(sql, [
      betData.id,
      betData.userId,
      betData.matchId,
      betData.type,
      betData.prediction,
      betData.odds,
      betData.amount,
      betData.potentialWin,
      virtualTime
    ]);
  }

  public async getBetsByUser(userId: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        b.*,
        m.date as matchDate,
        ht.name as homeTeamName,
        at.name as awayTeamName,
        u.username
      FROM bets b
      JOIN matches m ON b.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN users u ON b.user_id = u.id
      WHERE b.user_id = ?
      ORDER BY b.placed_at DESC
    `;
    return await this.all(sql, [userId]);
  }

  public async getBetsByMatch(matchId: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        b.*,
        u.username
      FROM bets b
      JOIN users u ON b.user_id = u.id
      WHERE b.match_id = ?
      ORDER BY b.placed_at DESC
    `;
    return await this.all(sql, [matchId]);
  }

  public async updateBetStatus(betId: string, status: string, resolvedAt?: string): Promise<{ lastID?: number; changes?: number }> {
    let finalResolvedAt = resolvedAt;
    
    // If no resolvedAt provided, use virtual time
    if (!finalResolvedAt) {
      try {
        const { VirtualTimeService } = await import('../services/VirtualTimeService');
        const virtualTimeService = VirtualTimeService.getInstance();
        await virtualTimeService.initialize();
        const currentState = await virtualTimeService.getCurrentState();
        finalResolvedAt = currentState.currentDate.toISOString();
      } catch (error) {
        console.error('Error getting virtual time for bet status update, using real time:', error);
        finalResolvedAt = new Date().toISOString();
      }
    }

    const sql = `
      UPDATE bets 
      SET status = ?, resolved_at = ?
      WHERE id = ?
    `;
    return await this.run(sql, [status, finalResolvedAt, betId]);
  }

  public async getAllBets(): Promise<unknown[]> {
    const sql = `
      SELECT 
        b.*,
        u.username,
        m.date as matchDate,
        ht.name as homeTeamName,
        at.name as awayTeamName
      FROM bets b
      JOIN users u ON b.user_id = u.id
      JOIN matches m ON b.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      ORDER BY b.placed_at DESC
    `;
    return await this.all(sql);
  }

  // ============== PREDICTIONS METHODS ==============
  
  public async createPrediction(predictionData: {
    id: string;
    userId: string;
    matchId: string;
    prediction: string;
    confidence: number;
  }): Promise<{ lastID?: number; changes?: number }> {
    // Get current virtual time
    let virtualTime: string;
    try {
      const { VirtualTimeService } = await import('../services/VirtualTimeService');
      const virtualTimeService = VirtualTimeService.getInstance();
      await virtualTimeService.initialize();
      const currentState = await virtualTimeService.getCurrentState();
      virtualTime = currentState.currentDate.toISOString();
    } catch (error) {
      console.error('Error getting virtual time for prediction, using real time:', error);
      virtualTime = new Date().toISOString();
    }

    const sql = `
      INSERT INTO predictions (id, user_id, match_id, prediction, confidence, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `;
    return await this.run(sql, [
      predictionData.id,
      predictionData.userId,
      predictionData.matchId,
      predictionData.prediction,
      predictionData.confidence,
      virtualTime
    ]);
  }

  public async getPredictionsByUser(userId: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        p.*,
        m.date as matchDate,
        ht.name as homeTeamName,
        at.name as awayTeamName,
        u.username
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `;
    return await this.all(sql, [userId]);
  }

  public async getPredictionsByMatch(matchId: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        p.*,
        u.username
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      WHERE p.match_id = ?
      ORDER BY p.created_at DESC
    `;
    return await this.all(sql, [matchId]);
  }

  public async updatePredictionStatus(predictionId: string, status: string, points: number, resolvedAt?: string): Promise<{ lastID?: number; changes?: number }> {
    let finalResolvedAt = resolvedAt;
    
    // If no resolvedAt provided, use virtual time
    if (!finalResolvedAt) {
      try {
        const { VirtualTimeService } = await import('../services/VirtualTimeService');
        const virtualTimeService = VirtualTimeService.getInstance();
        await virtualTimeService.initialize();
        const currentState = await virtualTimeService.getCurrentState();
        finalResolvedAt = currentState.currentDate.toISOString();
      } catch (error) {
        console.error('Error getting virtual time for prediction status update, using real time:', error);
        finalResolvedAt = new Date().toISOString();
      }
    }

    const sql = `
      UPDATE predictions 
      SET status = ?, points = ?, resolved_at = ?
      WHERE id = ?
    `;
    return await this.run(sql, [status, points, finalResolvedAt, predictionId]);
  }

  public async getAllPredictions(): Promise<unknown[]> {
    const sql = `
      SELECT 
        p.*,
        u.username,
        m.date as matchDate,
        ht.name as homeTeamName,
        at.name as awayTeamName
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      JOIN matches m ON p.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      ORDER BY p.created_at DESC
    `;
    return await this.all(sql);
  }

  public async getUserPredictionForMatch(userId: string, matchId: string): Promise<unknown> {
    const sql = `
      SELECT * FROM predictions 
      WHERE user_id = ? AND match_id = ?
    `;
    return await this.get(sql, [userId, matchId]);
  }

  public async resolveMatchPredictions(matchId: string, homeScore: number, awayScore: number): Promise<{ resolved: number; correct: number; incorrect: number }> {
    try {
      console.log(`🔮 Resolving predictions for match ${matchId} - Final score: ${homeScore}-${awayScore}`);
      
      // Determinar el resultado real del partido
      let actualResult: 'home' | 'away' | 'draw';
      if (homeScore > awayScore) {
        actualResult = 'home';
      } else if (awayScore > homeScore) {
        actualResult = 'away';
      } else {
        actualResult = 'draw';
      }

      console.log(`🎯 Match result: ${actualResult}`);

      // Obtener todas las predicciones pendientes para este partido
      const pendingPredictions = await this.all(`
        SELECT id, prediction, user_id, confidence 
        FROM predictions 
        WHERE match_id = ? AND status = 'pending'
      `, [matchId]);

      console.log(`📊 Found ${pendingPredictions.length} pending predictions to resolve`);

      let resolvedCount = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      
      // Get current virtual time for resolved_at
      let virtualTime: string;
      try {
        const { VirtualTimeService } = await import('../services/VirtualTimeService');
        const virtualTimeService = VirtualTimeService.getInstance();
        await virtualTimeService.initialize();
        const currentState = await virtualTimeService.getCurrentState();
        virtualTime = currentState.currentDate.toISOString();
      } catch (error) {
        console.error('Error getting virtual time for prediction resolution, using real time:', error);
        virtualTime = new Date().toISOString();
      }

      const resolvedAt = virtualTime;

      // Resolver cada predicción
      for (const prediction of pendingPredictions) {
        const pred = prediction as { id: string; prediction: string; user_id: string; confidence: number };
        const isCorrect = pred.prediction === actualResult;
        const newStatus = isCorrect ? 'correct' : 'incorrect';
        
        // Calcular puntos basados en la confianza y si acertó
        const points = isCorrect ? pred.confidence * 10 : 0;

        // Actualizar la predicción
        await this.run(`
          UPDATE predictions 
          SET status = ?, points = ?, resolved_at = ?
          WHERE id = ?
        `, [newStatus, points, resolvedAt, pred.id]);

        resolvedCount++;
        if (isCorrect) {
          correctCount++;
          console.log(`✅ User ${pred.user_id}: Correct prediction (${pred.prediction}) - Points: ${points}`);
        } else {
          incorrectCount++;
          console.log(`❌ User ${pred.user_id}: Incorrect prediction (${pred.prediction} vs ${actualResult}) - Points: 0`);
        }
      }

      console.log(`🏆 Predictions resolved: ${resolvedCount} total, ${correctCount} correct, ${incorrectCount} incorrect`);

      return {
        resolved: resolvedCount,
        correct: correctCount,
        incorrect: incorrectCount
      };
    } catch (error) {
      console.error('❌ Error resolving match predictions:', error);
      throw error;
    }
  }

  // ============== ADMIN STATISTICS METHODS ==============
  
  public async getAllUsers(): Promise<unknown[]> {
    const sql = `
      SELECT 
        u.id, u.username, u.email, u.role, u.balance, u.created_at, u.updated_at,
        COUNT(DISTINCT b.id) as total_bets,
        COALESCE(SUM(CASE WHEN b.status = 'won' THEN b.potential_win - b.amount ELSE 0 END), 0) as total_winnings,
        COALESCE(SUM(CASE WHEN b.status = 'lost' THEN b.amount ELSE 0 END), 0) as total_losses,
        COUNT(DISTINCT p.id) as total_predictions,
        COUNT(CASE WHEN p.status = 'correct' THEN 1 END) as correct_predictions
      FROM users u
      LEFT JOIN bets b ON u.id = b.user_id
      LEFT JOIN predictions p ON u.id = p.user_id
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;
    return await this.all(sql);
  }

  public async getBetStatistics(): Promise<unknown> {
    const sql = `
      SELECT 
        COUNT(*) as total_bets,
        SUM(amount) as total_amount,
        AVG(amount) as average_bet,
        COUNT(CASE WHEN status = 'won' THEN 1 END) as won_bets,
        COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_bets,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bets,
        SUM(CASE WHEN status = 'won' THEN potential_win - amount ELSE 0 END) as total_winnings_paid,
        SUM(CASE WHEN status = 'lost' THEN amount ELSE 0 END) as total_losses_collected
      FROM bets
    `;
    return await this.get(sql);
  }

  public async getBetStatisticsByDateRange(startDate: string, endDate: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        DATE(placed_at) as date,
        COUNT(*) as total_bets,
        SUM(amount) as total_amount,
        COUNT(CASE WHEN status = 'won' THEN 1 END) as won_bets,
        COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_bets
      FROM bets
      WHERE DATE(placed_at) BETWEEN ? AND ?
      GROUP BY DATE(placed_at)
      ORDER BY date DESC
    `;
    return await this.all(sql, [startDate, endDate]);
  }

  public async getTopUsersByBets(limit: number = 10): Promise<unknown[]> {
    const sql = `
      SELECT 
        u.username,
        COUNT(b.id) as bet_count,
        SUM(b.amount) as total_amount,
        COUNT(CASE WHEN b.status = 'won' THEN 1 END) as won_count,
        COUNT(CASE WHEN b.status = 'lost' THEN 1 END) as lost_count,
        SUM(CASE WHEN b.status = 'won' THEN b.potential_win - b.amount ELSE 0 END) as net_winnings
      FROM users u
      JOIN bets b ON u.id = b.user_id
      WHERE u.role = 'user'
      GROUP BY u.id, u.username
      ORDER BY bet_count DESC
      LIMIT ?
    `;
    return await this.all(sql, [limit]);
  }

  public async getTopMatchesByBets(limit: number = 10): Promise<unknown[]> {
    const sql = `
      SELECT 
        m.id,
        ht.name as home_team,
        at.name as away_team,
        m.date,
        COUNT(b.id) as bet_count,
        SUM(b.amount) as total_amount
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN bets b ON m.id = b.match_id
      GROUP BY m.id
      HAVING bet_count > 0
      ORDER BY bet_count DESC
      LIMIT ?
    `;
    return await this.all(sql, [limit]);
  }

  public async getBetTypeStatistics(): Promise<unknown[]> {
    const sql = `
      SELECT 
        bt.name,
        bt.category,
        COUNT(b.id) as bet_count,
        SUM(b.amount) as total_amount,
        AVG(b.odds) as average_odds,
        COUNT(CASE WHEN b.status = 'won' THEN 1 END) as won_count,
        COUNT(CASE WHEN b.status = 'lost' THEN 1 END) as lost_count
      FROM bet_types bt
      LEFT JOIN bets b ON bt.id = b.type
      WHERE bt.is_active = TRUE
      GROUP BY bt.id, bt.name, bt.category
      ORDER BY bet_count DESC
    `;
    return await this.all(sql);
  }

  // ============== USER TRANSACTIONS METHODS ==============
  
  public async createTransaction(transactionData: {
    id: string;
    userId: string;
    type: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    description?: string;
    referenceId?: string;
  }): Promise<{ lastID?: number; changes?: number }> {
    const sql = `
      INSERT INTO user_transactions (id, user_id, type, amount, balance_before, balance_after, description, reference_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return await this.run(sql, [
      transactionData.id,
      transactionData.userId,
      transactionData.type,
      transactionData.amount,
      transactionData.balanceBefore,
      transactionData.balanceAfter,
      transactionData.description || '',
      transactionData.referenceId || null
    ]);
  }

  public async getUserTransactions(userId: string, limit: number = 50): Promise<unknown[]> {
    const sql = `
      SELECT * FROM user_transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    return await this.all(sql, [userId, limit]);
  }

  // ============== ADMIN LOGS METHODS ==============
  
  public async createAdminLog(logData: {
    id: string;
    adminUserId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ lastID?: number; changes?: number }> {
    const sql = `
      INSERT INTO admin_logs (id, admin_user_id, action, target_type, target_id, description, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return await this.run(sql, [
      logData.id,
      logData.adminUserId,
      logData.action,
      logData.targetType || null,
      logData.targetId || null,
      logData.description || '',
      logData.ipAddress || null,
      logData.userAgent || null
    ]);
  }

  public async getAdminLogs(limit: number = 100): Promise<unknown[]> {
    const sql = `
      SELECT 
        al.*,
        u.username as admin_username
      FROM admin_logs al
      JOIN users u ON al.admin_user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `;
    return await this.all(sql, [limit]);
  }

  // ============== HISTORICAL DATA METHODS ==============
  
  public async archiveCompletedSeason(seasonId: string): Promise<void> {
    const season = await this.getSeasonById(seasonId) as Season | undefined;
    if (!season) return;

    console.log(`📚 Archivando temporada completada: ${season.name} (${seasonId})`);

    // Archive season
    const historicalSeasonId = `hist-${seasonId}-${Date.now()}`;
    await this.run(`
      INSERT INTO historical_seasons (
        id, original_season_id, name, start_date, end_date, 
        total_teams, total_matches, total_bets, total_predictions, champion_team_id, champion_team_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      historicalSeasonId,
      seasonId,
      season.name,
      season.start_date,
      season.end_date,
      season.teamsCount || 0,
      season.matchesCount || 0,
      0, // Will be calculated
      0, // Will be calculated
      null, // Will be determined from standings
      null
    ]);

    console.log(`📊 Actualizando estadísticas históricas de equipos...`);
    
    // Update team historical stats
    await this.updateHistoricalTeamStats();
    
    console.log(`👥 Actualizando estadísticas históricas de usuarios...`);
    
    // Update user historical stats
    await this.updateHistoricalUserStats();

    console.log(`✅ Temporada ${season.name} archivada correctamente`);
  }

  /**
   * Fuerza la actualización de todas las estadísticas históricas de equipos
   * Útil para reparar datos históricos existentes
   */
  public async forceUpdateHistoricalTeamStats(): Promise<void> {
    console.log(`🔧 Forzando actualización de estadísticas históricas de equipos...`);
    await this.updateHistoricalTeamStats();
    console.log(`✅ Estadísticas históricas de equipos actualizadas forzadamente`);
  }

  /**
   * Repara y pobla la tabla historical_team_stats con datos de temporadas ya finalizadas
   */
  public async repairHistoricalTeamStats(): Promise<void> {
    console.log(`🔧 Reparando estadísticas históricas de equipos...`);
    
    try {
      // Primero, limpiar registros con datos NULL
      await this.run(`
        DELETE FROM historical_team_stats 
        WHERE total_seasons IS NULL OR total_matches IS NULL
      `);
      
      // Forzar la actualización completa
      await this.forceUpdateHistoricalTeamStats();
      
      // Verificar resultados
      const stats = await this.all(`
        SELECT team_id, team_name, total_seasons, total_matches, championships_won 
        FROM historical_team_stats 
        ORDER BY championships_won DESC, total_wins DESC
      `);
      
      console.log(`✅ Reparación completada. ${(stats as any[]).length} equipos actualizados`);
      console.table(stats);
      
    } catch (error) {
      console.error('❌ Error reparando estadísticas históricas:', error);
      throw error;
    }
  }

  private async updateHistoricalTeamStats(): Promise<void> {
    // Complex query to aggregate all team statistics across all seasons
    const sql = `
      INSERT OR REPLACE INTO historical_team_stats (
        id, team_id, team_name, total_seasons, total_matches, total_wins, 
        total_losses, total_draws, total_points_for, total_points_against, 
        total_snitch_catches, championships_won, best_season_position, 
        worst_season_position, updated_at
      )
      SELECT 
        'hist-' || t.id as id,
        t.id as team_id,
        t.name as team_name,
        COUNT(DISTINCT st.season_id) as total_seasons,
        COALESCE(SUM(st.matches_played), 0) as total_matches,
        COALESCE(SUM(st.wins), 0) as total_wins,
        COALESCE(SUM(st.losses), 0) as total_losses,
        COALESCE(SUM(st.draws), 0) as total_draws,
        COALESCE(SUM(st.points_for), 0) as total_points_for,
        COALESCE(SUM(st.points_against), 0) as total_points_against,
        COALESCE(SUM(st.snitch_catches), 0) as total_snitch_catches,
        COUNT(CASE WHEN st.position = 1 THEN 1 END) as championships_won,
        MIN(st.position) as best_season_position,
        MAX(st.position) as worst_season_position,
        CURRENT_TIMESTAMP as updated_at
      FROM teams t
      LEFT JOIN standings st ON t.id = st.team_id
      WHERE st.season_id IS NOT NULL OR t.id IN (
        SELECT DISTINCT team_id FROM season_teams
      )
      GROUP BY t.id, t.name
    `;
    await this.run(sql);
  }

  private async updateHistoricalUserStats(): Promise<void> {
    // Complex query to aggregate all user statistics
    const sql = `
      INSERT OR REPLACE INTO historical_user_stats (
        id, user_id, username, total_bets, total_amount_bet, total_winnings,
        total_losses, total_predictions, correct_predictions, prediction_accuracy, account_created
      )
      SELECT 
        'hist-' || u.id as id,
        u.id as user_id,
        u.username,
        COUNT(DISTINCT b.id) as total_bets,
        COALESCE(SUM(b.amount), 0) as total_amount_bet,
        COALESCE(SUM(CASE WHEN b.status = 'won' THEN b.potential_win - b.amount ELSE 0 END), 0) as total_winnings,
        COALESCE(SUM(CASE WHEN b.status = 'lost' THEN b.amount ELSE 0 END), 0) as total_losses,
        COUNT(DISTINCT p.id) as total_predictions,
        COUNT(CASE WHEN p.status = 'correct' THEN 1 END) as correct_predictions,
        CASE 
          WHEN COUNT(DISTINCT p.id) > 0 
          THEN (COUNT(CASE WHEN p.status = 'correct' THEN 1 END) * 100.0 / COUNT(DISTINCT p.id))
          ELSE 0 
        END as prediction_accuracy,
        u.created_at as account_created
      FROM users u
      LEFT JOIN bets b ON u.id = b.user_id
      LEFT JOIN predictions p ON u.id = p.user_id
      WHERE u.role = 'user'
      GROUP BY u.id, u.username, u.created_at
    `;
    await this.run(sql);
  }

  // ============== RESET METHODS ==============

  /**
   * Reset database for a fresh season - clears matches, events, bets, predictions
   * but keeps users, teams, and basic configuration
   */
  public async resetForNewSeason(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    console.log('🔄 Starting database reset for new season...');

    try {
      // Disable foreign key constraints first, outside of transaction
      console.log('⚙️ Disabling foreign key constraints...');
      await this.run('PRAGMA foreign_keys = OFF');

      // Start transaction
      await this.run('BEGIN TRANSACTION');

      // Clear all betting data first (no dependencies)
      console.log('🗑️ Clearing bets...');
      await this.run('DELETE FROM bets');
      
      // Clear all predictions
      console.log('🗑️ Clearing predictions...');
      await this.run('DELETE FROM predictions');

      // Clear all match-related data (cascading deletes will handle events)
      console.log('🗑️ Clearing matches and events...');
      await this.run('DELETE FROM match_events');
      await this.run('DELETE FROM matches');
      
      // Clear season-related data
      console.log('🗑️ Clearing seasons and standings...');
      await this.run('DELETE FROM standings');
      await this.run('DELETE FROM season_teams');
      await this.run('DELETE FROM seasons');
      
      // Clear historical seasons
      console.log('🗑️ Clearing historical seasons...');
      await this.run('DELETE FROM historical_seasons');
      
      // Reset team statistics to zero
      console.log('🔄 Resetting team statistics...');
      await this.run(`
        UPDATE teams SET 
          matches_played = 0,
          wins = 0,
          losses = 0,
          draws = 0,
          points_for = 0,
          points_against = 0,
          snitch_catches = 0,
          updated_at = CURRENT_TIMESTAMP
      `);

      // Reset user balances to default
      console.log('💰 Resetting user balances...');
      await this.run(`
        UPDATE users SET 
          balance = 1000.0,
          updated_at = CURRENT_TIMESTAMP
        WHERE role = 'user'
      `);

      // Clear historical stats (optional - you might want to keep these)
      console.log('📊 Clearing historical statistics...');
      await this.run('DELETE FROM historical_team_stats');
      await this.run('DELETE FROM historical_user_stats');

      // Clear user transactions
      console.log('� Clearing user transactions...');
      await this.run('DELETE FROM user_transactions');

      // Clear admin logs  
      console.log('📋 Clearing admin logs...');
      await this.run('DELETE FROM admin_logs');

      // Clear virtual time state
      console.log('⏰ Resetting virtual time state...');
      await this.run('DELETE FROM virtual_time_state');

      // Commit transaction
      await this.run('COMMIT');

      // Re-enable foreign key constraints
      console.log('⚙️ Re-enabling foreign key constraints...');
      await this.run('PRAGMA foreign_keys = ON');

      console.log('✅ Database reset completed successfully!');
      console.log('🎯 Ready for new season generation');

    } catch (error) {
      // Rollback transaction on error
      await this.run('ROLLBACK');
      // Re-enable foreign key constraints even on error
      await this.run('PRAGMA foreign_keys = ON');
      console.error('❌ Error during database reset:', error);
      throw error;
    }
  }

  /**
   * Complete database reset - removes everything including users and teams
   * Use with extreme caution!
   */
  public async resetCompleteDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    console.log('⚠️ Starting COMPLETE database reset...');

    try {
      // Start transaction
      await this.run('BEGIN TRANSACTION');

      // Get all table names
      const tables = await this.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `) as { name: string }[];

      // Clear all tables
      for (const table of tables) {
        console.log(`🗑️ Clearing table: ${table.name}`);
        await this.run(`DELETE FROM ${table.name}`);
      }

      // Commit transaction
      await this.run('COMMIT');

      console.log('✅ Complete database reset completed!');
      console.log('🏗️ Re-seeding initial data...');

      // Re-seed initial data
      await this.seedInitialData();

      console.log('✅ Database fully reset and re-seeded!');

    } catch (error) {
      // Rollback transaction on error
      await this.run('ROLLBACK');
      console.error('❌ Error during complete database reset:', error);
      throw error;
    }
  }

  // ============== MATCH SIMULATION METHODS ==============

  public async updateMatchStatus(matchId: string, status: string): Promise<void> {
    const sql = `
      UPDATE matches 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await this.run(sql, [status, matchId]);
  }

  public async updateMatchScore(matchId: string, homeScore: number, awayScore: number): Promise<void> {
    const sql = `
      UPDATE matches 
      SET home_score = ?, away_score = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await this.run(sql, [homeScore, awayScore, matchId]);
  }

  public async updateMatchSnitchCaught(matchId: string, snitchCaught: boolean, snitchCaughtBy: string): Promise<void> {
    const sql = `
      UPDATE matches 
      SET snitch_caught = ?, snitch_caught_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await this.run(sql, [snitchCaught, snitchCaughtBy, matchId]);
  }

  public async finishMatch(matchId: string, matchResult: {
    homeScore: number;
    awayScore: number;
    duration: number;
    snitchCaught: boolean;
    snitchCaughtBy: string;
    events: Array<{
      id: string;
      minute: number;
      type: string;
      team: string;
      player?: string;
      description: string;
      points: number;
    }>;
    finishedAt: string;
  }): Promise<void> {
    console.log('🔄 Database.finishMatch called with:', {
      matchId,
      homeScore: matchResult.homeScore,
      awayScore: matchResult.awayScore,
      eventsCount: matchResult.events.length,
      duration: matchResult.duration,
      snitchCaught: matchResult.snitchCaught,
      snitchCaughtBy: matchResult.snitchCaughtBy
    });

    try {
      // Verificar que el partido existe primero
      const existingMatch = await this.get('SELECT * FROM matches WHERE id = ?', [matchId]);
      if (!existingMatch) {
        throw new Error(`Match with ID ${matchId} does not exist`);
      }

      console.log('✅ Match exists, proceeding with update');

      // Actualizar el partido con todos los resultados
      const updateMatchSql = `
        UPDATE matches 
        SET status = 'finished', 
            home_score = ?, 
            away_score = ?, 
            duration = ?, 
            snitch_caught = ?, 
            snitch_caught_by = ?, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await this.run(updateMatchSql, [
        matchResult.homeScore,
        matchResult.awayScore,
        matchResult.duration,
        matchResult.snitchCaught,
        matchResult.snitchCaughtBy,
        matchId
      ]);

      console.log('✅ Match updated successfully');

      // Limpiar eventos existentes del partido para evitar duplicados
      await this.run('DELETE FROM match_events WHERE match_id = ?', [matchId]);
      console.log('✅ Existing events cleared');

      // Guardar todos los eventos del partido
      let eventsProcessed = 0;
      for (const event of matchResult.events) {
        try {
          await this.createMatchEvent({
            id: event.id,
            matchId,
            minute: event.minute,
            type: event.type,
            team: event.team,
            player: event.player || undefined,
            description: event.description,
            points: event.points
          });
          eventsProcessed++;
        } catch (eventError) {
          console.error(`❌ Error saving event ${event.id}:`, eventError);
          // Continue processing other events
        }
      }

      // Resolve predictions for the match
      const { correct, incorrect } = await this.resolveMatchPredictions(matchId, matchResult.homeScore, matchResult.awayScore);

      console.log(`✅ Match ${matchId} finished successfully with ${eventsProcessed}/${matchResult.events.length} events saved. Predictions resolved: ${correct} correct, ${incorrect} incorrect`);
    } catch (error) {
      console.error('❌ Error in finishMatch:', error);
      throw error;
    }
  }

  public async createMatchEvent(event: {
    id: string;
    matchId: string;
    minute: number;
    type: string;
    team: string;
    player?: string;
    description: string;
    points: number;
  }): Promise<void> {
    try {
      const sql = `
        INSERT INTO match_events (id, match_id, minute, type, team, player, description, points)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.run(sql, [
        event.id,
        event.matchId,
        event.minute,
        event.type,
        event.team,
        event.player || null,
        event.description,
        event.points
      ]);
    } catch (error) {
      console.error('❌ Error creating match event:', {
        eventId: event.id,
        matchId: event.matchId,
        type: event.type,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  public async getMatchEvents(matchId: string): Promise<unknown[]> {
    const sql = `
      SELECT * FROM match_events
      WHERE match_id = ?
      ORDER BY minute ASC
    `;
    return await this.all(sql, [matchId]);
  }

  // ============== PLAYERS METHODS ==============

  private async seedPlayers(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    console.log('👥 Seeding players for all teams...');

    // Get all teams
    const teams = await this.all('SELECT id FROM teams') as Array<{ id: string }>;

    // Player data for each team
    const playersByTeam = {
      'gryffindor': [
        // Titulares (7 jugadores)
        { name: 'Harry Potter', position: 'seeker', skill_level: 95, is_starting: true, number: 1, years_active: 7 },
        { name: 'Ron Weasley', position: 'keeper', skill_level: 88, is_starting: true, number: 2, years_active: 6 },
        { name: 'Fred Weasley', position: 'beater', skill_level: 85, is_starting: true, number: 3, years_active: 7 },
        { name: 'George Weasley', position: 'beater', skill_level: 85, is_starting: true, number: 4, years_active: 7 },
        { name: 'Angelina Johnson', position: 'chaser', skill_level: 90, is_starting: true, number: 5, years_active: 6 },
        { name: 'Katie Bell', position: 'chaser', skill_level: 88, is_starting: true, number: 6, years_active: 5 },
        { name: 'Alicia Spinnet', position: 'chaser', skill_level: 87, is_starting: true, number: 7, years_active: 6 },
        // Suplentes
        { name: 'Oliver Wood', position: 'keeper', skill_level: 92, is_starting: false, number: 8, years_active: 8 },
        { name: 'Ginny Weasley', position: 'seeker', skill_level: 88, is_starting: false, number: 9, years_active: 4 },
        { name: 'Dean Thomas', position: 'chaser', skill_level: 75, is_starting: false, number: 10, years_active: 3 },
        { name: 'Seamus Finnigan', position: 'beater', skill_level: 72, is_starting: false, number: 11, years_active: 3 }
      ],
      'slytherin': [
        // Titulares
        { name: 'Draco Malfoy', position: 'seeker', skill_level: 87, is_starting: true, number: 1, years_active: 6 },
        { name: 'Blaise Zabini', position: 'keeper', skill_level: 93, is_starting: true, number: 2, years_active: 5 },
        { name: 'Vincent Crabbe', position: 'beater', skill_level: 88, is_starting: true, number: 3, years_active: 6 },
        { name: 'Gregory Goyle', position: 'beater', skill_level: 86, is_starting: true, number: 4, years_active: 6 },
        { name: 'Marcus Flint', position: 'chaser', skill_level: 92, is_starting: true, number: 5, years_active: 8 },
        { name: 'Adrian Pucey', position: 'chaser', skill_level: 89, is_starting: true, number: 6, years_active: 7 },
        { name: 'Terence Higgs', position: 'chaser', skill_level: 85, is_starting: true, number: 7, years_active: 5 },
        // Suplentes
        { name: 'Miles Bletchley', position: 'keeper', skill_level: 85, is_starting: false, number: 8, years_active: 4 },
        { name: 'Graham Montague', position: 'seeker', skill_level: 80, is_starting: false, number: 9, years_active: 3 },
        { name: 'Cassius Warrington', position: 'chaser', skill_level: 78, is_starting: false, number: 10, years_active: 4 },
        { name: 'Peregrine Derrick', position: 'beater', skill_level: 83, is_starting: false, number: 11, years_active: 5 }
      ],
      'ravenclaw': [
        // Titulares
        { name: 'Cho Chang', position: 'seeker', skill_level: 92, is_starting: true, number: 1, years_active: 5 },
        { name: 'Grant Page', position: 'keeper', skill_level: 85, is_starting: true, number: 2, years_active: 4 },
        { name: 'Jason Samuels', position: 'beater', skill_level: 78, is_starting: true, number: 3, years_active: 3 },
        { name: 'Duncan Inglebee', position: 'beater', skill_level: 76, is_starting: true, number: 4, years_active: 3 },
        { name: 'Roger Davies', position: 'chaser', skill_level: 90, is_starting: true, number: 5, years_active: 6 },
        { name: 'Randolph Burrow', position: 'chaser', skill_level: 88, is_starting: true, number: 6, years_active: 5 },
        { name: 'Jeremy Stretton', position: 'chaser', skill_level: 87, is_starting: true, number: 7, years_active: 4 },
        // Suplentes
        { name: 'Luna Lovegood', position: 'seeker', skill_level: 83, is_starting: false, number: 8, years_active: 2 },
        { name: 'Terry Boot', position: 'keeper', skill_level: 79, is_starting: false, number: 9, years_active: 3 },
        { name: 'Michael Corner', position: 'chaser', skill_level: 82, is_starting: false, number: 10, years_active: 3 },
        { name: 'Anthony Goldstein', position: 'beater', skill_level: 74, is_starting: false, number: 11, years_active: 2 }
      ],
      'hufflepuff': [
        // Titulares
        { name: 'Cedric Diggory', position: 'seeker', skill_level: 89, is_starting: true, number: 1, years_active: 6 },
        { name: 'Herbert Fleet', position: 'keeper', skill_level: 90, is_starting: true, number: 2, years_active: 5 },
        { name: 'Maxine O\'Flaherty', position: 'beater', skill_level: 82, is_starting: true, number: 3, years_active: 4 },
        { name: 'Anthony Rickett', position: 'beater', skill_level: 84, is_starting: true, number: 4, years_active: 5 },
        { name: 'Tamsin Applebee', position: 'chaser', skill_level: 86, is_starting: true, number: 5, years_active: 4 },
        { name: 'Heidi Macavoy', position: 'chaser', skill_level: 83, is_starting: true, number: 6, years_active: 3 },
        { name: 'Malcolm Preece', position: 'chaser', skill_level: 81, is_starting: true, number: 7, years_active: 3 },
        // Suplentes
        { name: 'Justin Finch-Fletchley', position: 'keeper', skill_level: 82, is_starting: false, number: 8, years_active: 4 },
        { name: 'Zacharias Smith', position: 'seeker', skill_level: 76, is_starting: false, number: 9, years_active: 3 },
        { name: 'Hannah Abbott', position: 'chaser', skill_level: 78, is_starting: false, number: 10, years_active: 3 },
        { name: 'Susan Bones', position: 'beater', skill_level: 75, is_starting: false, number: 11, years_active: 2 }
      ],
      'chudley-cannons': [
        // Titulares
        { name: 'Joey Jenkins', position: 'seeker', skill_level: 78, is_starting: true, number: 1, years_active: 4 },
        { name: 'Ronan Lynch', position: 'keeper', skill_level: 72, is_starting: true, number: 2, years_active: 6 },
        { name: 'Kevin Broadmoor', position: 'beater', skill_level: 80, is_starting: true, number: 3, years_active: 5 },
        { name: 'Karl Broadmoor', position: 'beater', skill_level: 78, is_starting: true, number: 4, years_active: 5 },
        { name: 'Galvin Gudgeon', position: 'chaser', skill_level: 75, is_starting: true, number: 5, years_active: 8 },
        { name: 'Lennox Campbell', position: 'chaser', skill_level: 73, is_starting: true, number: 6, years_active: 3 },
        { name: 'Rupert Brookstanton', position: 'chaser', skill_level: 71, is_starting: true, number: 7, years_active: 2 },
        // Suplentes
        { name: 'Dragomir Gorgovitch', position: 'seeker', skill_level: 82, is_starting: false, number: 8, years_active: 10 },
        { name: 'Ragmar Dorkins', position: 'keeper', skill_level: 68, is_starting: false, number: 9, years_active: 2 },
        { name: 'Catriona McCormack', position: 'chaser', skill_level: 77, is_starting: false, number: 10, years_active: 7 },
        { name: 'Meaghan McCormack', position: 'beater', skill_level: 74, is_starting: false, number: 11, years_active: 5 }
      ],
      'holyhead-harpies': [
        // Titulares
        { name: 'Ginny Weasley', position: 'seeker', skill_level: 95, is_starting: true, number: 1, years_active: 8 },
        { name: 'Glynnis Griffiths', position: 'keeper', skill_level: 88, is_starting: true, number: 2, years_active: 12 },
        { name: 'Gwenog Jones', position: 'beater', skill_level: 92, is_starting: true, number: 3, years_active: 15 },
        { name: 'Valmai Morgan', position: 'beater', skill_level: 89, is_starting: true, number: 4, years_active: 10 },
        { name: 'Wilda Griffiths', position: 'chaser', skill_level: 96, is_starting: true, number: 5, years_active: 14 },
        { name: 'Julia Johnson', position: 'chaser', skill_level: 94, is_starting: true, number: 6, years_active: 9 },
        { name: 'Gwendolyn Morgan', position: 'chaser', skill_level: 93, is_starting: true, number: 7, years_active: 11 },
        // Suplentes
        { name: 'Artemis Faulkner', position: 'keeper', skill_level: 84, is_starting: false, number: 8, years_active: 5 },
        { name: 'Lilywhite', position: 'seeker', skill_level: 87, is_starting: false, number: 9, years_active: 6 },
        { name: 'Emma Vanity', position: 'chaser', skill_level: 85, is_starting: false, number: 10, years_active: 4 },
        { name: 'Lucinda Talkalot', position: 'beater', skill_level: 82, is_starting: false, number: 11, years_active: 7 }
      ]
    };

    // Insert players for each team
    for (const team of teams) {
      const teamPlayers = playersByTeam[team.id as keyof typeof playersByTeam];
      if (teamPlayers) {
        for (const player of teamPlayers) {
          const playerId = `${team.id}-${player.name.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')}`;
          
          await this.run(`
            INSERT INTO players (id, name, team_id, position, skill_level, is_starting, number, years_active, achievements)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            playerId,
            player.name,
            team.id,
            player.position,
            player.skill_level,
            player.is_starting,
            player.number,
            player.years_active,
            JSON.stringify([]) // Empty achievements array for now
          ]);
        }
      }
    }

    console.log('✅ All players seeded successfully');
  }

  public async getTeamById(teamId: string): Promise<unknown> {
    const sql = `
      SELECT 
        t.*,
        COUNT(DISTINCT p.id) as total_players,
        COUNT(CASE WHEN p.is_starting = 1 THEN 1 END) as starting_players
      FROM teams t
      LEFT JOIN players p ON t.id = p.team_id
      WHERE t.id = ?
      GROUP BY t.id
    `;
    return await this.get(sql, [teamId]);
  }

  public async getTeamPlayers(teamId: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        id, name, position, skill_level, is_starting, number, years_active, achievements,
        created_at, updated_at
      FROM players
      WHERE team_id = ?
      ORDER BY is_starting DESC, position ASC, number ASC
    `;
    return await this.all(sql, [teamId]);
  }

  public async getTeamStartingLineup(teamId: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        id, name, position, skill_level, number, years_active, achievements
      FROM players
      WHERE team_id = ? AND is_starting = 1
      ORDER BY position ASC, number ASC
    `;
    return await this.all(sql, [teamId]);
  }

  public async getPlayersByPosition(teamId: string, position: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        id, name, skill_level, is_starting, number, years_active, achievements
      FROM players
      WHERE team_id = ? AND position = ?
      ORDER BY is_starting DESC, skill_level DESC
    `;
    return await this.all(sql, [teamId, position]);
  }

  public async getTeamStatistics(teamId: string): Promise<unknown> {
    const sql = `
      SELECT 
        t.id, t.name, t.logo, t.founded, t.description, t.stadium, t.colors,
        t.slogan, t.history, t.titles, t.achievements,
        t.matches_played, t.wins, t.losses, t.draws,
        t.points_for, t.points_against, t.snitch_catches,
        t.attack_strength, t.defense_strength, t.seeker_skill,
        t.keeper_skill, t.chaser_skill, t.beater_skill,
        ROUND(CAST(t.wins AS FLOAT) / NULLIF(t.matches_played, 0) * 100, 1) as win_percentage,
        (t.points_for - t.points_against) as point_difference
      FROM teams t
      WHERE t.id = ?
    `;
    return await this.get(sql, [teamId]);
  }

  public async getMatchLineups(matchId: string): Promise<{
    homeTeam: { team: unknown; lineup: unknown[] };
    awayTeam: { team: unknown; lineup: unknown[] };
  }> {
    // Get match details
    const match = await this.getMatchById(matchId) as { home_team_id: string; away_team_id: string } | undefined;
    if (!match) {
      throw new Error('Match not found');
    }

    // Get both teams' lineups
    const homeLineup = await this.getTeamStartingLineup(match.home_team_id);
    const awayLineup = await this.getTeamStartingLineup(match.away_team_id);
    
    // Get team basic info
    const homeTeam = await this.getTeamById(match.home_team_id);
    const awayTeam = await this.getTeamById(match.away_team_id);

    return {
      homeTeam: { team: homeTeam, lineup: homeLineup },
      awayTeam: { team: awayTeam, lineup: awayLineup }
    };
  }
}
