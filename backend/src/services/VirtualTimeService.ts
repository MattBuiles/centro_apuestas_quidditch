import { Database } from '../database/Database';
import { Match, MatchEvent, MatchResult, Season, TeamRow, MatchRow } from '../types';
import { SeasonManagementService } from './SeasonManagementService';
import { StandingsService } from './StandingsService';
import { v4 as uuidv4 } from 'uuid';

export interface VirtualTimeState {
  currentDate: Date;
  activeSeason: Season | null;
  timeSpeed: 'slow' | 'medium' | 'fast';
  autoMode: boolean;
  lastUpdate: Date;
}

export interface TimeAdvanceOptions {
  days?: number;
  hours?: number;
  untilNextMatch?: boolean;
  simulatePendingMatches?: boolean;
}

export class VirtualTimeService {
  private static instance: VirtualTimeService | null = null;
  private db = Database.getInstance();
  private seasonService = new SeasonManagementService();
  private standingsService = new StandingsService();
  private currentState: VirtualTimeState;
  private readonly STORAGE_KEY = 'virtual_time_state';
  private initialized = false;
  private resetFlag = false; // Flag to track if we just performed a reset

  constructor() {
    this.currentState = this.getDefaultState();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): VirtualTimeService {
    if (!VirtualTimeService.instance) {
      VirtualTimeService.instance = new VirtualTimeService();
    }
    return VirtualTimeService.instance;
  }

  /**
   * Initialize the service and load state from database
   */
  public async initialize(): Promise<void> {
    // Don't re-initialize if already done, unless we need to reload from DB
    if (this.initialized && !this.resetFlag) {
      return;
    }

    try {
      // If we just did a reset, don't load from database
      if (this.resetFlag) {
        console.log('⏭️  Skipping database load after recent reset');
        this.resetFlag = false;
        this.initialized = true;
        return;
      }

      await this.loadStateFromDatabase();
      
      // If no state was loaded, create initial state
      if (!await this.stateExistsInDatabase()) {
        console.log('Creating initial virtual time state...');
        await this.saveState();
      }
      
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to load virtual time state from database, using default:', error);
      this.currentState = this.getDefaultState();
      // Try to save the default state
      try {
        await this.saveState();
      } catch (saveError) {
        console.warn('Failed to save default virtual time state:', saveError);
      }
      this.initialized = true;
    }
  }

  /**
   * Check if virtual time state exists in database
   */
  private async stateExistsInDatabase(): Promise<boolean> {
    try {
      const row = await this.db.get('SELECT id FROM virtual_time_state WHERE id = ?', ['global']);
      return !!row;
    } catch {
      return false;
    }
  }

  private getDefaultState(): VirtualTimeState {
    // Set virtual time to start before the season begins (July 14th, 2025)
    // Always use 2025 for the game world, regardless of real current year
    const defaultStartDate = new Date('2025-07-14T00:00:00Z');
    
    return {
      currentDate: defaultStartDate,
      activeSeason: null,
      timeSpeed: 'medium',
      autoMode: false,
      lastUpdate: new Date()
    };
  }

  private async loadStateFromDatabase(): Promise<void> {
    try {
      const row = await this.db.get('SELECT * FROM virtual_time_state WHERE id = ?', ['global']) as {
        current_date: string;
        active_season_id?: string;
        time_speed: string;
        auto_mode: number;
        last_update: string;
      } | undefined;
      
      if (row) {
        console.log('Loading virtual time state from database:', row);
        this.currentState = {
          currentDate: new Date(row.current_date),
          activeSeason: null, // Will be loaded when needed
          timeSpeed: row.time_speed as 'slow' | 'medium' | 'fast' || 'medium',
          autoMode: Boolean(row.auto_mode),
          lastUpdate: new Date(row.last_update)
        };
      } else {
        console.log('No virtual time state found in database, using default');
        this.currentState = this.getDefaultState();
      }
    } catch (error) {
      // If table doesn't exist, that's ok - we'll use default state
      console.log('Virtual time state table not found or error loading, using default state:', error);
      this.currentState = this.getDefaultState();
    }
  }

  private loadState(): VirtualTimeState {
    // This method is no longer used directly, kept for backwards compatibility
    return this.getDefaultState();
  }

  private async saveState(): Promise<void> {
    try {
      console.log('💾 Saving virtual time state to database:', {
        currentDate: this.currentState.currentDate.toISOString(),
        timeSpeed: this.currentState.timeSpeed,
        autoMode: this.currentState.autoMode
      });
      
      // Save state to database
      await this.db.run(`
        INSERT OR REPLACE INTO virtual_time_state (id, current_date, active_season_id, time_speed, auto_mode, last_update)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'global',
        this.currentState.currentDate.toISOString(),
        this.currentState.activeSeason?.id || null,
        this.currentState.timeSpeed,
        this.currentState.autoMode ? 1 : 0,
        this.currentState.lastUpdate.toISOString()
      ]);
      
      console.log('✅ Virtual time state saved successfully');
    } catch (error) {
      console.error('❌ Failed to save virtual time state:', error);
      throw error;
    }
  }

  async getCurrentState(): Promise<VirtualTimeState> {
    return { ...this.currentState };
  }

  async setCurrentDate(newDate: Date): Promise<void> {
    this.currentState.currentDate = newDate;
    this.currentState.lastUpdate = new Date();
    await this.saveState();
  }

  async advanceTime(options: TimeAdvanceOptions): Promise<{
    newDate: Date;
    matchesSimulated: MatchResult[];
    seasonUpdated: boolean;
  }> {
    const { days = 0, hours = 0, untilNextMatch = false, simulatePendingMatches = true } = options;

    let newDate = new Date(this.currentState.currentDate);
    
    if (untilNextMatch && this.currentState.activeSeason) {
      // Find next scheduled match
      const nextMatch = await this.getNextScheduledMatch();
      if (nextMatch) {
        newDate = new Date(nextMatch.date);
      } else {
        // Advance by 1 day if no matches
        newDate.setDate(newDate.getDate() + 1);
      }
    } else {
      newDate.setDate(newDate.getDate() + days);
      newDate.setHours(newDate.getHours() + hours);
    }

    const matchesSimulated: MatchResult[] = [];
    let seasonUpdated = false;

    // First, complete all matches that are currently live
    if (this.currentState.activeSeason) {
      const liveMatches = await this.getLiveMatches();
      for (const match of liveMatches) {
        console.log(`🔴 Completing live match: ${match.id}`);
        const result = await this.simulateMatch(match.id);
        matchesSimulated.push(result);
      }
    }

    // Then simulate matches that should have happened
    if (simulatePendingMatches && this.currentState.activeSeason) {
      const pendingMatches = await this.getPendingMatchesUntil(newDate);
      for (const match of pendingMatches) {
        const result = await this.simulateMatch(match.id);
        matchesSimulated.push(result);
      }
      seasonUpdated = matchesSimulated.length > 0;
    }

    // Update current time
    this.currentState.currentDate = newDate;
    this.currentState.lastUpdate = new Date();
    
    await this.saveState();

    // After all matches are simulated, ensure all combined bets are resolved
    if (matchesSimulated.length > 0) {
      try {
        const { BetResolutionService } = await import('./BetResolutionService');
        const betResolutionService = BetResolutionService.getInstance();
        const combinedBetsResult = await betResolutionService.resolveAllPendingCombinedBets();
        if (combinedBetsResult.resolved > 0) {
          console.log(`🎊 Additional combined bets resolved after time advance: ${combinedBetsResult.resolved}`);
        }
      } catch (error) {
        console.error('❌ Error resolving combined bets after time advance:', error);
        // Don't throw - time advance should succeed even if bet resolution fails
      }
    }

    return {
      newDate,
      matchesSimulated,
      seasonUpdated
    };
  }

  private async getNextScheduledMatch(): Promise<Match | null> {
    const match = await this.db.get(`
      SELECT * FROM matches 
      WHERE status = 'scheduled' 
      ORDER BY date ASC 
      LIMIT 1
    `) as MatchRow | undefined;

    return match ? this.mapRowToMatch(match) : null;
  }

  private async getPendingMatchesUntil(endDate: Date): Promise<Match[]> {
    const matches = await this.db.all(`
      SELECT * FROM matches 
      WHERE status = 'scheduled' 
      AND date <= ?
      ORDER BY date ASC
    `, [endDate.toISOString()]) as MatchRow[];

    return matches.map(match => this.mapRowToMatch(match));
  }

  private async simulateMatch(matchId: string): Promise<MatchResult> {
    const match = await this.db.get('SELECT * FROM matches WHERE id = ?', [matchId]) as MatchRow;
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    const homeTeam = await this.db.get('SELECT * FROM teams WHERE id = ?', [match.home_team_id]) as TeamRow;
    const awayTeam = await this.db.get('SELECT * FROM teams WHERE id = ?', [match.away_team_id]) as TeamRow;

    if (!homeTeam || !awayTeam) {
      throw new Error('Teams not found for match');
    }

    // Generate match result using simulation logic
    const result = this.generateMatchResult(homeTeam, awayTeam, matchId);

    // Use the centralized finishMatch method that handles everything consistently
    const matchResult = {
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      duration: result.duration,
      snitchCaught: result.snitchCaught,
      snitchCaughtBy: result.snitchCaughtBy || '',
      events: result.events,
      finishedAt: new Date().toISOString()
    };

    // This will handle all match completion logic consistently
    await this.db.finishMatch(matchId, matchResult);

    // Actualizar standings en la base de datos
    await this.standingsService.updateStandingsAfterMatch(matchId);

    // Verificar si la temporada debe finalizarse después de simular el partido
    const seasonResult = await this.seasonService.checkAndFinishSeasonIfComplete();
    if (seasonResult.seasonFinished) {
      console.log(`🏆 ¡Temporada finalizada automáticamente después de simular partido! ID: ${seasonResult.seasonId}`);
    }

    return result;
  }

  private generateMatchResult(homeTeam: TeamRow, awayTeam: TeamRow, matchId: string): MatchResult {
    // Basic match simulation - this could be made more sophisticated
    const homeAdvantage = 5; // Home team gets slight advantage
    const homeStrength = (homeTeam.attack_strength || 75) + homeAdvantage;
    const awayStrength = awayTeam.attack_strength || 75;

    // Use strengths to influence scoring (for future enhancements)
    const strengthDifference = homeStrength - awayStrength;
    
    // Generate match events FIRST - these will determine the final score
    const events: MatchEvent[] = [];
    const duration = Math.floor(Math.random() * 60) + 30; // 30-90 minutes

    // Generate Quaffle goals based on team strength
    const baseGoalCount = Math.floor(Math.random() * 10) + 8; // 8-17 goals total
    const homeGoalAdvantage = Math.max(0, strengthDifference / 10); // Slight advantage
    
    const homeGoalChance = 0.5 + (homeGoalAdvantage / 100); // Slight home advantage

    // Generate goal events
    for (let i = 0; i < baseGoalCount; i++) {
      const minute = Math.floor(Math.random() * duration);
      const randomValue = Math.random();
      const isHomeGoal = randomValue < homeGoalChance;
      
      events.push({
        id: uuidv4(),
        matchId,
        minute,
        type: 'goal',
        team: isHomeGoal ? homeTeam.id : awayTeam.id,
        player: `Chaser ${Math.floor(Math.random() * 3) + 1}`,
        description: 'Quaffle goal scored - 10 points!',
        points: 10
      });
    }

    // Generate some foul events (no points)
    const foulCount = Math.floor(Math.random() * 4) + 2; // 2-5 fouls
    for (let i = 0; i < foulCount; i++) {
      events.push({
        id: uuidv4(),
        matchId,
        minute: Math.floor(Math.random() * duration),
        type: 'foul',
        team: Math.random() < 0.5 ? homeTeam.id : awayTeam.id,
        player: `Player ${Math.floor(Math.random() * 7) + 1}`,
        description: 'Foul committed - rule violation',
        points: 0
      });
    }

    // Determine snitch catch (150 points)
    const snitchCatchChance = 0.85; // 85% chance someone catches it
    const snitchCaught = Math.random() < snitchCatchChance;
    let snitchCaughtBy = null;

    if (snitchCaught) {
      // Higher seeker skill = higher chance to catch
      const homeSeekerSkill = homeTeam.seeker_skill || 75;
      const awaySeekerSkill = awayTeam.seeker_skill || 75;
      const totalSkill = homeSeekerSkill + awaySeekerSkill;
      const homeChance = homeSeekerSkill / totalSkill;
      
      snitchCaughtBy = Math.random() < homeChance ? homeTeam.id : awayTeam.id;
      
      // Add snitch catch event
      events.push({
        id: uuidv4(),
        matchId,
        minute: duration - Math.floor(Math.random() * 10) - 1, // Near end of match
        type: 'snitch',
        team: snitchCaughtBy,
        player: 'Seeker',
        description: 'Golden Snitch caught! +150 points!',
        points: 150
      });
    }

    // Sort events by minute
    events.sort((a, b) => a.minute - b.minute);

    // 🎯 CALCULATE FINAL SCORES FROM EVENTS - This is the key fix!
    const { homeScore, awayScore } = this.calculateScoreFromEvents(events, homeTeam.id, awayTeam.id);

    console.log(`🎯 Match ${matchId} simulated: ${homeTeam.name || 'Home'} ${homeScore} - ${awayScore} ${awayTeam.name || 'Away'}`);
    console.log(`   Events generated: ${events.length} (${events.filter(e => e.type === 'goal').length} goals, ${events.filter(e => e.type === 'snitch').length} snitch, ${events.filter(e => e.type === 'foul').length} fouls)`);

    const weatherTypes = ['sunny', 'cloudy', 'rainy', 'stormy', 'foggy', 'windy'] as const;
    const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];

    return {
      matchId,
      homeScore,
      awayScore,
      duration,
      snitchCaught,
      snitchCaughtBy: snitchCaughtBy || undefined,
      events,
      weather: randomWeather,
      attendance: Math.floor(Math.random() * 50000) + 10000
    };
  }

  /**
   * Calculate final scores from the events generated during simulation
   * This ensures the final score always matches the events
   */
  private calculateScoreFromEvents(events: MatchEvent[], homeTeamId: string, awayTeamId: string): {
    homeScore: number;
    awayScore: number;
  } {
    let homeScore = 0;
    let awayScore = 0;

    for (const event of events) {
      if (event.points > 0) {
        if (event.team === homeTeamId) {
          homeScore += event.points;
        } else if (event.team === awayTeamId) {
          awayScore += event.points;
        }
      }
    }

    return { homeScore, awayScore };
  }

  private mapRowToMatch(row: MatchRow): Match {
    return {
      id: row.id,
      seasonId: row.season_id,
      homeTeamId: row.home_team_id,
      awayTeamId: row.away_team_id,
      date: new Date(row.date),
      status: row.status as Match['status'],
      homeScore: row.home_score,
      awayScore: row.away_score,
      snitchCaught: row.snitch_caught,
      snitchCaughtBy: row.snitch_caught_by,
      duration: row.duration,
      events: [], // Events would be loaded separately
      odds: {
        homeWin: row.odds_home_win || 2.0,
        awayWin: row.odds_away_win || 2.0,
        draw: row.odds_draw || 5.0,
        totalPoints: {
          over150: row.odds_total_over || 1.8,
          under150: row.odds_total_under || 1.8
        },
        snitchCatch: {
          home: row.odds_snitch_home || 1.9,
          away: row.odds_snitch_away || 1.9
        }
      }
    };
  }

  async setActiveSeason(seasonId: string): Promise<void> {
    const seasonRow = await this.db.get('SELECT * FROM seasons WHERE id = ?', [seasonId]) as {
      id: string;
      name: string;
      start_date: string;
      end_date: string;
      status: string;
    } | undefined;
    
    if (!seasonRow) {
      throw new Error(`Season ${seasonId} not found`);
    }

    // For now, we'll set a simplified season object
    // In a full implementation, this would load teams, matches, etc.
    this.currentState.activeSeason = {
      id: seasonRow.id,
      name: seasonRow.name,
      startDate: new Date(seasonRow.start_date),
      endDate: new Date(seasonRow.end_date),
      status: seasonRow.status as Season['status'],
      teams: [],
      matches: [],
      standings: []
    };
    
    // Important: Don't change the current date when setting active season
    // This allows the reset process to maintain the correct initial date
    console.log(`✅ Active season set to: ${seasonRow.name} (keeping current virtual date: ${this.currentState.currentDate.toISOString()})`);
    
    await this.saveState();
  }

  /**
   * Update virtual time settings
   */
  async updateSettings(settings: { timeSpeed?: 'slow' | 'medium' | 'fast'; autoMode?: boolean }): Promise<VirtualTimeState> {
    if (settings.timeSpeed) {
      this.currentState.timeSpeed = settings.timeSpeed;
    }
    
    if (settings.autoMode !== undefined) {
      this.currentState.autoMode = settings.autoMode;
    }
    
    this.currentState.lastUpdate = new Date();
    await this.saveState();
    
    return this.getCurrentState();
  }

  /**
   * Get the active season
   */
  async getActiveSeason(): Promise<Season | null> {
    // First, always check the database for the current active season
    const seasonRow = await this.db.get(`
      SELECT * FROM seasons 
      WHERE status = 'active' 
      ORDER BY start_date DESC 
      LIMIT 1
    `) as {
      id: string;
      name: string;
      start_date: string;
      end_date: string;
      status: string;
    } | undefined;

    if (seasonRow) {
      // We have an active season in the database
      const season: Season = {
        id: seasonRow.id,
        name: seasonRow.name,
        startDate: new Date(seasonRow.start_date),
        endDate: new Date(seasonRow.end_date),
        status: seasonRow.status as Season['status'],
        teams: [],
        matches: [],
        standings: []
      };
      
      // Update our state to match the database
      this.currentState.activeSeason = season;
      await this.saveState();
      return season;
    } else {
      // No active season in database, clear our state
      if (this.currentState.activeSeason) {
        console.log(`🔄 Clearing inactive season from virtual time state: ${this.currentState.activeSeason.name}`);
        this.currentState.activeSeason = null;
        await this.saveState();
      }
      return null;
    }
  }

  /**
   * Create a new season starting from current virtual time
   */
  async createSeasonFromCurrentTime(options: { 
    name: string; 
    duration: number; // duration in days
    teamIds: string[];
  }): Promise<Season> {
    const startDate = new Date(this.currentState.currentDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + options.duration);

    // Create season using SeasonManagementService
    const { SeasonManagementService } = await import('./SeasonManagementService');
    const seasonService = new SeasonManagementService();
    
    const season = await seasonService.createSeason({
      name: options.name,
      startDate,
      endDate,
      teamIds: options.teamIds
    });

    // Set as active season
    this.currentState.activeSeason = season;
    await this.saveState();

    return season;
  }

  /**
   * Get upcoming season information based on current virtual time
   */
  async getUpcomingSeasons(): Promise<Season[]> {
    const currentDate = this.currentState.currentDate;
    
    const seasonRows = await this.db.all(`
      SELECT * FROM seasons 
      WHERE start_date > ? 
      ORDER BY start_date ASC 
      LIMIT 5
    `, [currentDate.toISOString()]) as {
      id: string;
      name: string;
      start_date: string;
      end_date: string;
      status: string;
    }[];

    const seasons: Season[] = [];
    for (const row of seasonRows) {
      const season = await this.loadSeasonFromRow(row);
      seasons.push(season);
    }

    return seasons;
  }

  /**
   * Get season progression information
   */
  async getSeasonProgression(): Promise<{
    currentSeason: Season | null;
    nextSeason: Season | null;
    daysUntilNextSeason: number;
    seasonProgress: number;
  }> {
    const currentSeason = await this.getActiveSeason();
    const upcomingSeasons = await this.getUpcomingSeasons();
    const nextSeason = upcomingSeasons.length > 0 ? upcomingSeasons[0] : null;
    
    let daysUntilNextSeason = 0;
    let seasonProgress = 0;

    if (nextSeason) {
      const timeDiff = nextSeason.startDate.getTime() - this.currentState.currentDate.getTime();
      daysUntilNextSeason = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    }

    if (currentSeason) {
      const seasonDuration = currentSeason.endDate.getTime() - currentSeason.startDate.getTime();
      const elapsed = this.currentState.currentDate.getTime() - currentSeason.startDate.getTime();
      seasonProgress = Math.min(100, Math.max(0, (elapsed / seasonDuration) * 100));
    }

    return {
      currentSeason,
      nextSeason,
      daysUntilNextSeason,
      seasonProgress
    };
  }

  private async loadSeasonFromRow(row: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
  }): Promise<Season> {
    return {
      id: row.id,
      name: row.name,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      status: row.status as Season['status'],
      teams: [], // Simplified for performance
      matches: [], // Simplified for performance
      standings: [] // Simplified for performance
    };
  }

  /**
   * Force save current state to database
   * Used when external services modify the virtual time
   */
  async forceSaveState(): Promise<void> {
    this.currentState.lastUpdate = new Date();
    await this.saveState();
  }

  /**
   * Set virtual time to a specific date
   */
  async setVirtualTime(date: Date): Promise<void> {
    console.log('🕒 Setting virtual time to:', date.toISOString());
    this.currentState.currentDate = date;
    this.currentState.lastUpdate = new Date();
    await this.saveState();
  }

  /**
   * Reset virtual time to current real time
   */
  async resetToRealTime(): Promise<void> {
    console.log('🔄 Resetting virtual time to real time');
    this.currentState.currentDate = new Date();
    this.currentState.lastUpdate = new Date();
    await this.saveState();
  }

  /**
   * Reset virtual time to initial state (used during database reset)
   * Sets the time to before the season starts to allow proper preparation
   */
  public async resetToInitialState(): Promise<void> {
    console.log('🔄 Resetting virtual time to initial state...');
    
    // First, clear any existing virtual time state from database
    await this.db.run('DELETE FROM virtual_time_state WHERE id = ?', ['global']);
    console.log('🧹 Cleared existing virtual time state from database');
    
    // Reset to default state (July 14th, 2025, before season starts)
    const newState = this.getDefaultState();
    console.log(`📅 Setting virtual time to: ${newState.currentDate.toISOString()}`);
    
    this.currentState = newState;
    
    // Save the reset state to database
    await this.saveState();
    
    // Set the reset flag to prevent loading from database on next initialize
    this.resetFlag = true;
    this.initialized = false; // Force re-initialization with the reset flag
    
    console.log(`✅ Virtual time reset completed to: ${this.currentState.currentDate.toISOString()}`);
  }

  private async getLiveMatches(): Promise<Match[]> {
    const matches = await this.db.all(`
      SELECT * FROM matches 
      WHERE status = 'live'
      ORDER BY date ASC
    `) as MatchRow[];

    return matches.map(match => this.mapRowToMatch(match));
  }
}

