import { Router } from 'express';
import { SeasonController } from '../controllers/SeasonController';

const router = Router();
const seasonController = new SeasonController();

// GET /api/seasons - Get all seasons
router.get('/', seasonController.getAllSeasons);

// GET /api/seasons/current - Get current active season
router.get('/current', seasonController.getCurrentSeason);

// GET /api/seasons/league-time - Get league time information
router.get('/league-time', seasonController.getLeagueTime);

// GET /api/seasons/check-completion - Check and finish season if all matches are completed
router.get('/check-completion', seasonController.checkSeasonCompletion);

// GET /api/standings/current - Get current season standings
router.get('/standings/current', seasonController.getCurrentStandings);

// GET /api/seasons/:id/standings - Get standings for specific season
router.get('/:id/standings', seasonController.getSeasonStandings);

// GET /api/seasons/:id - Get specific season
router.get('/:id', seasonController.getSeasonById);

// POST /api/seasons - Create new season
router.post('/', seasonController.createSeason);

// PUT /api/seasons/:id/activate - Activate season
router.put('/:id/activate', seasonController.activateSeason);

export default router;
