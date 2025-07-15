import { promisify } from 'util';
import { DatabaseConnection } from './DatabaseConnection';

export class DatabaseSchemas {
  private connection: DatabaseConnection;

  constructor() {
    this.connection = DatabaseConnection.getInstance();
  }

  public async createTables(): Promise<void> {
    const db = this.connection.getDatabase();
    if (!db) throw new Error('Database not connected');

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

    const exec = promisify(db.exec.bind(db));
    await exec(createTablesSQL);
    console.log('✅ Database tables created successfully');
  }
}
