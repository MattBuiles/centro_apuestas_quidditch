// Database interfaces for type safety

export interface TeamRow {
  id: string;
  [key: string]: unknown;
}

export interface TeamStats {
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

export interface FinishedMatch {
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  snitch_caught_by: string | null;
  [key: string]: unknown;
}

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  teamsCount?: number;
  matchesCount?: number;
  finishedMatches?: number;
  scheduledMatches?: number;
  [key: string]: unknown;
}

export interface BetData {
  id: string;
  userId: string;
  matchId: string;
  type: string;
  prediction: string;
  odds: number;
  amount: number;
  potentialWin: number;
}

export interface PredictionData {
  id: string;
  userId: string;
  matchId: string;
  prediction: string;
  confidence: number;
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  password: string;
  role?: string;
  balance?: number;
}

export interface TransactionData {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  referenceId?: string;
}

export interface AdminLogData {
  id: string;
  adminUserId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  minute: number;
  type: string;
  team: string;
  player?: string;
  description: string;
  points: number;
}

export interface MatchResult {
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
}

export interface DatabaseResult {
  lastID?: number;
  changes?: number;
}
