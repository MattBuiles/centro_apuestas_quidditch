export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPublic {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  founded: number;
  description: string;
  stadium: string;
  colors: string[];
  stats: TeamStats;
}

export interface TeamStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  snitchCatches: number;
  winRate: number;
}

export interface Season {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'finished';
  teams: Team[];
  matches: Match[];
  standings: StandingEntry[];
}

export interface Match {
  id: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  date: Date;
  status: 'scheduled' | 'live' | 'finished' | 'postponed';
  homeScore?: number;
  awayScore?: number;
  snitchCaught?: boolean;
  snitchCaughtBy?: string;
  duration?: number;
  events: MatchEvent[];
  odds: MatchOdds;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  minute: number;
  type: 'goal' | 'snitch' | 'foul' | 'timeout' | 'substitution';
  team: string;
  player?: string;
  description: string;
  points: number;
}

export interface MatchOdds {
  homeWin: number;
  awayWin: number;
  draw: number;
  totalPoints: {
    over150: number;
    under150: number;
  };
  snitchCatch: {
    home: number;
    away: number;
  };
}

export interface StandingEntry {
  teamId: string;
  team: Team;
  position: number;
  points: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDifference: number;
  winRate: number;
  snitchCatches: number;
}

export interface Bet {
  id: string;
  userId: string;
  matchId: string;
  type: BetType;
  prediction: string;
  odds: number;
  amount: number;
  potentialWin: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  placedAt: Date;
  resolvedAt?: Date;
}

export type BetType = 
  | 'match_winner'
  | 'total_points_over'
  | 'total_points_under'
  | 'snitch_catcher'
  | 'exact_score'
  | 'first_to_score';

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  prediction: 'home' | 'away' | 'draw';
  confidence: number;
  points: number;
  status: 'pending' | 'correct' | 'incorrect';
  createdAt: Date;
  resolvedAt?: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface WebSocketMessage {
  type: 'match_update' | 'bet_update' | 'prediction_update' | 'standings_update' | 'connection' | 'ping' | 'pong';
  data: unknown;
  timestamp: string;
}

export interface MatchLiveUpdate {
  matchId: string;
  currentMinute: number;
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  status: Match['status'];
}

export interface AdminStats {
  totalUsers: number;
  totalBets: number;
  totalBetAmount: number;
  totalMatches: number;
  activeUsers: number;
  recentActivity: RecentActivity[];
}

export interface RecentActivity {
  id: string;
  type: 'bet' | 'user_registration' | 'match_result' | 'prediction';
  description: string;
  userId?: string;
  username?: string;
  timestamp: Date;
  amount?: number;
}

export interface DatabaseConfig {
  path: string;
  enableWAL?: boolean;
  enableForeignKeys?: boolean;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Database row interfaces for SQL queries
export interface TeamRow {
  id: string;
  name: string;
  logo?: string;
  founded?: number;
  description?: string;
  stadium?: string;
  colors?: string; // JSON string
  matches_played?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  points_for?: number;
  points_against?: number;
  snitch_catches?: number;
  attack_strength?: number;
  defense_strength?: number;
  seeker_skill?: number;
  keeper_skill?: number;
  chaser_skill?: number;
  beater_skill?: number;
  slogan?: string;
  history?: string;
  titles?: number;
  achievements?: string; // JSON string
}

export interface Player {
  id: string;
  name: string;
  team_id: string;
  position: 'keeper' | 'seeker' | 'beater' | 'chaser';
  skill_level: number;
  is_starting: boolean;
  years_active?: number;
  number?: number;
  achievements?: string[]; // JSON array
}

export interface MatchRow {
  id: string;
  season_id: string;
  home_team_id: string;
  away_team_id: string;
  date: string;
  status: string;
  home_score?: number;
  away_score?: number;
  snitch_caught?: boolean;
  snitch_caught_by?: string;
  duration?: number;
  odds_home_win?: number;
  odds_away_win?: number;
  odds_draw?: number;
  odds_total_over?: number;
  odds_total_under?: number;
  odds_snitch_home?: number;
  odds_snitch_away?: number;
}

export interface MatchResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
  duration: number;
  snitchCaught: boolean;
  snitchCaughtBy?: string;
  events: MatchEvent[];
  weather: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' | 'windy';
  attendance: number;
}
