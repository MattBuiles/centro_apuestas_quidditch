import { Request, Response } from 'express';
import { VirtualTimeService } from '../services/VirtualTimeService';

export class VirtualTimeController {
  private virtualTimeService: VirtualTimeService;

  constructor() {
    this.virtualTimeService = new VirtualTimeService();
  }

  // GET /api/virtual-time/current - Get current virtual time state
  public getCurrentTime = async (req: Request, res: Response): Promise<void> => {
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

  // POST /api/virtual-time/advance - Advance virtual time
  public advanceTime = async (req: Request, res: Response): Promise<void> => {
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
        message: 'Virtual time advanced successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error advancing virtual time:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to advance virtual time',
        timestamp: new Date().toISOString()
      });
    }
  };

  // PUT /api/virtual-time/settings - Update virtual time settings
  public updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const { timeSpeed, autoMode } = req.body;
      
      const result = await this.virtualTimeService.updateSettings({
        timeSpeed,
        autoMode
      });
      
      res.json({
        success: true,
        data: result,
        message: 'Virtual time settings updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating virtual time settings:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update virtual time settings',
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/virtual-time/active-season - Get active season with virtual time context
  public getActiveSeason = async (req: Request, res: Response): Promise<void> => {
    try {
      const activeSeason = await this.virtualTimeService.getActiveSeason();
      
      res.json({
        success: true,
        data: activeSeason,
        message: 'Active season retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting active season:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve active season',
        timestamp: new Date().toISOString()
      });
    }
  };

  // POST /api/virtual-time/create-season - Create new season with virtual time integration
  public createSeasonWithTime = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, duration, teamIds } = req.body;
      
      const season = await this.virtualTimeService.createSeasonFromCurrentTime({
        name,
        duration,
        teamIds
      });
      
      res.json({
        success: true,
        data: season,
        message: 'Season created successfully with virtual time integration',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating season with virtual time:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create season with virtual time integration',
        timestamp: new Date().toISOString()
      });
    }
  };

  // POST /api/virtual-time/reset - Reset virtual time to real time (requires authentication)
  public resetTime = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.virtualTimeService.resetToRealTime();
      const state = await this.virtualTimeService.getCurrentState();
      
      res.json({
        success: true,
        data: state,
        message: 'Virtual time reset to real time successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error resetting virtual time:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to reset virtual time',
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/virtual-time/upcoming-seasons - Get upcoming seasons
  public getUpcomingSeasons = async (req: Request, res: Response): Promise<void> => {
    try {
      const upcomingSeasons = await this.virtualTimeService.getUpcomingSeasons();
      
      res.json({
        success: true,
        data: upcomingSeasons,
        message: 'Upcoming seasons retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting upcoming seasons:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve upcoming seasons',
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/virtual-time/season-progression - Get season progression
  public getSeasonProgression = async (req: Request, res: Response): Promise<void> => {
    try {
      const progression = await this.virtualTimeService.getSeasonProgression();
      
      res.json({
        success: true,
        data: progression,
        message: 'Season progression retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting season progression:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve season progression',
        timestamp: new Date().toISOString()
      });
    }
  };
}
