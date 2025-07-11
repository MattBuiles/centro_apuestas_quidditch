import { Router } from 'express';
import { Database } from '../database/Database';

const router = Router();

// GET /api/matches - Get all matches
router.get('/', async (req, res) => {
  try {
    const db = Database.getInstance();
    const matches = await db.getAllMatches();
    
    res.json({
      success: true,
      data: matches,
      message: 'Matches retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve matches',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/matches/:id - Get specific match
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = Database.getInstance();
    const match = await db.getMatchById(id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found',
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      data: match,
      message: 'Match retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve match',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/matches/status/:status - Get matches by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const db = Database.getInstance();
    const matches = await db.getMatchesByStatus(status);
    
    res.json({
      success: true,
      data: matches,
      message: `${status} matches retrieved successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error fetching ${req.params.status} matches:`, error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: `Failed to retrieve ${req.params.status} matches`,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/matches/upcoming/:limit - Get upcoming matches with limit
router.get('/upcoming/:limit', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    const db = Database.getInstance();
    const matches = await db.getUpcomingMatches(limit);
    
    res.json({
      success: true,
      data: matches,
      message: 'Upcoming matches retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve upcoming matches',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/matches/next-unplayed - Get next unplayed match based on virtual time
router.get('/next-unplayed', async (req, res) => {
  try {
    const db = Database.getInstance();
    
    // Get current virtual time from league time service
    // For now, we'll use a query parameter or current time
    const currentVirtualTime = req.query.virtualTime as string || new Date().toISOString();
    
    const nextMatch = await db.getNextUnplayedMatch(currentVirtualTime);
    
    if (!nextMatch) {
      return res.json({
        success: true,
        data: null,
        message: 'No unplayed matches found',
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      data: nextMatch,
      message: 'Next unplayed match retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching next unplayed match:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve next unplayed match',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
