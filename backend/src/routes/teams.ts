import { Router } from 'express';
import { Database } from '../database/Database';
import { SeasonController } from '../controllers/SeasonController';

const router = Router();
const seasonController = new SeasonController();

// Get all teams
router.get('/', async (req, res) => {
  try {
    const db = Database.getInstance();
    const teams = await db.all('SELECT * FROM teams ORDER BY name');
    
    res.json({
      success: true,
      data: teams,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Teams fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teams',
      timestamp: new Date().toISOString()
    });
  }
});

// Get team by ID
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const db = Database.getInstance();
    const team = await db.get('SELECT * FROM teams WHERE id = ?', [req.params.id]);
    
    if (!team) {
      res.status(404).json({
        success: false,
        error: 'Team not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      success: true,
      data: team,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Team fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team',
      timestamp: new Date().toISOString()
    });
  }
});

// Get historical stats for all teams
router.get('/historical-stats', seasonController.getHistoricalTeamStats);

// Get historical stats for specific team
router.get('/:teamId/historical-stats', seasonController.getTeamHistoricalStats);

export default router;
