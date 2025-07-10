import { Router } from 'express';
import { MatchController } from '../controllers/MatchController';

const router = Router();
const matchController = new MatchController();

// GET /api/matches - Get all matches
router.get('/', matchController.getAllMatches);

// GET /api/matches/live - Get live matches
router.get('/live', matchController.getLiveMatches);

// GET /api/matches/upcoming - Get upcoming matches
router.get('/upcoming', matchController.getUpcomingMatches);

// GET /api/matches/virtual-time - Get virtual time state
router.get('/virtual-time', matchController.getVirtualTimeState);

// GET /api/matches/:id - Get specific match
router.get('/:id', matchController.getMatchById);

// POST /api/matches/:id/simulate - Simulate a match
router.post('/:id/simulate', matchController.simulateMatch);

// POST /api/matches/advance-time - Advance virtual time
router.post('/advance-time', matchController.advanceTime);

export default router;
