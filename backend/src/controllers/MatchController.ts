import { Request, Response } from 'express';
import { Database } from '../database/Database';
import { VirtualTimeService } from '../services/VirtualTimeService';
import { SeasonManagementService } from '../services/SeasonManagementService';
import { Match, MatchEvent, MatchResult, ApiResponse, MatchRow, Season } from '../types';

export class MatchController {
  private db = Database.getInstance();
  private virtualTimeService = new VirtualTimeService();
  private seasonService = new SeasonManagementService();

  // GET /api/matches - Get all matches
  public getAllMatches = async (req: Request, res: Response<ApiResponse<Match[]>>) => {
    try {
      const { status, seasonId, limit = 50 } = req.query;
      
      let query = 'SELECT * FROM matches';
      const params: (string | number)[] = [];
      const conditions: string[] = [];

      if (status) {
        conditions.push('status = ?');
        params.push(status as string);
      }

      if (seasonId) {
        conditions.push('season_id = ?');
        params.push(seasonId as string);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY date ASC LIMIT ?';
      params.push(parseInt(limit as string));

      const matches = await this.db.all(query, params) as MatchRow[];
      
      // Transform database rows to Match objects
      const matchesWithDetails = await Promise.all(
        matches.map(async (match: MatchRow) => {
          const events = await this.getMatchEvents(match.id);
          return this.mapRowToMatch(match, events);
        })
      );

      res.json({
        success: true,
        data: matchesWithDetails,
        message: 'Matches retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching matches:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve matches',
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/matches/:id - Get specific match
  public getMatchById = async (req: Request, res: Response<ApiResponse<Match>>): Promise<void> => {
    try {
      const { id } = req.params;
      
      const match = await this.db.get('SELECT * FROM matches WHERE id = ?', [id]) as MatchRow | undefined;
      
      if (!match) {
        res.status(404).json({
          success: false,
          error: 'Match not found',
          message: `Match with ID ${id} does not exist`,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const events = await this.getMatchEvents(id);
      const matchWithDetails = this.mapRowToMatch(match, events);

      res.json({
        success: true,
        data: matchWithDetails,
        message: 'Match retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching match:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve match',
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/matches/live - Get live matches
  public getLiveMatches = async (req: Request, res: Response<ApiResponse<Match[]>>) => {
    try {
      const matches = await this.db.all(`
        SELECT * FROM matches 
        WHERE status = 'live' 
        ORDER BY date ASC
      `) as MatchRow[];
      
      const liveMatches = await Promise.all(
        matches.map(async (match: MatchRow) => {
          const events = await this.getMatchEvents(match.id);
          return this.mapRowToMatch(match, events);
        })
      );

      res.json({
        success: true,
        data: liveMatches,
        message: 'Live matches retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching live matches:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve live matches',
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/matches/upcoming - Get upcoming matches
  public getUpcomingMatches = async (req: Request, res: Response<ApiResponse<Match[]>>) => {
    try {
      const { limit = 10 } = req.query;
      
      const matches = await this.db.all(`
        SELECT * FROM matches 
        WHERE status = 'scheduled' 
        ORDER BY date ASC 
        LIMIT ?
      `, [parseInt(limit as string)]) as MatchRow[];
      
      const upcomingMatches = await Promise.all(
        matches.map(async (match: MatchRow) => {
          const events = await this.getMatchEvents(match.id);
          return this.mapRowToMatch(match, events);
        })
      );

      res.json({
        success: true,
        data: upcomingMatches,
        message: 'Upcoming matches retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching upcoming matches:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve upcoming matches',
        timestamp: new Date().toISOString()
      });
    }
  };

  // POST /api/matches/:id/simulate - Simulate a specific match
  public simulateMatch = async (req: Request, res: Response<ApiResponse<MatchResult>>): Promise<void> => {
    try {
      const { id } = req.params;
      
      const match = await this.db.get('SELECT * FROM matches WHERE id = ?', [id]) as MatchRow | undefined;
      
      if (!match) {
        res.status(404).json({
          success: false,
          error: 'Match not found',
          message: `Match with ID ${id} does not exist`,
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (match.status !== 'scheduled') {
        res.status(400).json({
          success: false,
          error: 'Match cannot be simulated',
          message: `Match is ${match.status}, can only simulate scheduled matches`,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Use virtual time service to simulate the match
      const result = await this.virtualTimeService['simulateMatch'](id);

      res.json({
        success: true,
        data: result,
        message: 'Match simulated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error simulating match:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to simulate match',
        timestamp: new Date().toISOString()
      });
    }
  };

  // POST /api/matches/advance-time - Advance virtual time
  public advanceTime = async (req: Request, res: Response<ApiResponse<{
    newDate: Date;
    matchesSimulated: MatchResult[];
    seasonUpdated: boolean;
  }>>) => {
    try {
      const { days, hours, untilNextMatch, simulatePendingMatches } = req.body;
      
      const result = await this.virtualTimeService.advanceTime({
        days,
        hours,
        untilNextMatch,
        simulatePendingMatches
      });

      res.json({
        success: true,
        data: result,
        message: `Time advanced successfully. ${result.matchesSimulated.length} matches simulated.`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error advancing time:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to advance time',
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/matches/virtual-time - Get current virtual time state
  public getVirtualTimeState = async (req: Request, res: Response<ApiResponse<{
    currentDate: Date;
    activeSeason: Season | null;
    timeSpeed: string;
    autoMode: boolean;
    lastUpdate: Date;
  }>>) => {
    try {
      const state = await this.virtualTimeService.getCurrentState();
      
      res.json({
        success: true,
        data: state,
        message: 'Virtual time state retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting virtual time state:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve virtual time state',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Helper method to get match events
  private async getMatchEvents(matchId: string): Promise<MatchEvent[]> {
    const events = await this.db.all(`
      SELECT * FROM match_events 
      WHERE match_id = ? 
      ORDER BY minute ASC
    `, [matchId]) as Array<{
      id: string;
      match_id: string;
      minute: number;
      type: string;
      team: string;
      player: string;
      description: string;
      points: number;
    }>;
    
    return events.map((event) => ({
      id: event.id,
      matchId: event.match_id,
      minute: event.minute,
      type: event.type as MatchEvent['type'],
      team: event.team,
      player: event.player,
      description: event.description,
      points: event.points
    }));
  }

  // Helper method to map database row to Match object
  private mapRowToMatch(row: MatchRow, events: MatchEvent[]): Match {
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
      events,
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
}
