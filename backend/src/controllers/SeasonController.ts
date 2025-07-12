import { Request, Response } from 'express';
import { Database } from '../database/Database';
import { SeasonManagementService } from '../services/SeasonManagementService';
import { StandingsService } from '../services/StandingsService';
import { HistoricalSeasonsService } from '../services/HistoricalSeasonsService';
import { HistoricalTeamStatsService } from '../services/HistoricalTeamStatsService';
import { VirtualTimeService } from '../services/VirtualTimeService';
import { Season, ApiResponse } from '../types';

export class SeasonController {
  private db = Database.getInstance();
  private seasonService = new SeasonManagementService();
  private standingsService = new StandingsService();
  private historicalSeasonsService = new HistoricalSeasonsService();
  private historicalTeamStatsService = new HistoricalTeamStatsService();
  private virtualTimeService = VirtualTimeService.getInstance();

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

  // POST /api/seasons/create-default - Create new season with default settings
  public createDefaultSeason = async (req: Request, res: Response<ApiResponse<Season>>): Promise<void> => {
    try {
      // Get virtual time to start season from current date
      const currentState = await this.virtualTimeService.getCurrentState();
      const startDate = new Date(currentState.currentDate);
      
      // Season duration: 4 months (120 days)
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 120);
      
      // Get all available teams
      const teams = await this.db.all('SELECT id FROM teams ORDER BY name') as { id: string }[];
      
      if (teams.length < 4) {
        res.status(400).json({
          success: false,
          error: 'Insufficient teams',
          message: 'At least 4 teams are required to create a season',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Generate season name based on current year
      const year = startDate.getFullYear();
      const seasonName = `Liga Profesional Quidditch ${year}`;

      const season = await this.seasonService.createSeason({
        name: seasonName,
        startDate,
        endDate,
        teamIds: teams.map(t => t.id),
        status: 'active' // Make it active immediately
      });

      // Set as active season in virtual time
      await this.virtualTimeService.setActiveSeason(season.id);
      
      res.status(201).json({
        success: true,
        data: season,
        message: 'New season created and activated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating default season:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create default season',
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

  // POST /api/seasons/check-completion - Check and finish season if all matches are completed
  public checkSeasonCompletion = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.seasonService.checkAndFinishSeasonIfComplete();
      
      if (result.seasonFinished) {
        res.json({
          success: true,
          data: {
            seasonFinished: true,
            seasonId: result.seasonId,
            message: 'Season has been automatically finished'
          },
          message: 'Season completion check completed successfully',
          timestamp: new Date().toISOString()
        });
      } else {
        res.json({
          success: true,
          data: {
            seasonFinished: false,
            message: 'Season is still active or has pending matches'
          },
          message: 'Season completion check completed successfully',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error checking season completion:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to check season completion',
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/seasons/:id/standings - Get standings for a specific season
  public getSeasonStandings = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Verificar que la temporada existe
      const season = await this.seasonService.getSeasonById(id);
      if (!season) {
        res.status(404).json({
          success: false,
          error: 'Season not found',
          message: `Season with ID ${id} not found`,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Obtener standings desde la base de datos
      const standings = await this.standingsService.getSeasonStandings(id);
      
      // Obtener información adicional de los equipos
      const teamsMap = new Map();
      season.teams?.forEach(team => {
        teamsMap.set(team.id, team);
      });

      // Enriquecer standings con información de equipos
      const enrichedStandings = standings.map(standing => ({
        ...standing,
        team: teamsMap.get(standing.teamId) || { id: standing.teamId, name: standing.teamId }
      }));

      res.json({
        success: true,
        data: enrichedStandings,
        message: 'Season standings retrieved successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error fetching season standings:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve season standings',
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/standings/current - Get current season standings
  public getCurrentStandings = async (req: Request, res: Response): Promise<void> => {
    try {
      // Obtener la temporada activa
      const currentSeason = await this.seasonService.getCurrentSeason();
      if (!currentSeason) {
        res.status(404).json({
          success: false,
          error: 'No active season found',
          message: 'There is no currently active season',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Obtener standings desde la base de datos
      const standings = await this.standingsService.getSeasonStandings(currentSeason.id);
      
      // Enriquecer standings con información de equipos
      const enrichedStandings = standings.map(standing => ({
        ...standing,
        team: currentSeason.teams?.find(team => team.id === standing.teamId) || 
              { id: standing.teamId, name: standing.teamId }
      }));

      res.json({
        success: true,
        data: {
          season: {
            id: currentSeason.id,
            name: currentSeason.name,
            status: currentSeason.status
          },
          standings: enrichedStandings
        },
        message: 'Current standings retrieved successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error fetching current standings:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve current standings',
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/seasons/historical - Get all historical seasons
  public getHistoricalSeasons = async (req: Request, res: Response): Promise<void> => {
    try {
      const historicalSeasons = await this.historicalSeasonsService.getAllHistoricalSeasons();
      
      res.json({
        success: true,
        data: historicalSeasons,
        message: 'Historical seasons retrieved successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error fetching historical seasons:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve historical seasons',
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/seasons/historical/:id - Get specific historical season
  public getHistoricalSeasonById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const historicalSeason = await this.historicalSeasonsService.getHistoricalSeasonById(id);
      
      if (!historicalSeason) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Historical season not found',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      res.json({
        success: true,
        data: historicalSeason,
        message: 'Historical season retrieved successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error fetching historical season:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve historical season',
        timestamp: new Date().toISOString()
      });
    }
  };

  // POST /api/seasons/:id/archive - Manually archive a finished season
  public archiveFinishedSeason = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Verificar que la temporada existe y está finalizada
      const season = await this.seasonService.getSeasonById(id);
      
      if (season.status !== 'finished') {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Only finished seasons can be archived',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      await this.historicalSeasonsService.archiveFinishedSeason(id);
      
      res.json({
        success: true,
        data: { seasonId: id },
        message: 'Season archived successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error archiving season:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Season not found',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'Failed to archive season',
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  // GET /api/teams/historical-stats - Get historical stats for all teams
  public getHistoricalTeamStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const historicalStats = await this.historicalTeamStatsService.getAllHistoricalStats();
      
      res.json({
        success: true,
        data: historicalStats,
        message: 'Historical team stats retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching historical team stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve historical team stats',
        timestamp: new Date().toISOString()
      });
    }
  };

  // GET /api/teams/:teamId/historical-stats - Get historical stats for specific team
  public getTeamHistoricalStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { teamId } = req.params;
      
      const historicalStats = await this.historicalTeamStatsService.getTeamHistoricalStats(teamId);
      
      if (!historicalStats) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'No historical stats found for this team',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      res.json({
        success: true,
        data: historicalStats,
        message: 'Team historical stats retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching team historical stats:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Team not found',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'Failed to retrieve team historical stats',
          timestamp: new Date().toISOString()
        });
      }
    }
  };
}
