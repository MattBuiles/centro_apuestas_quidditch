import { Router } from 'express';
import { Database } from '../database/Database';
import { MatchSimulationService } from '../services/MatchSimulationService';

const router = Router();
const matchSimulationService = new MatchSimulationService();

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

// GET /api/matches/:id/simulation-status - Get match simulation status
router.get('/:id/simulation-status', async (req, res) => {
  try {
    const { id } = req.params;
    const status = await matchSimulationService.getMatchSimulationStatus(id);
    
    return res.json({
      success: true,
      data: status,
      message: 'Match simulation status retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting match simulation status:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve match simulation status',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/matches/:id/iniciar-simulacion - Start match simulation
router.post('/:id/iniciar-simulacion', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el partido existe
    const db = Database.getInstance();
    const match = await db.getMatchById(id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found',
        message: 'The specified match does not exist',
        timestamp: new Date().toISOString()
      });
    }

    // Verificar que el partido no ha sido jugado
    const matchData = match as { status: string };
    if (matchData.status === 'finished') {
      return res.status(400).json({
        success: false,
        error: 'Match already finished',
        message: 'Cannot simulate a match that has already been finished',
        timestamp: new Date().toISOString()
      });
    }

    // Verificar que el partido esté en estado 'live' o 'scheduled'
    if (matchData.status !== 'live' && matchData.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        error: 'Invalid match status',
        message: `Match must be in 'live' or 'scheduled' status to start simulation. Current status: ${matchData.status}`,
        timestamp: new Date().toISOString()
      });
    }

    // Iniciar simulación
    await matchSimulationService.startMatchSimulation(id);

    return res.json({
      success: true,
      message: 'Match simulation started successfully',
      data: {
        matchId: id,
        status: 'live',
        simulationStarted: true
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error starting match simulation:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to start match simulation',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/matches/:id/finish - Finish match and save results
router.post('/:id/finish', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      homeScore,
      awayScore,
      events,
      duration,
      snitchCaught,
      snitchCaughtBy,
      finishedAt
    } = req.body;
    
    // Verificar que el partido existe
    const db = Database.getInstance();
    const match = await db.getMatchById(id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found',
        message: 'The specified match does not exist',
        timestamp: new Date().toISOString()
      });
    }

    // Preparar los datos del resultado
    const matchResult = {
      homeScore: homeScore || 0,
      awayScore: awayScore || 0,
      duration: duration || 0,
      snitchCaught: snitchCaught || false,
      snitchCaughtBy: snitchCaughtBy || '',
      events: events || [],
      finishedAt: finishedAt || new Date().toISOString()
    };

    // Finalizar el partido
    await db.finishMatch(id, matchResult);

    console.log(`✅ Match ${id} finished and saved:`, {
      homeScore: matchResult.homeScore,
      awayScore: matchResult.awayScore,
      events: matchResult.events.length,
      duration: matchResult.duration,
      snitchCaught: matchResult.snitchCaught
    });

    return res.json({
      success: true,
      message: 'Match finished and results saved successfully',
      data: {
        matchId: id,
        homeScore: matchResult.homeScore,
        awayScore: matchResult.awayScore,
        status: 'finished',
        events: matchResult.events.length,
        duration: matchResult.duration,
        finishedAt: matchResult.finishedAt
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error finishing match:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to finish match',
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

export default router;
