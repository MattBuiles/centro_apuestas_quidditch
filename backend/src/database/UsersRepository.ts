import { DatabaseConnection } from './DatabaseConnection';
import { UserData, DatabaseResult } from './interfaces';

export class UsersRepository {
  private connection: DatabaseConnection;

  constructor() {
    this.connection = DatabaseConnection.getInstance();
  }

  public async getUserByEmail(email: string): Promise<unknown> {
    const sql = `
      SELECT id, username, email, password, role, balance, created_at, updated_at
      FROM users 
      WHERE email = ?
    `;
    return await this.connection.get(sql, [email]);
  }

  public async getUserById(id: string): Promise<unknown> {
    const sql = `
      SELECT id, username, email, role, balance, created_at, updated_at
      FROM users 
      WHERE id = ?
    `;
    return await this.connection.get(sql, [id]);
  }

  public async createUser(userData: UserData): Promise<DatabaseResult> {
    const sql = `
      INSERT INTO users (id, username, email, password, role, balance)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    return await this.connection.run(sql, [
      userData.id,
      userData.username,
      userData.email,
      userData.password,
      userData.role || 'user',
      userData.balance || 1000
    ]);
  }

  public async updateUserBalance(userId: string, newBalance: number): Promise<DatabaseResult> {
    const sql = `
      UPDATE users 
      SET balance = ?, updated_at = datetime('now')
      WHERE id = ?
    `;
    return await this.connection.run(sql, [newBalance, userId]);
  }

  public async updateUserProfile(userId: string, userData: { username?: string; email?: string }): Promise<DatabaseResult> {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (userData.username !== undefined) {
      updates.push('username = ?');
      params.push(userData.username);
    }
    
    if (userData.email !== undefined) {
      updates.push('email = ?');
      params.push(userData.email);
    }
    
    if (updates.length === 0) {
      throw new Error('No fields to update');
    }
    
    updates.push('updated_at = datetime(\'now\')');
    params.push(userId);
    
    const sql = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `;
    
    return await this.connection.run(sql, params);
  }

  public async updateUserPassword(userId: string, hashedPassword: string): Promise<DatabaseResult> {
    const sql = `
      UPDATE users 
      SET password = ?, updated_at = datetime('now')
      WHERE id = ?
    `;
    return await this.connection.run(sql, [hashedPassword, userId]);
  }

  public async getUserPasswordById(userId: string): Promise<{ password: string } | null> {
    const sql = `
      SELECT password
      FROM users 
      WHERE id = ?
    `;
    const result = await this.connection.get(sql, [userId]);
    return result as { password: string } | null;
  }

  public async getAllUsers(): Promise<unknown[]> {
    const sql = `
      SELECT 
        u.id, u.username, u.email, u.role, u.balance, u.created_at, u.updated_at,
        COUNT(DISTINCT b.id) as total_bets,
        COALESCE(SUM(CASE WHEN b.status = 'won' THEN b.potential_win - b.amount ELSE 0 END), 0) as total_winnings,
        COALESCE(SUM(CASE WHEN b.status = 'lost' THEN b.amount ELSE 0 END), 0) as total_losses,
        COUNT(DISTINCT p.id) as total_predictions,
        COUNT(CASE WHEN p.status = 'correct' THEN 1 END) as correct_predictions
      FROM users u
      LEFT JOIN bets b ON u.id = b.user_id
      LEFT JOIN predictions p ON u.id = p.user_id
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;
    return await this.connection.all(sql);
  }
}
