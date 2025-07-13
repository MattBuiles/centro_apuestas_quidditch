import { apiClient } from '../utils/apiClient';
import { Match, EventType } from '../types/league';
import { FEATURES } from '../config/features';

// Tipo para las respuestas del backend
interface BackendMatch {
  id: string;
  seasonId?: string;
  season_id?: string;
  homeTeamId?: string;
  home_team_id?: string;
  awayTeamId?: string;
  away_team_id?: string;
  date: string;
  status: 'scheduled' | 'live' | 'finished' | 'postponed';
  homeScore?: number;
  home_score?: number;
  awayScore?: number;
  away_score?: number;
  snitchCaught?: boolean;
  snitch_caught?: boolean;
  snitchCaughtBy?: string;
  snitch_caught_by?: string;
  duration?: number;
  // Additional fields from database joins
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  seasonName?: string;
  events: Array<{
    id: string;
    matchId: string;
    match_id?: string;
    minute: number;
    type: string;
    team: string;
    player?: string;
    description: string;
    points: number;
  }>;
}

// Método eliminado: generateMockMatches - Ya no se usan datos mock

// Convertir match del backend al formato frontend
const adaptBackendMatch = (backendMatch: BackendMatch): Match => {
  // Handle both camelCase and snake_case field names from backend
  const homeTeamId = backendMatch.homeTeamId || backendMatch.home_team_id;
  const awayTeamId = backendMatch.awayTeamId || backendMatch.away_team_id;
  const homeScore = backendMatch.homeScore ?? backendMatch.home_score ?? 0;
  const awayScore = backendMatch.awayScore ?? backendMatch.away_score ?? 0;
  const snitchCaught = backendMatch.snitchCaught ?? backendMatch.snitch_caught ?? false;

  // Debug logging to see what we receive from backend
  if (FEATURES.DEBUG_API) {
    console.log('🔍 Backend match data received:', {
      id: backendMatch.id,
      homeTeamId,
      awayTeamId,
      status: backendMatch.status,
      rawHomeTeamId: backendMatch.homeTeamId,
      rawHomeTeamIdSnake: backendMatch.home_team_id,
      rawAwayTeamId: backendMatch.awayTeamId,
      rawAwayTeamIdSnake: backendMatch.away_team_id,
    });
  }

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
    localId: homeTeamId || '',
    visitanteId: awayTeamId || '',
    homeTeamId: homeTeamId || '',
    awayTeamId: awayTeamId || '',
    fecha: new Date(backendMatch.date),
    date: new Date(backendMatch.date),
    eventos: adaptedEvents,
    events: adaptedEvents,
    status: backendMatch.status,
    homeScore: homeScore,
    awayScore: awayScore,
    duration: backendMatch.duration || 0,
    round: 1, // TODO: agregar al backend
    matchday: 1, // TODO: agregar al backend
    venue: `Stadium`, // TODO: agregar al backend
    attendance: Math.floor(Math.random() * 50000) + 10000, // TODO: agregar al backend
    weather: 'sunny', // TODO: agregar al backend
    snitchCaught: snitchCaught,
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
      throw new Error('Backend unavailable - matches cannot be retrieved');
    }
  } else {
    throw new Error('Backend API is disabled - matches cannot be retrieved');
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
      throw new Error(`Match ${matchId} not found or backend unavailable`);
    }
  } else {
    throw new Error('Backend API is disabled - matches cannot be retrieved');
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
      throw new Error('Live matches cannot be retrieved - backend unavailable');
    }
  } else {
    throw new Error('Backend API is disabled - live matches cannot be retrieved');
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
      throw new Error('Upcoming matches cannot be retrieved - backend unavailable');
    }
  } else {
    throw new Error('Backend API is disabled - upcoming matches cannot be retrieved');
  }
};

// Obtener el próximo partido no simulado
export const getNextUnplayedMatch = async (virtualTime?: string): Promise<Match | null> => {
  if (FEATURES.USE_BACKEND_MATCHES) {
    try {
      if (FEATURES.DEBUG_API) {
        console.log('🔄 Fetching next unplayed match from backend...');
      }

      const queryParam = virtualTime ? `?virtualTime=${encodeURIComponent(virtualTime)}` : '';
      const response = await apiClient.get<BackendMatch>(`/matches/next-unplayed${queryParam}`);
      
      if (response.success && response.data) {
        if (FEATURES.DEBUG_API) {
          console.log('✅ Next unplayed match fetched from backend:', response.data.id);
        }
        return adaptBackendMatch(response.data);
      } else if (response.success && response.data === null) {
        // No unplayed matches found
        if (FEATURES.DEBUG_API) {
          console.log('✅ No unplayed matches found');
        }
        return null;
      } else {
        throw new Error('Backend response was not successful');
      }
    } catch (error) {
      console.error('❌ Error fetching next unplayed match from backend:', error);
      throw new Error('Next unplayed match cannot be retrieved - backend unavailable');
    }
  } else {
    throw new Error('Backend API is disabled - next unplayed match cannot be retrieved');
  }
};

// Obtener alineaciones de un partido
export const getMatchLineups = async (matchId: string) => {
  if (FEATURES.USE_BACKEND_MATCHES) {
    try {
      console.log(`🔄 Fetching lineups for match ${matchId}...`);
      const response = await apiClient.get(`/matches/${matchId}/lineups`);
      
      if (response.success && response.data) {
        console.log('✅ Match lineups fetched from backend');
        return response.data;
      } else {
        throw new Error('Backend response was not successful');
      }
    } catch (error) {
      console.error(`❌ Error fetching lineups for match ${matchId}:`, error);
      throw new Error('Match lineups cannot be retrieved - backend unavailable');
    }
  } else {
    throw new Error('Backend API is disabled - match lineups cannot be retrieved');
  }
};

// Obtener eventos de un partido
export const getMatchEvents = async (matchId: string) => {
  if (FEATURES.USE_BACKEND_MATCHES) {
    try {
      console.log(`🔄 Fetching events for match ${matchId}...`);
      const response = await apiClient.get(`/matches/${matchId}/events`);
      
      if (response.success && response.data) {
        console.log('✅ Match events fetched from backend');
        return response.data;
      } else {
        throw new Error('Backend response was not successful');
      }
    } catch (error) {
      console.error(`❌ Error fetching events for match ${matchId}:`, error);
      throw new Error('Match events cannot be retrieved - backend unavailable');
    }
  } else {
    throw new Error('Backend API is disabled - match events cannot be retrieved');
  }
};

// Obtener partidos relacionados (próximos partidos de los equipos involucrados)
export const getRelatedMatches = async (homeTeamId: string, awayTeamId: string): Promise<Match[]> => {
  // Por ahora, generar datos mock ya que no tenemos endpoint específico para esto
  return generateMockRelatedMatches(homeTeamId, awayTeamId);
};

// Generar partidos relacionados mock como fallback
const generateMockRelatedMatches = (homeTeamId: string, awayTeamId: string): Match[] => {
  const teamIds = ['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'];
  const otherTeams = teamIds.filter(id => id !== homeTeamId && id !== awayTeamId);
  
  const mockMatches: Match[] = [];
  
  // Generar próximos partidos para ambos equipos
  for (let i = 1; i <= 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() + (i * 7)); // Cada semana
    
    const opponent = otherTeams[Math.floor(Math.random() * otherTeams.length)];
    const isHomeTeamMatch = i <= 3;
    const teamId = isHomeTeamMatch ? homeTeamId : awayTeamId;
    
    mockMatches.push({
      id: `mock-related-${teamId}-${i}`,
      localId: teamId,
      visitanteId: opponent,
      fecha: date,
      homeTeamId: teamId,
      awayTeamId: opponent,
      date: date,
      status: 'scheduled',
      homeScore: 0,
      awayScore: 0,
      duration: 0,
      round: 1,
      matchday: i,
      snitchCaught: false,
      eventos: [],
      events: []
    });
  }
  
  return mockMatches;
};
