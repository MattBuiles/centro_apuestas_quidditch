import { apiClient } from '../utils/apiClient';
import { FEATURES } from '../config/features';
import { Team } from '../types/league';

// Interface para la respuesta completa del backend
export interface BackendTeamResponse {
  id: string;
  name: string;
  logo: string;
  founded: number;
  description: string;
  stadium: string;
  colors: string[];
  slogan: string;
  history: string;
  titles: number;
  achievements: string[];
  matches_played: number;
  wins: number;
  losses: number;
  draws: number;
  points_for: number;
  points_against: number;
  snitch_catches: number;
  attack_strength: number;
  defense_strength: number;
  seeker_skill: number;
  keeper_skill: number;
  chaser_skill: number;
  beater_skill: number;
  win_percentage: number;
  point_difference: number;
  players?: Player[];
  startingLineup?: Player[];
}

export interface Player {
  id: string;
  name: string;
  position: 'keeper' | 'seeker' | 'beater' | 'chaser';
  skill_level: number;
  is_starting: boolean;
  number: number;
  years_active: number;
  achievements: string[];
}

interface TeamLineup {
  homeTeam: {
    team: BackendTeamResponse;
    lineup: Player[];
  };
  awayTeam: {
    team: BackendTeamResponse;
    lineup: Player[];
  };
}

// Interface para compatibilidad con detalles extendidos
interface TeamDetails extends Team {
  players?: Player[];
  startingLineup?: Player[];
  fullStats?: BackendTeamResponse;
}

// Datos locales como fallback
const LOCAL_TEAMS: Team[] = [
  {
    id: 'gryffindor',
    name: 'Gryffindor',
    house: 'Gryffindor',
    fuerzaAtaque: 85,
    fuerzaDefensa: 80,
    attackStrength: 85,
    defenseStrength: 80,
    seekerSkill: 90,
    chaserSkill: 85,
    keeperSkill: 80,
    beaterSkill: 75,
    logo: '/images/gryffindor-logo.png',
    colors: {
      primary: '#740001',
      secondary: '#D3A625'
    },
    venue: 'Campo de Quidditch de Hogwarts',
    founded: 990,
    slogan: 'Coraje, valentía y determinación'
  },
  {
    id: 'slytherin',
    name: 'Slytherin',
    house: 'Slytherin',
    fuerzaAtaque: 90,
    fuerzaDefensa: 85,
    attackStrength: 90,
    defenseStrength: 85,
    seekerSkill: 85,
    chaserSkill: 90,
    keeperSkill: 85,
    beaterSkill: 80,
    logo: '/images/slytherin-logo.png',
    colors: {
      primary: '#1A472A',
      secondary: '#AAAAAA'
    },
    venue: 'Campo de Quidditch de Hogwarts',
    founded: 990,
    slogan: 'Astucia, ambición y liderazgo'
  },
  {
    id: 'ravenclaw',
    name: 'Ravenclaw',
    house: 'Ravenclaw',
    fuerzaAtaque: 80,
    fuerzaDefensa: 90,
    attackStrength: 80,
    defenseStrength: 90,
    seekerSkill: 95,
    chaserSkill: 80,
    keeperSkill: 85,
    beaterSkill: 70,
    logo: '/images/ravenclaw-logo.png',
    colors: {
      primary: '#0E1A40',
      secondary: '#946B2D'
    },
    venue: 'Campo de Quidditch de Hogwarts',
    founded: 990,
    slogan: 'Sabiduría, ingenio e inteligencia'
  },
  {
    id: 'hufflepuff',
    name: 'Hufflepuff',
    house: 'Hufflepuff',
    fuerzaAtaque: 75,
    fuerzaDefensa: 95,
    attackStrength: 75,
    defenseStrength: 95,
    seekerSkill: 80,
    chaserSkill: 75,
    keeperSkill: 95,
    beaterSkill: 85,
    logo: '/images/hufflepuff-logo.png',
    colors: {
      primary: '#ECB939',
      secondary: '#372E29'
    },
    venue: 'Campo de Quidditch de Hogwarts',
    founded: 990,
    slogan: 'Lealtad, trabajo duro y paciencia'
  }
];

// Función para adaptar datos del backend al formato frontend
const adaptBackendTeam = (backendTeam: BackendTeamResponse): Team => {
  return {
    id: backendTeam.id,
    name: backendTeam.name,
    house: backendTeam.name, // Para compatibilidad
    fuerzaAtaque: backendTeam.attack_strength || 75,
    fuerzaDefensa: backendTeam.defense_strength || 75,
    attackStrength: backendTeam.attack_strength || 75,
    defenseStrength: backendTeam.defense_strength || 75,
    seekerSkill: backendTeam.seeker_skill || 75,
    chaserSkill: backendTeam.chaser_skill || 75,
    keeperSkill: backendTeam.keeper_skill || 75,
    beaterSkill: backendTeam.beater_skill || 75,
    logo: backendTeam.logo || '/images/default-logo.png',
    colors: backendTeam.colors ? {
      primary: backendTeam.colors[0] || '#000000',
      secondary: backendTeam.colors[1] || '#FFFFFF'
    } : {
      primary: '#000000',
      secondary: '#FFFFFF'
    },
    venue: backendTeam.stadium || 'Unknown Stadium',
    founded: backendTeam.founded || 0,
    slogan: backendTeam.slogan || ''
  };
};

// Función para obtener información completa de un equipo
export const getTeamDetails = async (teamId: string): Promise<TeamDetails | null> => {
  if (FEATURES.USE_BACKEND_TEAMS) {
    try {
      console.log(`🌐 Fetching team details for ${teamId}...`);
      const response = await apiClient.get<BackendTeamResponse>(`/teams/${teamId}`);
      
      if (response.success && response.data) {
        console.log('✅ Team details loaded from backend');
        const baseTeam = adaptBackendTeam(response.data);
        return {
          ...baseTeam,
          players: response.data.players || [],
          startingLineup: response.data.startingLineup || [],
          fullStats: response.data
        };
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch team details for ${teamId}:`, error);
    }
  }
  
  // Fallback to local data
  const localTeam = LOCAL_TEAMS.find(team => team.id === teamId);
  return localTeam ? { ...localTeam } : null;
};

// Función para obtener jugadores de un equipo
export const getTeamPlayers = async (teamId: string): Promise<Player[]> => {
  if (FEATURES.USE_BACKEND_TEAMS) {
    try {
      console.log(`🌐 Fetching players for team ${teamId}...`);
      const response = await apiClient.get<Player[]>(`/teams/${teamId}/players`);
      
      if (response.success && response.data) {
        console.log('✅ Team players loaded from backend');
        return response.data;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch players for ${teamId}:`, error);
    }
  }
  
  return []; // Return empty array as fallback
};

// Función para obtener alineación titular de un equipo
export const getTeamLineup = async (teamId: string): Promise<Player[]> => {
  if (FEATURES.USE_BACKEND_TEAMS) {
    try {
      console.log(`🌐 Fetching lineup for team ${teamId}...`);
      const response = await apiClient.get<Player[]>(`/teams/${teamId}/lineup`);
      
      if (response.success && response.data) {
        console.log('✅ Team lineup loaded from backend');
        return response.data;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch lineup for ${teamId}:`, error);
    }
  }
  
  return []; // Return empty array as fallback
};

// Función para obtener jugadores por posición
export const getPlayersByPosition = async (teamId: string, position: string): Promise<Player[]> => {
  if (FEATURES.USE_BACKEND_TEAMS) {
    try {
      console.log(`🌐 Fetching ${position} players for team ${teamId}...`);
      const response = await apiClient.get<Player[]>(`/teams/${teamId}/players/${position}`);
      
      if (response.success && response.data) {
        console.log(`✅ ${position} players loaded from backend`);
        return response.data;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch ${position} players for ${teamId}:`, error);
    }
  }
  
  return []; // Return empty array as fallback
};

// Interface para el historial de enfrentamientos
export interface HeadToHeadData {
  totalMatches: number;
  teamWins: number;
  opponentWins: number;
  draws: number;
  recentMatches: {
    id: string;
    result: 'W' | 'L' | 'D';
    teamScore: number;
    opponentScore: number;
    date: string;
    venue: string;
    status: string;
  }[];
  statistics: {
    teamAvgPoints: number;
    opponentAvgPoints: number;
    teamSnitchCatches: number;
    opponentSnitchCatches: number;
    teamHighScoring: number;
    opponentHighScoring: number;
  };
  legendaryMatches: {
    id: string;
    date: string;
    teamScore: number;
    opponentScore: number;
    venue: string;
    description: string;
    title: string;
  }[];
}

// Función para obtener historial de enfrentamientos entre dos equipos
export const getHeadToHeadData = async (teamId: string, opponentId: string): Promise<HeadToHeadData | null> => {
  if (FEATURES.USE_BACKEND_TEAMS) {
    try {
      console.log(`🌐 Fetching head-to-head data between ${teamId} and ${opponentId}...`);
      const response = await apiClient.get<HeadToHeadData>(`/teams/${teamId}/vs/${opponentId}`);
      
      if (response.success && response.data) {
        console.log('✅ Head-to-head data loaded from backend');
        return response.data;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch head-to-head data:`, error);
    }
  }
  
  // Fallback to mock data
  return {
    totalMatches: 14,
    teamWins: 7,
    opponentWins: 5,
    draws: 2,
    recentMatches: [
      { id: '1', result: 'W', teamScore: 180, opponentScore: 120, date: '2025-05-15', venue: 'Home', status: 'finished' },
      { id: '2', result: 'L', teamScore: 90, opponentScore: 150, date: '2025-03-22', venue: 'Away', status: 'finished' },
      { id: '3', result: 'W', teamScore: 200, opponentScore: 170, date: '2025-01-18', venue: 'Home', status: 'finished' },
      { id: '4', result: 'W', teamScore: 160, opponentScore: 130, date: '2024-11-25', venue: 'Neutral', status: 'finished' },
      { id: '5', result: 'L', teamScore: 110, opponentScore: 140, date: '2024-10-07', venue: 'Away', status: 'finished' }
    ],
    statistics: {
      teamAvgPoints: 145,
      opponentAvgPoints: 125,
      teamSnitchCatches: 8,
      opponentSnitchCatches: 6,
      teamHighScoring: 3,
      opponentHighScoring: 2
    },
    legendaryMatches: [
      {
        id: '1',
        date: '2024-06-15',
        teamScore: 230,
        opponentScore: 220,
        venue: 'Hogwarts',
        description: 'Un enfrentamiento épico que duró 4 horas. La Snitch fue capturada en el último minuto tras una persecución que recorrió todo el estadio.',
        title: 'La Final de los Milenios'
      },
      {
        id: '2',
        date: '2023-12-03',
        teamScore: 180,
        opponentScore: 30,
        venue: 'Slytherin Dungeons',
        description: 'Una demostración de dominación absoluta con 15 goles consecutivos antes de que la Snitch fuera capturada.',
        title: 'El Duelo de los Rayos'
      }
    ]
  };
};

// Servicio principal con backend + fallback
export const getTeams = async (): Promise<Team[]> => {
  // Si el backend está habilitado, intentar usarlo
  if (FEATURES.USE_BACKEND_TEAMS) {
    try {
      console.log('🌐 Fetching teams from backend...');
      const response = await apiClient.get<BackendTeamResponse[]>('/teams');
      
      if (response.success && response.data) {
        console.log('✅ Teams loaded from backend:', response.data.length);
        // Convertir datos del backend al formato frontend
        return response.data.map(adaptBackendTeam);
      }
    } catch (error) {
      console.warn('⚠️ Backend unavailable, using local teams:', error);
      if (FEATURES.SHOW_FALLBACK_MESSAGES) {
        // En desarrollo, mostrar mensaje de fallback
        console.log('🔄 Fallback: Using local team data');
      }
    }
  }
  
  // Fallback a datos locales
  console.log('📁 Using local teams data');
  return LOCAL_TEAMS;
};

// Método helper para verificar estado del backend
export const checkBackendStatus = async (): Promise<boolean> => {
  if (!FEATURES.USE_BACKEND_TEAMS) {
    return false;
  }
  
  try {
    return await apiClient.healthCheck();
  } catch {
    return false;
  }
};

// Export para compatibilidad con código existente
export { LOCAL_TEAMS as getLocalTeams };

// Interface para cronología de eventos del partido
export interface MatchChronology {
  matchId: string;
  events: MatchEvent[];
  keyEvents: KeyEvent[];
  matchDuration: number;
  finalScore: {
    home: number;
    away: number;
  };
}

export interface MatchEvent {
  id: string;
  minute: number;
  second?: number;
  timestamp: number;
  type: 'QUAFFLE_GOAL' | 'SNITCH_CAUGHT' | 'FOUL' | 'TIMEOUT' | 'INJURY' | 'BLUDGER_HIT' | 'SAVE';
  teamId: string;
  teamName: string;
  playerId?: string;
  playerName?: string;
  description: string;
  points: number;
  homeScore?: number;
  awayScore?: number;
  currentScore: {
    home: number;
    away: number;
  };
  details?: Record<string, unknown>;
}

export interface KeyEvent {
  id: string;
  minute: number;
  timestamp: number;
  type: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

// Función para obtener la cronología completa de un partido finalizado
export const getMatchChronology = async (matchId: string): Promise<MatchChronology | null> => {
  if (FEATURES.USE_BACKEND_MATCHES) {
    try {
      console.log(`🌐 Fetching match chronology for ${matchId}...`);
      
      // Obtener detalles del partido, eventos y equipos
      const [matchResponse, eventsResponse, teamsResponse] = await Promise.all([
        apiClient.get(`/matches/${matchId}`),
        apiClient.get(`/matches/${matchId}/events`),
        apiClient.get('/teams')
      ]);
      
      if (eventsResponse.success && eventsResponse.data && Array.isArray(eventsResponse.data)) {
        const rawEvents = eventsResponse.data;
        const matchData = matchResponse.success ? matchResponse.data : null;
        const teamsData = teamsResponse.success && teamsResponse.data ? teamsResponse.data : [];
        
        console.log('✅ Raw events from database:', rawEvents);
        console.log('✅ Teams data:', teamsData);
        
        // Crear un mapa de ID de equipo a nombre de equipo
        const teamNameMap: Record<string, string> = {};
        if (Array.isArray(teamsData)) {
          teamsData.forEach((team: any) => {
            teamNameMap[team.id] = team.name;
          });
        }
        
        console.log('✅ Team name mapping:', teamNameMap);
        
        // Transformar eventos de la base de datos al formato esperado
        const transformedEvents: MatchEvent[] = rawEvents.map((event: any, index: number) => ({
          id: event.id || `event-${index}`,
          minute: event.minute || 0,
          second: 0,
          timestamp: (event.minute || 0) * 60,
          type: event.type || 'QUAFFLE_GOAL',
          teamId: event.team || 'unknown',
          teamName: teamNameMap[event.team] || event.team || 'Equipo Desconocido',
          playerId: event.player || undefined,
          playerName: event.player || undefined,
          description: event.description || 'Evento sin descripción',
          points: event.points || 0,
          homeScore: undefined,
          awayScore: undefined,
          currentScore: { home: 0, away: 0 }, // Se calculará dinámicamente
          details: event.details || {}
        }));

        // Calcular puntajes acumulativos
        let homeScore = 0;
        let awayScore = 0;
        
        transformedEvents.forEach(event => {
          // Determinar si es equipo local o visitante basado en el ID del partido
          const matchInfo = matchData as any;
          const isHomeTeam = event.teamId === matchInfo?.home_team_id || 
                           event.teamId === matchInfo?.homeTeamId ||
                           event.teamId === matchInfo?.homeTeam;
          
          if (isHomeTeam) {
            homeScore += event.points;
          } else {
            awayScore += event.points;
          }
          
          event.homeScore = homeScore;
          event.awayScore = awayScore;
          event.currentScore = { home: homeScore, away: awayScore };
        });

        // Identificar eventos clave (goles, snitch dorada, etc.)
        const keyEvents: KeyEvent[] = transformedEvents
          .filter(event => 
            event.type === 'SNITCH_CAUGHT' || 
            event.points >= 10 ||
            event.type === 'FOUL'
          )
          .map(event => ({
            id: event.id,
            minute: event.minute,
            timestamp: event.timestamp,
            type: event.type,
            description: event.description,
            impact: event.type === 'SNITCH_CAUGHT' ? 'high' as const : 
                   event.points >= 10 ? 'medium' as const : 'low' as const
          }));

        const finalScore = transformedEvents.length > 0 
          ? transformedEvents[transformedEvents.length - 1].currentScore
          : { home: homeScore, away: awayScore };

        const chronology: MatchChronology = {
          matchId,
          events: transformedEvents,
          keyEvents,
          matchDuration: Math.max(...transformedEvents.map(e => e.minute), 0),
          finalScore
        };

        console.log('📊 Transformed chronology:', {
          eventsCount: chronology.events.length,
          keyEventsCount: chronology.keyEvents.length,
          duration: chronology.matchDuration,
          finalScore: chronology.finalScore
        });

        return chronology;
      } else {
        console.warn('❌ Backend response success but no events data:', eventsResponse);
        return null;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch match chronology for ${matchId}:`, error);
      return null;
    }
  }
  
  // Only return mock data for specific test matches
  if (matchId.includes('test') || matchId.includes('mock')) {
    return {
      matchId,
      events: [
        {
          id: 'evt-1',
          minute: 0,
          timestamp: 0,
          type: 'QUAFFLE_GOAL',
          teamId: 'home',
          teamName: 'Gryffindor',
          description: '🏃‍♂️ Inicio del duelo mágico',
          points: 0,
          homeScore: 0,
          awayScore: 0,
          currentScore: { home: 0, away: 0 }
        },
        {
          id: 'evt-2',
          minute: 15,
          timestamp: 900,
          type: 'QUAFFLE_GOAL',
          teamId: 'home',
          teamName: 'Gryffindor',
          description: '⚡ Gol de Quaffle por Harry Potter',
          points: 10,
          homeScore: 10,
          awayScore: 0,
          currentScore: { home: 10, away: 0 }
        },
        {
          id: 'evt-3',
          minute: 28,
          timestamp: 1680,
          type: 'QUAFFLE_GOAL',
          teamId: 'away',
          teamName: 'Slytherin',
          description: '🐍 Gol de Quaffle por Draco Malfoy',
          points: 10,
          homeScore: 10,
          awayScore: 10,
          currentScore: { home: 10, away: 10 }
        },
        {
          id: 'evt-4',
          minute: 45,
          timestamp: 2700,
          type: 'SNITCH_CAUGHT',
          teamId: 'home',
          teamName: 'Gryffindor',
          description: '🟡 Snitch capturada por Harry Potter - ¡Victoria para Gryffindor!',
          points: 150,
          homeScore: 160,
          awayScore: 10,
          currentScore: { home: 160, away: 10 }
        }
      ],
      keyEvents: [
        { 
          id: 'key-1',
          minute: 15, 
          type: 'FIRST_GOAL', 
          description: 'Primer gol del partido', 
          impact: 'medium',
          timestamp: 900 
        },
        { 
          id: 'key-2',
          minute: 45, 
          type: 'SNITCH_CAUGHT', 
          description: 'Captura de la Snitch Dorada', 
          impact: 'high',
          timestamp: 2700
        }
      ],
      matchDuration: 45,
      finalScore: {
        home: 160,
        away: 10
      }
    };
  }
  
  // Return null for real matches that don't have chronology data
  console.warn(`No chronology data available for match ${matchId}`);
  return null;
};