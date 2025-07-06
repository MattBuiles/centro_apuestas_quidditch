import { Router } from 'express';
import { Match } from '../types';

const router = Router();

// Mock data para desarrollo - en un caso real esto vendría de la base de datos
const generateMockMatches = (): Match[] => {
  const teams = [
    { id: 'gryffindor', name: 'Gryffindor' },
    { id: 'slytherin', name: 'Slytherin' }, 
    { id: 'ravenclaw', name: 'Ravenclaw' },
    { id: 'hufflepuff', name: 'Hufflepuff' },
    { id: 'chudley-cannons', name: 'Chudley Cannons' },
    { id: 'holyhead-harpies', name: 'Holyhead Harpies' }
  ];

  const matches: Match[] = [];
  const currentDate = new Date();

  // Generar partidos de ejemplo
  for (let i = 0; i < 10; i++) {
    const homeTeam = teams[Math.floor(Math.random() * teams.length)];
    let awayTeam = teams[Math.floor(Math.random() * teams.length)];
    while (awayTeam.id === homeTeam.id) {
      awayTeam = teams[Math.floor(Math.random() * teams.length)];
    }

    const matchDate = new Date(currentDate.getTime() + (Math.random() * 30 - 15) * 24 * 60 * 60 * 1000);
    const isPast = matchDate < currentDate;
    const isLive = !isPast && Math.random() < 0.1; // 10% chance de estar en vivo

    const status = isPast ? 'finished' : isLive ? 'live' : 'scheduled';
    const homeScore = isPast || isLive ? Math.floor(Math.random() * 200) + 50 : 0;
    const awayScore = isPast || isLive ? Math.floor(Math.random() * 200) + 50 : 0;

    matches.push({
      id: `match-${i + 1}`,
      seasonId: 'season-2024',
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      date: matchDate,
      status,
      homeScore,
      awayScore,
      duration: isPast ? Math.floor(Math.random() * 60) + 30 : undefined,
      snitchCaught: isPast && Math.random() < 0.8,
      snitchCaughtBy: isPast && Math.random() < 0.8 ? (Math.random() < 0.5 ? homeTeam.id : awayTeam.id) : undefined,
      events: [],
      odds: {
        homeWin: 1.5 + Math.random() * 2,
        awayWin: 1.5 + Math.random() * 2,
        draw: 5.0 + Math.random() * 5,
        totalPoints: {
          over150: 1.8 + Math.random() * 0.4,
          under150: 1.8 + Math.random() * 0.4
        },
        snitchCatch: {
          home: 1.9 + Math.random() * 0.2,
          away: 1.9 + Math.random() * 0.2
        }
      }
    });
  }

  return matches.sort((a, b) => a.date.getTime() - b.date.getTime());
};

// GET /api/matches - Obtener todos los partidos
router.get('/', (req, res) => {
  try {
    const matches = generateMockMatches();
    
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

// GET /api/matches/:id - Obtener un partido específico
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const matches = generateMockMatches();
    const match = matches.find(m => m.id === id);

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found',
        message: `Match with ID ${id} does not exist`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: match,
      message: 'Match retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve match',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/matches/status/live - Obtener partidos en vivo
router.get('/status/live', (req, res) => {
  try {
    const matches = generateMockMatches();
    const liveMatches = matches.filter(m => m.status === 'live');
    
    res.json({
      success: true,
      data: liveMatches,
      message: 'Live matches retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching live matches:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve live matches',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/matches/status/upcoming - Obtener próximos partidos
router.get('/status/upcoming', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const matches = generateMockMatches();
    const upcomingMatches = matches
      .filter(m => m.status === 'scheduled')
      .slice(0, parseInt(limit as string));
    
    res.json({
      success: true,
      data: upcomingMatches,
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

export default router;
