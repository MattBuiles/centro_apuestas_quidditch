import { DatabaseConnection } from './DatabaseConnection';
import { TransactionData, AdminLogData, DatabaseResult } from './interfaces';

export class AdminRepository {
  private connection: DatabaseConnection;

  constructor() {
    this.connection = DatabaseConnection.getInstance();
  }

  // User transactions methods
  public async createTransaction(transactionData: TransactionData): Promise<DatabaseResult> {
    // Get current virtual time
    let virtualTime: string;
    try {
      const { VirtualTimeService } = await import('../services/VirtualTimeService');
      const virtualTimeService = VirtualTimeService.getInstance();
      await virtualTimeService.initialize();
      const currentState = await virtualTimeService.getCurrentState();
      virtualTime = currentState.currentDate.toISOString();
    } catch (error) {
      console.error('Error getting virtual time for transaction, using real time:', error);
      virtualTime = new Date().toISOString();
    }

    const sql = `
      INSERT INTO user_transactions (id, user_id, type, amount, balance_before, balance_after, description, reference_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return await this.connection.run(sql, [
      transactionData.id,
      transactionData.userId,
      transactionData.type,
      transactionData.amount,
      transactionData.balanceBefore,
      transactionData.balanceAfter,
      transactionData.description || '',
      transactionData.referenceId || null,
      virtualTime
    ]);
  }

  public async getUserTransactions(userId: string, limit: number = 50): Promise<unknown[]> {
    const sql = `
      SELECT * FROM user_transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    return await this.connection.all(sql, [userId, limit]);
  }

  // Admin logs methods
  public async createAdminLog(logData: AdminLogData): Promise<DatabaseResult> {
    const sql = `
      INSERT INTO admin_logs (id, admin_user_id, action, target_type, target_id, description, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return await this.connection.run(sql, [
      logData.id,
      logData.adminUserId,
      logData.action,
      logData.targetType || null,
      logData.targetId || null,
      logData.description || '',
      logData.ipAddress || null,
      logData.userAgent || null
    ]);
  }

  public async getAdminLogs(limit: number = 100): Promise<unknown[]> {
    const sql = `
      SELECT 
        al.*,
        u.username as admin_username
      FROM admin_logs al
      JOIN users u ON al.admin_user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `;
    return await this.connection.all(sql, [limit]);
  }

  // Reset methods
  public async resetForNewSeason(): Promise<void> {
    console.log('🔄 Starting database reset for new season...');

    try {
      // Disable foreign key constraints first, outside of transaction
      console.log('⚙️ Disabling foreign key constraints...');
      await this.connection.run('PRAGMA foreign_keys = OFF');

      // Start transaction
      await this.connection.run('BEGIN TRANSACTION');

      // Clear all betting data first (no dependencies)
      console.log('🗑️ Clearing bets...');
      await this.connection.run('DELETE FROM bets');
      
      // Clear all predictions
      console.log('🗑️ Clearing predictions...');
      await this.connection.run('DELETE FROM predictions');

      // Clear all match-related data (cascading deletes will handle events)
      console.log('🗑️ Clearing matches and events...');
      await this.connection.run('DELETE FROM match_events');
      await this.connection.run('DELETE FROM matches');
      
      // Clear season-related data
      console.log('🗑️ Clearing seasons and standings...');
      await this.connection.run('DELETE FROM standings');
      await this.connection.run('DELETE FROM season_teams');
      await this.connection.run('DELETE FROM seasons');
      
      // Clear historical seasons
      console.log('🗑️ Clearing historical seasons...');
      await this.connection.run('DELETE FROM historical_seasons');
      
      // Reset team statistics to zero
      console.log('🔄 Resetting team statistics...');
      await this.connection.run(`
        UPDATE teams SET 
          matches_played = 0,
          wins = 0,
          losses = 0,
          draws = 0,
          points_for = 0,
          points_against = 0,
          snitch_catches = 0,
          updated_at = CURRENT_TIMESTAMP
      `);

      // Reset user balances to default
      console.log('💰 Resetting user balances...');
      await this.connection.run(`
        UPDATE users SET 
          balance = 1000.0,
          updated_at = CURRENT_TIMESTAMP
        WHERE role = 'user'
      `);

      // Clear historical stats (optional - you might want to keep these)
      console.log('📊 Clearing historical statistics...');
      await this.connection.run('DELETE FROM historical_team_stats');
      await this.connection.run('DELETE FROM historical_user_stats');

      // Clear user transactions
      console.log('💳 Clearing user transactions...');
      await this.connection.run('DELETE FROM user_transactions');

      // Clear admin logs  
      console.log('📋 Clearing admin logs...');
      await this.connection.run('DELETE FROM admin_logs');

      // Clear virtual time state
      console.log('⏰ Resetting virtual time state...');
      await this.connection.run('DELETE FROM virtual_time_state');

      // Commit transaction
      await this.connection.run('COMMIT');

      // Re-enable foreign key constraints
      console.log('⚙️ Re-enabling foreign key constraints...');
      await this.connection.run('PRAGMA foreign_keys = ON');

      console.log('✅ Database reset completed successfully!');
      console.log('🎯 Ready for new season generation');

    } catch (error) {
      // Rollback transaction on error
      await this.connection.run('ROLLBACK');
      // Re-enable foreign key constraints even on error
      await this.connection.run('PRAGMA foreign_keys = ON');
      console.error('❌ Error during database reset:', error);
      throw error;
    }
  }

  public async resetCompleteDatabase(): Promise<void> {
    console.log('⚠️ Starting COMPLETE database reset...');

    try {
      // Start transaction
      await this.connection.run('BEGIN TRANSACTION');

      // Get all table names
      const tables = await this.connection.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `) as { name: string }[];

      // Clear all tables
      for (const table of tables) {
        console.log(`🗑️ Clearing table: ${table.name}`);
        await this.connection.run(`DELETE FROM ${table.name}`);
      }

      // Commit transaction
      await this.connection.run('COMMIT');

      console.log('✅ Complete database reset completed!');
      console.log('🏗️ Re-seeding initial data...');

      // Re-seed initial data
      const { DatabaseSeed } = await import('./DatabaseSeed');
      const seeder = new DatabaseSeed();
      await seeder.seedInitialData();

      console.log('✅ Database fully reset and re-seeded!');

    } catch (error) {
      // Rollback transaction on error
      await this.connection.run('ROLLBACK');
      console.error('❌ Error during complete database reset:', error);
      throw error;
    }
  }
}
