import { Response } from 'express';
import { Database } from '../database/Database';
import { VirtualTimeService, VirtualTimeState } from '../services/VirtualTimeService';
import { SeasonManagementService } from '../services/SeasonManagementService';
import { ApiResponse, Season, Team } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';

interface SystemStats {
  teamsCreated: number;
  matchesGenerated: number;
  seasonCreated: string;
}

interface ResetDatabaseResponse {
  message: string;
  newSeason: Season;
  virtualTime: VirtualTimeState;
  stats: SystemStats;
}

interface SystemStatusResponse {
  virtualTime: VirtualTimeState;
  currentSeason: Season | null;
  stats: {
    totalTeams: number;
    totalMatches: number;
    totalUsers: number;
    totalBets: number;
    totalPredictions: number;
    activeSeasons: number;
    scheduledMatches: number;
    liveMatches: number;
    finishedMatches: number;
  };
  systemReady: boolean;
}

interface TruncateTableResponse {
  table: string;
  action: string;
}

interface GenerateSeasonResponse {
  season: Season;
  matchesGenerated: number;
  teamsParticipating: number;
}

interface AdminLogsResponse {
  logs: AdminLogEntry[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface AdminLogEntry {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  description: string;
  created_at: string;
  admin_username: string;
}

export class AdminController {
  private db = Database.getInstance();
  private virtualTimeService = VirtualTimeService.getInstance();
  private seasonService = new SeasonManagementService();

  /**
   * Complete database reset - Returns system to initial functional state
   * This is the main endpoint for the "Reset Database" button
   */
  public resetDatabase = async (req: AuthenticatedRequest, res: Response<ApiResponse<ResetDatabaseResponse>>): Promise<void> => {
    try {
      console.log('🔄 Starting complete database reset...');
      
      // Step 1: Clear all existing data
      console.log('🧹 Step 1: Clearing existing data...');
      await this.db.resetForNewSeason();
      
      // Step 2: Create new season with complete fixtures (before time reset)
      console.log('🏆 Step 2: Creating new season...');
      const newSeason = await this.createNewSeasonWithFixtures();
      
      // Step 3: Reset virtual time to initial state (2025-07-14)
      console.log('🕒 Step 3: Resetting virtual time to initial state...');
      await this.virtualTimeService.resetToInitialState();
      
      // Step 4: Update virtual time service with the new active season
      console.log('🔄 Step 4: Setting new season as active in virtual time...');
      await this.virtualTimeService.setActiveSeason(newSeason.id);
      
      // Step 5: Configure virtual time settings and ensure correct date
      console.log('⏰ Step 5: Configuring virtual time settings...');
      await this.virtualTimeService.updateSettings({
        timeSpeed: 'medium',
        autoMode: false
      });
      
      // Step 6: Force reset to ensure correct initial date (2025-07-14)
      console.log('🔧 Step 6: Final time reset to ensure 2025-07-14...');
      await this.virtualTimeService.resetToInitialState();
      
      console.log('✅ Database reset completed successfully!');
      
      // Log admin action
      await this.logAdminAction(req.user!.userId, 'database_reset', 'system', null, 'Complete database reset executed');
      
      res.json({
        success: true,
        data: {
          message: 'Database reset completed successfully',
          newSeason: newSeason,
          virtualTime: await this.virtualTimeService.getCurrentState(),
          stats: {
            teamsCreated: 6,
            matchesGenerated: await this.getMatchCount(newSeason.id),
            seasonCreated: newSeason.name
          }
        },
        message: 'System returned to initial functional state',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error during database reset:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset database',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Create a new season with complete fixture generation
   */
  private async createNewSeasonWithFixtures() {
    // Get all teams
    const teams = await this.db.getAllTeams() as Team[];
    const teamIds = teams.map(team => team.id);
    
    // Create new season
    const currentYear = new Date().getFullYear();
    const seasonData = {
      name: `Liga Quidditch ${currentYear}`,
      startDate: new Date(`${currentYear}-08-01T00:00:00Z`), // Start August 1st
      endDate: new Date(`${currentYear}-12-31T23:59:59Z`),   // End December 31st
      teamIds: teamIds,
      status: 'active' as const // Set the new season as active
    };
    
    const season = await this.seasonService.createSeason(seasonData);
    
    console.log(`✅ Created season: ${season.name}`);
    console.log(`📅 Season period: ${seasonData.startDate.toISOString()} to ${seasonData.endDate.toISOString()}`);
    console.log(`👥 Teams participating: ${teamIds.length}`);
    
    return season;
  }

  /**
   * Get match count for a season
   */
  private async getMatchCount(seasonId: string): Promise<number> {
    const result = await this.db.get('SELECT COUNT(*) as count FROM matches WHERE season_id = ?', [seasonId]) as { count: number };
    return result.count;
  }

  /**
   * Log admin action for audit trail
   */
  private async logAdminAction(adminUserId: string, action: string, targetType: string, targetId: string | null, description: string): Promise<void> {
    try {
      await this.db.run(`
        INSERT INTO admin_logs (admin_user_id, action, target_type, target_id, description, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [adminUserId, action, targetType, targetId, description]);
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Get system status for admin dashboard
   */
  public getSystemStatus = async (req: AuthenticatedRequest, res: Response<ApiResponse<SystemStatusResponse>>): Promise<void> => {
    try {
      const virtualTime = await this.virtualTimeService.getCurrentState();
      const currentSeason = await this.db.get('SELECT * FROM seasons WHERE status = "active"') as Season | null;
      
      const stats = {
        totalTeams: await this.getTableCount('teams'),
        totalMatches: await this.getTableCount('matches'),
        totalUsers: await this.getTableCount('users'),
        totalBets: await this.getTableCount('bets'),
        totalPredictions: await this.getTableCount('predictions'),
        activeSeasons: await this.getTableCount('seasons', 'status = "active"'),
        scheduledMatches: await this.getTableCount('matches', 'status = "scheduled"'),
        liveMatches: await this.getTableCount('matches', 'status = "live"'),
        finishedMatches: await this.getTableCount('matches', 'status = "finished"')
      };

      res.json({
        success: true,
        data: {
          virtualTime,
          currentSeason,
          stats,
          systemReady: currentSeason !== null && stats.totalTeams > 0 && stats.totalMatches > 0
        },
        message: 'System status retrieved successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error getting system status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get system status',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Helper method to get table count
   */
  private async getTableCount(table: string, whereClause?: string): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${table}${whereClause ? ' WHERE ' + whereClause : ''}`;
    const result = await this.db.get(sql) as { count: number };
    return result.count;
  }

  /**
   * Truncate specific table (for development/testing)
   */
  public truncateTable = async (req: AuthenticatedRequest, res: Response<ApiResponse<TruncateTableResponse>>): Promise<void> => {
    try {
      const { table } = req.params;
      const allowedTables = ['bets', 'predictions', 'matches', 'seasons', 'standings', 'match_events', 'user_transactions'];
      
      if (!allowedTables.includes(table)) {
        res.status(400).json({
          success: false,
          error: 'Table not allowed for truncation',
          message: `Allowed tables: ${allowedTables.join(', ')}`,
          timestamp: new Date().toISOString()
        });
        return;
      }

      await this.db.run(`DELETE FROM ${table}`);
      
      // Log admin action
      await this.logAdminAction(req.user!.userId, 'truncate_table', 'table', table, `Truncated table: ${table}`);
      
      res.json({
        success: true,
        data: { table, action: 'truncated' },
        message: `Table ${table} truncated successfully`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error truncating table:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to truncate table',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Generate new season manually
   */
  public generateNewSeason = async (req: AuthenticatedRequest, res: Response<ApiResponse<GenerateSeasonResponse>>): Promise<void> => {
    try {
      const { name, startDate, endDate } = req.body;
      
      // Get all teams
      const teams = await this.db.getAllTeams() as Team[];
      const teamIds = teams.map(team => team.id);
      
      if (teamIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No teams found',
          message: 'Cannot create season without teams. Please reset database first.',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // Create season
      const seasonData = {
        name: name || `Liga Quidditch ${new Date().getFullYear()}`,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
        teamIds: teamIds
      };
      
      const season = await this.seasonService.createSeason(seasonData);
      const matchCount = await this.getMatchCount(season.id);
      
      // Log admin action
      await this.logAdminAction(req.user!.userId, 'generate_season', 'season', season.id, `Generated new season: ${season.name}`);
      
      res.json({
        success: true,
        data: {
          season,
          matchesGenerated: matchCount,
          teamsParticipating: teamIds.length
        },
        message: 'New season generated successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error generating new season:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate new season',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Get admin logs
   */
  public getAdminLogs = async (req: AuthenticatedRequest, res: Response<ApiResponse<AdminLogsResponse>>): Promise<void> => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      
      const logs = await this.db.all(`
        SELECT al.*, u.username as admin_username
        FROM admin_logs al
        JOIN users u ON al.admin_user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?
      `, [Number(limit), Number(offset)]) as AdminLogEntry[];
      
      const totalCount = await this.getTableCount('admin_logs');
      
      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            total: totalCount,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: (Number(offset) + Number(limit)) < totalCount
          }
        },
        message: 'Admin logs retrieved successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error getting admin logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get admin logs',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      });
    }
  };
}
