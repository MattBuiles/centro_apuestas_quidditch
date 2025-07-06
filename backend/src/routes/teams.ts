import { Router } from 'express';
import { Database } from '../database/Database';

const router = Router();

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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teams',
      timestamp: new Date().toISOString()
    });
  }
});

// Get team by ID
router.get('/:id', async (req, res) => {
  try {
    const db = Database.getInstance();
    const team = await db.get('SELECT * FROM teams WHERE id = ?', [req.params.id]);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: team,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
