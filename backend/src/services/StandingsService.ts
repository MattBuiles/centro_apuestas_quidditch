import { Database } from '../database/Database';

export interface StandingData {
  seasonId: string;
  teamId: string;
  position: number;
  points: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDifference: number;
  snitchCatches: number;
}

export class StandingsService {
  private db = Database.getInstance();

  /**
   * Actualiza la tabla de standings después de que se complete un partido
   */
  async updateStandingsAfterMatch(matchId: string): Promise<void> {
    try {
      // Obtener información del partido
      const match = await this.db.get(`
        SELECT season_id, home_team_id, away_team_id, home_score, away_score, snitch_caught_by
        FROM matches 
        WHERE id = ? AND status = 'finished'
      `, [matchId]) as {
        season_id: string;
        home_team_id: string;
        away_team_id: string;
        home_score: number;
        away_score: number;
        snitch_caught_by: string | null;
      } | undefined;

      if (!match) {
        console.log(`⚠️ Partido ${matchId} no encontrado o no finalizado`);
        return;
      }

      console.log(`📊 Actualizando standings para el partido ${matchId}`);
      
      // Recalcular y actualizar standings para toda la temporada
      await this.recalculateSeasonStandings(match.season_id);
      
      console.log(`✅ Standings actualizados para la temporada ${match.season_id}`);
      
    } catch (error) {
      console.error('Error actualizando standings:', error);
      throw error;
    }
  }

  /**
   * Recalcula completamente los standings de una temporada
   */
  async recalculateSeasonStandings(seasonId: string): Promise<void> {
    try {
      // Obtener todos los equipos de la temporada
      const teams = await this.db.all(`
        SELECT t.id
        FROM teams t
        JOIN season_teams st ON t.id = st.team_id
        WHERE st.season_id = ?
      `, [seasonId]) as Array<{ id: string }>;

      if (teams.length === 0) {
        console.log(`⚠️ No se encontraron equipos para la temporada ${seasonId}`);
        return;
      }

      // Inicializar standings para cada equipo
      const standingsMap = new Map<string, StandingData>();
      
      teams.forEach(team => {
        standingsMap.set(team.id, {
          seasonId,
          teamId: team.id,
          position: 0,
          points: 0,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          pointsDifference: 0,
          snitchCatches: 0
        });
      });

      // Obtener todos los partidos finalizados de la temporada
      const finishedMatches = await this.db.all(`
        SELECT home_team_id, away_team_id, home_score, away_score, snitch_caught_by
        FROM matches 
        WHERE season_id = ? AND status = 'finished'
      `, [seasonId]) as Array<{
        home_team_id: string;
        away_team_id: string;
        home_score: number;
        away_score: number;
        snitch_caught_by: string | null;
      }>;

      // Procesar cada partido finalizado
      finishedMatches.forEach(match => {
        const homeStanding = standingsMap.get(match.home_team_id);
        const awayStanding = standingsMap.get(match.away_team_id);

        if (!homeStanding || !awayStanding) {
          console.warn(`⚠️ Equipo no encontrado en standings: ${match.home_team_id} vs ${match.away_team_id}`);
          return;
        }

        // Actualizar partidos jugados
        homeStanding.matchesPlayed++;
        awayStanding.matchesPlayed++;

        // Actualizar goles
        homeStanding.pointsFor += match.home_score;
        homeStanding.pointsAgainst += match.away_score;
        awayStanding.pointsFor += match.away_score;
        awayStanding.pointsAgainst += match.home_score;

        // Actualizar capturas de snitch
        if (match.snitch_caught_by === 'home') {
          homeStanding.snitchCatches++;
        } else if (match.snitch_caught_by === 'away') {
          awayStanding.snitchCatches++;
        }

        // Determinar resultado y actualizar puntos y estadísticas
        if (match.home_score > match.away_score) {
          // Victoria local
          homeStanding.wins++;
          homeStanding.points += 3;
          awayStanding.losses++;
        } else if (match.home_score < match.away_score) {
          // Victoria visitante
          awayStanding.wins++;
          awayStanding.points += 3;
          homeStanding.losses++;
        } else {
          // Empate
          homeStanding.draws++;
          awayStanding.draws++;
          homeStanding.points += 1;
          awayStanding.points += 1;
        }
      });

      // Calcular diferencia de goles
      standingsMap.forEach(standing => {
        standing.pointsDifference = standing.pointsFor - standing.pointsAgainst;
      });

      // Ordenar por puntos, diferencia de goles y goles a favor
      const sortedStandings = Array.from(standingsMap.values()).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.pointsDifference !== a.pointsDifference) return b.pointsDifference - a.pointsDifference;
        return b.pointsFor - a.pointsFor;
      });

      // Asignar posiciones
      sortedStandings.forEach((standing, index) => {
        standing.position = index + 1;
      });

      // Guardar en la base de datos
      await this.saveStandingsToDatabase(sortedStandings);

      console.log(`📊 Standings recalculados para ${sortedStandings.length} equipos en temporada ${seasonId}`);

    } catch (error) {
      console.error('Error recalculando standings:', error);
      throw error;
    }
  }

  /**
   * Guarda los standings en la base de datos
   */
  private async saveStandingsToDatabase(standings: StandingData[]): Promise<void> {
    try {
      // Usar transacción para asegurar consistencia
      await this.db.run('BEGIN TRANSACTION');

      for (const standing of standings) {
        await this.db.run(`
          INSERT OR REPLACE INTO standings (
            season_id, team_id, position, points, matches_played, wins, losses, draws,
            points_for, points_against, points_difference, snitch_catches, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          standing.seasonId,
          standing.teamId,
          standing.position,
          standing.points,
          standing.matchesPlayed,
          standing.wins,
          standing.losses,
          standing.draws,
          standing.pointsFor,
          standing.pointsAgainst,
          standing.pointsDifference,
          standing.snitchCatches
        ]);
      }

      await this.db.run('COMMIT');
      
    } catch (error) {
      await this.db.run('ROLLBACK');
      console.error('Error guardando standings en base de datos:', error);
      throw error;
    }
  }

  /**
   * Obtiene los standings de una temporada desde la base de datos
   */
  async getSeasonStandings(seasonId: string): Promise<StandingData[]> {
    try {
      const standings = await this.db.all(`
        SELECT 
          season_id as seasonId,
          team_id as teamId,
          position,
          points,
          matches_played as matchesPlayed,
          wins,
          losses,
          draws,
          points_for as pointsFor,
          points_against as pointsAgainst,
          points_difference as pointsDifference,
          snitch_catches as snitchCatches
        FROM standings
        WHERE season_id = ?
        ORDER BY position ASC
      `, [seasonId]) as StandingData[];

      return standings;
    } catch (error) {
      console.error('Error obteniendo standings:', error);
      throw error;
    }
  }

  /**
   * Inicializa los standings para una nueva temporada
   */
  async initializeSeasonStandings(seasonId: string): Promise<void> {
    try {
      console.log(`🆕 Inicializando standings para temporada ${seasonId}`);
      
      // Obtener equipos de la temporada
      const teams = await this.db.all(`
        SELECT t.id
        FROM teams t
        JOIN season_teams st ON t.id = st.team_id
        WHERE st.season_id = ?
      `, [seasonId]) as Array<{ id: string }>;

      // Crear standings iniciales (todos en 0)
      const initialStandings: StandingData[] = teams.map((team, index) => ({
        seasonId,
        teamId: team.id,
        position: index + 1,
        points: 0,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointsDifference: 0,
        snitchCatches: 0
      }));

      await this.saveStandingsToDatabase(initialStandings);
      
      console.log(`✅ Standings inicializados para ${teams.length} equipos`);
      
    } catch (error) {
      console.error('Error inicializando standings:', error);
      throw error;
    }
  }
}
