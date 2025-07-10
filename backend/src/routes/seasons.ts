import { Router } from 'express';
import { SeasonController } from '../controllers/SeasonController';

const router = Router();
const seasonController = new SeasonController();

// GET /api/seasons - Get all seasons
router.get('/', seasonController.getAllSeasons);

// GET /api/seasons/current - Get current season
router.get('/current', seasonController.getCurrentSeason);

// GET /api/seasons/:id - Get specific season
router.get('/:id', seasonController.getSeasonById);

// GET /api/seasons/:id/standings - Get season standings
router.get('/:id/standings', seasonController.getSeasonStandings);

// GET /api/seasons/:id/matches - Get season matches
router.get('/:id/matches', seasonController.getSeasonMatches);

// POST /api/seasons - Create new season
router.post('/', seasonController.createSeason);

// PUT /api/seasons/:id/activate - Activate season
router.put('/:id/activate', seasonController.activateSeason);

export default router;
