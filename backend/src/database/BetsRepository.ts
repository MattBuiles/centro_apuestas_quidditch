import { DatabaseConnection } from './DatabaseConnection';
import { BetData, DatabaseResult } from './interfaces';

export class BetsRepository {
  private connection: DatabaseConnection;

  constructor() {
    this.connection = DatabaseConnection.getInstance();
  }

  public async createBet(betData: BetData): Promise<DatabaseResult> {
    // Get current virtual time
    let virtualTime: string;
    try {
      const { VirtualTimeService } = await import('../services/VirtualTimeService');
      const virtualTimeService = VirtualTimeService.getInstance();
      await virtualTimeService.initialize();
      const currentState = await virtualTimeService.getCurrentState();
      virtualTime = currentState.currentDate.toISOString();
    } catch (error) {
      console.error('Error getting virtual time for bet, using real time:', error);
      virtualTime = new Date().toISOString();
    }

    const sql = `
      INSERT INTO bets (id, user_id, match_id, type, prediction, odds, amount, potential_win, status, placed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `;
    return await this.connection.run(sql, [
      betData.id,
      betData.userId,
      betData.matchId,
      betData.type,
      betData.prediction,
      betData.odds,
      betData.amount,
      betData.potentialWin,
      virtualTime
    ]);
  }

  public async getBetsByUser(userId: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        b.*,
        m.date as matchDate,
        ht.name as homeTeamName,
        at.name as awayTeamName,
        u.username
      FROM bets b
      JOIN matches m ON b.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN users u ON b.user_id = u.id
      WHERE b.user_id = ?
      ORDER BY b.placed_at DESC
    `;
    return await this.connection.all(sql, [userId]);
  }

  public async getBetsByMatch(matchId: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        b.*,
        u.username
      FROM bets b
      JOIN users u ON b.user_id = u.id
      WHERE b.match_id = ?
      ORDER BY b.placed_at DESC
    `;
    return await this.connection.all(sql, [matchId]);
  }

  public async updateBetStatus(betId: string, status: string, resolvedAt?: string): Promise<DatabaseResult> {
    let finalResolvedAt = resolvedAt;
    
    // If no resolvedAt provided, use virtual time
    if (!finalResolvedAt) {
      try {
        const { VirtualTimeService } = await import('../services/VirtualTimeService');
        const virtualTimeService = VirtualTimeService.getInstance();
        await virtualTimeService.initialize();
        const currentState = await virtualTimeService.getCurrentState();
        finalResolvedAt = currentState.currentDate.toISOString();
      } catch (error) {
        console.error('Error getting virtual time for bet status update, using real time:', error);
        finalResolvedAt = new Date().toISOString();
      }
    }

    // If the bet won, we need to handle the payout and create a transaction
    if (status === 'won') {
      // First, get bet details to calculate winnings
      const betDetails = await this.connection.get(`
        SELECT b.*, u.balance, u.id as user_id 
        FROM bets b 
        JOIN users u ON b.user_id = u.id 
        WHERE b.id = ?
      `, [betId]) as any;

      if (betDetails) {
        const winnings = betDetails.potential_win;
        const newBalance = betDetails.balance + winnings;
        
        // Update user balance
        const updateBalanceSQL = `UPDATE users SET balance = ? WHERE id = ?`;
        await this.connection.run(updateBalanceSQL, [newBalance, betDetails.user_id]);

        // Create transaction record for the winnings
        const { Database } = await import('./Database');
        const db = Database.getInstance();
        
        const transactionId = `win-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await db.createTransaction({
          id: transactionId,
          userId: betDetails.user_id,
          type: 'bet_won',
          amount: winnings,
          balanceBefore: betDetails.balance,
          balanceAfter: newBalance,
          description: `Ganancia de apuesta: ${winnings} galeones`,
          referenceId: betId
        });

        console.log(`🎉 Bet won! User ${betDetails.user_id} received ${winnings} galeones. New balance: ${newBalance}`);
      }
    }
    
    // If the bet lost, create a transaction record for the loss
    if (status === 'lost') {
      const betDetails = await this.connection.get(`
        SELECT b.*, u.balance, u.id as user_id 
        FROM bets b 
        JOIN users u ON b.user_id = u.id 
        WHERE b.id = ?
      `, [betId]) as any;

      if (betDetails) {
        // Create transaction record for the loss (amount will be negative since it was already deducted)
        const { Database } = await import('./Database');
        const db = Database.getInstance();
        
        const transactionId = `loss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await db.createTransaction({
          id: transactionId,
          userId: betDetails.user_id,
          type: 'bet_lost',
          amount: 0, // No change in balance since money was already deducted when placing bet
          balanceBefore: betDetails.balance,
          balanceAfter: betDetails.balance,
          description: `Apuesta perdida: ${betDetails.amount} galeones`,
          referenceId: betId
        });

        console.log(`💔 Bet lost! User ${betDetails.user_id} lost ${betDetails.amount} galeones from bet ${betId}`);
      }
    }

    // Update the bet status
    const sql = `
      UPDATE bets 
      SET status = ?, resolved_at = ?
      WHERE id = ?
    `;
    return await this.connection.run(sql, [status, finalResolvedAt, betId]);
  }

  public async getAllBets(): Promise<unknown[]> {
    const sql = `
      SELECT 
        b.*,
        u.username,
        m.date as matchDate,
        ht.name as homeTeamName,
        at.name as awayTeamName
      FROM bets b
      JOIN users u ON b.user_id = u.id
      JOIN matches m ON b.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      ORDER BY b.placed_at DESC
    `;
    return await this.connection.all(sql);
  }

  public async getBetStatistics(): Promise<unknown> {
    const sql = `
      SELECT 
        COUNT(*) as total_bets,
        SUM(amount) as total_amount,
        AVG(amount) as average_bet,
        COUNT(CASE WHEN status = 'won' THEN 1 END) as won_bets,
        COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_bets,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bets,
        SUM(CASE WHEN status = 'won' THEN potential_win - amount ELSE 0 END) as total_winnings_paid,
        SUM(CASE WHEN status = 'lost' THEN amount ELSE 0 END) as total_losses_collected
      FROM bets
    `;
    return await this.connection.get(sql);
  }

  public async getBetStatisticsByDateRange(startDate: string, endDate: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        DATE(placed_at) as date,
        COUNT(*) as total_bets,
        SUM(amount) as total_amount,
        COUNT(CASE WHEN status = 'won' THEN 1 END) as won_bets,
        COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_bets
      FROM bets
      WHERE DATE(placed_at) BETWEEN ? AND ?
      GROUP BY DATE(placed_at)
      ORDER BY date DESC
    `;
    return await this.connection.all(sql, [startDate, endDate]);
  }

  public async getTopUsersByBets(limit: number = 10): Promise<unknown[]> {
    const sql = `
      SELECT 
        u.username,
        COUNT(b.id) as bet_count,
        SUM(b.amount) as total_amount,
        COUNT(CASE WHEN b.status = 'won' THEN 1 END) as won_count,
        COUNT(CASE WHEN b.status = 'lost' THEN 1 END) as lost_count,
        SUM(CASE WHEN b.status = 'won' THEN b.potential_win - b.amount ELSE 0 END) as net_winnings
      FROM users u
      JOIN bets b ON u.id = b.user_id
      WHERE u.role = 'user'
      GROUP BY u.id, u.username
      ORDER BY bet_count DESC
      LIMIT ?
    `;
    return await this.connection.all(sql, [limit]);
  }

  public async getTopMatchesByBets(limit: number = 10): Promise<unknown[]> {
    const sql = `
      SELECT 
        m.id,
        ht.name as home_team,
        at.name as away_team,
        m.date,
        COUNT(b.id) as bet_count,
        SUM(b.amount) as total_amount
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN bets b ON m.id = b.match_id
      GROUP BY m.id
      HAVING bet_count > 0
      ORDER BY bet_count DESC
      LIMIT ?
    `;
    return await this.connection.all(sql, [limit]);
  }

  public async getBetTypeStatistics(): Promise<unknown[]> {
    const sql = `
      SELECT 
        bt.name,
        bt.category,
        COUNT(b.id) as bet_count,
        SUM(b.amount) as total_amount,
        AVG(b.odds) as average_odds,
        COUNT(CASE WHEN b.status = 'won' THEN 1 END) as won_count,
        COUNT(CASE WHEN b.status = 'lost' THEN 1 END) as lost_count
      FROM bet_types bt
      LEFT JOIN bets b ON bt.id = b.type
      WHERE bt.is_active = TRUE
      GROUP BY bt.id, bt.name, bt.category
      ORDER BY bet_count DESC
    `;
    return await this.connection.all(sql);
  }
}
