import { apiClient } from '../utils/apiClient';
import { FEATURES } from '../config/features';
import { Team } from '../types/league';

// Interface para compatibilidad con detalles extendidos
interface TeamDetails extends Team {
  players?: string[]; // Example detail
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

// Servicio principal con backend + fallback
export const getTeams = async (): Promise<Team[]> => {
  // Si el backend está habilitado, intentar usarlo
  if (FEATURES.USE_BACKEND_TEAMS) {
    try {
      console.log('🌐 Fetching teams from backend...');
      const response = await apiClient.get<Team[]>('/teams');
      
      if (response.success && response.data) {
        console.log('✅ Teams loaded from backend:', response.data.length);
        return response.data;
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

export const getTeamDetails = async (teamId: string): Promise<TeamDetails | null> => {
  // Si el backend está habilitado, intentar usarlo
  if (FEATURES.USE_BACKEND_TEAMS) {
    try {
      console.log(`🌐 Fetching team details for ${teamId} from backend...`);
      const response = await apiClient.get<TeamDetails>(`/teams/${teamId}`);
      
      if (response.success && response.data) {
        console.log(`✅ Team details loaded from backend for ${teamId}`);
        return response.data;
      }
    } catch (error) {
      console.warn(`⚠️ Backend unavailable for team ${teamId}, using local data:`, error);
    }
  }
  
  // Fallback a datos locales
  const localTeam = LOCAL_TEAMS.find(team => team.id === teamId);
  if (localTeam) {
    console.log(`📁 Using local data for team ${teamId}`);
    return {
      ...localTeam,
      players: ['Player 1', 'Player 2', 'Player 3'] // Mock players
    };
  }
  
  console.warn(`❌ Team ${teamId} not found in local data`);
  return null;
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