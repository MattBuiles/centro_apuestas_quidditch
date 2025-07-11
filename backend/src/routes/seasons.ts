import { Router } from 'express';
import { SeasonController } from '../controllers/SeasonController';

const router = Router();
const seasonController = new SeasonController();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Seasons endpoint - implement CRUD operations',
    timestamp: new Date().toISOString()
  });
});

// GET /api/seasons/league-time - Get league time information
router.get('/league-time', seasonController.getLeagueTime);

export default router;
