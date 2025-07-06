import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          timestamp: new Date().toISOString()
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          timestamp: new Date().toISOString()
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

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

  public register = async (req: Request<{}, ApiResponse<{ user: UserPublic; tokens: AuthTokens }>, RegisterRequest>, res: Response) => {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await this.db.get(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [email, username]
      );

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User already exists with this email or username',
          timestamp: new Date().toISOString()
        });
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
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email, role: newUser.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = newUser;

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

  public getProfile = async (req: AuthenticatedRequest, res: Response<ApiResponse<UserPublic>>) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
          timestamp: new Date().toISOString()
        });
      }

      const user = await this.db.get(
        'SELECT id, username, email, role, balance, created_at, updated_at FROM users WHERE id = ?',
        [req.user.userId]
      ) as UserPublic;

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          timestamp: new Date().toISOString()
        });
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
