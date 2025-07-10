import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database/Database';
import { User, UserPublic, ApiResponse, AuthTokens, LoginRequest, RegisterRequest } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  private db = Database.getInstance();

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await this.db.get(
        'SELECT * FROM users WHERE email = ?',
        [email]
      ) as User | undefined;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is not set');
      }
      
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
      );

      // Remove password from user object
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
          tokens: {
            accessToken: token,
            expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await this.db.get(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [email, username]
      );

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'User already exists with this email or username',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userId = uuidv4();
      await this.db.run(
        `INSERT INTO users (id, username, email, password, role, balance) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, username, email, hashedPassword, 'user', 1000]
      );

      // Get created user
      const newUser = await this.db.get(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      ) as User;

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is not set');
      }
      
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email, role: newUser.role },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
      );

      // Remove password from user object
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...userWithoutPassword } = newUser;

      res.status(201).json({
        success: true,
        data: {
          user: userWithoutPassword,
          tokens: {
            accessToken: token,
            expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  public refreshToken = async (req: Request, res: Response) => {
    // For now, just return the same token. In production, implement proper refresh logic
    res.json({
      success: true,
      message: 'Refresh token endpoint - implement proper refresh logic',
      timestamp: new Date().toISOString()
    });
  };

  public getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const user = await this.db.get(
        'SELECT id, username, email, role, balance, created_at, updated_at FROM users WHERE id = ?',
        [req.user.userId]
      ) as UserPublic;

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.json({
        success: true,
        data: user,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };
}
