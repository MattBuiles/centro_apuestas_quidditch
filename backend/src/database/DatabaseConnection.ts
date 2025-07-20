import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { DatabaseConfig } from '../types';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: sqlite3.Database | null = null;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(config?: DatabaseConfig): Promise<void> {
    // Always use backend directory database
    const backendDir = path.resolve(__dirname, '..');
    const defaultDbPath = path.join(backendDir, 'database', 'quidditch.db');
    const dbPath = config?.path || process.env.DATABASE_URL || defaultDbPath;
    
    // Ensure database directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database:', dbPath);
          
          if (config?.enableWAL) {
            this.db!.exec('PRAGMA journal_mode = WAL;');
          }
          
          if (config?.enableForeignKeys !== false) {
            this.db!.exec('PRAGMA foreign_keys = ON;');
          }
          
          resolve();
        }
      });
    });
  }

  public async close(): Promise<void> {
    if (this.db) {
      const close = promisify(this.db.close.bind(this.db));
      await close();
      this.db = null;
    }
  }

  public getDatabase(): sqlite3.Database {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  // Helper methods for common database operations
  public async get(sql: string, params: unknown[] = []): Promise<unknown> {
    if (!this.db) throw new Error('Database not connected');
    return new Promise((resolve, reject) => {
      this.db!.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  public async all(sql: string, params: unknown[] = []): Promise<unknown[]> {
    if (!this.db) throw new Error('Database not connected');
    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  public async run(sql: string, params: unknown[] = []): Promise<{ lastID?: number; changes?: number }> {
    if (!this.db) throw new Error('Database not connected');
    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
}
