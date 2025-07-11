import { Request, Response } from 'express';
import { LeagueTimeService } from '../services/LeagueTimeService';
import { Database } from '../database/Database';

export class LeagueTimeController {
  private leagueTimeService: LeagueTimeService;
  private isInitialized = false;

  constructor() {
    this.leagueTimeService = new LeagueTimeService();
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      try {
        await this.leagueTimeService.initialize();
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize LeagueTimeService:', error);
        throw error;
      }
    }
  }

  // GET /api/league-time - Get comprehensive league time information
  public getLeagueTimeInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.ensureInitialized();
      const leagueTimeInfo = await this.leagueTimeService.getLeagueTimeInfo();
      
      res.json({
        success: true,
        data: leagueTimeInfo,
        message: 'League time information retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting league time info:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve league time information',
        timestamp: new Date().toISOString()
      });
    }
  };

  // POST /api/league-time/advance - Advance league time with automatic management
  public advanceLeagueTime = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.ensureInitialized();
      const { days, hours, toNextMatch, simulateMatches } = req.body;
      
      const result = await this.leagueTimeService.advanceLeagueTime({
        days,
        hours,
        untilNextMatch: toNextMatch,
        simulatePendingMatches: simulateMatches
      });
      
      res.json({
        success: true,
        data: {
          success: true,
          newDate: result.newDate.toISOString(),
          simulatedMatches: result.simulatedMatches,
          message: `Time advanced successfully. ${result.simulatedMatches.length} matches simulated.`,
          seasonChanged: !!result.newSeason,
          newSeason: result.newSeason
        },
        message: 'League time advanced successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error advancing league time:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to advance league time',
        timestamp: new Date().toISOString()
      });
    }
  };

  // POST /api/league-time/advance-to-next-match - Advance to next unplayed match and set it as live
  public advanceToNextMatch = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.ensureInitialized();
      
      // Get next scheduled match
      const db = Database.getInstance();
      const virtualTimeService = new (await import('../services/VirtualTimeService')).VirtualTimeService();
      await virtualTimeService.initialize();
      const currentState = await virtualTimeService.getCurrentState();
      
      // Check if there's already a live match
      const liveMatches = await db.all(`
        SELECT * FROM matches 
        WHERE status = 'live'
      `);
      
      if (liveMatches && liveMatches.length > 0) {
        res.json({
          success: false,
          message: 'Ya hay un partido en vivo. Simúlalo antes de avanzar al siguiente.',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      let nextMatch = await db.getNextUnplayedMatch(currentState.currentDate.toISOString()) as {
        id: string;
        date: string;
        [key: string]: unknown;
      } | null;
      
      if (!nextMatch) {
        // No matches found relative to current time, try to find the next scheduled match regardless of time
        console.log('No unplayed matches found relative to current time, searching for any scheduled matches...');
        const nextScheduledMatch = await db.get(`
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
          WHERE m.status = 'scheduled' 
            AND (m.home_score IS NULL OR m.away_score IS NULL)
          ORDER BY m.date ASC
          LIMIT 1
        `) as {
          id: string;
          date: string;
          [key: string]: unknown;
        } | null;
        
        if (nextScheduledMatch) {
          console.log('Found scheduled match:', nextScheduledMatch);
          nextMatch = nextScheduledMatch;
        } else {
          // No matches found at all, try to generate a new season
          console.log('No scheduled matches found, attempting to generate a new season...');
          try {
            const newSeason = await this.leagueTimeService.generateSeasonIfNeeded();
            
            if (newSeason) {
              // Try to find the next match again after generating the season
              const nextMatchAfterGeneration = await db.get(`
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
                WHERE m.status = 'scheduled' 
                  AND (m.home_score IS NULL OR m.away_score IS NULL)
                ORDER BY m.date ASC
                LIMIT 1
              `) as {
                id: string;
                date: string;
                [key: string]: unknown;
              } | null;
              
              if (nextMatchAfterGeneration) {
                nextMatch = nextMatchAfterGeneration;
              }
            }
          } catch (seasonError) {
            console.error('Error generating new season:', seasonError);
          }
          
          if (!nextMatch) {
            res.json({
              success: false,
              message: 'No se encontraron partidos pendientes y no se pudo generar una nueva temporada',
              timestamp: new Date().toISOString()
            });
            return;
          }
        }
      }
      
      // Advance time to that match date
      const matchDate = new Date(nextMatch.date);
      await this.leagueTimeService.setCurrentDate(matchDate);
      
      // Mark the match as live
      await db.run(`UPDATE matches SET status = 'live' WHERE id = ?`, [nextMatch.id]);
      
      res.json({
        success: true,
        data: {
          success: true,
          newDate: matchDate.toISOString(),
          simulatedMatches: [],
          message: `Avanzado al próximo partido en ${matchDate.toLocaleDateString('es-ES')}`
        },
        message: 'Successfully advanced to next match',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error advancing to next match:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to advance to next match',
        timestamp: new Date().toISOString()
      });
    }
  };

  // POST /api/league-time/generate-season - Generate a new season automatically
  public generateSeason = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.ensureInitialized();
      const newSeason = await this.leagueTimeService.generateSeasonIfNeeded();
      
      if (newSeason) {
        res.json({
          success: true,
          data: newSeason,
          message: 'New season generated successfully',
          timestamp: new Date().toISOString()
        });
      } else {
        res.json({
          success: true,
          data: null,
          message: 'No new season needed at this time',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error generating season:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to generate new season',
        timestamp: new Date().toISOString()
      });
    }
  };

  // POST /api/league-time/reset-database - Reset database for new season
  public resetDatabase = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.ensureInitialized();
      const { complete = false } = req.body;
      
      const db = Database.getInstance();
      
      if (complete) {
        await db.resetCompleteDatabase();
      } else {
        await db.resetForNewSeason();
      }
      
      // After reset, initialize a new season
      const newSeason = await this.leagueTimeService.generateSeasonIfNeeded();
      
      res.json({
        success: true,
        data: {
          resetType: complete ? 'complete' : 'season',
          newSeason: newSeason
        },
        message: `Database reset ${complete ? 'completely' : 'for new season'} successfully`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error resetting database:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to reset database',
        timestamp: new Date().toISOString()
      });
    }
  };
}
