import { Request, Response } from 'express';
import { LeagueTimeService } from '../services/LeagueTimeService';

export class LeagueTimeController {
  private leagueTimeService: LeagueTimeService;

  constructor() {
    this.leagueTimeService = new LeagueTimeService();
    // Initialize the service
    this.leagueTimeService.initialize().catch(error => {
      console.error('Failed to initialize LeagueTimeService:', error);
    });
  }

  // GET /api/league-time - Get comprehensive league time information
  public getLeagueTimeInfo = async (req: Request, res: Response): Promise<void> => {
    try {
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
      const { days, hours, untilNextMatch, simulatePendingMatches } = req.body;
      
      const result = await this.leagueTimeService.advanceLeagueTime({
        days,
        hours,
        untilNextMatch,
        simulatePendingMatches
      });
      
      res.json({
        success: true,
        data: result,
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
}
