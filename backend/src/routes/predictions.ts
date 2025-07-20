import { Router } from 'express';
import { Database } from '../database/Database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const db = Database.getInstance();

// GET /api/predictions - Get all predictions (admin) or user predictions
router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    
    if (user.role === 'admin') {
      // Admin gets all predictions with pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const offset = (page - 1) * limit;

      let sql = `
        SELECT 
          p.*,
          u.username,
          m.date as matchDate,
          ht.name as homeTeamName,
          at.name as awayTeamName
        FROM predictions p
        JOIN users u ON p.user_id = u.id
        JOIN matches m ON p.match_id = m.id
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
      `;

      const params: (string | number)[] = [];
      if (status && status !== 'all') {
        sql += ' WHERE p.status = ?';
        params.push(status);
      }

      sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const predictions = await db.all(sql, params);
      
      // Get total count for pagination
      const totalQuery = 'SELECT COUNT(*) as count FROM predictions' + (status && status !== 'all' ? ' WHERE status = ?' : '');
      const totalParams = status && status !== 'all' ? [status] : [];
      const totalPredictions = await db.get(totalQuery, totalParams) as any;

      return res.json({
        success: true,
        data: {
          data: predictions,
          count: totalPredictions.count,
          page,
          limit,
          totalPages: Math.ceil(totalPredictions.count / limit)
        },
        timestamp: new Date().toISOString()
      });
    } else {
      // Regular user gets only their predictions
      const predictions = await db.getPredictionsByUser(user.userId);
      return res.json({
        success: true,
        data: predictions,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/predictions - Create a new prediction
router.post('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { matchId, prediction, confidence } = req.body;

    // Validate required fields
    if (!matchId || !prediction || !confidence) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        timestamp: new Date().toISOString()
      });
    }

    // Validate prediction value
    if (!['home', 'away', 'draw'].includes(prediction)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid prediction value',
        timestamp: new Date().toISOString()
      });
    }

    // Validate confidence level
    if (confidence < 1 || confidence > 5) {
      return res.status(400).json({
        success: false,
        error: 'Confidence must be between 1 and 5',
        timestamp: new Date().toISOString()
      });
    }

    // Verify match exists and is predictable
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
        error: 'Cannot predict on finished match',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user already has prediction for this match
    const existingPrediction = await db.getUserPredictionForMatch(user.userId, matchId);
    if (existingPrediction) {
      return res.status(400).json({
        success: false,
        error: 'You have already made a prediction for this match',
        timestamp: new Date().toISOString()
      });
    }

    const predictionId = uuidv4();

    // Create prediction
    await db.createPrediction({
      id: predictionId,
      userId: user.userId,
      matchId,
      prediction,
      confidence
    });

    return res.status(201).json({
      success: true,
      data: {
        id: predictionId,
        matchId,
        prediction,
        confidence,
        status: 'pending'
      },
      message: 'Prediction created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating prediction:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/predictions/match/:matchId - Get predictions for a specific match
router.get('/match/:matchId', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const matchId = req.params.matchId;
    const user = req.user!;

    if (user.role === 'admin') {
      // Admin can see all predictions for the match
      const predictions = await db.getPredictionsByMatch(matchId);
      return res.json({
        success: true,
        data: predictions,
        timestamp: new Date().toISOString()
      });
    } else {
      // Regular user can only see their own prediction
      const prediction = await db.getUserPredictionForMatch(user.userId, matchId);
      return res.json({
        success: true,
        data: prediction || null,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error fetching match predictions:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/predictions/statistics - Get prediction statistics (admin only)
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

    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_predictions,
        COUNT(CASE WHEN status = 'correct' THEN 1 END) as correct_predictions,
        COUNT(CASE WHEN status = 'incorrect' THEN 1 END) as incorrect_predictions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_predictions,
        AVG(confidence) as average_confidence,
        COUNT(CASE WHEN prediction = 'home' THEN 1 END) as home_predictions,
        COUNT(CASE WHEN prediction = 'away' THEN 1 END) as away_predictions,
        COUNT(CASE WHEN prediction = 'draw' THEN 1 END) as draw_predictions
      FROM predictions
    `);

    // Get top predictors
    const topPredictors = await db.all(`
      SELECT 
        u.username,
        COUNT(p.id) as total_predictions,
        COUNT(CASE WHEN p.status = 'correct' THEN 1 END) as correct_predictions,
        CASE 
          WHEN COUNT(p.id) > 0 
          THEN (COUNT(CASE WHEN p.status = 'correct' THEN 1 END) * 100.0 / COUNT(p.id))
          ELSE 0 
        END as accuracy_percentage
      FROM users u
      JOIN predictions p ON u.id = p.user_id
      WHERE u.role = 'user'
      GROUP BY u.id, u.username
      HAVING COUNT(p.id) >= 3
      ORDER BY accuracy_percentage DESC, total_predictions DESC
      LIMIT 10
    `);

    return res.json({
      success: true,
      data: {
        general: stats,
        topPredictors
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching prediction statistics:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/predictions/user/stats - Get user's prediction statistics
router.get('/user/stats', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;

    // Get user's prediction statistics
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_predictions,
        COUNT(CASE WHEN status = 'correct' THEN 1 END) as correct_predictions,
        COUNT(CASE WHEN status = 'incorrect' THEN 1 END) as incorrect_predictions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_predictions,
        CASE 
          WHEN COUNT(*) > 0 
          THEN (COUNT(CASE WHEN status = 'correct' THEN 1 END) * 100.0 / COUNT(*))
          ELSE 0 
        END as accuracy_percentage,
        SUM(points) as total_points,
        AVG(confidence) as average_confidence,
        COUNT(CASE WHEN prediction = 'home' THEN 1 END) as home_predictions,
        COUNT(CASE WHEN prediction = 'away' THEN 1 END) as away_predictions,
        COUNT(CASE WHEN prediction = 'draw' THEN 1 END) as draw_predictions
      FROM predictions 
      WHERE user_id = ?
    `, [user.userId]) as any;

    // Get recent predictions with match details
    const recentPredictions = await db.all(`
      SELECT 
        p.id,
        p.prediction,
        p.confidence,
        p.status,
        p.points,
        p.created_at,
        p.resolved_at,
        m.date as match_date,
        ht.name as home_team_name,
        at.name as away_team_name,
        m.home_score,
        m.away_score,
        m.status as match_status
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT 10
    `, [user.userId]);

    return res.json({
      success: true,
      data: {
        summary: {
          totalPredictions: stats?.total_predictions || 0,
          correctPredictions: stats?.correct_predictions || 0,
          incorrectPredictions: stats?.incorrect_predictions || 0,
          pendingPredictions: stats?.pending_predictions || 0,
          accuracyPercentage: Math.round((stats?.accuracy_percentage || 0) * 100) / 100,
          totalPoints: stats?.total_points || 0,
          averageConfidence: Math.round((stats?.average_confidence || 0) * 100) / 100,
          homePredictions: stats?.home_predictions || 0,
          awayPredictions: stats?.away_predictions || 0,
          drawPredictions: stats?.draw_predictions || 0
        },
        recentPredictions
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching user prediction stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/predictions/match/:matchId/stats - Get aggregated prediction statistics for a match
router.get('/match/:matchId/stats', async (req, res) => {
  try {
    const matchId = req.params.matchId;

    // Get aggregated statistics for the match
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_predictions,
        COUNT(CASE WHEN prediction = 'home' THEN 1 END) as home_predictions,
        COUNT(CASE WHEN prediction = 'away' THEN 1 END) as away_predictions,
        COUNT(CASE WHEN prediction = 'draw' THEN 1 END) as draw_predictions,
        AVG(confidence) as average_confidence
      FROM predictions 
      WHERE match_id = ?
    `, [matchId]) as any;

    // Calculate percentages
    const totalPredictions = stats?.total_predictions || 0;
    const homePercentage = totalPredictions > 0 ? (stats?.home_predictions / totalPredictions) * 100 : 0;
    const awayPercentage = totalPredictions > 0 ? (stats?.away_predictions / totalPredictions) * 100 : 0;
    const drawPercentage = totalPredictions > 0 ? (stats?.draw_predictions / totalPredictions) * 100 : 0;

    return res.json({
      success: true,
      data: {
        totalPredictions: totalPredictions,
        homeWinPredictions: stats?.home_predictions || 0,
        awayWinPredictions: stats?.away_predictions || 0,
        drawPredictions: stats?.draw_predictions || 0,
        homeWinPercentage: homePercentage,
        awayWinPercentage: awayPercentage,
        drawPercentage: drawPercentage,
        averageConfidence: stats?.average_confidence || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching match prediction stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
