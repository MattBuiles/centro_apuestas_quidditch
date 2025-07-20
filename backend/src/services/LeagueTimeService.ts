import { VirtualTimeService } from './VirtualTimeService';
import { SeasonManagementService } from './SeasonManagementService';
import { Database } from '../database/Database';
import { Season, Match } from '../types';

export interface LeagueTimeInfo {
  currentDate: Date;
  timeSpeed: 'slow' | 'medium' | 'fast';
  autoMode: boolean;
  activeSeason: Season | null;
  upcomingSeasons: Season[];
  seasonProgress: number;
  daysUntilNextSeason: number;
  nextMatch: Match | null;
  lastUpdate: Date;
}

export class LeagueTimeService {
  private virtualTimeService: VirtualTimeService;
  private seasonService: SeasonManagementService;
  private db = Database.getInstance();

  constructor() {
    this.virtualTimeService = VirtualTimeService.getInstance();
    this.seasonService = new SeasonManagementService();
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await this.virtualTimeService.initialize();
  }

  /**
   * Set the current virtual date
   */
  async setCurrentDate(newDate: Date): Promise<void> {
    await this.virtualTimeService.setCurrentDate(newDate);
  }

  /**
   * Get comprehensive league time information
   */
  async getLeagueTimeInfo(): Promise<LeagueTimeInfo> {
    const virtualTimeState = await this.virtualTimeService.getCurrentState();
    const progression = await this.virtualTimeService.getSeasonProgression();
    const upcomingSeasons = await this.virtualTimeService.getUpcomingSeasons();
    const nextMatch = await this.getNextScheduledMatch();

    return {
      currentDate: virtualTimeState.currentDate,
      timeSpeed: virtualTimeState.timeSpeed,
      autoMode: virtualTimeState.autoMode,
      activeSeason: progression.currentSeason,
      upcomingSeasons,
      seasonProgress: progression.seasonProgress,
      daysUntilNextSeason: progression.daysUntilNextSeason,
      nextMatch,
      lastUpdate: virtualTimeState.lastUpdate
    };
  }

  /**
   * Get the next scheduled match
   */
  private async getNextScheduledMatch(): Promise<Match | null> {
    const currentDate = this.virtualTimeService.getCurrentState();
    
    const matchRow = await this.db.get(`
      SELECT * FROM matches 
      WHERE date > ? AND status = 'scheduled'
      ORDER BY date ASC 
      LIMIT 1
    `, [(await currentDate).currentDate.toISOString()]) as {
      id: string;
      season_id: string;
      home_team_id: string;
      away_team_id: string;
      date: string;
      status: string;
      home_score: number | null;
      away_score: number | null;
      snitch_caught: boolean;
      snitch_caught_by: string | null;
      duration: number | null;
      odds_home_win: number;
      odds_away_win: number;
      odds_draw: number;
      odds_total_over: number;
      odds_total_under: number;
      odds_snitch_home: number;
      odds_snitch_away: number;
    } | undefined;

    if (!matchRow) {
      return null;
    }

    return {
      id: matchRow.id,
      seasonId: matchRow.season_id,
      homeTeamId: matchRow.home_team_id,
      awayTeamId: matchRow.away_team_id,
      date: new Date(matchRow.date),
      status: matchRow.status as Match['status'],
      homeScore: matchRow.home_score || undefined,
      awayScore: matchRow.away_score || undefined,
      snitchCaught: matchRow.snitch_caught,
      snitchCaughtBy: matchRow.snitch_caught_by || undefined,
      duration: matchRow.duration || undefined,
      events: [],
      odds: {
        homeWin: matchRow.odds_home_win || 2.0,
        awayWin: matchRow.odds_away_win || 2.0,
        draw: matchRow.odds_draw || 5.0,
        totalPoints: {
          over150: matchRow.odds_total_over || 1.8,
          under150: matchRow.odds_total_under || 1.8
        },
        snitchCatch: {
          home: matchRow.odds_snitch_home || 1.9,
          away: matchRow.odds_snitch_away || 1.9
        }
      }
    };
  }

  /**
   * Generate automatic seasons based on virtual time progression
   */
  async generateSeasonIfNeeded(): Promise<Season | null> {
    const currentState = await this.virtualTimeService.getCurrentState();
    const activeSeason = await this.virtualTimeService.getActiveSeason();
    
    // If no active season and virtual time is active, generate one
    if (!activeSeason && currentState.autoMode) {
      // Get all teams for the new season
      const teamRows = await this.db.all('SELECT id FROM teams ORDER BY name') as { id: string }[];
      const teamIds = teamRows.map(row => row.id);

      if (teamIds.length >= 4) { // Minimum teams for a season
        const seasonName = `Season ${new Date().getFullYear()}`;
        const duration = 120; // 120 days season

        const newSeason = await this.virtualTimeService.createSeasonFromCurrentTime({
          name: seasonName,
          duration,
          teamIds
        });

        // Activate the new season
        await this.seasonService.activateSeason(newSeason.id);
        
        return newSeason;
      }
    }

    return null;
  }

  /**
   * Process time advancement with league logic
   */
  async advanceLeagueTime(options: {
    days?: number;
    hours?: number;
    untilNextMatch?: boolean;
    simulatePendingMatches?: boolean;
  }): Promise<{
    newDate: Date;
    simulatedMatches: string[];
    newSeason?: Season;
  }> {
    // Advance virtual time
    const result = await this.virtualTimeService.advanceTime(options);
    
    // Check if we need to generate a new season
    const newSeason = await this.generateSeasonIfNeeded();
    
    return {
      newDate: result.newDate,
      simulatedMatches: result.matchesSimulated.map(match => match.matchId),
      newSeason: newSeason || undefined
    };
  }
}
