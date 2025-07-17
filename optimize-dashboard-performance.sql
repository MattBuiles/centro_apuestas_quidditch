-- Dashboard Performance Optimization - Database Indexes
-- This script creates indexes to optimize the dashboard queries

-- Index for user role queries (getDashboardStats)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Index for bet created_at queries (used frequently in dashboard)
CREATE INDEX IF NOT EXISTS idx_bets_created_at ON bets(created_at);

-- Index for bet status queries (win rate calculations)
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);

-- Index for bet amount queries (risk analysis, performance metrics)
CREATE INDEX IF NOT EXISTS idx_bets_amount ON bets(amount);

-- Composite index for user bets (active users, recent activity)
CREATE INDEX IF NOT EXISTS idx_bets_user_created ON bets(user_id, created_at);

-- Composite index for bet amount and date (risk analysis optimization)
CREATE INDEX IF NOT EXISTS idx_bets_amount_created ON bets(amount, created_at);

-- Index for match-related queries (popular teams, recent activity)
CREATE INDEX IF NOT EXISTS idx_bets_match_id ON bets(match_id);

-- Index for team queries (popular teams)
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team_id);

-- Composite index for bet status and potential_win (performance metrics)
CREATE INDEX IF NOT EXISTS idx_bets_status_potential_win ON bets(status, potential_win);

-- Index for user-specific queries
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Query to check index creation
SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%';
