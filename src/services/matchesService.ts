import { apiClient } from '../utils/apiClient';
import { Match, EventType } from '../types/league';
import { FEATURES } from '../config/features';

// Tipo para las respuestas del backend
interface BackendMatch {
  id: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  status: 'scheduled' | 'live' | 'finished' | 'postponed';
  homeScore?: number;
  awayScore?: number;
  snitchCaught?: boolean;
  snitchCaughtBy?: string;
  duration?: number;
  events: Array<{
    id: string;
    matchId: string;
    minute: number;
    type: string;
    team: string;
    player?: string;
    description: string;
    points: number;
  }>;
}

// Mock data para fallback cuando el backend no esté disponible
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

  for (let i = 0; i < 8; i++) {
    const homeTeam = teams[Math.floor(Math.random() * teams.length)];
    let awayTeam = teams[Math.floor(Math.random() * teams.length)];
    while (awayTeam.id === homeTeam.id) {
      awayTeam = teams[Math.floor(Math.random() * teams.length)];
    }

    const matchDate = new Date(currentDate.getTime() + (Math.random() * 30 - 15) * 24 * 60 * 60 * 1000);
    const isPast = matchDate < currentDate;
    const isLive = !isPast && Math.random() < 0.15;

    const status = isPast ? 'finished' : isLive ? 'live' : 'scheduled';
    const homeScore = isPast || isLive ? Math.floor(Math.random() * 200) + 50 : 0;
    const awayScore = isPast || isLive ? Math.floor(Math.random() * 200) + 50 : 0;

    matches.push({
      id: `mock-match-${i + 1}`,
      localId: homeTeam.id,
      visitanteId: awayTeam.id,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      fecha: matchDate,
      date: matchDate,
      eventos: [],
      events: [],
      status,
      homeScore,
      awayScore,
      duration: isPast ? Math.floor(Math.random() * 60) + 30 : 0,
      round: Math.floor(i / 4) + 1,
      matchday: (i % 4) + 1,
      venue: `${homeTeam.name} Stadium`,
      attendance: Math.floor(Math.random() * 50000) + 10000,
      weather: 'sunny',
      snitchCaught: isPast && Math.random() < 0.8,
      snitchCaughtAt: isPast && Math.random() < 0.8 ? Math.floor(Math.random() * 60) + 10 : undefined,
      currentMinute: isLive ? Math.floor(Math.random() * 90) + 1 : undefined,
      isLive: isLive
    });
  }

  return matches.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
};

// Convertir match del backend al formato frontend
const adaptBackendMatch = (backendMatch: BackendMatch): Match => {
  // Convertir eventos del backend al formato frontend
  const adaptedEvents = (backendMatch.events || []).map(event => ({
    id: event.id,
    type: event.type as EventType, // Convertir al tipo de evento del frontend
    minute: event.minute,
    second: 0, // El backend no tiene segundos aún
    teamId: event.team,
    description: event.description,
    points: event.points,
    success: true // Por defecto true
  }));

  return {
    id: backendMatch.id,
    localId: backendMatch.homeTeamId,
    visitanteId: backendMatch.awayTeamId,
    homeTeamId: backendMatch.homeTeamId,
    awayTeamId: backendMatch.awayTeamId,
    fecha: new Date(backendMatch.date),
    date: new Date(backendMatch.date),
    eventos: adaptedEvents,
    events: adaptedEvents,
    status: backendMatch.status,
    homeScore: backendMatch.homeScore || 0,
    awayScore: backendMatch.awayScore || 0,
    duration: backendMatch.duration || 0,
    round: 1, // TODO: agregar al backend
    matchday: 1, // TODO: agregar al backend
    venue: `Stadium`, // TODO: agregar al backend
    attendance: Math.floor(Math.random() * 50000) + 10000, // TODO: agregar al backend
    weather: 'sunny', // TODO: agregar al backend
    snitchCaught: backendMatch.snitchCaught || false,
    snitchCaughtAt: undefined, // TODO: agregar al backend
    currentMinute: undefined, // TODO: agregar al backend para partidos en vivo
    isLive: backendMatch.status === 'live'
  };
};

export const getMatches = async (): Promise<Match[]> => {
  if (FEATURES.USE_BACKEND_MATCHES) {
    try {
      if (FEATURES.DEBUG_API) {
        console.log('🔄 Fetching matches from backend...');
      }

      const response = await apiClient.get<BackendMatch[]>('/matches');
      
      if (response.success && response.data) {
        if (FEATURES.DEBUG_API) {
          console.log('✅ Matches fetched from backend:', response.data.length);
        }
        return response.data.map(adaptBackendMatch);
      } else {
        throw new Error('Backend response was not successful');
      }
    } catch (error) {
      console.error('❌ Error fetching matches from backend:', error);
      
      if (FEATURES.SHOW_FALLBACK_MESSAGES) {
        console.warn('🔄 Falling back to local mock data for matches');
      }
      
      return generateMockMatches();
    }
  } else {
    if (FEATURES.DEBUG_API) {
      console.log('📍 Using local mock data for matches (backend disabled)');
    }
    return generateMockMatches();
  }
};

export const getMatchDetails = async (matchId: string): Promise<Match | null> => {
  if (FEATURES.USE_BACKEND_MATCHES) {
    try {
      if (FEATURES.DEBUG_API) {
        console.log(`🔄 Fetching match details for ${matchId} from backend...`);
      }

      const response = await apiClient.get<BackendMatch>(`/matches/${matchId}`);
      
      if (response.success && response.data) {
        if (FEATURES.DEBUG_API) {
          console.log('✅ Match details fetched from backend:', response.data.id);
        }
        return adaptBackendMatch(response.data);
      } else {
        throw new Error('Backend response was not successful');
      }
    } catch (error) {
      console.error(`❌ Error fetching match details for ${matchId}:`, error);
      
      if (FEATURES.SHOW_FALLBACK_MESSAGES) {
        console.warn('🔄 Falling back to local mock data for match details');
      }
      
      // Fallback: buscar en datos locales
      const localMatches = generateMockMatches();
      return localMatches.find(m => m.id === matchId) || null;
    }
  } else {
    if (FEATURES.DEBUG_API) {
      console.log(`📍 Using local mock data for match ${matchId} (backend disabled)`);
    }
    
    const localMatches = generateMockMatches();
    return localMatches.find(m => m.id === matchId) || null;
  }
};

// Obtener partidos en vivo
export const getLiveMatches = async (): Promise<Match[]> => {
  if (FEATURES.USE_BACKEND_MATCHES) {
    try {
      if (FEATURES.DEBUG_API) {
        console.log('🔄 Fetching live matches from backend...');
      }

      const response = await apiClient.get<BackendMatch[]>('/matches/status/live');
      
      if (response.success && response.data) {
        if (FEATURES.DEBUG_API) {
          console.log('✅ Live matches fetched from backend:', response.data.length);
        }
        return response.data.map(adaptBackendMatch);
      } else {
        throw new Error('Backend response was not successful');
      }
    } catch (error) {
      console.error('❌ Error fetching live matches from backend:', error);
      
      if (FEATURES.SHOW_FALLBACK_MESSAGES) {
        console.warn('🔄 Falling back to local mock data for live matches');
      }
      
      const localMatches = generateMockMatches();
      return localMatches.filter(m => m.status === 'live');
    }
  } else {
    if (FEATURES.DEBUG_API) {
      console.log('📍 Using local mock data for live matches (backend disabled)');
    }
    
    const localMatches = generateMockMatches();
    return localMatches.filter(m => m.status === 'live');
  }
};

// Obtener próximos partidos
export const getUpcomingMatches = async (limit: number = 10): Promise<Match[]> => {
  if (FEATURES.USE_BACKEND_MATCHES) {
    try {
      if (FEATURES.DEBUG_API) {
        console.log(`🔄 Fetching ${limit} upcoming matches from backend...`);
      }

      const response = await apiClient.get<BackendMatch[]>(`/matches/status/upcoming?limit=${limit}`);
      
      if (response.success && response.data) {
        if (FEATURES.DEBUG_API) {
          console.log('✅ Upcoming matches fetched from backend:', response.data.length);
        }
        return response.data.map(adaptBackendMatch);
      } else {
        throw new Error('Backend response was not successful');
      }
    } catch (error) {
      console.error('❌ Error fetching upcoming matches from backend:', error);
      
      if (FEATURES.SHOW_FALLBACK_MESSAGES) {
        console.warn('🔄 Falling back to local mock data for upcoming matches');
      }
      
      const localMatches = generateMockMatches();
      return localMatches.filter(m => m.status === 'scheduled').slice(0, limit);
    }
  } else {
    if (FEATURES.DEBUG_API) {
      console.log(`📍 Using local mock data for ${limit} upcoming matches (backend disabled)`);
    }
    
    const localMatches = generateMockMatches();
    return localMatches.filter(m => m.status === 'scheduled').slice(0, limit);
  }
};
