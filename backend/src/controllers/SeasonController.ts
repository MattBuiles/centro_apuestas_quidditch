import { Request, Response } from 'express';
import { Database } from '../database/Database';
import { SeasonManagementService } from '../services/SeasonManagementService';
import { VirtualTimeService } from '../services/VirtualTimeService';
import { Season, ApiResponse } from '../types';

export class SeasonController {
  private db = Database.getInstance();
  private seasonService = new SeasonManagementService();
  private virtualTimeService = new VirtualTimeService();

  // GET /api/seasons - Get all seasons
  public getAllSeasons = async (req: Request, res: Response<ApiResponse<Season[]>>) => {
    try {
      const seasons = await this.seasonService.getAllSeasons();
      
      res.json({
        success: true,
        data: seasons,
        message: 'Seasons retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching seasons:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve seasons',
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/seasons/:id - Get specific season
  public getSeasonById = async (req: Request, res: Response<ApiResponse<Season>>): Promise<void> => {
    try {
      const { id } = req.params;
      
      const season = await this.seasonService.getSeasonById(id);
      
      res.json({
        success: true,
        data: season,
        message: 'Season retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching season:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Season not found',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'Failed to retrieve season',
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  // GET /api/seasons/current - Get current active season
  public getCurrentSeason = async (req: Request, res: Response<ApiResponse<Season | null>>) => {
    try {
      const season = await this.seasonService.getCurrentSeason();
      
      res.json({
        success: true,
        data: season,
        message: season ? 'Current season retrieved successfully' : 'No active season found',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching current season:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve current season',
        timestamp: new Date().toISOString()
      });
    }
  };

  // POST /api/seasons - Create new season
  public createSeason = async (req: Request, res: Response<ApiResponse<Season>>): Promise<void> => {
    try {
      const { name, startDate, endDate, teamIds } = req.body;
      
      // Validate required fields
      if (!name || !startDate || !endDate || !teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'name, startDate, endDate, and teamIds are required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Validate date format
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format',
          message: 'startDate and endDate must be valid dates',
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (start >= end) {
        res.status(400).json({
          success: false,
          error: 'Invalid date range',
          message: 'startDate must be before endDate',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Validate minimum number of teams
      if (teamIds.length < 4) {
        res.status(400).json({
          success: false,
          error: 'Insufficient teams',
          message: 'A season requires at least 4 teams',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const season = await this.seasonService.createSeason({
        name,
        startDate: start,
        endDate: end,
        teamIds
      });
      
      res.status(201).json({
        success: true,
        data: season,
        message: 'Season created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating season:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create season',
        timestamp: new Date().toISOString()
      });
    }
  };

  // PUT /api/seasons/:id/activate - Activate season
  public activateSeason = async (req: Request, res: Response<ApiResponse<Season>>): Promise<void> => {
    try {
      const { id } = req.params;
      
      const season = await this.seasonService.activateSeason(id);
      
      res.json({
        success: true,
        data: season,
        message: 'Season activated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error activating season:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Season not found',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'Failed to activate season',
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  // GET /api/seasons/league-time - Get league time information
  public getLeagueTime = async (req: Request, res: Response): Promise<void> => {
    try {
      const virtualTimeState = await this.virtualTimeService.getCurrentState();
      const currentSeason = await this.seasonService.getCurrentSeason();
      
      const leagueTimeInfo = {
        currentDate: virtualTimeState.currentDate,
        timeSpeed: virtualTimeState.timeSpeed,
        autoMode: virtualTimeState.autoMode,
        activeSeason: currentSeason,
        lastUpdate: virtualTimeState.lastUpdate
      };
      
      res.json({
        success: true,
        data: leagueTimeInfo,
        message: 'League time information retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching league time:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve league time information',
        timestamp: new Date().toISOString()
      });
    }
  };
}
