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

interface CreateSeasonResponse {
  season: Season;
  matchesGenerated: number;
  teamsParticipating: number;
  virtualTime: any;
  previousSeasonFinalized: boolean;
}

interface TeamStanding {
  team_id: string;
  team_name: string;
  points: number;
  goals_for: number;
  goals_against: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
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
      
      // Step 2: Reset virtual time to initial state FIRST (2025-07-14)
      console.log('🕒 Step 2: Resetting virtual time to initial state...');
      await this.virtualTimeService.resetToInitialState();
      
      // Step 3: Create new season with fixtures based on virtual time
      console.log('🏆 Step 3: Creating new season...');
      const newSeason = await this.createNewSeasonWithFixtures();
      
      // Step 4: Update virtual time service with the new active season
      console.log('🔄 Step 4: Setting new season as active in virtual time...');
      await this.virtualTimeService.setActiveSeason(newSeason.id);
      
      // Step 5: Configure virtual time settings
      console.log('⏰ Step 5: Configuring virtual time settings...');
      await this.virtualTimeService.updateSettings({
        timeSpeed: 'medium',
        autoMode: false
      });
      
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
    
    // Get current virtual time state to use as reference
    const virtualTimeState = await this.virtualTimeService.getCurrentState();
    const currentVirtualDate = new Date(virtualTimeState.currentDate);
    
    // Create new season starting from current virtual date
    const currentYear = currentVirtualDate.getFullYear();
    const startDate = new Date(currentVirtualDate);
    startDate.setDate(startDate.getDate() + 1); // Start tomorrow from virtual time
    
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 4); // 4 months duration
    
    const seasonData = {
      name: `Liga Quidditch ${currentYear}`,
      startDate: startDate,
      endDate: endDate,
      teamIds: teamIds,
      status: 'active' as const // Set the new season as active
    };
    
    const season = await this.seasonService.createSeason(seasonData);
    
    console.log(`✅ Created season: ${season.name}`);
    console.log(`📅 Season period: ${seasonData.startDate.toISOString()} to ${seasonData.endDate.toISOString()}`);
    console.log(`⏰ Virtual time reference: ${currentVirtualDate.toISOString()}`);
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

  /**
   * Create new season with proper handling of existing active seasons
   * This is the endpoint for the "Iniciar Nueva Temporada" button
   */
  public createNewSeason = async (req: AuthenticatedRequest, res: Response<ApiResponse<GenerateSeasonResponse>>): Promise<void> => {
    try {
      console.log('🌟 Starting new season creation process...');
      
      // Step 1: Check if there's an active season and finalize it
      const currentActiveSeason = await this.db.get('SELECT * FROM seasons WHERE status = "active"') as Season | null;
      
      if (currentActiveSeason) {
        console.log(`📋 Found active season: ${currentActiveSeason.name}, finalizing...`);
        
        // Finalize the current season (mark as finished and save historical data)
        await this.finalizeActiveSeason(currentActiveSeason);
        console.log('✅ Previous season finalized and archived');
      }
      
      // Step 2: Get current virtual time for proper season scheduling
      const virtualTimeState = await this.virtualTimeService.getCurrentState();
      const currentVirtualDate = virtualTimeState.currentDate;
      
      console.log(`📅 Current virtual time: ${currentVirtualDate.toISOString()}`);
      
      // Step 3: Calculate season dates based on virtual time
      const seasonStartDate = new Date(currentVirtualDate);
      
      // If we're before August 1st, start this year's season
      // If we're after August 1st, start next year's season
      const currentMonth = seasonStartDate.getMonth(); // 0-based (July = 6, August = 7)
      const currentYear = seasonStartDate.getFullYear();
      
      let seasonYear: number;
      if (currentMonth < 7) { // Before August (month 7)
        seasonYear = currentYear;
      } else {
        seasonYear = currentYear + 1;
      }
      
      // Season runs from August 1st to December 31st
      const finalStartDate = new Date(`${seasonYear}-08-01T00:00:00Z`);
      const finalEndDate = new Date(`${seasonYear}-12-31T23:59:59Z`);
      
      // Step 4: Get all teams
      const teams = await this.db.getAllTeams() as Team[];
      const teamIds = teams.map(team => team.id);
      
      if (teamIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No teams found',
          message: 'Cannot create season without teams. Database may need to be reset.',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // Step 5: Create the new season
      const seasonData = {
        name: `Liga Quidditch ${seasonYear}`,
        startDate: finalStartDate,
        endDate: finalEndDate,
        teamIds: teamIds,
        status: 'active' as const // Explicitly set as active
      };
      
      console.log(`🏆 Creating new season: ${seasonData.name}`);
      console.log(`📅 Season period: ${finalStartDate.toISOString()} to ${finalEndDate.toISOString()}`);
      console.log(`👥 Teams participating: ${teamIds.length}`);
      
      const season = await this.seasonService.createSeason(seasonData);
      const matchCount = await this.getMatchCount(season.id);
      
      // Step 6: Set the new season as active in virtual time service
      await this.virtualTimeService.setActiveSeason(season.id);
      console.log('✅ New season set as active in virtual time service');
      
      // Step 7: Log admin action
      await this.logAdminAction(
        req.user!.userId, 
        'create_new_season', 
        'season', 
        season.id, 
        `Created new season: ${season.name} (${teamIds.length} teams, ${matchCount} matches)`
      );
      
      console.log(`✅ New season created successfully: ${season.name}`);
      
      // Initialize the first match for the new season
      await this.initializeFirstMatch(season.id);
      
      res.json({
        success: true,
        data: {
          season: season,
          matchesGenerated: matchCount,
          teamsParticipating: teamIds.length,
          virtualTime: virtualTimeState,
          previousSeasonFinalized: !!currentActiveSeason
        } as CreateSeasonResponse,
        message: `Nueva temporada "${season.name}" creada exitosamente con ${matchCount} partidos`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error creating new season:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create new season',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Initialize the first match of a new season to be ready for simulation
   */
  private async initializeFirstMatch(seasonId: string): Promise<void> {
    try {
      // Get the first scheduled match of the season
      const firstMatch = await this.db.get(`
        SELECT * FROM matches 
        WHERE season_id = ? AND status = 'scheduled' 
        ORDER BY date ASC 
        LIMIT 1
      `, [seasonId]) as {
        id: string;
        home_team_id: string;
        away_team_id: string;
        date: string;
        status: string;
      } | undefined;

      if (firstMatch) {
        console.log(`🏐 First match found: ${firstMatch.home_team_id} vs ${firstMatch.away_team_id}`);
        console.log(`📅 Scheduled for: ${firstMatch.date}`);
        
        // Ensure the virtual time is set to allow this match to start
        const virtualTimeService = VirtualTimeService.getInstance();
        const currentVirtualState = await virtualTimeService.getCurrentState();
        const matchDate = new Date(firstMatch.date);
        
        console.log(`⏰ Virtual time: ${currentVirtualState.currentDate.toISOString()}`);
        console.log(`🏐 Match time: ${matchDate.toISOString()}`);
        
        // If virtual time is before the match date, advance it to make the match playable
        if (currentVirtualState.currentDate < matchDate) {
          console.log('⏩ Advancing virtual time to match date to make first match playable...');
          
          // Advance virtual time to just past the match time
          const newVirtualTime = new Date(matchDate);
          newVirtualTime.setMinutes(newVirtualTime.getMinutes() + 5); // 5 minutes past match start
          
          await virtualTimeService.setCurrentDate(newVirtualTime);
          console.log(`✅ Virtual time advanced to: ${newVirtualTime.toISOString()}`);
          console.log('🎮 First match should now be detectable by the simulation system');
        } else {
          console.log('✅ First match is ready to be picked up by the simulation system');
        }
      } else {
        console.warn('⚠️ No scheduled matches found for the new season');
      }
    } catch (error) {
      console.error('Error initializing first match:', error);
    }
  }

  /**
   * Finalize an active season by moving it to historical data
   */
  private async finalizeActiveSeason(season: Season): Promise<void> {
    try {
      console.log(`📊 Finalizing season: ${season.name}`);
      
      // 1. Mark season as finished
      await this.db.run('UPDATE seasons SET status = ? WHERE id = ?', ['finished', season.id]);
      
      // 2. Calculate final standings
      const standings = await this.db.all(`
        SELECT 
          ts.*,
          t.name as team_name
        FROM team_standings ts
        JOIN teams t ON ts.team_id = t.id
        WHERE ts.season_id = ?
        ORDER BY ts.points DESC, (ts.goals_for - ts.goals_against) DESC, ts.goals_for DESC
      `, [season.id]) as TeamStanding[];
      
      // 3. Get season statistics
      const totalMatches = await this.db.get('SELECT COUNT(*) as count FROM matches WHERE season_id = ?', [season.id]) as { count: number };
      const completedMatches = await this.db.get('SELECT COUNT(*) as count FROM matches WHERE season_id = ? AND status = "finished"', [season.id]) as { count: number };
      
      // 4. Save to historical seasons
      const historicalSeasonData = {
        original_season_id: season.id,
        name: season.name,
        year: new Date(season.startDate).getFullYear(),
        start_date: season.startDate,
        end_date: season.endDate,
        total_matches: totalMatches.count,
        completed_matches: completedMatches.count,
        final_standings: JSON.stringify(standings),
        champion_team_id: standings.length > 0 ? standings[0].team_id : null,
        created_at: new Date().toISOString()
      };
      
      await this.db.run(`
        INSERT INTO historical_seasons (
          original_season_id, name, year, start_date, end_date,
          total_matches, completed_matches, final_standings, champion_team_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        historicalSeasonData.original_season_id,
        historicalSeasonData.name,
        historicalSeasonData.year,
        historicalSeasonData.start_date,
        historicalSeasonData.end_date,
        historicalSeasonData.total_matches,
        historicalSeasonData.completed_matches,
        historicalSeasonData.final_standings,
        historicalSeasonData.champion_team_id,
        historicalSeasonData.created_at
      ]);
      
      console.log(`✅ Season ${season.name} finalized and archived to historical data`);
      console.log(`🏆 Champion: ${standings.length > 0 ? standings[0].team_name : 'No champion determined'}`);
      console.log(`📊 Final stats: ${completedMatches.count}/${totalMatches.count} matches completed`);
      
    } catch (error) {
      console.error('Error finalizing active season:', error);
      throw new Error(`Failed to finalize active season: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
