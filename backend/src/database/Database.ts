import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { DatabaseConfig } from '../types';

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
    const dbPath = config?.path || process.env.DATABASE_URL || './database/quidditch.db';
    
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
        type TEXT CHECK(type IN ('goal', 'snitch', 'foul', 'timeout', 'substitution')) NOT NULL,
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
        colors: JSON.stringify(['#740001', '#D3A625'])
      },
      {
        id: 'slytherin',
        name: 'Slytherin',
        logo: '/images/slytherin-logo.png',
        founded: 990,
        description: 'Casa conocida por su astucia y ambición',
        stadium: 'Campo de Quidditch de Hogwarts',
        colors: JSON.stringify(['#1A472A', '#AAAAAA'])
      },
      {
        id: 'ravenclaw',
        name: 'Ravenclaw',
        logo: '/images/ravenclaw-logo.png',
        founded: 990,
        description: 'Casa conocida por su sabiduría e ingenio',
        stadium: 'Campo de Quidditch de Hogwarts',
        colors: JSON.stringify(['#0E1A40', '#946B2D'])
      },
      {
        id: 'hufflepuff',
        name: 'Hufflepuff',
        logo: '/images/hufflepuff-logo.png',
        founded: 990,
        description: 'Casa conocida por su lealtad y trabajo duro',
        stadium: 'Campo de Quidditch de Hogwarts',
        colors: JSON.stringify(['#ECB939', '#372E29'])
      },
      {
        id: 'chudley-cannons',
        name: 'Chudley Cannons',
        logo: '/images/chudley-cannons-logo.png',
        founded: 1892,
        description: 'Equipo profesional inglés con sede en Chudley',
        stadium: 'Estadio Chudley',
        colors: JSON.stringify(['#FFA500', '#000000'])
      },
      {
        id: 'holyhead-harpies',
        name: 'Holyhead Harpies',
        logo: '/images/holyhead-harpies-logo.png',
        founded: 1203,
        description: 'Equipo profesional femenino de Gales',
        stadium: 'Estadio Holyhead',
        colors: JSON.stringify(['#006400', '#FFFFFF'])
      }
    ];

    // Insert teams
    for (const team of teamsData) {
      await this.run(`
        INSERT INTO teams (id, name, logo, founded, description, stadium, colors)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [team.id, team.name, team.logo, team.founded, team.description, team.stadium, team.colors]);
    }

    // Create default admin user
    const bcrypt = await import('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await this.run(`
      INSERT INTO users (id, username, email, password, role, balance)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['admin-user', 'admin', 'admin@quidditch.com', adminPassword, 'admin', 10000]);

    console.log('🌱 Initial data seeded successfully');
    console.log('👤 Default admin user created: admin@quidditch.com / admin123');

    // Create a sample season
    await this.createSampleSeason();
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
    const teams = await this.all('SELECT id FROM teams');
    for (const team of teams as any[]) {
      await this.run(`
        INSERT INTO season_teams (season_id, team_id)
        VALUES (?, ?)
      `, [seasonId, team.id]);
    }

    // Generate sample matches (round-robin tournament)
    const teamIds = (teams as any[]).map(t => t.id);
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
    `, [seasonId]) as any[];

    const teamStats: { [key: string]: any } = {};

    // Initialize team stats
    const teams = await this.all('SELECT id FROM teams') as any[];
    for (const team of teams) {
      teamStats[team.id] = {
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
    `) as any[];

    // Calculate league points (3 for win, 1 for draw)
    const standings = teams.map((team: any) => ({
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
}
