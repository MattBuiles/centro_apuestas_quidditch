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

// Método eliminado: generateMockMatches - Ya no se usan datos mock

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
