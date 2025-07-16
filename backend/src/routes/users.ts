import { Router } from 'express';
import { Database } from '../database/Database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

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
        MAX(b.placed_at) as last_bet_date
      FROM users u
      LEFT JOIN bets b ON u.id = b.user_id
      LEFT JOIN predictions p ON u.id = p.user_id
      WHERE u.role = 'user'
    `;

    const params: (string | number)[] = [];
    
    if (search) {
      sql += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
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

export default router;
