import { Router } from 'express';
import { LeagueTimeController } from '../controllers/LeagueTimeController';
import { authenticate } from '../middleware/auth';

const router = Router();
const leagueTimeController = new LeagueTimeController();

// GET /api/league-time - Get comprehensive league time information
router.get('/', leagueTimeController.getLeagueTimeInfo);

// POST /api/league-time/advance - Advance league time with automatic management (requires authentication)
router.post('/advance', authenticate, leagueTimeController.advanceLeagueTime);

// POST /api/league-time/advance-to-next-match - Advance to next unplayed match (requires authentication)
router.post('/advance-to-next-match', authenticate, leagueTimeController.advanceToNextMatch);

// POST /api/league-time/generate-season - Generate a new season automatically (requires authentication)
router.post('/generate-season', authenticate, leagueTimeController.generateSeason);

// POST /api/league-time/reset-database - Reset database for new season (requires authentication)
router.post('/reset-database', authenticate, leagueTimeController.resetDatabase);

export default router;
