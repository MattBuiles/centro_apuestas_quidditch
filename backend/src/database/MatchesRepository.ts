import { DatabaseConnection } from './DatabaseConnection';
import { DatabaseResult } from './interfaces';
// Add import for BetResolutionService
import { BetResolutionService } from '../services/BetResolutionService';

export class MatchesRepository {
  private connection: DatabaseConnection;

  constructor() {
    this.connection = DatabaseConnection.getInstance();
  }

  public async getAllMatches(): Promise<unknown[]> {
    const sql = `
      SELECT 
        m.*,
        ht.name as homeTeamName,
        ht.logo as homeTeamLogo,
        at.name as awayTeamName,
        at.logo as awayTeamLogo,
        s.name as seasonName
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      ORDER BY m.date ASC
    `;
    return await this.connection.all(sql);
  }

  public async getMatchById(id: string): Promise<unknown> {
    const sql = `
      SELECT 
        m.*,
        ht.name as homeTeamName,
        ht.logo as homeTeamLogo,
        at.name as awayTeamName,
        at.logo as awayTeamLogo,
        s.name as seasonName
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      WHERE m.id = ?
    `;
    return await this.connection.get(sql, [id]);
  }

  public async getMatchesByStatus(status: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        m.*,
        ht.name as homeTeamName,
        ht.logo as homeTeamLogo,
        at.name as awayTeamName,
        at.logo as awayTeamLogo,
        s.name as seasonName
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      WHERE m.status = ?
      ORDER BY m.date ASC
    `;
    return await this.connection.all(sql, [status]);
  }

  public async getUpcomingMatches(limit: number = 10): Promise<unknown[]> {
    const sql = `
      SELECT 
        m.*,
        ht.name as homeTeamName,
        ht.logo as homeTeamLogo,
        at.name as awayTeamName,
        at.logo as awayTeamLogo,
        s.name as seasonName
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      WHERE m.status = 'scheduled' AND m.date > datetime('now')
      ORDER BY m.date ASC
      LIMIT ?
    `;
    return await this.connection.all(sql, [limit]);
  }

  public async getNextUnplayedMatch(currentVirtualTime: string): Promise<unknown> {
    const sql = `
      SELECT 
        m.*,
        ht.name as homeTeamName,
        ht.logo as homeTeamLogo,
        at.name as awayTeamName,
        at.logo as awayTeamLogo,
        s.name as seasonName
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      WHERE m.status = 'scheduled' 
        AND m.date >= ?
      ORDER BY m.date ASC
      LIMIT 1
    `;
    return await this.connection.get(sql, [currentVirtualTime]);
  }

  public async getUnplayedMatchesUntil(targetTime: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        m.*,
        ht.name as homeTeamName,
        ht.logo as homeTeamLogo,
        at.name as awayTeamName,
        at.logo as awayTeamLogo,
        s.name as seasonName
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      WHERE m.status = 'scheduled' 
        AND m.date <= ?
      ORDER BY m.date ASC
    `;
    return await this.connection.all(sql, [targetTime]);
  }

  public async getRelatedMatches(homeTeamId: string, awayTeamId: string, currentVirtualTime: string, limit: number = 5): Promise<unknown[]> {
    const sql = `
      SELECT 
        m.*,
        ht.name as homeTeamName,
        ht.logo as homeTeamLogo,
        at.name as awayTeamName,
        at.logo as awayTeamLogo,
        s.name as seasonName
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      WHERE m.status = 'scheduled' 
        AND m.date > ?
        AND (m.home_team_id = ? OR m.away_team_id = ? OR m.home_team_id = ? OR m.away_team_id = ?)
      ORDER BY m.date ASC
      LIMIT ?
    `;
    return await this.connection.all(sql, [currentVirtualTime, homeTeamId, homeTeamId, awayTeamId, awayTeamId, limit]);
  }

  // Match simulation methods
  public async updateMatchStatus(matchId: string, status: string): Promise<void> {
    const sql = `
      UPDATE matches 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await this.connection.run(sql, [status, matchId]);
  }

  public async updateMatchScore(matchId: string, homeScore: number, awayScore: number): Promise<void> {
    const sql = `
      UPDATE matches 
      SET home_score = ?, away_score = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await this.connection.run(sql, [homeScore, awayScore, matchId]);
  }

  public async updateMatchSnitchCaught(matchId: string, snitchCaught: boolean, snitchCaughtBy: string): Promise<void> {
    const sql = `
      UPDATE matches 
      SET snitch_caught = ?, snitch_caught_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await this.connection.run(sql, [snitchCaught, snitchCaughtBy, matchId]);
  }

  public async finishMatch(matchId: string, matchResult: {
    homeScore: number;
    awayScore: number;
    duration: number;
    snitchCaught: boolean;
    snitchCaughtBy: string;
    events: Array<{
      id: string;
      minute: number;
      type: string;
      team: string;
      player?: string;
      description: string;
      points: number;
    }>;
    finishedAt: string;
  }): Promise<void> {
    console.log('🔄 MatchesRepository.finishMatch called with:', {
      matchId,
      homeScore: matchResult.homeScore,
      awayScore: matchResult.awayScore,
      eventsCount: matchResult.events.length,
      duration: matchResult.duration,
      snitchCaught: matchResult.snitchCaught,
      snitchCaughtBy: matchResult.snitchCaughtBy
    });

    try {
      // Verificar que el partido existe y obtener su estado actual
      const existingMatch = await this.connection.get('SELECT * FROM matches WHERE id = ?', [matchId]) as { 
        id: string; 
        status: string; 
        home_team_id: string; 
        away_team_id: string; 
        home_score: number; 
        away_score: number; 
        is_stats_consolidated?: boolean;
      } | undefined;
      
      if (!existingMatch) {
        throw new Error(`Match with ID ${matchId} does not exist`);
      }

      // 🛡️ PROTECCIÓN CONTRA DUPLICACIÓN: Verificar si el partido ya está terminado
      if (existingMatch.status === 'finished') {
        console.log(`⚠️ Match ${matchId} is already finished. Skipping duplicate finalization.`);
        console.log(`   Current scores: ${existingMatch.home_score} - ${existingMatch.away_score}`);
        console.log(`   Attempted scores: ${matchResult.homeScore} - ${matchResult.awayScore}`);
        
        // No lanzar error, solo retornar sin procesar
        return;
      }

      // 🛡️ PROTECCIÓN ADICIONAL: Verificar si las estadísticas ya están consolidadas
      if (existingMatch.is_stats_consolidated) {
        console.log(`⚠️ Match ${matchId} statistics are already consolidated. Skipping duplicate processing.`);
        return;
      }

      console.log('✅ Match exists and is not finished yet, proceeding with update');

      // Actualizar el partido con todos los resultados
      const updateMatchSql = `
        UPDATE matches 
        SET status = 'finished', 
            home_score = ?, 
            away_score = ?, 
            duration = ?, 
            snitch_caught = ?, 
            snitch_caught_by = ?, 
            is_stats_consolidated = TRUE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await this.connection.run(updateMatchSql, [
        matchResult.homeScore,
        matchResult.awayScore,
        matchResult.duration,
        matchResult.snitchCaught,
        matchResult.snitchCaughtBy,
        matchId
      ]);

      console.log('✅ Match updated successfully');

      // Limpiar eventos existentes del partido para evitar duplicados
      await this.connection.run('DELETE FROM match_events WHERE match_id = ?', [matchId]);
      console.log('✅ Existing events cleared');

      // Guardar todos los eventos del partido
      let eventsProcessed = 0;
      for (const event of matchResult.events) {
        try {
          await this.createMatchEvent({
            id: event.id,
            matchId,
            minute: event.minute,
            type: event.type,
            team: event.team,
            player: event.player || undefined,
            description: event.description,
            points: event.points
          });
          eventsProcessed++;
        } catch (eventError) {
          console.error(`❌ Error saving event ${event.id}:`, eventError);
          // Continue processing other events
        }
      }

      console.log(`✅ Match ${matchId} finished successfully with ${eventsProcessed}/${matchResult.events.length} events saved`);

      // 🎯 SOLO ACTUALIZAR ESTADÍSTICAS SI EL PARTIDO NO ESTABA TERMINADO ANTES
      console.log('🔄 Updating team statistics...');
      await this.updateTeamStatistics(matchId, matchResult.homeScore, matchResult.awayScore, matchResult.snitchCaughtBy);
      console.log('✅ Team statistics updated');

      // Resolve bets for the finished match
      try {
        const betResolutionService = BetResolutionService.getInstance();
        const resolution = await betResolutionService.resolveBetsForMatch(matchId);
        console.log(`✅ Bets resolved for match ${matchId}: ${resolution.resolved} resolved, ${resolution.errors.length} errors`);
        
        if (resolution.errors.length > 0) {
          console.warn('⚠️ Bet resolution errors:', resolution.errors);
        }
      } catch (betError) {
        console.error('❌ Error resolving bets for match:', betError);
        // Don't throw - match should still finish successfully even if bet resolution fails
      }

    } catch (error) {
      console.error('❌ Error in finishMatch:', error);
      throw error;
    }
  }

  public async createMatchEvent(event: {
    id: string;
    matchId: string;
    minute: number;
    type: string;
    team: string;
    player?: string;
    description: string;
    points: number;
  }): Promise<void> {
    try {
      const sql = `
        INSERT INTO match_events (id, match_id, minute, type, team, player, description, points)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.connection.run(sql, [
        event.id,
        event.matchId,
        event.minute,
        event.type,
        event.team,
        event.player || null,
        event.description,
        event.points
      ]);
    } catch (error) {
      console.error('❌ Error creating match event:', {
        eventId: event.id,
        matchId: event.matchId,
        type: event.type,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  public async getMatchEvents(matchId: string): Promise<unknown[]> {
    const sql = `
      SELECT * FROM match_events
      WHERE match_id = ?
      ORDER BY minute ASC
    `;
    return await this.connection.all(sql, [matchId]);
  }

  public async getMatchLineups(matchId: string): Promise<{
    homeTeam: { team: unknown; lineup: unknown[] };
    awayTeam: { team: unknown; lineup: unknown[] };
  }> {
    // Get match details
    const match = await this.getMatchById(matchId) as { home_team_id: string; away_team_id: string } | undefined;
    if (!match) {
      throw new Error('Match not found');
    }

    // Import TeamsRepository to get lineups
    const { TeamsRepository } = await import('./TeamsRepository');
    const teamsRepo = new TeamsRepository();

    // Get both teams' lineups
    const homeLineup = await teamsRepo.getTeamStartingLineup(match.home_team_id);
    const awayLineup = await teamsRepo.getTeamStartingLineup(match.away_team_id);
    
    // Get team basic info
    const homeTeam = await teamsRepo.getTeamById(match.home_team_id);
    const awayTeam = await teamsRepo.getTeamById(match.away_team_id);

    return {
      homeTeam: { team: homeTeam, lineup: homeLineup },
      awayTeam: { team: awayTeam, lineup: awayLineup }
    };
  }

  /**
   * Updates team statistics after a match is finished
   */
  private async updateTeamStatistics(matchId: string, homeScore: number, awayScore: number, snitchCaughtBy: string): Promise<void> {
    try {
      // Get match details to get team IDs
      const match = await this.connection.get('SELECT home_team_id, away_team_id FROM matches WHERE id = ?', [matchId]) as { home_team_id: string; away_team_id: string } | undefined;
      
      if (!match) {
        throw new Error(`Match ${matchId} not found`);
      }

      const homeTeamId = match.home_team_id;
      const awayTeamId = match.away_team_id;

      // Determine match result
      let homeResult: 'win' | 'loss' | 'draw';
      let awayResult: 'win' | 'loss' | 'draw';

      if (homeScore > awayScore) {
        homeResult = 'win';
        awayResult = 'loss';
      } else if (awayScore > homeScore) {
        homeResult = 'loss';
        awayResult = 'win';
      } else {
        homeResult = 'draw';
        awayResult = 'draw';
      }

      // Update home team statistics
      await this.updateSingleTeamStats(homeTeamId, homeResult, homeScore, awayScore, snitchCaughtBy === homeTeamId);

      // Update away team statistics
      await this.updateSingleTeamStats(awayTeamId, awayResult, awayScore, homeScore, snitchCaughtBy === awayTeamId);

      console.log(`📊 Updated statistics for teams ${homeTeamId} (${homeResult}) and ${awayTeamId} (${awayResult})`);
    } catch (error) {
      console.error('❌ Error updating team statistics:', error);
      throw error;
    }
  }

  /**
   * Updates statistics for a single team
   */
  private async updateSingleTeamStats(teamId: string, result: 'win' | 'loss' | 'draw', pointsFor: number, pointsAgainst: number, caughtSnitch: boolean): Promise<void> {
    const sql = `
      UPDATE teams 
      SET 
        matches_played = matches_played + 1,
        wins = wins + ?,
        losses = losses + ?,
        draws = draws + ?,
        points_for = points_for + ?,
        points_against = points_against + ?,
        snitch_catches = snitch_catches + ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const wins = result === 'win' ? 1 : 0;
    const losses = result === 'loss' ? 1 : 0;
    const draws = result === 'draw' ? 1 : 0;
    const snitchCatch = caughtSnitch ? 1 : 0;

    await this.connection.run(sql, [
      wins,
      losses, 
      draws,
      pointsFor,
      pointsAgainst,
      snitchCatch,
      teamId
    ]);
  }
}
