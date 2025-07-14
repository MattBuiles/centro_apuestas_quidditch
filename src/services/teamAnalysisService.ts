import { FEATURES } from '../config/features';

export interface TeamStatistics {
  id: string;
  name: string;
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
}

export interface TeamAnalysisData {
  name: string;
  formRating: number;
  strengths: string[];
  weaknesses: string[];
  momentum: 'up' | 'down' | 'stable';
  winProbability: number;
  recentForm: Array<{ result: 'W' | 'L' | 'D'; confidence: number }>;
  statistics: TeamStatistics;
}

export interface HeadToHeadData {
  teamWins: number;
  opponentWins: number;
  draws: number;
  totalMatches: number;
  teamAvgPoints: number;
  opponentAvgPoints: number;
  recentMatches: Array<{
    result: 'W' | 'L' | 'D';
    teamScore: number;
    opponentScore: number;
    date: string;
  }>;
}

class TeamAnalysisService {
  private readonly API_BASE_URL = 'http://localhost:3001/api';

  /**
   * Obtiene las estadísticas de un equipo desde el backend
   */
  async getTeamStatistics(teamId: string): Promise<TeamStatistics | null> {
    if (!FEATURES.USE_BACKEND_MATCHES) {
      console.log(`⚠️ Backend disabled, cannot fetch statistics for team "${teamId}"`);
      return null;
    }

    try {
      console.log(`🔄 Fetching team statistics from backend for: ${teamId}`);
      const response = await fetch(`${this.API_BASE_URL}/teams/${teamId}`);
      
      if (!response.ok) {
        console.warn(`❌ Failed to fetch team statistics for ${teamId}:`, response.status);
        return null;
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        console.warn('❌ Invalid team statistics response:', data);
        return null;
      }

      const teamData = data.data;
      console.log(`✅ Team statistics fetched successfully for ${teamId}:`, {
        name: teamData.name,
        matches_played: teamData.matches_played,
        wins: teamData.wins,
        win_percentage: teamData.win_percentage,
        attack_strength: teamData.attack_strength,
        defense_strength: teamData.defense_strength
      });

      // Asegurar que todos los campos requeridos estén presentes
      const statistics: TeamStatistics = {
        id: teamData.id || teamId,
        name: teamData.name || teamId,
        matches_played: teamData.matches_played || 0,
        wins: teamData.wins || 0,
        losses: teamData.losses || 0,
        draws: teamData.draws || 0,
        points_for: teamData.points_for || 0,
        points_against: teamData.points_against || 0,
        snitch_catches: teamData.snitch_catches || 0,
        attack_strength: teamData.attack_strength || 75,
        defense_strength: teamData.defense_strength || 75,
        seeker_skill: teamData.seeker_skill || 75,
        keeper_skill: teamData.keeper_skill || 75,
        chaser_skill: teamData.chaser_skill || 75,
        beater_skill: teamData.beater_skill || 75,
        win_percentage: teamData.win_percentage || 0,
        point_difference: teamData.point_difference || 0
      };

      return statistics;
    } catch (error) {
      console.error('❌ Error fetching team statistics:', error);
      return null;
    }
  }

  /**
   * Obtiene el historial de enfrentamientos entre dos equipos
   */
  async getHeadToHeadData(teamId: string, opponentId: string): Promise<HeadToHeadData | null> {
    if (!FEATURES.USE_BACKEND_MATCHES) {
      console.log(`⚠️ Backend disabled, cannot fetch head-to-head data for ${teamId} vs ${opponentId}`);
      return null;
    }

    try {
      console.log(`🔄 Fetching head-to-head data from backend: ${teamId} vs ${opponentId}`);
      const response = await fetch(`${this.API_BASE_URL}/teams/${teamId}/vs/${opponentId}`);
      
      if (!response.ok) {
        console.warn(`❌ Failed to fetch head-to-head data:`, response.status);
        return null;
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        console.warn('❌ Invalid head-to-head response:', data);
        return null;
      }

      const h2hData = data.data;
      console.log(`✅ Head-to-head data fetched successfully:`, {
        totalMatches: h2hData.totalMatches,
        teamWins: h2hData.teamWins,
        opponentWins: h2hData.opponentWins
      });

      // Transformar a la estructura esperada
      const headToHeadData: HeadToHeadData = {
        teamWins: h2hData.teamWins || 0,
        opponentWins: h2hData.opponentWins || 0,
        draws: h2hData.draws || 0,
        totalMatches: h2hData.totalMatches || 0,
        teamAvgPoints: h2hData.statistics?.teamAvgPoints || 0,
        opponentAvgPoints: h2hData.statistics?.opponentAvgPoints || 0,
        recentMatches: (h2hData.recentMatches || []).map((match: { result?: string; teamScore?: number; opponentScore?: number; date?: string }) => ({
          result: match.result || 'L',
          teamScore: match.teamScore || 0,
          opponentScore: match.opponentScore || 0,
          date: match.date || new Date().toISOString()
        }))
      };

      return headToHeadData;
    } catch (error) {
      console.error('❌ Error fetching head-to-head data:', error);
      return null;
    }
  }

  /**
   * Obtiene los últimos partidos de un equipo
   */
  async getTeamRecentMatches(teamId: string, limit: number = 5): Promise<Array<{ result: 'W' | 'L' | 'D'; confidence: number }> | null> {
    if (!FEATURES.USE_BACKEND_MATCHES) {
      console.log(`⚠️ Backend disabled, cannot fetch recent matches for team "${teamId}"`);
      return null;
    }

    try {
      console.log(`🔄 Fetching recent matches from backend for: ${teamId}`);
      const response = await fetch(`${this.API_BASE_URL}/teams/${teamId}/recent-matches?limit=${limit}`);
      
      if (!response.ok) {
        console.warn(`❌ Failed to fetch recent matches for ${teamId}:`, response.status);
        return null;
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        console.warn('❌ Invalid recent matches response:', data);
        return null;
      }

      const matches = data.data;
      console.log(`✅ Recent matches fetched successfully for ${teamId}:`, matches.length, 'matches');

      // Transformar a la estructura esperada
      return matches.map((match: { result?: string; confidence?: number }) => ({
        result: (match.result || 'L') as 'W' | 'L' | 'D',
        confidence: match.confidence || 70
      }));
    } catch (error) {
      console.error('❌ Error fetching recent matches:', error);
      return null;
    }
  }

  /**
   * Analiza un equipo basándose en sus estadísticas reales del backend
   */
  async analyzeTeam(teamId: string, isHome: boolean = false): Promise<TeamAnalysisData> {
    console.log(`🔍 TeamAnalysisService: Analyzing team "${teamId}", isHome: ${isHome}`);
    
    const stats = await this.getTeamStatistics(teamId);
    
    if (!stats) {
      console.log(`⚠️ No backend data found for team "${teamId}", using mock analysis`);
      // Fallback a análisis simulado si no hay datos del backend
      return this.generateMockAnalysis(teamId, isHome);
    }

    console.log(`✅ Backend data found for team "${teamId}":`, {
      name: stats.name,
      winPercentage: stats.win_percentage,
      attackStrength: stats.attack_strength,
      defenseStrength: stats.defense_strength
    });

    return await this.generateRealAnalysis(stats, isHome);
  }

  /**
   * Genera análisis basado en estadísticas reales del backend
   */
  private async generateRealAnalysis(stats: TeamStatistics, isHome: boolean): Promise<TeamAnalysisData> {
    // Calcular rating de forma basado en estadísticas reales
    const winRate = stats.win_percentage || 0;
    const attackRating = stats.attack_strength || 75;
    const defenseRating = stats.defense_strength || 75;
    const overallSkill = (attackRating + defenseRating + stats.seeker_skill + stats.keeper_skill) / 4;
    
    // Base rating combinando win rate y habilidades del equipo
    let formRating = Math.round((winRate + overallSkill) / 2);
    
    // Ventaja de local
    if (isHome) {
      formRating = Math.min(95, formRating + 5);
    }

    // Determinar fortalezas basadas en estadísticas reales
    const strengths: string[] = [];
    if (attackRating >= 85) strengths.push('Ataque devastador');
    if (defenseRating >= 85) strengths.push('Defensa impenetrable');
    if (stats.seeker_skill >= 90) strengths.push('Buscador excepcional');
    if (stats.keeper_skill >= 90) strengths.push('Guardián élite');
    if (stats.win_percentage >= 70) strengths.push('Consistencia ganadora');
    if (stats.snitch_catches >= 5) strengths.push('Maestros de la Snitch');
    if (stats.point_difference > 100) strengths.push('Dominancia ofensiva');
    
    // Si no tiene fortalezas destacadas, agregar algo genérico
    if (strengths.length === 0) {
      if (formRating >= 60) {
        strengths.push('Equipo equilibrado');
      } else {
        strengths.push('Potencial en desarrollo');
      }
    }

    // Determinar debilidades basadas en estadísticas reales
    const weaknesses: string[] = [];
    if (attackRating < 70) weaknesses.push('Ofensiva inconsistente');
    if (defenseRating < 70) weaknesses.push('Vulnerabilidades defensivas');
    if (stats.seeker_skill < 70) weaknesses.push('Búsqueda de Snitch deficiente');
    if (stats.win_percentage < 40) weaknesses.push('Dificultades para cerrar partidos');
    if (stats.point_difference < -50) weaknesses.push('Problemas de anotación');
    if (stats.matches_played < 5) weaknesses.push('Falta de experiencia');

    // Determinar momentum basado en win rate y forma reciente
    let momentum: 'up' | 'down' | 'stable' = 'stable';
    if (winRate >= 70) momentum = 'up';
    else if (winRate <= 30) momentum = 'down';

    // Intentar obtener forma reciente real del backend
    const realRecentForm = await this.getTeamRecentMatches(stats.id);
    const recentForm = realRecentForm || this.generateRecentForm(stats.win_percentage);

    // Ajustar momentum basado en forma reciente real si está disponible
    if (realRecentForm && realRecentForm.length >= 3) {
      const recentWins = realRecentForm.filter(match => match.result === 'W').length;
      const recentWinRate = (recentWins / realRecentForm.length) * 100;
      
      if (recentWinRate >= 80) momentum = 'up';
      else if (recentWinRate <= 20) momentum = 'down';
      
      console.log(`📈 Momentum updated based on recent form for ${stats.name}:`, {
        recentWins: `${recentWins}/${realRecentForm.length}`,
        recentWinRate: `${recentWinRate}%`,
        momentum
      });
    }

    return {
      name: stats.name,
      formRating,
      strengths,
      weaknesses,
      momentum,
      winProbability: 0, // Se calculará después en el componente
      recentForm,
      statistics: stats
    };
  }

  /**
   * Genera análisis simulado (fallback cuando no hay datos del backend)
   */
  private generateMockAnalysis(teamId: string, isHome: boolean): TeamAnalysisData {
    // Mapear IDs de equipos a nombres más amigables
    const teamNameMap: { [key: string]: string } = {
      'gryffindor': 'Gryffindor',
      'slytherin': 'Slytherin', 
      'ravenclaw': 'Ravenclaw',
      'hufflepuff': 'Hufflepuff',
      'chudley-cannons': 'Chudley Cannons',
      'holyhead-harpies': 'Holyhead Harpies'
    };

    const teamName = teamNameMap[teamId] || teamId;
    
    const baseRating = 40 + Math.floor(Math.random() * 40);
    const homeAdvantage = isHome ? 5 : 0;
    const formRating = Math.min(90, baseRating + homeAdvantage);
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    if (formRating > 70) {
      strengths.push('Ofensiva potente', 'Buena defensa');
    } else if (formRating > 50) {
      strengths.push('Equilibrio táctico');
    }
    
    if (formRating < 50) {
      weaknesses.push('Inconsistencia', 'Problemas defensivos');
    } else if (formRating < 70) {
      weaknesses.push('Falta de profundidad en plantilla');
    }
    
    const momentum: 'up' | 'down' | 'stable' = 
      formRating > 65 ? 'up' : formRating < 45 ? 'down' : 'stable';

    const recentForm = this.generateRecentForm(formRating);

    // Mock statistics
    const mockStats: TeamStatistics = {
      id: teamId,
      name: teamName,
      matches_played: 10,
      wins: Math.floor(formRating / 10),
      losses: 10 - Math.floor(formRating / 10),
      draws: 0,
      points_for: formRating * 15,
      points_against: (100 - formRating) * 12,
      snitch_catches: Math.floor(formRating / 20),
      attack_strength: formRating + Math.floor(Math.random() * 20) - 10,
      defense_strength: formRating + Math.floor(Math.random() * 20) - 10,
      seeker_skill: formRating + Math.floor(Math.random() * 15) - 7,
      keeper_skill: formRating + Math.floor(Math.random() * 15) - 7,
      chaser_skill: formRating + Math.floor(Math.random() * 15) - 7,
      beater_skill: formRating + Math.floor(Math.random() * 15) - 7,
      win_percentage: formRating,
      point_difference: (formRating - 50) * 5
    };
    
    return {
      name: teamName,
      formRating,
      strengths,
      weaknesses,
      momentum,
      winProbability: 0,
      recentForm,
      statistics: mockStats
    };
  }

  /**
   * Genera forma reciente basada en el porcentaje de victorias
   */
  private generateRecentForm(winPercentage: number): Array<{ result: 'W' | 'L' | 'D'; confidence: number }> {
    const form: Array<{ result: 'W' | 'L' | 'D'; confidence: number }> = [];
    
    for (let i = 0; i < 5; i++) {
      const random = Math.random() * 100;
      let result: 'W' | 'L' | 'D';
      let confidence: number;
      
      if (random < winPercentage) {
        result = 'W';
        confidence = Math.random() * 30 + 70; // 70-100% confianza en victorias
      } else if (random < winPercentage + 10) {
        result = 'D';
        confidence = Math.random() * 20 + 60; // 60-80% confianza en empates
      } else {
        result = 'L';
        confidence = Math.random() * 40 + 50; // 50-90% confianza en derrotas
      }
      
      form.push({ result, confidence: Math.round(confidence) });
    }
    
    return form;
  }

  /**
   * Calcula las probabilidades de victoria entre dos equipos
   */
  calculateWinProbabilities(homeAnalysis: TeamAnalysisData, awayAnalysis: TeamAnalysisData): {
    homeWinProbability: number;
    awayWinProbability: number;
  } {
    const totalRating = homeAnalysis.formRating + awayAnalysis.formRating;
    const homeWinProbability = Math.round((homeAnalysis.formRating / totalRating) * 100);
    const awayWinProbability = Math.round((awayAnalysis.formRating / totalRating) * 100);
    
    return { homeWinProbability, awayWinProbability };
  }
}

export default new TeamAnalysisService();
