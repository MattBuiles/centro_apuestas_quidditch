import { apiClient } from '../utils/apiClient';

export interface HistoricalSeasonData {
  id: string;
  originalSeasonId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  archivedAt: string;
  totalTeams: number;
  totalMatches: number;
  totalBets: number;
  totalPredictions: number;
  totalRevenue: number;
  championTeamId: string | null;
  championTeamName: string | null;
}

export interface HistoricalTeamStats {
  teamId: string;
  teamName: string;
  totalSeasons: number;
  totalMatches: number;
  totalWins: number;
  totalDraws: number;
  totalLosses: number;
  totalGoalsFor: number;
  totalGoalsAgainst: number;
  totalPoints: number;
  championships: number;
  winPercentage: number;
  averageGoalsPerMatch: number;
  averagePointsPerSeason: number;
}

export interface HistoricalStanding {
  position: number;
  teamId: string;
  teamName: string;
  totalSeasons: number;
  totalMatches: number;
  totalWins: number;
  totalDraws: number;
  totalLosses: number;
  totalGoalsFor: number;
  totalGoalsAgainst: number;
  totalGoalDifference: number;
  totalPoints: number;
  championships: number;
  winPercentage: number;
  averagePointsPerSeason: number;
  averageGoalsPerMatch: number;
}

export class HistoricalSeasonsService {
  /**
   * Obtiene todas las temporadas históricas
   */
  async getAllHistoricalSeasons(): Promise<HistoricalSeasonData[]> {
    try {
      const response = await apiClient.get<HistoricalSeasonData[]>('/seasons/historical');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching historical seasons:', error);
      throw error;
    }
  }

  /**
   * Obtiene una temporada histórica específica
   */
  async getHistoricalSeasonById(historicalSeasonId: string): Promise<HistoricalSeasonData | null> {
    try {
      const response = await apiClient.get<HistoricalSeasonData>(`/seasons/historical/${historicalSeasonId}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching historical season:', error);
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Obtiene las estadísticas históricas de todos los equipos (standing histórico acumulativo)
   */
  async getHistoricalTeamStats(): Promise<HistoricalTeamStats[]> {
    try {
      const response = await apiClient.get<HistoricalTeamStats[]>('/teams/historical-stats');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching historical team stats:', error);
      throw error;
    }
  }

  /**
   * Obtiene las estadísticas acumulativas de todos los equipos desde la tabla standings
   */
  async getCumulativeTeamStats(): Promise<HistoricalTeamStats[]> {
    try {
      const response = await apiClient.get<HistoricalTeamStats[]>('/teams/cumulative-stats');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching cumulative team stats:', error);
      throw error;
    }
  }

  /**
   * Obtiene las estadísticas históricas de un equipo específico
   */
  async getTeamHistoricalStats(teamId: string): Promise<HistoricalTeamStats | null> {
    try {
      const response = await apiClient.get<HistoricalTeamStats>(`/teams/${teamId}/historical-stats`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching team historical stats:', error);
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Convierte las estadísticas históricas de equipos en un standing histórico ordenado
   */
  convertToHistoricalStandings(teamStats: HistoricalTeamStats[]): HistoricalStanding[] {
    const standings: HistoricalStanding[] = teamStats.map(stats => ({
      position: 0, // Se asignará después del ordenamiento
      teamId: stats.teamId,
      teamName: stats.teamName,
      totalSeasons: stats.totalSeasons,
      totalMatches: stats.totalMatches,
      totalWins: stats.totalWins,
      totalDraws: stats.totalDraws,
      totalLosses: stats.totalLosses,
      totalGoalsFor: stats.totalGoalsFor,
      totalGoalsAgainst: stats.totalGoalsAgainst,
      totalGoalDifference: stats.totalGoalsFor - stats.totalGoalsAgainst,
      totalPoints: stats.totalPoints,
      championships: stats.championships,
      winPercentage: stats.winPercentage,
      averagePointsPerSeason: stats.averagePointsPerSeason,
      averageGoalsPerMatch: stats.averageGoalsPerMatch
    }));

    // Ordenar por: 1) Campeonatos, 2) Total de puntos, 3) Diferencia de goles, 4) Goles a favor
    standings.sort((a, b) => {
      if (b.championships !== a.championships) return b.championships - a.championships;
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.totalGoalDifference !== a.totalGoalDifference) return b.totalGoalDifference - a.totalGoalDifference;
      return b.totalGoalsFor - a.totalGoalsFor;
    });

    // Asignar posiciones
    standings.forEach((standing, index) => {
      standing.position = index + 1;
    });

    return standings;
  }

  /**
   * Obtiene y convierte las estadísticas acumulativas en standings históricos
   */
  async getCumulativeHistoricalStandings(): Promise<HistoricalStanding[]> {
    try {
      const cumulativeStats = await this.getCumulativeTeamStats();
      return this.convertToHistoricalStandings(cumulativeStats);
    } catch (error) {
      console.error('Error fetching cumulative historical standings:', error);
      throw error;
    }
  }

  /**
   * Archiva una temporada finalizada manualmente
   */
  async archiveFinishedSeason(seasonId: string): Promise<void> {
    try {
      await apiClient.post(`/seasons/${seasonId}/archive`, {});
    } catch (error) {
      console.error('Error archiving season:', error);
      throw error;
    }
  }
}
