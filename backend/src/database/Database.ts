import { DatabaseConfig } from '../types';
import { DatabaseConnection } from './DatabaseConnection';
import { DatabaseSchemas } from './DatabaseSchemas';
import { DatabaseSeed } from './DatabaseSeed';
import { MatchesRepository } from './MatchesRepository';
import { SeasonsRepository } from './SeasonsRepository';
import { UsersRepository } from './UsersRepository';
import { BetsRepository } from './BetsRepository';
import { PredictionsRepository } from './PredictionsRepository';
import { AdminRepository } from './AdminRepository';
import { HistoricalRepository } from './HistoricalRepository';
import { TeamsRepository } from './TeamsRepository';
import { 
  BetData, 
  PredictionData, 
  UserData, 
  TransactionData, 
  AdminLogData, 
  MatchEvent, 
  MatchResult,
  DatabaseResult 
} from './interfaces';
import sqlite3 from 'sqlite3';

export class Database {
  private static instance: Database;
  private connection: DatabaseConnection;
  private schemas: DatabaseSchemas;
  private seed: DatabaseSeed;
  private matches: MatchesRepository;
  private seasons: SeasonsRepository;
  private users: UsersRepository;
  private bets: BetsRepository;
  private predictions: PredictionsRepository;
  private admin: AdminRepository;
  private historical: HistoricalRepository;
  private teams: TeamsRepository;

  private constructor() {
    this.connection = DatabaseConnection.getInstance();
    this.schemas = new DatabaseSchemas();
    this.seed = new DatabaseSeed();
    this.matches = new MatchesRepository();
    this.seasons = new SeasonsRepository();
    this.users = new UsersRepository();
    this.bets = new BetsRepository();
    this.predictions = new PredictionsRepository();
    this.admin = new AdminRepository();
    this.historical = new HistoricalRepository();
    this.teams = new TeamsRepository();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public static async initialize(config?: DatabaseConfig): Promise<void> {
    const instance = Database.getInstance();
    await instance.connection.connect(config);
    await instance.schemas.createTables();
    await instance.seed.seedInitialData();
  }

  public static async close(): Promise<void> {
    const instance = Database.getInstance();
    await instance.connection.close();
  }

  public getDatabase(): sqlite3.Database {
    return this.connection.getDatabase();
  }

  // Helper methods for common database operations
  public async get(sql: string, params: unknown[] = []): Promise<unknown> {
    return await this.connection.get(sql, params);
  }

  public async all(sql: string, params: unknown[] = []): Promise<unknown[]> {
    return await this.connection.all(sql, params);
  }

  public async run(sql: string, params: unknown[] = []): Promise<DatabaseResult> {
    return await this.connection.run(sql, params);
  }

  // ============== MATCHES METHODS ==============
  
  public async getAllMatches(): Promise<unknown[]> {
    return await this.matches.getAllMatches();
  }

  public async getMatchById(id: string): Promise<unknown> {
    return await this.matches.getMatchById(id);
  }

  public async getMatchesByStatus(status: string): Promise<unknown[]> {
    return await this.matches.getMatchesByStatus(status);
  }

  public async getUpcomingMatches(limit: number = 10): Promise<unknown[]> {
    return await this.matches.getUpcomingMatches(limit);
  }

  public async getNextUnplayedMatch(currentVirtualTime: string): Promise<unknown> {
    return await this.matches.getNextUnplayedMatch(currentVirtualTime);
  }

  public async getUnplayedMatchesUntil(targetTime: string): Promise<unknown[]> {
    return await this.matches.getUnplayedMatchesUntil(targetTime);
  }

  public async getRelatedMatches(homeTeamId: string, awayTeamId: string, currentVirtualTime: string, limit: number = 5): Promise<unknown[]> {
    return await this.matches.getRelatedMatches(homeTeamId, awayTeamId, currentVirtualTime, limit);
  }

  public async updateMatchStatus(matchId: string, status: string): Promise<void> {
    return await this.matches.updateMatchStatus(matchId, status);
  }

  public async updateMatchScore(matchId: string, homeScore: number, awayScore: number): Promise<void> {
    return await this.matches.updateMatchScore(matchId, homeScore, awayScore);
  }

  public async updateMatchSnitchCaught(matchId: string, snitchCaught: boolean, snitchCaughtBy: string): Promise<void> {
    return await this.matches.updateMatchSnitchCaught(matchId, snitchCaught, snitchCaughtBy);
  }

  public async finishMatch(matchId: string, matchResult: MatchResult): Promise<void> {
    await this.matches.finishMatch(matchId, matchResult);
    
    // Resolve predictions for the match
    const { correct, incorrect } = await this.predictions.resolveMatchPredictions(matchId, matchResult.homeScore, matchResult.awayScore);
    console.log(`🏆 Predictions resolved: ${correct} correct, ${incorrect} incorrect`);
  }

  public async createMatchEvent(event: MatchEvent): Promise<void> {
    return await this.matches.createMatchEvent(event);
  }

  public async getMatchEvents(matchId: string): Promise<unknown[]> {
    return await this.matches.getMatchEvents(matchId);
  }

  public async getMatchLineups(matchId: string): Promise<{
    homeTeam: { team: unknown; lineup: unknown[] };
    awayTeam: { team: unknown; lineup: unknown[] };
  }> {
    return await this.matches.getMatchLineups(matchId);
  }

  // ============== SEASONS METHODS ==============
  
  public async getAllSeasons(): Promise<unknown[]> {
    return await this.seasons.getAllSeasons();
  }

  public async getSeasonById(id: string): Promise<unknown> {
    return await this.seasons.getSeasonById(id);
  }

  public async getCurrentSeason(): Promise<unknown> {
    return await this.seasons.getCurrentSeason();
  }

  public async getSeasonStandings(seasonId: string): Promise<unknown[]> {
    return await this.seasons.getSeasonStandings(seasonId);
  }

  public async getSeasonMatches(seasonId: string): Promise<unknown[]> {
    return await this.seasons.getSeasonMatches(seasonId);
  }

  // ============== TEAMS METHODS ==============
  
  public async getAllTeams(): Promise<unknown[]> {
    return await this.teams.getAllTeams();
  }

  public async getTeamById(teamId: string): Promise<unknown> {
    return await this.teams.getTeamById(teamId);
  }

  public async getTeamPlayers(teamId: string): Promise<unknown[]> {
    return await this.teams.getTeamPlayers(teamId);
  }

  public async getTeamStartingLineup(teamId: string): Promise<unknown[]> {
    return await this.teams.getTeamStartingLineup(teamId);
  }

  public async getPlayersByPosition(teamId: string, position: string): Promise<unknown[]> {
    return await this.teams.getPlayersByPosition(teamId, position);
  }

  public async getTeamStatistics(teamId: string): Promise<unknown> {
    return await this.teams.getTeamStatistics(teamId);
  }

  public async getTeamUpcomingMatches(teamId: string, limit: number = 5): Promise<unknown[]> {
    return await this.teams.getTeamUpcomingMatches(teamId, limit);
  }

  public async getTeamRecentMatches(teamId: string, limit: number = 5): Promise<unknown[]> {
    return await this.teams.getTeamRecentMatches(teamId, limit);
  }

  public async getTeamRivalries(teamId: string): Promise<unknown[]> {
    return await this.teams.getTeamRivalries(teamId);
  }

  public async getTeamHistoricalIdols(teamId: string): Promise<unknown[]> {
    return await this.teams.getTeamHistoricalIdols(teamId);
  }

  // ============== USERS/AUTH METHODS ==============
  
  public async getUserByEmail(email: string): Promise<unknown> {
    return await this.users.getUserByEmail(email);
  }

  public async getUserById(id: string): Promise<unknown> {
    return await this.users.getUserById(id);
  }

  public async createUser(userData: UserData): Promise<DatabaseResult> {
    return await this.users.createUser(userData);
  }

  public async updateUserBalance(userId: string, newBalance: number): Promise<DatabaseResult> {
    return await this.users.updateUserBalance(userId, newBalance);
  }

  public async getAllUsers(): Promise<unknown[]> {
    return await this.users.getAllUsers();
  }

  // ============== BETS METHODS ==============
  
  public async createBet(betData: BetData): Promise<DatabaseResult> {
    return await this.bets.createBet(betData);
  }

  public async getBetsByUser(userId: string): Promise<unknown[]> {
    return await this.bets.getBetsByUser(userId);
  }

  public async getBetsByMatch(matchId: string): Promise<unknown[]> {
    return await this.bets.getBetsByMatch(matchId);
  }

  public async updateBetStatus(betId: string, status: string, resolvedAt?: string): Promise<DatabaseResult> {
    return await this.bets.updateBetStatus(betId, status, resolvedAt);
  }

  public async getAllBets(): Promise<unknown[]> {
    return await this.bets.getAllBets();
  }

  public async getBetStatistics(): Promise<unknown> {
    return await this.bets.getBetStatistics();
  }

  public async getBetStatisticsByDateRange(startDate: string, endDate: string): Promise<unknown[]> {
    return await this.bets.getBetStatisticsByDateRange(startDate, endDate);
  }

  public async getTopUsersByBets(limit: number = 10): Promise<unknown[]> {
    return await this.bets.getTopUsersByBets(limit);
  }

  public async getTopMatchesByBets(limit: number = 10): Promise<unknown[]> {
    return await this.bets.getTopMatchesByBets(limit);
  }

  public async getBetTypeStatistics(): Promise<unknown[]> {
    return await this.bets.getBetTypeStatistics();
  }

  // ============== PREDICTIONS METHODS ==============
  
  public async createPrediction(predictionData: PredictionData): Promise<DatabaseResult> {
    return await this.predictions.createPrediction(predictionData);
  }

  public async getPredictionsByUser(userId: string): Promise<unknown[]> {
    return await this.predictions.getPredictionsByUser(userId);
  }

  public async getPredictionsByMatch(matchId: string): Promise<unknown[]> {
    return await this.predictions.getPredictionsByMatch(matchId);
  }

  public async updatePredictionStatus(predictionId: string, status: string, points: number, resolvedAt?: string): Promise<DatabaseResult> {
    return await this.predictions.updatePredictionStatus(predictionId, status, points, resolvedAt);
  }

  public async getAllPredictions(): Promise<unknown[]> {
    return await this.predictions.getAllPredictions();
  }

  public async getUserPredictionForMatch(userId: string, matchId: string): Promise<unknown> {
    return await this.predictions.getUserPredictionForMatch(userId, matchId);
  }

  public async resolveMatchPredictions(matchId: string, homeScore: number, awayScore: number): Promise<{ resolved: number; correct: number; incorrect: number }> {
    return await this.predictions.resolveMatchPredictions(matchId, homeScore, awayScore);
  }

  // ============== ADMIN/TRANSACTIONS METHODS ==============
  
  public async createTransaction(transactionData: TransactionData): Promise<DatabaseResult> {
    return await this.admin.createTransaction(transactionData);
  }

  public async getUserTransactions(userId: string, limit: number = 50): Promise<unknown[]> {
    return await this.admin.getUserTransactions(userId, limit);
  }

  public async createAdminLog(logData: AdminLogData): Promise<DatabaseResult> {
    return await this.admin.createAdminLog(logData);
  }

  public async getAdminLogs(limit: number = 100): Promise<unknown[]> {
    return await this.admin.getAdminLogs(limit);
  }

  public async resetForNewSeason(): Promise<void> {
    return await this.admin.resetForNewSeason();
  }

  public async resetCompleteDatabase(): Promise<void> {
    return await this.admin.resetCompleteDatabase();
  }

  // ============== HISTORICAL DATA METHODS ==============
  
  public async archiveCompletedSeason(seasonId: string): Promise<void> {
    return await this.historical.archiveCompletedSeason(seasonId);
  }

  public async forceUpdateHistoricalTeamStats(): Promise<void> {
    return await this.historical.forceUpdateHistoricalTeamStats();
  }

  public async repairHistoricalTeamStats(): Promise<void> {
    return await this.historical.repairHistoricalTeamStats();
  }
}
