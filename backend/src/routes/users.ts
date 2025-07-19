import { Router } from 'express';
import { Database } from '../database/Database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();
const db = Database.getInstance();

// GET /api/users - Get all users (admin only)
router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        timestamp: new Date().toISOString()
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;

    let sql = `
      SELECT 
        u.id, u.username, u.email, u.role, u.balance, u.created_at, u.updated_at,
        COUNT(DISTINCT b.id) as total_bets,
        COALESCE(SUM(CASE WHEN b.status = 'won' THEN b.potential_win - b.amount ELSE 0 END), 0) as total_winnings,
        COALESCE(SUM(CASE WHEN b.status = 'lost' THEN b.amount ELSE 0 END), 0) as total_losses,
        COUNT(DISTINCT p.id) as total_predictions,
        COUNT(CASE WHEN p.status = 'correct' THEN 1 END) as correct_predictions,
        COUNT(CASE WHEN p.status = 'incorrect' THEN 1 END) as incorrect_predictions,
        MAX(b.placed_at) as last_bet_date
      FROM users u
      LEFT JOIN bets b ON u.id = b.user_id
      LEFT JOIN predictions p ON u.id = p.user_id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];
    
    if (search) {
      sql += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Add role filter if specified
    const role = req.query.role as string;
    if (role && (role === 'user' || role === 'admin')) {
      sql += ' AND u.role = ?';
      params.push(role);
    }

    sql += ' GROUP BY u.id ORDER BY u.created_at DESC';

    const allUsers = await db.all(sql, params);
    const totalUsers = allUsers.length;
    
    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedUsers = allUsers.slice(offset, offset + limit);

    return res.json({
      success: true,
      data: {
        data: paginatedUsers,
        count: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/users/stats - Get current user statistics
router.get('/stats', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    
    const stats = await db.getUserStats(user.userId);
    
    return res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/users/:id - Get specific user details (admin only)
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const userId = req.params.id;
    
    if (user.role !== 'admin' && user.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        timestamp: new Date().toISOString()
      });
    }

    const userDetails = await db.getUserById(userId);
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Get user's recent activity
    const [recentBets, recentPredictions, transactions] = await Promise.all([
      db.getBetsByUser(userId),
      db.getPredictionsByUser(userId),
      db.getUserTransactions(userId, 20)
    ]);

    return res.json({
      success: true,
      data: {
        user: userDetails,
        recentBets,
        recentPredictions,
        transactions
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching user details:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// PUT /api/users/profile - Update current user profile
router.put('/profile', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { username, email } = req.body;
    
    // Validate input
    if (!username && !email) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (username or email) must be provided',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if username already exists (if provided)
    if (username) {
      const existingUserByUsername = await db.get(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, user.userId]
      );
      
      if (existingUserByUsername) {
        return res.status(409).json({
          success: false,
          error: 'Username already exists',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Check if email already exists (if provided)
    if (email) {
      const existingUserByEmail = await db.get(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, user.userId]
      );
      
      if (existingUserByEmail) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Update user profile
    const updateData: { username?: string; email?: string } = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    
    await db.updateUserProfile(user.userId, updateData);
    
    // Get updated user data
    const updatedUser = await db.getUserById(user.userId);
    
    return res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// PUT /api/users/password - Change current user password
router.put('/password', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
        timestamp: new Date().toISOString()
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long',
        timestamp: new Date().toISOString()
      });
    }

    // Get current user password from database
    const userPassword = await db.getUserPasswordById(user.userId);
    if (!userPassword) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userPassword.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
        timestamp: new Date().toISOString()
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await db.updateUserPassword(user.userId, hashedNewPassword);

    res.json({
      success: true,
      message: 'Password updated successfully',
      timestamp: new Date().toISOString()
    });
    return;

  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// PUT /api/users/:id/balance - Update user balance (admin only)
router.put('/:id/balance', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const userId = req.params.id;
    const { amount, reason } = req.body;
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        timestamp: new Date().toISOString()
      });
    }

    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        timestamp: new Date().toISOString()
      });
    }

    const targetUser = await db.getUserById(userId) as any;
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    const newBalance = targetUser.balance + amount;
    if (newBalance < 0) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        timestamp: new Date().toISOString()
      });
    }

    await db.updateUserBalance(userId, newBalance);

    // Create transaction record
    const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db.createTransaction({
      id: transactionId,
      userId: userId,
      type: amount > 0 ? 'deposit' : 'withdrawal',
      amount: amount,
      balanceBefore: targetUser.balance,
      balanceAfter: newBalance,
      description: reason || `Balance adjustment by admin ${user.email}`,
      referenceId: undefined
    });

    return res.json({
      success: true,
      data: {
        oldBalance: targetUser.balance,
        newBalance,
        adjustment: amount
      },
      message: 'Balance updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating balance:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// PUT /api/users/:id - Update user information (admin only)
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const userId = req.params.id;
    const { username, email, role } = req.body;
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        timestamp: new Date().toISOString()
      });
    }

    // Get target user first
    const targetUser = await db.getUserById(userId) as any;
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Prevent editing admin users (except by super admin)
    if (targetUser.role === 'admin' && user.userId !== targetUser.id) {
      return res.status(403).json({
        success: false,
        error: 'Cannot edit admin users',
        timestamp: new Date().toISOString()
      });
    }

    // Check if new username is taken (if username is being changed)
    if (username && username !== targetUser.username) {
      const existingUser = await db.get(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userId]
      );
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Username already exists',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Check if new email is taken (if email is being changed)
    if (email && email !== targetUser.email) {
      const existingUser = await db.get(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (username) {
      updates.push('username = ?');
      params.push(username);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (role && (role === 'user' || role === 'admin')) {
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update',
        timestamp: new Date().toISOString()
      });
    }

    // Add updated_at and userId to params
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);

    // Execute update
    await db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Get updated user
    const updatedUser = await db.get(
      'SELECT id, username, email, role, balance, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    return res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
