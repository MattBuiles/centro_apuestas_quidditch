import { Router } from 'express';
import { Database } from '../database/Database';
import { ApiResponse } from '../types';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const db = Database.getInstance();

// GET /api/bets - Get all bets (admin only) or user bets
router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    
    if (user.role === 'admin') {
      // Admin gets all bets with pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const offset = (page - 1) * limit;

      let sql = `
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
      `;

      const params: any[] = [];
      if (status && status !== 'all') {
        sql += ' WHERE b.status = ?';
        params.push(status);
      }

      sql += ' ORDER BY b.placed_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const bets = await db.all(sql, params);
      const totalBets = await db.get('SELECT COUNT(*) as count FROM bets' + (status && status !== 'all' ? ' WHERE status = ?' : ''), 
                                    status && status !== 'all' ? [status] : []) as any;

      return res.json({
        success: true,
        data: {
          data: bets,
          count: totalBets.count,
          page,
          limit,
          totalPages: Math.ceil(totalBets.count / limit)
        },
        timestamp: new Date().toISOString()
      });
    } else {
      // Regular user gets only their bets
      const bets = await db.getBetsByUser(user.userId);
      return res.json({
        success: true,
        data: bets,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error fetching bets:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/bets - Create a new bet
router.post('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { matchId, type, prediction, odds, amount } = req.body;

    // Validate required fields
    if (!matchId || !type || !prediction || !odds || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        timestamp: new Date().toISOString()
      });
    }

    // Check user balance
    const userRecord = await db.getUserById(user.userId) as any;
    if (!userRecord || userRecord.balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        timestamp: new Date().toISOString()
      });
    }

    // Check daily betting limit (3 bets per day)
    const { VirtualTimeService } = await import('../services/VirtualTimeService');
    const virtualTimeService = VirtualTimeService.getInstance();
    await virtualTimeService.initialize();
    const currentState = await virtualTimeService.getCurrentState();
    const virtualDate = currentState.currentDate.toISOString();
    
    const dailyBetsCount = await db.getUserDailyBetsCount(user.userId, virtualDate);
    if (dailyBetsCount >= 3) {
      return res.status(400).json({
        success: false,
        error: 'Daily betting limit reached. You can only place 3 bets per day.',
        timestamp: new Date().toISOString()
      });
    }

    // Verify match exists and is bettable
    const match = await db.getMatchById(matchId) as any;
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }

    if (match.status === 'finished') {
      return res.status(400).json({
        success: false,
        error: 'Cannot place bet on finished match',
        timestamp: new Date().toISOString()
      });
    }

    const betId = uuidv4();
    const potentialWin = amount * odds;

    // Create bet
    await db.createBet({
      id: betId,
      userId: user.userId,
      matchId,
      type,
      prediction,
      odds,
      amount,
      potentialWin
    });

    // Update user balance
    const newBalance = userRecord.balance - amount;
    await db.updateUserBalance(user.userId, newBalance);

    // Create transaction record
    const transactionId = uuidv4();
    await db.createTransaction({
      id: transactionId,
      userId: user.userId,
      type: 'bet_placed',
      amount: -amount,
      balanceBefore: userRecord.balance,
      balanceAfter: newBalance,
      description: `Bet placed on ${match.homeTeamName} vs ${match.awayTeamName}`,
      referenceId: betId
    });

    return res.status(201).json({
      success: true,
      data: {
        id: betId,
        matchId,
        type,
        prediction,
        odds,
        amount,
        potentialWin,
        status: 'pending'
      },
      message: 'Bet placed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating bet:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/bets/statistics - Get betting statistics (admin only)
router.get('/statistics', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        timestamp: new Date().toISOString()
      });
    }

    const [generalStats, topUsers, topMatches, betTypeStats] = await Promise.all([
      db.getBetStatistics(),
      db.getTopUsersByBets(10),
      db.getTopMatchesByBets(10),
      db.getBetTypeStatistics()
    ]);

    return res.json({
      success: true,
      data: {
        general: generalStats,
        topUsers,
        topMatches,
        betTypes: betTypeStats
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching bet statistics:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/bets/daily-count - Get user's daily bets count
router.get('/daily-count', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    console.log('🔄 Daily count request for user:', user.userId);
    
    // Get current virtual time
    const { VirtualTimeService } = await import('../services/VirtualTimeService');
    const virtualTimeService = VirtualTimeService.getInstance();
    await virtualTimeService.initialize();
    const currentState = await virtualTimeService.getCurrentState();
    const virtualDate = currentState.currentDate.toISOString();
    
    console.log('📅 Virtual date for count:', virtualDate);
    
    // Get user's daily bets count
    const dailyCount = await db.getUserDailyBetsCount(user.userId, virtualDate);
    
    console.log('📊 Daily bets count for user', user.userId, ':', dailyCount);
    
    const responseData = {
      dailyCount,
      maxDaily: 3,
      remaining: Math.max(0, 3 - dailyCount),
      canBet: dailyCount < 3,
      virtualDate: virtualDate.split('T')[0] // Return just the date part
    };
    
    console.log('📤 Sending response:', responseData);
    
    return res.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching daily bets count:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/bets/daily-stats - Get daily betting statistics (admin only)
router.get('/daily-stats', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        timestamp: new Date().toISOString()
      });
    }

    const startDate = req.query.startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = req.query.endDate as string || new Date().toISOString().split('T')[0];

    const dailyStats = await db.getBetStatisticsByDateRange(startDate, endDate);

    return res.json({
      success: true,
      data: dailyStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching daily statistics:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
