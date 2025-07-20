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
  virtualTime: VirtualTimeState;
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

interface AdvancedStatsData {
  totalBets: number;
  totalVolume: number;
  averageBet: number;
  wonBets: number;
  lostBets: number;
  pendingBets: number;
  cancelledBets: number;
  totalWinnings: number;
  totalLosses: number;
}

interface DailyVolumeData {
  date: string;
  betCount: number;
  volume: number;
}

interface ActiveUserData {
  username: string;
  id: string;
  betCount: number;
  totalAmount: number;
  winRate: number | null;
}

interface PopularMatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  betCount: number;
  totalVolume: number;
  averageAmount: number;
}

interface CountResult {
  count: number;
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

  /**
   * Get dashboard statistics for admin panel
   */
  public getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Optimized single query for all dashboard stats with virtual time support
      const statsResult = await this.db.get(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE role = "user") as totalUsers,
          (SELECT COUNT(DISTINCT user_id) FROM bets WHERE placed_at >= datetime('now', '-30 days')) as activeUsers,
          (SELECT COUNT(*) FROM bets) as totalBets,
          (SELECT COUNT(*) FROM bets WHERE DATE(placed_at) = DATE('now')) as betsToday,
          (SELECT COALESCE(SUM(amount), 0) FROM bets) as totalRevenue,
          (SELECT COALESCE(AVG(amount), 0) FROM bets) as averageBet,
          (SELECT COUNT(*) FROM bets WHERE status IN ('won', 'lost')) as totalResolved,
          (SELECT COUNT(*) FROM bets WHERE status = 'won') as totalWon
      `) as {
        totalUsers: number;
        activeUsers: number;
        totalBets: number;
        betsToday: number;
        totalRevenue: number;
        averageBet: number;
        totalResolved: number;
        totalWon: number;
      };

      console.log('📊 Dashboard stats query result:', statsResult);

      const winRate = statsResult.totalResolved > 0 ? 
        (statsResult.totalWon / statsResult.totalResolved) * 100 : 0;

      const response = {
        success: true,
        data: {
          totalUsers: statsResult.totalUsers || 0,
          activeUsers: statsResult.activeUsers || 0,
          totalBets: statsResult.totalBets || 0,
          betsToday: statsResult.betsToday || 0,
          totalRevenue: statsResult.totalRevenue || 0,
          averageBet: parseFloat((statsResult.averageBet || 0).toFixed(2)),
          winRate: parseFloat(winRate.toFixed(1))
        },
        timestamp: new Date().toISOString()
      };

      console.log('📊 Dashboard stats response:', response);
      res.json(response);
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve dashboard statistics',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Get bets grouped by day of week
   */
  public getBetsByDay = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const betsByDay = await this.db.all(`
        SELECT 
          CASE strftime('%w', placed_at)
            WHEN '0' THEN 'D'
            WHEN '1' THEN 'L'
            WHEN '2' THEN 'M'
            WHEN '3' THEN 'M'
            WHEN '4' THEN 'J'
            WHEN '5' THEN 'V'
            WHEN '6' THEN 'S'
          END as day,
          COUNT(*) as count
        FROM bets 
        GROUP BY strftime('%w', placed_at)
        ORDER BY strftime('%w', placed_at)
      `);

      console.log('📅 Bets by day query result:', betsByDay);

      // Initialize all days with 0
      const daysMap = new Map([
        ['D', 0], ['L', 0], ['M', 0], ['M', 0], ['J', 0], ['V', 0], ['S', 0]
      ]);

      // Update with actual data
      (betsByDay as Array<{ day: string; count: number }>).forEach((row) => {
        daysMap.set(row.day, row.count);
      });

      const result = Array.from(daysMap.entries()).map(([day, count]) => ({
        day,
        count
      }));

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting bets by day:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve bets by day',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Get most popular teams by bet count
   */
  public getPopularTeams = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const popularTeams = await this.db.all(`
        SELECT 
          t.name,
          t.colors as house_color,
          COUNT(b.id) as betCount,
          ROUND(COUNT(b.id) * 100.0 / CASE WHEN (SELECT COUNT(*) FROM bets) = 0 THEN 1 ELSE (SELECT COUNT(*) FROM bets) END, 1) as percentage
        FROM teams t
        LEFT JOIN matches m ON t.id = m.home_team_id OR t.id = m.away_team_id
        LEFT JOIN bets b ON m.id = b.match_id
        GROUP BY t.id, t.name, t.colors
        ORDER BY betCount DESC
        LIMIT 4
      `);

      console.log('🏏 Popular teams query result:', popularTeams);

      res.json({
        success: true,
        data: popularTeams || [],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting popular teams:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve popular teams',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Get risk analysis data
   */
  public getRiskAnalysis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Optimized single query for all risk analysis data
      const riskData = await this.db.get(`
        SELECT 
          (SELECT COUNT(*) FROM bets WHERE amount > 500 AND placed_at >= datetime('now', '-7 days')) as criticalAlerts,
          (SELECT COUNT(*) FROM bets WHERE amount > 200 AND placed_at >= datetime('now', '-7 days')) as highAmountBets,
          (SELECT COUNT(DISTINCT user_id) FROM bets WHERE amount > 300 
           GROUP BY user_id HAVING COUNT(*) > 10) as riskUsers
      `) as {
        criticalAlerts: number;
        highAmountBets: number;
        riskUsers: number | null;
      };

      res.json({
        success: true,
        data: {
          criticalAlerts: riskData.criticalAlerts,
          highAmountBets: riskData.highAmountBets,
          riskUsers: riskData.riskUsers || 0
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting risk analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve risk analysis',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Get most active users
   */
  public getActiveUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const activeUsers = await this.db.all(`
        SELECT 
          u.username,
          COUNT(b.id) as betCount,
          COALESCE(SUM(b.amount), 0) as totalAmount,
          ROUND(
            COUNT(CASE WHEN b.status = 'won' THEN 1 END) * 100.0 / 
            NULLIF(COUNT(CASE WHEN b.status IN ('won', 'lost') THEN 1 END), 0), 
            1
          ) as winRate,
          CASE 
            WHEN SUM(b.amount) > 2000 THEN 10
            WHEN SUM(b.amount) > 1000 THEN 8
            WHEN SUM(b.amount) > 500 THEN 6
            ELSE 4
          END as riskLevel
        FROM users u
        JOIN bets b ON u.id = b.user_id
        WHERE u.role = 'user'
        GROUP BY u.id, u.username
        ORDER BY betCount DESC, totalAmount DESC
        LIMIT 4
      `);

      res.json({
        success: true,
        data: (activeUsers as Array<{
          username: string;
          betCount: number;
          totalAmount: number;
          winRate: number;
          riskLevel: number;
        }>).map((user) => ({
          username: user.username,
          betCount: user.betCount,
          totalAmount: user.totalAmount,
          winRate: user.winRate || 0,
          riskLevel: user.riskLevel
        })),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting active users:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve active users',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Get platform performance metrics
   */
  public getPerformanceMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Optimized single query for all performance metrics
      const metricsData = await this.db.get(`
        SELECT 
          (SELECT COALESCE(SUM(amount), 0) FROM bets) as totalBetAmount,
          (SELECT COALESCE(SUM(CASE WHEN status = 'won' THEN potential_win ELSE 0 END), 0) FROM bets) as totalPayouts,
          (SELECT COALESCE(AVG(user_total), 0) 
           FROM (SELECT SUM(amount) as user_total FROM bets WHERE placed_at >= datetime('now', '-30 days') GROUP BY user_id)) as avgSpending,
          (SELECT COUNT(*) / 24.0 FROM bets WHERE placed_at >= datetime('now', '-24 hours')) as betsPerHour,
          (SELECT COUNT(DISTINCT CASE WHEN b.user_id IS NOT NULL THEN u.id END) * 100.0 / COUNT(u.id)
           FROM users u LEFT JOIN bets b ON u.id = b.user_id AND b.placed_at >= datetime('now', '-30 days')
           WHERE u.role = 'user') as activeUserRate
      `) as {
        totalBetAmount: number;
        totalPayouts: number;
        avgSpending: number;
        betsPerHour: number;
        activeUserRate: number;
      };

      const profitMargin = metricsData.totalBetAmount > 0 ? 
        ((metricsData.totalBetAmount - metricsData.totalPayouts) / metricsData.totalBetAmount) * 100 : 0;

      res.json({
        success: true,
        data: {
          profitMargin: parseFloat(profitMargin.toFixed(1)),
          avgSpendingPerUser: parseFloat(metricsData.avgSpending.toFixed(0)),
          betsPerHour: parseFloat(metricsData.betsPerHour.toFixed(1)),
          activeUserRate: parseFloat((metricsData.activeUserRate || 0).toFixed(1))
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve performance metrics',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Get recent platform activity
   */
  public getRecentActivity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const recentActivity = await this.db.all(`
        SELECT 
          'user_register' as type,
          u.username,
          'Nuevo usuario registrado' as description,
          u.created_at as timestamp,
          NULL as amount
        FROM users u
        WHERE u.role = 'user' AND u.created_at >= datetime('now', '-30 days')
        
        UNION ALL
        
        SELECT 
          CASE 
            WHEN b.status = 'won' THEN 'bet_won'
            WHEN b.status = 'lost' THEN 'bet_lost'
            ELSE 'bet_placed'
          END as type,
          u.username,
          'Apuesta realizada en ' || ht.name || ' vs ' || at.name as description,
          b.placed_at as timestamp,
          b.amount
        FROM bets b
        JOIN users u ON b.user_id = u.id
        LEFT JOIN matches m ON b.match_id = m.id
        LEFT JOIN teams ht ON m.home_team_id = ht.id
        LEFT JOIN teams at ON m.away_team_id = at.id
        
        ORDER BY timestamp DESC
        LIMIT 20
      `);

      console.log('📈 Recent activity query result:', recentActivity.length, 'items');

      res.json({
        success: true,
        data: recentActivity || [],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting recent activity:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve recent activity',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Get current risk alerts
   */
  public getRiskAlerts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Optimized single query for all risk alerts using UNION
      const riskAlerts = await this.db.all(`
        SELECT 
          'high_amount' as type,
          u.username,
          'Apuesta de alto monto detectada' as description,
          b.amount,
          b.placed_at as timestamp
        FROM bets b
        JOIN users u ON b.user_id = u.id
        WHERE b.amount > 1000 AND b.placed_at >= datetime('now', '-24 hours')
        
        UNION ALL
        
        SELECT 
          'suspicious_pattern' as type,
          u.username,
          'Patrón de apuestas sospechoso detectado' as description,
          CAST(SUM(b.amount) as INTEGER) as amount,
          MAX(b.placed_at) as timestamp
        FROM users u
        JOIN bets b ON u.id = b.user_id
        WHERE b.placed_at >= datetime('now', '-24 hours')
        GROUP BY u.id, u.username
        HAVING COUNT(b.id) > 20 OR SUM(b.amount) > 5000
        
        ORDER BY timestamp DESC
        LIMIT 10
      `);

      res.json({
        success: true,
        data: riskAlerts,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting risk alerts:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve risk alerts',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Get advanced statistics with filters for admin panel
   */
  public getAdvancedStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        period = '30', // days
        status = 'all',
        userId = 'all',
        dateFrom,
        dateTo
      } = req.query;

      console.log('🔍 Advanced statistics request with filters:', {
        period, status, userId, dateFrom, dateTo
      });

      // Build WHERE clause for filters
      let whereClause = 'WHERE 1=1';
      const params: (string | number)[] = [];

      // Date range filter
      if (dateFrom && dateTo) {
        whereClause += ' AND DATE(b.placed_at) BETWEEN ? AND ?';
        params.push(dateFrom as string, dateTo as string);
      } else if (period !== 'all') {
        whereClause += ' AND b.placed_at >= datetime("now", "-' + period + ' days")';
      }

      // Status filter
      if (status !== 'all') {
        whereClause += ' AND b.status = ?';
        params.push(status as string);
      }

      // User filter
      if (userId !== 'all') {
        whereClause += ' AND u.id = ?';
        params.push(userId as string);
      }

      console.log('📊 SQL WHERE clause:', whereClause);
      console.log('📊 SQL params:', params);

      // Calculate previous period for comparison
      let previousPeriodClause = '';
      if (dateFrom && dateTo) {
        const fromDate = new Date(dateFrom as string);
        const toDate = new Date(dateTo as string);
        const diff = toDate.getTime() - fromDate.getTime();
        const previousFrom = new Date(fromDate.getTime() - diff);
        const previousTo = new Date(fromDate.getTime() - 1);
        
        previousPeriodClause = `AND DATE(b.placed_at) BETWEEN '${previousFrom.toISOString().split('T')[0]}' AND '${previousTo.toISOString().split('T')[0]}'`;
      } else if (period !== 'all') {
        const periodDays = parseInt(period as string);
        previousPeriodClause = `AND b.placed_at >= datetime("now", "-${periodDays * 2} days") AND b.placed_at < datetime("now", "-${periodDays} days")`;
      }

      // Main statistics query
      const statsQuery = `
        SELECT 
          COUNT(*) as totalBets,
          COALESCE(SUM(b.amount), 0) as totalVolume,
          COALESCE(AVG(b.amount), 0) as averageBet,
          COUNT(CASE WHEN b.status = 'won' THEN 1 END) as wonBets,
          COUNT(CASE WHEN b.status = 'lost' THEN 1 END) as lostBets,
          COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pendingBets,
          COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelledBets,
          COALESCE(SUM(CASE WHEN b.status = 'won' THEN COALESCE(b.potential_win, 0) - b.amount ELSE 0 END), 0) as totalWinnings,
          COALESCE(SUM(CASE WHEN b.status = 'lost' THEN b.amount ELSE 0 END), 0) as totalLosses
        FROM bets b
        JOIN users u ON b.user_id = u.id
        ${whereClause}
      `;

      // Previous period statistics query for comparison
      const previousStatsQuery = `
        SELECT 
          COUNT(*) as totalBets,
          COALESCE(SUM(b.amount), 0) as totalVolume,
          COALESCE(AVG(b.amount), 0) as averageBet
        FROM bets b
        JOIN users u ON b.user_id = u.id
        WHERE 1=1 ${previousPeriodClause}
      `;

      // Daily volume query for chart
      const dailyVolumeQuery = `
        SELECT 
          DATE(b.placed_at) as date,
          COUNT(*) as betCount,
          COALESCE(SUM(b.amount), 0) as volume
        FROM bets b
        JOIN users u ON b.user_id = u.id
        ${whereClause}
        GROUP BY DATE(b.placed_at)
        ORDER BY date ASC
        LIMIT 30
      `;

      // Most active users query
      const activeUsersQuery = `
        SELECT 
          u.username,
          u.id,
          COUNT(b.id) as betCount,
          COALESCE(SUM(b.amount), 0) as totalAmount,
          ROUND(
            COUNT(CASE WHEN b.status = 'won' THEN 1 END) * 100.0 / 
            NULLIF(COUNT(CASE WHEN b.status IN ('won', 'lost') THEN 1 END), 0), 
            1
          ) as winRate
        FROM users u
        JOIN bets b ON u.id = b.user_id
        ${whereClause}
        GROUP BY u.id, u.username
        ORDER BY betCount DESC
        LIMIT 5
      `;

      // Most popular matches query
      const popularMatchesQuery = `
        SELECT 
          m.id,
          COALESCE(t1.name, 'Team A') as homeTeam,
          COALESCE(t2.name, 'Team B') as awayTeam,
          COUNT(b.id) as betCount,
          COALESCE(SUM(b.amount), 0) as totalVolume,
          COALESCE(AVG(b.amount), 0) as averageAmount
        FROM bets b
        JOIN users u ON b.user_id = u.id
        LEFT JOIN matches m ON b.match_id = m.id
        LEFT JOIN teams t1 ON m.home_team_id = t1.id
        LEFT JOIN teams t2 ON m.away_team_id = t2.id
        ${whereClause}
        GROUP BY m.id, t1.name, t2.name
        ORDER BY betCount DESC
        LIMIT 3
      `;

      // High risk bets query
      const highRiskQuery = `
        SELECT COUNT(*) as count
        FROM bets b
        JOIN users u ON b.user_id = u.id
        ${whereClause} AND b.amount > 300000
      `;

      // Hyperactive users query
      const hyperactiveUsersQuery = `
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        JOIN bets b ON u.id = b.user_id
        ${whereClause}
        GROUP BY u.id
        HAVING COUNT(b.id) > 5
      `;

      console.log('📊 Executing database queries...');

      // Execute all queries
      const [
        currentStats,
        previousStats,
        dailyVolume,
        activeUsers,
        popularMatches,
        highRiskBets,
        hyperactiveUsersResult
      ] = await Promise.all([
        this.db.get(statsQuery, params),
        this.db.get(previousStatsQuery),
        this.db.all(dailyVolumeQuery, params),
        this.db.all(activeUsersQuery, params),
        this.db.all(popularMatchesQuery, params),
        this.db.get(highRiskQuery, params),
        this.db.all(hyperactiveUsersQuery, params)
      ]);

      console.log('📊 Query results:', {
        currentStats,
        previousStats,
        dailyVolumeCount: (dailyVolume as DailyVolumeData[]).length,
        activeUsersCount: (activeUsers as ActiveUserData[]).length,
        popularMatchesCount: (popularMatches as PopularMatchData[]).length
      });

      // Calculate percentages and comparisons
      const stats = currentStats as AdvancedStatsData;
      const prevStats = (previousStats as AdvancedStatsData) || { 
        totalBets: 0, 
        totalVolume: 0, 
        averageBet: 0, 
        wonBets: 0, 
        lostBets: 0, 
        pendingBets: 0, 
        cancelledBets: 0, 
        totalWinnings: 0, 
        totalLosses: 0 
      };

      const totalResolved = stats.wonBets + stats.lostBets;
      const winRate = totalResolved > 0 ? (stats.wonBets / totalResolved) * 100 : 0;
      const netProfit = stats.totalWinnings - stats.totalLosses;

      // Calculate changes from previous period
      const betsChange = prevStats.totalBets > 0 ? 
        ((stats.totalBets - prevStats.totalBets) / prevStats.totalBets) * 100 : 0;
      const volumeChange = prevStats.totalVolume > 0 ? 
        ((stats.totalVolume - prevStats.totalVolume) / prevStats.totalVolume) * 100 : 0;
      const avgBetChange = prevStats.averageBet > 0 ? 
        ((stats.averageBet - prevStats.averageBet) / prevStats.averageBet) * 100 : 0;

      // Process daily volume data (already in ascending order)
      const dailyData = (dailyVolume as DailyVolumeData[]);
      const maxDaily = dailyData.length > 0 ? Math.max(...dailyData.map(d => d.volume)) : 0;
      const avgDaily = dailyData.length > 0 ? 
        dailyData.reduce((sum, d) => sum + d.volume, 0) / dailyData.length : 0;

      // Count hyperactive users
      const hyperactiveCount = (hyperactiveUsersResult as ActiveUserData[]).length;

      // Format response
      const response = {
        success: true,
        data: {
          // Main indicators
          indicators: {
            totalBets: {
              value: stats.totalBets,
              change: Math.round(betsChange * 100) / 100,
              trend: betsChange > 0 ? 'up' : betsChange < 0 ? 'down' : 'stable'
            },
            totalVolume: {
              value: stats.totalVolume,
              change: Math.round(volumeChange * 100) / 100,
              trend: volumeChange > 0 ? 'up' : volumeChange < 0 ? 'down' : 'stable'
            },
            winRate: {
              value: Math.round(winRate * 100) / 100,
              change: 2.3, // This could be calculated from previous period if needed
              trend: 'up'
            },
            averageBet: {
              value: Math.round(stats.averageBet),
              change: Math.round(avgBetChange * 100) / 100,
              trend: avgBetChange > 0 ? 'up' : avgBetChange < 0 ? 'down' : 'stable'
            }
          },

          // Status distribution
          statusDistribution: [
            {
              label: 'Ganadas',
              value: stats.wonBets,
              percentage: stats.totalBets > 0 ? (stats.wonBets / stats.totalBets) * 100 : 0,
              color: '#10B981'
            },
            {
              label: 'Perdidas',
              value: stats.lostBets,
              percentage: stats.totalBets > 0 ? (stats.lostBets / stats.totalBets) * 100 : 0,
              color: '#EF4444'
            },
            {
              label: 'Pendientes',
              value: stats.pendingBets,
              percentage: stats.totalBets > 0 ? (stats.pendingBets / stats.totalBets) * 100 : 0,
              color: '#F59E0B'
            },
            {
              label: 'Canceladas',
              value: stats.cancelledBets,
              percentage: stats.totalBets > 0 ? (stats.cancelledBets / stats.totalBets) * 100 : 0,
              color: '#6B7280'
            }
          ],

          // Bet distribution by amount ranges
          betDistribution: [
            {
              range: '€1-€10',
              count: await this.getBetCountByRange(1, 10, whereClause, params),
              percentage: 0,
              color: '#10B981'
            },
            {
              range: '€11-€50',
              count: await this.getBetCountByRange(11, 50, whereClause, params),
              percentage: 0,
              color: '#3B82F6'
            },
            {
              range: '€51-€100',
              count: await this.getBetCountByRange(51, 100, whereClause, params),
              percentage: 0,
              color: '#F59E0B'
            },
            {
              range: '€100+',
              count: await this.getBetCountByRange(101, 999999, whereClause, params),
              percentage: 0,
              color: '#EF4444'
            }
          ].map(item => {
            const totalBetsByAmount = item.count;
            const totalBets = stats.totalBets;
            return {
              ...item,
              percentage: totalBets > 0 ? (totalBetsByAmount / totalBets) * 100 : 0
            };
          }),

          // User segments
          userSegments: await this.getUserSegments(whereClause, params),

          // Team performance
          teamPerformance: await this.getTeamPerformance(whereClause, params),

          // Daily volume chart data
          dailyVolume: {
            data: dailyData,
            maxDaily,
            avgDaily: Math.round(avgDaily)
          },

          // Active users ranking
          activeUsers: (activeUsers as ActiveUserData[]).map((user, index) => ({
            rank: index + 1,
            username: user.username,
            betCount: user.betCount,
            totalAmount: user.totalAmount,
            winRate: user.winRate || 0
          })),

          // Popular matches
          popularMatches: (popularMatches as PopularMatchData[]).map((match, index) => ({
            rank: index + 1,
            name: `${match.homeTeam} vs ${match.awayTeam}`,
            betCount: match.betCount,
            totalVolume: match.totalVolume,
            averageAmount: Math.round(match.averageAmount)
          })),

          // Risk analysis
          riskAnalysis: {
            highRiskBets: (highRiskBets as CountResult).count,
            hyperactiveUsers: hyperactiveCount,
            profitLossRatio: stats.totalLosses > 0 ? stats.totalWinnings / stats.totalLosses : 0,
            netProfit
          }
        },
        timestamp: new Date().toISOString()
      };

      console.log('📊 Advanced statistics response generated successfully');
      res.json(response);

    } catch (error) {
      console.error('❌ Error getting advanced statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve advanced statistics',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Get bet count by amount range
   */
  private async getBetCountByRange(minAmount: number, maxAmount: number, whereClause: string, params: (string | number)[]): Promise<number> {
    try {
      const rangeWhereClause = whereClause + ' AND b.amount >= ? AND b.amount <= ?';
      const rangeParams = [...params, minAmount, maxAmount];
      
      const result = await this.db.get(`
        SELECT COUNT(*) as count
        FROM bets b
        JOIN users u ON b.user_id = u.id
        ${rangeWhereClause}
      `, rangeParams) as { count: number } | undefined;

      return result?.count || 0;
    } catch (error) {
      console.error('Error getting bet count by range:', error);
      return 0;
    }
  }

  /**
   * Get user segments
   */
  private async getUserSegments(whereClause: string, params: (string | number)[]): Promise<Array<{
    segment: string;
    userCount: number;
    avgBetAmount: number;
    totalVolume: number;
    color: string;
  }>> {
    try {
      // Get user spending stats
      const userStats = await this.db.all(`
        SELECT 
          u.id,
          u.username,
          COUNT(b.id) as betCount,
          COALESCE(SUM(b.amount), 0) as totalAmount,
          COALESCE(AVG(b.amount), 0) as avgAmount
        FROM users u
        LEFT JOIN bets b ON u.id = b.user_id
        ${whereClause}
        GROUP BY u.id, u.username
        HAVING betCount > 0
        ORDER BY totalAmount DESC
      `, params) as Array<{
        id: string;
        username: string;
        betCount: number;
        totalAmount: number;
        avgAmount: number;
      }>;

      if (!userStats || userStats.length === 0) {
        return [
          { segment: 'Activos', userCount: 0, avgBetAmount: 0, totalVolume: 0, color: '#10B981' },
          { segment: 'Regulares', userCount: 0, avgBetAmount: 0, totalVolume: 0, color: '#3B82F6' },
          { segment: 'Inactivos', userCount: 0, avgBetAmount: 0, totalVolume: 0, color: '#6B7280' }
        ];
      }

      // Segment users (removed VIP, adjusted ranges)
      const activeUsers = userStats.filter(user => user.totalAmount >= 100);
      const regularUsers = userStats.filter(user => user.totalAmount >= 20 && user.totalAmount < 100);
      const inactiveUsers = userStats.filter(user => user.totalAmount < 20);

      return [
        {
          segment: 'Activos',
          userCount: activeUsers.length,
          avgBetAmount: activeUsers.length > 0 ? activeUsers.reduce((sum, user) => sum + user.avgAmount, 0) / activeUsers.length : 0,
          totalVolume: activeUsers.reduce((sum, user) => sum + user.totalAmount, 0),
          color: '#10B981'
        },
        {
          segment: 'Regulares',
          userCount: regularUsers.length,
          avgBetAmount: regularUsers.length > 0 ? regularUsers.reduce((sum, user) => sum + user.avgAmount, 0) / regularUsers.length : 0,
          totalVolume: regularUsers.reduce((sum, user) => sum + user.totalAmount, 0),
          color: '#3B82F6'
        },
        {
          segment: 'Inactivos',
          userCount: inactiveUsers.length,
          avgBetAmount: inactiveUsers.length > 0 ? inactiveUsers.reduce((sum, user) => sum + user.avgAmount, 0) / inactiveUsers.length : 0,
          totalVolume: inactiveUsers.reduce((sum, user) => sum + user.totalAmount, 0),
          color: '#6B7280'
        }
      ];
    } catch (error) {
      console.error('Error getting user segments:', error);
      return [];
    }
  }

  /**
   * Get team performance
   */
  private async getTeamPerformance(whereClause: string, params: (string | number)[]): Promise<Array<{
    teamName: string;
    teamColor: string;
    totalBets: number;
    wonBets: number;
    winRate: number;
    totalVolume: number;
  }>> {
    try {
      // First, get all teams
      const teams = await this.db.all(`
        SELECT id, name, colors
        FROM teams
        ORDER BY name
      `) as Array<{
        id: string;
        name: string;
        colors: string;
      }>;

      console.log('🏆 Found teams:', teams);

      const teamPerformance = [];

      for (const team of teams) {
        // Get bet statistics for this team
        const teamBets = await this.db.get(`
          SELECT 
            COUNT(b.id) as totalBets,
            COUNT(CASE WHEN b.status = 'won' THEN 1 END) as wonBets,
            COALESCE(SUM(b.amount), 0) as totalVolume
          FROM bets b
          JOIN matches m ON b.match_id = m.id
          JOIN users u ON b.user_id = u.id
          WHERE (m.home_team_id = ? OR m.away_team_id = ?)
          ${whereClause.replace('WHERE 1=1', 'AND 1=1')}
        `, [team.id, team.id, ...params]) as {
          totalBets: number;
          wonBets: number;
          totalVolume: number;
        } | undefined;

        const stats = teamBets || { totalBets: 0, wonBets: 0, totalVolume: 0 };
        
        // Parse colors from JSON string and get first color
        let teamColor = '#6B7280'; // default color
        try {
          if (team.colors) {
            const colorsArray = JSON.parse(team.colors);
            if (Array.isArray(colorsArray) && colorsArray.length > 0) {
              teamColor = colorsArray[0];
            }
          }
        } catch (error) {
          console.warn('Error parsing team colors:', error);
        }
        
        teamPerformance.push({
          teamName: team.name,
          teamColor: teamColor,
          totalBets: stats.totalBets,
          wonBets: stats.wonBets,
          winRate: stats.totalBets > 0 ? (stats.wonBets / stats.totalBets) * 100 : 0,
          totalVolume: stats.totalVolume
        });
      }

      console.log('🏆 Team performance results:', teamPerformance);
      return teamPerformance.sort((a, b) => b.totalVolume - a.totalVolume);
    } catch (error) {
      console.error('Error getting team performance:', error);
      return [];
    }
  }

  /**
   * Get users list for filters
   */
  public getUsersList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const users = await this.db.all(`
        SELECT DISTINCT u.id, u.username, COUNT(b.id) as betCount
        FROM users u
        LEFT JOIN bets b ON u.id = b.user_id
        WHERE u.role = 'user'
        GROUP BY u.id, u.username
        HAVING betCount > 0
        ORDER BY u.username ASC
        LIMIT 100
      `);

      res.json({
        success: true,
        data: users,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting users list:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve users list',
        timestamp: new Date().toISOString()
      });
    }
  };
}
