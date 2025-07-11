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
      const { days, hours, toNextMatch, simulateMatches, targetTime } = req.body;
      
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
