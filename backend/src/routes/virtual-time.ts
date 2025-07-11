import { Router } from 'express';
import { VirtualTimeController } from '../controllers/VirtualTimeController';
import { authenticate } from '../middleware/auth';

const router = Router();
const virtualTimeController = new VirtualTimeController();

// GET /api/virtual-time/current - Get current virtual time state
router.get('/current', virtualTimeController.getCurrentTime);

// GET /api/virtual-time/active-season - Get active season
router.get('/active-season', virtualTimeController.getActiveSeason);

// GET /api/virtual-time/upcoming-seasons - Get upcoming seasons
router.get('/upcoming-seasons', virtualTimeController.getUpcomingSeasons);

// GET /api/virtual-time/season-progression - Get season progression
router.get('/season-progression', virtualTimeController.getSeasonProgression);

// POST /api/virtual-time/advance - Advance virtual time (requires authentication)
router.post('/advance', authenticate, virtualTimeController.advanceTime);

// PUT /api/virtual-time/settings - Update virtual time settings (requires authentication)
router.put('/settings', authenticate, virtualTimeController.updateSettings);

// POST /api/virtual-time/create-season - Create new season with virtual time integration (requires authentication)
router.post('/create-season', authenticate, virtualTimeController.createSeasonWithTime);

// POST /api/virtual-time/reset - Reset virtual time to real time (requires authentication)
router.post('/reset', authenticate, virtualTimeController.resetTime);

export default router;
