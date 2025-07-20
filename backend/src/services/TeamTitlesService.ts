import { Database } from '../database/Database';

export interface TeamTitleData {
  teamId: string;
  teamName: string;
  totalTitles: number;
  seasonTitles: Array<{
    seasonId: string;
    seasonName: string;
    championshipDate: string;
    points: number;
    position: number;
  }>;
}

export class TeamTitlesService {
  private db = Database.getInstance();

  /**
   * Calcula el número total de títulos ganados por un equipo específico
   */
  async calculateTeamTitles(teamId: string): Promise<number> {
    try {
      // Buscar en temporadas históricas completadas
      const historicalTitles = await this.db.get(`
        SELECT COUNT(*) as count
        FROM historical_seasons
        WHERE champion_team_id = ?
      `, [teamId]) as { count: number } | undefined;

      let totalTitles = historicalTitles?.count || 0;

      // Buscar en temporadas actuales completadas que no estén archivadas
      const currentSeasonTitles = await this.db.get(`
        SELECT COUNT(*) as count
        FROM seasons s
        JOIN standings st ON s.id = st.season_id
        WHERE st.team_id = ? 
          AND st.position = 1 
          AND s.status = 'finished'
          AND s.id NOT IN (
            SELECT original_season_id 
            FROM historical_seasons 
            WHERE original_season_id IS NOT NULL
          )
      `, [teamId]) as { count: number } | undefined;

      totalTitles += currentSeasonTitles?.count || 0;

      console.log(`📊 Equipo ${teamId} - Títulos históricos: ${historicalTitles?.count || 0}, Actuales: ${currentSeasonTitles?.count || 0}, Total: ${totalTitles}`);

      return totalTitles;
    } catch (error) {
      console.error(`Error calculando títulos para equipo ${teamId}:`, error);
      return 0;
    }
  }

  /**
   * Obtiene información completa de títulos de un equipo incluyendo detalles de cada temporada
   */
  async getTeamTitleDetails(teamId: string): Promise<TeamTitleData> {
    try {
      // Obtener información básica del equipo
      const team = await this.db.get(`
        SELECT id, name FROM teams WHERE id = ?
      `, [teamId]) as { id: string; name: string } | undefined;

      if (!team) {
        throw new Error(`Equipo ${teamId} no encontrado`);
      }

      // Obtener títulos de temporadas históricas
      const historicalTitles = await this.db.all(`
        SELECT 
          hs.original_season_id as season_id,
          hs.name as season_name,
          hs.end_date as championship_date,
          0 as points,
          1 as position
        FROM historical_seasons hs
        WHERE hs.champion_team_id = ?
        ORDER BY hs.end_date DESC
      `, [teamId]) as Array<{
        season_id: string;
        season_name: string;
        championship_date: string;
        points: number;
        position: number;
      }>;

      // Obtener títulos de temporadas actuales completadas
      const currentTitles = await this.db.all(`
        SELECT 
          s.id as season_id,
          s.name as season_name,
          s.end_date as championship_date,
          st.points,
          st.position
        FROM seasons s
        JOIN standings st ON s.id = st.season_id
        WHERE st.team_id = ? 
          AND st.position = 1 
          AND s.status = 'finished'
          AND s.id NOT IN (
            SELECT original_season_id 
            FROM historical_seasons 
            WHERE original_season_id IS NOT NULL
          )
        ORDER BY s.end_date DESC
      `, [teamId]) as Array<{
        season_id: string;
        season_name: string;
        championship_date: string;
        points: number;
        position: number;
      }>;

      // Combinar ambos resultados
      const allTitles = [...historicalTitles, ...currentTitles];

      const result: TeamTitleData = {
        teamId: team.id,
        teamName: team.name,
        totalTitles: allTitles.length,
        seasonTitles: allTitles.map(title => ({
          seasonId: title.season_id,
          seasonName: title.season_name,
          championshipDate: title.championship_date,
          points: title.points,
          position: title.position
        }))
      };

      return result;
    } catch (error) {
      console.error(`Error obteniendo detalles de títulos para equipo ${teamId}:`, error);
      return {
        teamId,
        teamName: 'Equipo no encontrado',
        totalTitles: 0,
        seasonTitles: []
      };
    }
  }

  /**
   * Calcula títulos para todos los equipos
   */
  async calculateAllTeamsTitles(): Promise<Array<{ teamId: string; teamName: string; titles: number }>> {
    try {
      const teams = await this.db.all(`
        SELECT id, name FROM teams ORDER BY name
      `) as Array<{ id: string; name: string }>;

      const results = [];

      for (const team of teams) {
        const titles = await this.calculateTeamTitles(team.id);
        results.push({
          teamId: team.id,
          teamName: team.name,
          titles
        });
      }

      return results;
    } catch (error) {
      console.error('Error calculando títulos para todos los equipos:', error);
      return [];
    }
  }

  /**
   * Actualiza el campo titles en la tabla teams para mantener consistencia
   * (Este método se puede usar opcionalmente si se quiere mantener el valor en la BD)
   */
  async updateTeamTitlesInDatabase(): Promise<void> {
    try {
      console.log('🔄 Actualizando títulos en la base de datos...');
      
      const teams = await this.db.all(`
        SELECT id FROM teams
      `) as Array<{ id: string }>;

      for (const team of teams) {
        const titles = await this.calculateTeamTitles(team.id);
        
        await this.db.run(`
          UPDATE teams 
          SET titles = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [titles, team.id]);
      }

      console.log('✅ Títulos actualizados en la base de datos');
    } catch (error) {
      console.error('Error actualizando títulos en la base de datos:', error);
      throw error;
    }
  }

  /**
   * Elimina todos los valores mock/hardcodeados de la columna titles
   */
  async clearMockTitles(): Promise<void> {
    try {
      console.log('🧹 Eliminando valores mock de títulos...');
      
      await this.db.run(`
        UPDATE teams 
        SET titles = 0, updated_at = CURRENT_TIMESTAMP
        WHERE titles IS NOT NULL
      `);

      console.log('✅ Valores mock eliminados');
    } catch (error) {
      console.error('Error eliminando valores mock:', error);
      throw error;
    }
  }

  /**
   * Obtiene el ranking de equipos por títulos
   */
  async getTeamTitlesRanking(): Promise<Array<{ teamId: string; teamName: string; titles: number; position: number }>> {
    try {
      const teamsWithTitles = await this.calculateAllTeamsTitles();
      
      // Ordenar por títulos descendente
      const sortedTeams = teamsWithTitles.sort((a, b) => b.titles - a.titles);
      
      // Asignar posiciones
      const ranking = sortedTeams.map((team, index) => ({
        teamId: team.teamId,
        teamName: team.teamName,
        titles: team.titles,
        position: index + 1
      }));

      return ranking;
    } catch (error) {
      console.error('Error obteniendo ranking de títulos:', error);
      return [];
    }
  }
}
