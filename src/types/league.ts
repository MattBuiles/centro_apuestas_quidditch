// Types for the Quidditch League System

export interface Team {
  id: string;
  name: string;
  house?: string;
  // Core strengths following your schema
  fuerzaAtaque: number; // 1-100 (replaces attackStrength)
  fuerzaDefensa: number; // 1-100 (replaces defenseStrength)
  // Backward compatibility
  attackStrength: number; // 1-100
  defenseStrength: number; // 1-100
  seekerSkill: number; // 1-100 (for Snitch catching)
  chaserSkill: number; // 1-100 (for Quaffle handling)
  keeperSkill: number; // 1-100 (for saves)
  beaterSkill: number; // 1-100 (for Bludger control)
  logo?: string;
  colors?: {
    primary: string;
    secondary: string;
  };
  // Additional metadata
  venue?: string;
  founded?: number;
  slogan?: string;
}

export interface Player {
  id: string;
  name: string;
  position: 'CHASER' | 'KEEPER' | 'BEATER' | 'SEEKER';
  skill: number; // 1-100
  teamId: string;
}

export interface GameEvent {
  id: string;
  type: EventType;
  minute: number;
  second: number;
  teamId: string;
  playerId?: string;
  targetPlayerId?: string; // for fouls, bludger hits, etc.
  description: string;
  points: number;
  success: boolean;
}

export type EventType = 
  | 'QUAFFLE_GOAL' 
  | 'QUAFFLE_ATTEMPT' 
  | 'QUAFFLE_SAVE' 
  | 'SNITCH_CAUGHT' 
  | 'SNITCH_SPOTTED'
  | 'BLUDGER_HIT' 
  | 'BLUDGER_BLOCKED'
  | 'FOUL_BLAGGING'
  | 'FOUL_BLATCHING'
  | 'FOUL_BLURTING'
  | 'FOUL_COBBING'
  | 'FOUL_FLACKING'
  | 'FOUL_HAVERSACKING'
  | 'FOUL_QUAFFLE_POCKING'
  | 'FOUL_STOOGING'
  | 'TIMEOUT'
  | 'INJURY'
  | 'WEATHER_CHANGE';

export interface Match {
  id: string;
  // Core match data following your schema
  localId: string; // replaces homeTeamId
  visitanteId: string; // replaces awayTeamId
  fecha: Date; // replaces date
  resultado?: MatchResult; // embedded result
  eventos: GameEvent[]; // replaces events
  // Backward compatibility
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName?: string; // Team names from backend joins
  awayTeamName?: string;
  date: Date;
  events: GameEvent[];
  // Match status and metadata
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
  homeScore: number;
  awayScore: number;
  duration: number; // in minutes
  round: number; // 1 = first round, 2 = second round
  matchday: number; // 1-N within each round (jornada)
  venue?: string;
  attendance?: number;
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' | 'windy';
  snitchCaught: boolean;
  snitchCaughtAt?: number; // minute when snitch was caught
  // Live match state
  currentMinute?: number;
  isLive?: boolean;
}

export interface Season {
  id: string;
  name: string;
  year: number;
  equipos: Team[]; // replaces teams
  partidos: Match[]; // replaces matches
  // Backward compatibility
  teams: Team[];
  matches: Match[];
  // Season metadata
  startDate: Date;
  endDate: Date;
  currentMatchday: number;
  currentRound: number;
  totalMatchdays: number;
  status: 'not_started' | 'active' | 'finished';
  // Additional season data
  config?: ScheduleConfig;
  stats?: LeagueStats;
}

export interface Standing {
  teamId: string;
  team: Team;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
  form: ('W' | 'D' | 'L')[]; // last 5 matches
  snitchesCaught: number;
  averageMatchDuration: number;
}

export interface EventProbability {
  type: EventType;
  baseProb: number; // base probability per minute
  attackModifier: number; // how attack strength affects it
  defenseModifier: number; // how defense strength affects it
  points: number;
  endsMatch?: boolean; // for snitch caught
  description: string;
}

export interface SimulationConfig {
  minDuration: number; // minimum match duration in minutes
  maxDuration: number; // maximum match duration in minutes (if snitch not caught)
  snitchEndGame: boolean; // if catching snitch ends the game
  snitchMinTime: number; // minimum time before snitch can be caught
  eventCheckInterval: number; // seconds between event checks
  weatherEnabled: boolean;
  injuriesEnabled: boolean;
  foulsEnabled: boolean;
}

export interface MatchResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
  events: GameEvent[];
  duration: number;
  winner?: string; // 'home', 'away', or undefined for draw
  snitchCaught: boolean;
  snitchCaughtBy?: string; // team id
  attendance?: number;
  weather?: string;
}

export interface ScheduleConfig {
  seasonStart: Date;
  seasonEnd: Date;
  matchesPerWeek: number;
  daysBetweenRounds: number;
  preferredMatchDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  matchTimes: string[]; // e.g., ['14:00', '16:30', '19:00']
  venues?: string[];
}

export interface LeagueStats {
  totalMatches: number;
  totalGoals: number;
  averageGoalsPerMatch: number;
  averageMatchDuration: number;
  snitchCatchRate: number; // percentage of matches where snitch was caught
  mostCommonEvents: { type: EventType; count: number }[];
  topScorers: { teamId: string; goals: number }[];
}

// Live simulation state for minute-by-minute matches
export interface MatchState {
  matchId: string;
  minuto: number; // current minute
  golesLocal: number; // home team goals
  golesVisitante: number; // away team goals
  eventos: GameEvent[]; // all events so far
  isActive: boolean;
  snitchVisible: boolean;
  snitchCaught: boolean;
  snitchCaughtBy?: string;
  duration: number;
  lastEventTime: number;
  spectators?: number;
  weather?: string;
  backendSaved?: boolean; // Track if already saved to backend
}

// Event configuration for simulation engine
export interface EventConfig {
  tipo: EventType; // event type
  probAtaque: number; // attack probability
  probDefensa: number; // defense probability
  puntos: number; // points awarded
  description: string;
  endsMatch?: boolean;
  minTime?: number; // minimum time for event to occur
}

// Upcoming matches view interface
export interface UpcomingMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: Date;
  time: string;
  venue?: string;
  canBet: boolean;
  odds?: {
    home: number;
    away: number;
    draw?: number;
  };
}
