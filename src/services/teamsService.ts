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