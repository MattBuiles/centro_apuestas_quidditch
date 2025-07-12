import { Database } from '../database/Database';
import { v4 as uuidv4 } from 'uuid';

export interface HistoricalTeamStatsData {
  id: string;
  teamId: string;
  teamName: string;
  totalSeasons: number;
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  totalPointsFor: number;
  totalPointsAgainst: number;
  totalSnitchCatches: number;
  championshipsWon: number;
  bestSeasonPosition: number | null;
  worstSeasonPosition: number | null;
}

export interface SeasonTeamStats {
  teamId: string;
  teamName: string;
  position: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  snitchCatches: number;
  isChampion: boolean;
}

export class HistoricalTeamStatsService {
  private db = Database.getInstance();

  /**
   * Actualiza las estadísticas históricas de todos los equipos al finalizar una temporada
   */
  async updateHistoricalStatsForSeason(seasonId: string): Promise<void> {
    try {
      console.log(`📊 Actualizando estadísticas históricas para temporada ${seasonId}`);

      // Obtener estadísticas de la temporada finalizada
      const seasonStats = await this.getSeasonTeamStats(seasonId);

      if (seasonStats.length === 0) {
        console.log('⚠️ No se encontraron estadísticas para la temporada');
        return;
      }

      // Actualizar estadísticas históricas para cada equipo
      for (const teamStats of seasonStats) {
        await this.updateTeamHistoricalStats(teamStats);
      }

      console.log(`✅ Estadísticas históricas actualizadas para ${seasonStats.length} equipos`);

    } catch (error) {
      console.error('Error actualizando estadísticas históricas:', error);
      throw error;
    }
  }

  /**
   * Obtiene las estadísticas finales de todos los equipos de una temporada
   */
  private async getSeasonTeamStats(seasonId: string): Promise<SeasonTeamStats[]> {
    try {
      // Obtener datos de standings y equipos
      const seasonData = await this.db.all(`
        SELECT 
          s.team_id,
          t.name as team_name,
          s.position,
          s.matches_played,
          s.wins,
          s.losses,
          s.draws,
          s.points_for,
          s.points_against,
          s.snitch_catches
        FROM standings s
        JOIN teams t ON s.team_id = t.id
        WHERE s.season_id = ?
        ORDER BY s.position ASC
      `, [seasonId]) as Array<{
        team_id: string;
        team_name: string;
        position: number;
        matches_played: number;
        wins: number;
        losses: number;
        draws: number;
        points_for: number;
        points_against: number;
        snitch_catches: number;
      }>;

      return seasonData.map((data, index) => ({
        teamId: data.team_id,
        teamName: data.team_name,
        position: data.position,
        matches: data.matches_played,
        wins: data.wins,
        losses: data.losses,
        draws: data.draws,
        pointsFor: data.points_for,
        pointsAgainst: data.points_against,
        snitchCatches: data.snitch_catches,
        isChampion: index === 0 // El primer equipo (posición 1) es el campeón
      }));

    } catch (error) {
      console.error('Error obteniendo estadísticas de temporada:', error);
      throw error;
    }
  }

  /**
   * Actualiza las estadísticas históricas de un equipo específico
   */
  private async updateTeamHistoricalStats(seasonStats: SeasonTeamStats): Promise<void> {
    try {
      // Obtener estadísticas históricas actuales del equipo
      const currentStats = await this.db.get(`
        SELECT * FROM historical_team_stats WHERE team_id = ?
      `, [seasonStats.teamId]) as HistoricalTeamStatsData | undefined;

      let updatedStats: HistoricalTeamStatsData;

      if (currentStats) {
        // Actualizar estadísticas existentes
        updatedStats = {
          id: currentStats.id,
          teamId: seasonStats.teamId,
          teamName: seasonStats.teamName,
          totalSeasons: currentStats.totalSeasons + 1,
          totalMatches: currentStats.totalMatches + seasonStats.matches,
          totalWins: currentStats.totalWins + seasonStats.wins,
          totalLosses: currentStats.totalLosses + seasonStats.losses,
          totalDraws: currentStats.totalDraws + seasonStats.draws,
          totalPointsFor: currentStats.totalPointsFor + seasonStats.pointsFor,
          totalPointsAgainst: currentStats.totalPointsAgainst + seasonStats.pointsAgainst,
          totalSnitchCatches: currentStats.totalSnitchCatches + seasonStats.snitchCatches,
          championshipsWon: currentStats.championshipsWon + (seasonStats.isChampion ? 1 : 0),
          bestSeasonPosition: this.getBestPosition(currentStats.bestSeasonPosition, seasonStats.position),
          worstSeasonPosition: this.getWorstPosition(currentStats.worstSeasonPosition, seasonStats.position)
        };
      } else {
        // Crear nuevas estadísticas históricas
        updatedStats = {
          id: uuidv4(),
          teamId: seasonStats.teamId,
          teamName: seasonStats.teamName,
          totalSeasons: 1,
          totalMatches: seasonStats.matches,
          totalWins: seasonStats.wins,
          totalLosses: seasonStats.losses,
          totalDraws: seasonStats.draws,
          totalPointsFor: seasonStats.pointsFor,
          totalPointsAgainst: seasonStats.pointsAgainst,
          totalSnitchCatches: seasonStats.snitchCatches,
          championshipsWon: seasonStats.isChampion ? 1 : 0,
          bestSeasonPosition: seasonStats.position,
          worstSeasonPosition: seasonStats.position
        };
      }

      // Guardar en la base de datos
      await this.saveHistoricalStats(updatedStats);

      console.log(`📈 Estadísticas actualizadas para ${seasonStats.teamName}: ${updatedStats.totalSeasons} temporadas, ${updatedStats.championshipsWon} campeonatos`);

    } catch (error) {
      console.error(`Error actualizando estadísticas históricas para equipo ${seasonStats.teamId}:`, error);
      throw error;
    }
  }

  /**
   * Determina la mejor posición (número más bajo es mejor)
   */
  private getBestPosition(current: number | null, newPosition: number): number {
    if (current === null) return newPosition;
    return Math.min(current, newPosition);
  }

  /**
   * Determina la peor posición (número más alto es peor)
   */
  private getWorstPosition(current: number | null, newPosition: number): number {
    if (current === null) return newPosition;
    return Math.max(current, newPosition);
  }

  /**
   * Guarda las estadísticas históricas en la base de datos
   */
  private async saveHistoricalStats(stats: HistoricalTeamStatsData): Promise<void> {
    try {
      await this.db.run(`
        INSERT OR REPLACE INTO historical_team_stats (
          id, team_id, team_name, total_seasons, total_matches, total_wins, 
          total_losses, total_draws, total_points_for, total_points_against, 
          total_snitch_catches, championships_won, best_season_position, 
          worst_season_position, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        stats.id,
        stats.teamId,
        stats.teamName,
        stats.totalSeasons,
        stats.totalMatches,
        stats.totalWins,
        stats.totalLosses,
        stats.totalDraws,
        stats.totalPointsFor,
        stats.totalPointsAgainst,
        stats.totalSnitchCatches,
        stats.championshipsWon,
        stats.bestSeasonPosition,
        stats.worstSeasonPosition
      ]);

    } catch (error) {
      console.error('Error guardando estadísticas históricas:', error);
      throw error;
    }
  }

  /**
   * Obtiene las estadísticas históricas de todos los equipos
   */
  async getAllHistoricalStats(): Promise<HistoricalTeamStatsData[]> {
    try {
      const stats = await this.db.all(`
        SELECT 
          id,
          team_id as teamId,
          team_name as teamName,
          total_seasons as totalSeasons,
          total_matches as totalMatches,
          total_wins as totalWins,
          total_losses as totalLosses,
          total_draws as totalDraws,
          total_points_for as totalPointsFor,
          total_points_against as totalPointsAgainst,
          total_snitch_catches as totalSnitchCatches,
          championships_won as championshipsWon,
          best_season_position as bestSeasonPosition,
          worst_season_position as worstSeasonPosition
        FROM historical_team_stats
        ORDER BY championships_won DESC, total_wins DESC
      `) as HistoricalTeamStatsData[];

      return stats;

    } catch (error) {
      console.error('Error obteniendo estadísticas históricas:', error);
      throw error;
    }
  }

  /**
   * Obtiene las estadísticas históricas de un equipo específico
   */
  async getTeamHistoricalStats(teamId: string): Promise<HistoricalTeamStatsData | null> {
    try {
      const stats = await this.db.get(`
        SELECT 
          id,
          team_id as teamId,
          team_name as teamName,
          total_seasons as totalSeasons,
          total_matches as totalMatches,
          total_wins as totalWins,
          total_losses as totalLosses,
          total_draws as totalDraws,
          total_points_for as totalPointsFor,
          total_points_against as totalPointsAgainst,
          total_snitch_catches as totalSnitchCatches,
          championships_won as championshipsWon,
          best_season_position as bestSeasonPosition,
          worst_season_position as worstSeasonPosition
        FROM historical_team_stats
        WHERE team_id = ?
      `, [teamId]) as HistoricalTeamStatsData | undefined;

      return stats || null;

    } catch (error) {
      console.error('Error obteniendo estadísticas históricas del equipo:', error);
      throw error;
    }
  }
}
