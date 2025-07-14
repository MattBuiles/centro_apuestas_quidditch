import { Database } from '../database/Database';
import { StandingsService } from './StandingsService';
import { HistoricalTeamStatsService } from './HistoricalTeamStatsService';
import { v4 as uuidv4 } from 'uuid';

export interface HistoricalSeasonData {
  id: string;
  originalSeasonId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: string;
  archivedAt: Date;
  totalTeams: number;
  totalMatches: number;
  totalBets: number;
  totalPredictions: number;
  totalRevenue: number;
  championTeamId: string | null;
  championTeamName: string | null;
}

export class HistoricalSeasonsService {
  private db = Database.getInstance();
  private standingsService = new StandingsService();
  private historicalTeamStatsService = new HistoricalTeamStatsService();

  /**
   * Archiva una temporada finalizada en la tabla historical_seasons
   */
  async archiveFinishedSeason(seasonId: string): Promise<void> {
    try {
      // Verificar si la temporada ya está archivada para evitar duplicados
      const existingArchive = await this.db.get(`
        SELECT id FROM historical_seasons WHERE original_season_id = ?
      `, [seasonId]);

      if (existingArchive) {
        console.log(`⚠️ La temporada ${seasonId} ya está archivada, saltando...`);
        return;
      }

      console.log(`📚 Archivando temporada finalizada: ${seasonId}`);

      // Obtener información básica de la temporada
      const season = await this.db.get(`
        SELECT id, name, start_date, end_date, status
        FROM seasons 
        WHERE id = ? AND status = 'finished'
      `, [seasonId]) as {
        id: string;
        name: string;
        start_date: string;
        end_date: string;
        status: string;
      } | undefined;

      if (!season) {
        console.log(`⚠️ Temporada ${seasonId} no encontrada o no finalizada`);
        return;
      }

      // Obtener estadísticas de equipos
      const totalTeams = await this.getSeasonTeamsCount(seasonId);
      
      // Obtener estadísticas de partidos
      const matchStats = await this.getSeasonMatchStats(seasonId);
      
      // Obtener estadísticas de apuestas y predicciones (por ahora 0, se implementará más adelante)
      const betStats = await this.getSeasonBetStats(seasonId);
      const predictionStats = await this.getSeasonPredictionStats(seasonId);
      
      // Obtener el campeón de la temporada
      const champion = await this.getSeasonChampion(seasonId);

      // Crear registro histórico
      const historicalSeasonId = uuidv4();
      const historicalData: HistoricalSeasonData = {
        id: historicalSeasonId,
        originalSeasonId: seasonId,
        name: season.name,
        startDate: new Date(season.start_date),
        endDate: new Date(season.end_date),
        status: 'completed',
        archivedAt: new Date(),
        totalTeams,
        totalMatches: matchStats.total,
        totalBets: betStats.total,
        totalPredictions: predictionStats.total,
        totalRevenue: betStats.revenue,
        championTeamId: champion?.teamId || null,
        championTeamName: champion?.teamName || null
      };

      // Guardar en la base de datos
      await this.saveHistoricalSeason(historicalData);

      // Actualizar estadísticas históricas de equipos usando el servicio especializado
      await this.historicalTeamStatsService.updateHistoricalStatsForSeason(seasonId);

      // También ejecutar la actualización desde la base de datos para asegurar consistencia
      await this.db.archiveCompletedSeason(seasonId);

      console.log(`✅ Temporada ${season.name} archivada exitosamente como histórica`);
      console.log(`   - Equipos: ${totalTeams}`);
      console.log(`   - Partidos: ${matchStats.total} (${matchStats.finished} finalizados)`);
      console.log(`   - Campeón: ${champion?.teamName || 'No determinado'}`);
      console.log(`   - Estadísticas históricas de equipos actualizadas`);

    } catch (error) {
      console.error('Error archivando temporada:', error);
      throw error;
    }
  }

  /**
   * Obtiene el número de equipos en la temporada
   */
  private async getSeasonTeamsCount(seasonId: string): Promise<number> {
    const result = await this.db.get(`
      SELECT COUNT(*) as count
      FROM season_teams
      WHERE season_id = ?
    `, [seasonId]) as { count: number };

    return result.count;
  }

  /**
   * Obtiene estadísticas de partidos de la temporada
   */
  private async getSeasonMatchStats(seasonId: string): Promise<{ total: number; finished: number }> {
    const result = await this.db.get(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'finished' THEN 1 END) as finished
      FROM matches
      WHERE season_id = ?
    `, [seasonId]) as { total: number; finished: number };

    return result;
  }

  /**
   * Obtiene estadísticas de apuestas de la temporada (por implementar)
   */
  private async getSeasonBetStats(seasonId: string): Promise<{ total: number; revenue: number }> {
    try {
      const result = await this.db.get(`
        SELECT 
          COUNT(*) as total,
          COALESCE(SUM(amount), 0) as revenue
        FROM bets b
        JOIN matches m ON b.match_id = m.id
        WHERE m.season_id = ?
      `, [seasonId]) as { total: number; revenue: number } | undefined;

      return {
        total: result?.total || 0,
        revenue: result?.revenue || 0
      };
    } catch (error) {
      // Si hay error (tabla no existe, etc.), retornar 0
      console.warn('Error obteniendo estadísticas de apuestas:', error);
      return { total: 0, revenue: 0 };
    }
  }

  /**
   * Obtiene estadísticas de predicciones de la temporada (por implementar)
   */
  private async getSeasonPredictionStats(seasonId: string): Promise<{ total: number }> {
    try {
      const result = await this.db.get(`
        SELECT COUNT(*) as total
        FROM predictions p
        JOIN matches m ON p.match_id = m.id
        WHERE m.season_id = ?
      `, [seasonId]) as { total: number } | undefined;

      return { total: result?.total || 0 };
    } catch (error) {
      // Si hay error (tabla no existe, etc.), retornar 0
      console.warn('Error obteniendo estadísticas de predicciones:', error);
      return { total: 0 };
    }
  }

  /**
   * Obtiene el campeón de la temporada (equipo con más puntos)
   */
  private async getSeasonChampion(seasonId: string): Promise<{ teamId: string; teamName: string } | null> {
    try {
      const champion = await this.db.get(`
        SELECT 
          st.team_id,
          t.name as team_name
        FROM standings st
        JOIN teams t ON st.team_id = t.id
        WHERE st.season_id = ?
        ORDER BY st.position ASC
        LIMIT 1
      `, [seasonId]) as { team_id: string; team_name: string } | undefined;

      if (champion) {
        return {
          teamId: champion.team_id,
          teamName: champion.team_name
        };
      }

      return null;
    } catch (error) {
      console.warn('Error obteniendo campeón de temporada:', error);
      return null;
    }
  }

  /**
   * Guarda el registro histórico en la base de datos
   */
  private async saveHistoricalSeason(data: HistoricalSeasonData): Promise<void> {
    try {
      await this.db.run(`
        INSERT INTO historical_seasons (
          id, original_season_id, name, start_date, end_date, status, archived_at,
          total_teams, total_matches, total_bets, total_predictions, total_revenue,
          champion_team_id, champion_team_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.id,
        data.originalSeasonId,
        data.name,
        data.startDate.toISOString(),
        data.endDate.toISOString(),
        data.status,
        data.archivedAt.toISOString(),
        data.totalTeams,
        data.totalMatches,
        data.totalBets,
        data.totalPredictions,
        data.totalRevenue,
        data.championTeamId,
        data.championTeamName
      ]);
    } catch (error) {
      console.error('Error guardando temporada histórica:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las temporadas históricas
   */
  async getAllHistoricalSeasons(): Promise<HistoricalSeasonData[]> {
    try {
      const seasons = await this.db.all(`
        SELECT 
          id,
          original_season_id as originalSeasonId,
          name,
          start_date as startDate,
          end_date as endDate,
          status,
          archived_at as archivedAt,
          total_teams as totalTeams,
          total_matches as totalMatches,
          total_bets as totalBets,
          total_predictions as totalPredictions,
          total_revenue as totalRevenue,
          champion_team_id as championTeamId,
          champion_team_name as championTeamName
        FROM historical_seasons
        ORDER BY archived_at DESC
      `) as Array<{
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
      }>;

      return seasons.map(season => ({
        ...season,
        startDate: new Date(season.startDate),
        endDate: new Date(season.endDate),
        archivedAt: new Date(season.archivedAt)
      }));
    } catch (error) {
      console.error('Error obteniendo temporadas históricas:', error);
      throw error;
    }
  }

  /**
   * Obtiene una temporada histórica específica
   */
  async getHistoricalSeasonById(historicalSeasonId: string): Promise<HistoricalSeasonData | null> {
    try {
      const season = await this.db.get(`
        SELECT 
          id,
          original_season_id as originalSeasonId,
          name,
          start_date as startDate,
          end_date as endDate,
          status,
          archived_at as archivedAt,
          total_teams as totalTeams,
          total_matches as totalMatches,
          total_bets as totalBets,
          total_predictions as totalPredictions,
          total_revenue as totalRevenue,
          champion_team_id as championTeamId,
          champion_team_name as championTeamName
        FROM historical_seasons
        WHERE id = ?
      `, [historicalSeasonId]) as {
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
      } | undefined;

      if (!season) {
        return null;
      }

      return {
        ...season,
        startDate: new Date(season.startDate),
        endDate: new Date(season.endDate),
        archivedAt: new Date(season.archivedAt)
      };
    } catch (error) {
      console.error('Error obteniendo temporada histórica:', error);
      throw error;
    }
  }
}
