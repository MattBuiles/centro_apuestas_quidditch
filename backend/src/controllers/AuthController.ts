import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database/Database';
import { User, UserPublic, ApiResponse, AuthTokens, LoginRequest, RegisterRequest } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  private db = Database.getInstance();

  public login = async (req: Request<object, ApiResponse<{ user: UserPublic; tokens: AuthTokens }>, LoginRequest>, res: Response): Promise<void> => {
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
        res.status(500).json({
          success: false,
          error: 'JWT secret not configured',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const tokenPayload = { userId: user.id, email: user.email, role: user.role };
      const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '7d' });

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

  public register = async (req: Request<object, ApiResponse<{ user: UserPublic; tokens: AuthTokens }>, RegisterRequest>, res: Response): Promise<void> => {
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
        res.status(500).json({
          success: false,
          error: 'JWT secret not configured',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const tokenPayload = { userId: newUser.id, email: newUser.email, role: newUser.role };
      const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '7d' });

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

  public getProfile = async (req: AuthenticatedRequest, res: Response<ApiResponse<UserPublic>>): Promise<void> => {
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

  public forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      // Check if user exists with this email
      const user = await this.db.getUserByEmailForRecovery(email);

      if (!user) {
        // Don't reveal if email exists or not for security
        res.json({
          success: true,
          message: 'If an account with this email exists, a password recovery code has been sent.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Simulate sending recovery email by logging to console
      console.log('🦉 RECOVERY EMAIL SIMULATION 🦉');
      console.log('='.repeat(50));
      console.log(`📧 To: ${email}`);
      console.log(`👤 User ID: ${user.id}`);
      console.log(`🔐 Recovery Code: MAGIC-${Math.random().toString(36).substr(2, 8).toUpperCase()}`);
      console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
      console.log('📜 Message: "Una lechuza mágica ha llevado tu código de recuperación!"');
      console.log('='.repeat(50));

      res.json({
        success: true,
        message: 'If an account with this email exists, a password recovery code has been sent.',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };

  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, newPassword } = req.body;

      // Validate input
      if (!email || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Email and new password are required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Check if user exists
      const user = await this.db.getUserByEmailForRecovery(email);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password in database
      await this.db.updateUserPasswordByEmail(email, hashedNewPassword);

      // Log successful password reset
      console.log('🔐 PASSWORD RESET SUCCESSFUL 🔐');
      console.log('='.repeat(40));
      console.log(`📧 Email: ${email}`);
      console.log(`👤 User ID: ${user.id}`);
      console.log(`⏰ Reset Time: ${new Date().toISOString()}`);
      console.log('✨ Password successfully updated with bcrypt hashing');
      console.log('='.repeat(40));

      res.json({
        success: true,
        message: 'Password reset successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };
}
