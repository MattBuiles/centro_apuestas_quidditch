import { Router } from 'express';
import { Database } from '../database/Database';
import { SeasonController } from '../controllers/SeasonController';

interface TeamRow {
  colors?: string;
  achievements?: string;
  [key: string]: unknown;
}

interface PlayerRow {
  achievements?: string;
  [key: string]: unknown;
}

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

// Get cumulative stats for all teams from standings table (debe ir antes de /:id)
router.get('/cumulative-stats', seasonController.getCumulativeTeamStats);

// Get historical stats for all teams (debe ir antes de /:id)
router.get('/historical-stats', seasonController.getHistoricalTeamStats);

// Get team by ID
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const db = Database.getInstance();
    const teamId = req.params.id;
    
    // Get complete team information using the new methods
    const team = await db.getTeamStatistics(teamId);
    
    if (!team) {
      res.status(404).json({
        success: false,
        error: 'Team not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get team players
    const players = await db.getTeamPlayers(teamId);
    const startingLineup = await db.getTeamStartingLineup(teamId);

    // Parse JSON fields
    const teamData = {
      ...(team as object),
      colors: JSON.parse((team as TeamRow).colors || '[]'),
      achievements: JSON.parse((team as TeamRow).achievements || '[]'),
      players: players.map(player => ({
        ...(player as object),
        achievements: JSON.parse((player as PlayerRow).achievements || '[]')
      })),
      startingLineup: startingLineup.map(player => ({
        ...(player as object),
        achievements: JSON.parse((player as PlayerRow).achievements || '[]')
      }))
    };

    res.json({
      success: true,
      data: teamData,
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

// Get team players
router.get('/:id/players', async (req, res): Promise<void> => {
  try {
    const db = Database.getInstance();
    const teamId = req.params.id;
    
    const players = await db.getTeamPlayers(teamId);
    
    // Parse JSON achievements for each player
    const playersData = players.map(player => ({
      ...(player as object),
      achievements: JSON.parse((player as PlayerRow).achievements || '[]')
    }));

    res.json({
      success: true,
      data: playersData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Team players fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team players',
      timestamp: new Date().toISOString()
    });
  }
});

// Get team starting lineup
router.get('/:id/lineup', async (req, res): Promise<void> => {
  try {
    const db = Database.getInstance();
    const teamId = req.params.id;
    
    const lineup = await db.getTeamStartingLineup(teamId);
    
    // Parse JSON achievements for each player
    const lineupData = lineup.map(player => ({
      ...(player as object),
      achievements: JSON.parse((player as PlayerRow).achievements || '[]')
    }));

    res.json({
      success: true,
      data: lineupData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Team lineup fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team lineup',
      timestamp: new Date().toISOString()
    });
  }
});

// Get players by position
router.get('/:id/players/:position', async (req, res): Promise<void> => {
  try {
    const db = Database.getInstance();
    const { id: teamId, position } = req.params;
    
    // Validate position
    const validPositions = ['keeper', 'seeker', 'beater', 'chaser'];
    if (!validPositions.includes(position)) {
      res.status(400).json({
        success: false,
        error: 'Invalid position. Must be one of: keeper, seeker, beater, chaser',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    const players = await db.getPlayersByPosition(teamId, position);
    
    // Parse JSON achievements for each player
    const playersData = players.map(player => ({
      ...(player as object),
      achievements: JSON.parse((player as PlayerRow).achievements || '[]')
    }));

    res.json({
      success: true,
      data: playersData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Team position players fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch players by position',
      timestamp: new Date().toISOString()
    });
  }
});

// Get historical stats for specific team
router.get('/:teamId/historical-stats', seasonController.getTeamHistoricalStats);

export default router;
