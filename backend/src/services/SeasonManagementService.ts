import { Database } from '../database/Database';
import { Season, Team, Match, StandingEntry, TeamRow, MatchRow } from '../types';
import { StandingsService } from './StandingsService';
import { HistoricalSeasonsService } from './HistoricalSeasonsService';
import { v4 as uuidv4 } from 'uuid';

export interface SeasonCreateData {
  name: string;
  startDate: Date;
  endDate: Date;
  teamIds: string[];
  status?: 'upcoming' | 'active' | 'finished';
}

export class SeasonManagementService {
  private db = Database.getInstance();
  private standingsService = new StandingsService();
  private historicalSeasonsService = new HistoricalSeasonsService();

  async createSeason(data: SeasonCreateData): Promise<Season> {
    const seasonId = uuidv4();
    const status = data.status || 'upcoming'; // Default to 'upcoming' if not specified
    
    // Create season record
    await this.db.run(`
      INSERT INTO seasons (id, name, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?)
    `, [seasonId, data.name, data.startDate.toISOString(), data.endDate.toISOString(), status]);

    // Link teams to season
    for (const teamId of data.teamIds) {
      await this.db.run(`
        INSERT INTO season_teams (season_id, team_id)
        VALUES (?, ?)
      `, [seasonId, teamId]);
    }

    // Generate matches
    await this.generateSeasonMatches(seasonId, data.teamIds, data.startDate, data.endDate);

    // Inicializar standings para la nueva temporada
    await this.standingsService.initializeSeasonStandings(seasonId);

    // Return the created season
    return this.getSeasonById(seasonId);
  }

  async getSeasonById(seasonId: string): Promise<Season> {
    const seasonRow = await this.db.get(`
      SELECT * FROM seasons WHERE id = ?
    `, [seasonId]) as {
      id: string;
      name: string;
      start_date: string;
      end_date: string;
      status: string;
    } | undefined;

    if (!seasonRow) {
      throw new Error(`Season ${seasonId} not found`);
    }

    // Get teams
    const teamRows = await this.db.all(`
      SELECT t.* FROM teams t
      JOIN season_teams st ON t.id = st.team_id
      WHERE st.season_id = ?
      ORDER BY t.name
    `, [seasonId]) as TeamRow[];

    // Get matches
    const matchRows = await this.db.all(`
      SELECT * FROM matches
      WHERE season_id = ?
      ORDER BY date
    `, [seasonId]) as MatchRow[];

    // Get standings
    const standings = await this.generateStandings(seasonId);

    return {
      id: seasonRow.id,
      name: seasonRow.name,
      startDate: new Date(seasonRow.start_date),
      endDate: new Date(seasonRow.end_date),
      status: seasonRow.status as Season['status'],
      teams: teamRows.map(this.mapTeamRowToTeam),
      matches: matchRows.map(this.mapMatchRowToMatch),
      standings
    };
  }

  async getCurrentSeason(): Promise<Season | null> {
    const seasonRow = await this.db.get(`
      SELECT * FROM seasons 
      WHERE status = 'active' 
      ORDER BY start_date DESC 
      LIMIT 1
    `) as {
      id: string;
      name: string;
      start_date: string;
      end_date: string;
      status: string;
    } | undefined;

    if (!seasonRow) {
      return null;
    }

    return this.getSeasonById(seasonRow.id);
  }

  async getAllSeasons(): Promise<Season[]> {
    const seasonRows = await this.db.all(`
      SELECT * FROM seasons 
      ORDER BY start_date DESC
    `) as Array<{
      id: string;
      name: string;
      start_date: string;
      end_date: string;
      status: string;
    }>;

    const seasons: Season[] = [];
    for (const row of seasonRows) {
      const season = await this.getSeasonById(row.id);
      seasons.push(season);
    }

    return seasons;
  }

  async activateSeason(seasonId: string): Promise<Season> {
    // Deactivate current active season
    await this.db.run(`
      UPDATE seasons SET status = 'finished' WHERE status = 'active'
    `);

    // Activate new season
    await this.db.run(`
      UPDATE seasons SET status = 'active' WHERE id = ?
    `, [seasonId]);

    // Return the activated season
    return this.getSeasonById(seasonId);
  }

  /**
   * Verifica si todos los partidos de la temporada activa están finalizados
   * y actualiza el estado de la temporada a 'finished' si es necesario
   */
  async checkAndFinishSeasonIfComplete(): Promise<{ seasonFinished: boolean; seasonId?: string }> {
    // Obtener la temporada activa
    const activeSeasonRow = await this.db.get(`
      SELECT * FROM seasons 
      WHERE status = 'active' 
      LIMIT 1
    `) as {
      id: string;
      name: string;
      start_date: string;
      end_date: string;
      status: string;
    } | undefined;

    if (!activeSeasonRow) {
      return { seasonFinished: false };
    }

    // Verificar si todos los partidos de la temporada están finalizados
    const matchesStatus = await this.db.get(`
      SELECT 
        COUNT(*) as total_matches,
        COUNT(CASE WHEN status = 'finished' THEN 1 END) as finished_matches,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_matches,
        COUNT(CASE WHEN status = 'live' THEN 1 END) as live_matches
      FROM matches 
      WHERE season_id = ?
    `, [activeSeasonRow.id]) as {
      total_matches: number;
      finished_matches: number;
      scheduled_matches: number;
      live_matches: number;
    };

    console.log(`🏆 Verificando finalización de temporada ${activeSeasonRow.name}:`);
    console.log(`   - Total de partidos: ${matchesStatus.total_matches}`);
    console.log(`   - Partidos finalizados: ${matchesStatus.finished_matches}`);
    console.log(`   - Partidos programados: ${matchesStatus.scheduled_matches}`);
    console.log(`   - Partidos en vivo: ${matchesStatus.live_matches}`);

    // Si todos los partidos están finalizados, actualizar el estado de la temporada
    if (matchesStatus.total_matches > 0 && 
        matchesStatus.finished_matches === matchesStatus.total_matches) {
      
      console.log(`✅ Todos los partidos completados. Finalizando temporada ${activeSeasonRow.name}`);
      
      await this.db.run(`
        UPDATE seasons 
        SET status = 'finished' 
        WHERE id = ?
      `, [activeSeasonRow.id]);

      // Archivar la temporada en historical_seasons
      try {
        await this.historicalSeasonsService.archiveFinishedSeason(activeSeasonRow.id);
        console.log(`📚 Temporada ${activeSeasonRow.name} archivada en historical_seasons`);
      } catch (error) {
        console.error('Error archivando temporada en histórico:', error);
        // No fallar el proceso principal si hay error en el archivado
      }

      return { 
        seasonFinished: true, 
        seasonId: activeSeasonRow.id 
      };
    }

    return { seasonFinished: false };
  }

  /**
   * Finaliza manualmente una temporada específica
   */
  async finishSeason(seasonId: string): Promise<Season> {
    await this.db.run(`
      UPDATE seasons 
      SET status = 'finished' 
      WHERE id = ?
    `, [seasonId]);

    return this.getSeasonById(seasonId);
  }

  private async generateSeasonMatches(
    seasonId: string,
    teamIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    const matches: Array<{
      id: string;
      homeTeamId: string;
      awayTeamId: string;
      date: Date;
    }> = [];

    // Generate round-robin schedule (each team plays every other team twice)
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = 0; j < teamIds.length; j++) {
        if (i !== j) {
          matches.push({
            id: uuidv4(),
            homeTeamId: teamIds[i],
            awayTeamId: teamIds[j],
            date: new Date() // Will be set properly below
          });
        }
      }
    }

    // Get current virtual time to schedule matches from the current virtual date
    const { VirtualTimeService } = await import('./VirtualTimeService');
    const virtualTimeService = VirtualTimeService.getInstance();
    const currentVirtualState = await virtualTimeService.getCurrentState();
    
    // Schedule matches starting from the day after current virtual time
    const tomorrow = new Date(currentVirtualState.currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0); // Start at 2 PM tomorrow
    
    console.log(`📅 Programando partidos desde fecha virtual: ${currentVirtualState.currentDate.toISOString()}`);
    console.log(`📅 Primer partido programado para: ${tomorrow.toISOString()}`);
    
    // Schedule matches with more realistic distribution
    // Configuration for better match scheduling
    const matchesPerDay = Math.random() < 0.3 ? 0 : Math.random() < 0.6 ? 1 : 2; // 30% chance no matches, 30% chance 1 match, 40% chance 2 matches
    const possibleMatchTimes = ['14:00', '16:30', '19:00']; // More realistic times
    let currentDate = new Date(tomorrow);
    let matchesScheduledToday = 0;
    let currentMaxMatchesForDay = Math.random() < 0.3 ? 0 : Math.random() < 0.7 ? 1 : 2;

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      
      // Check if we need to move to next day
      if (matchesScheduledToday >= currentMaxMatchesForDay) {
        // Move to next day
        let daysToAdd = 1;
        
        // Sometimes skip days (20% chance of adding extra day, 10% chance of 2 extra days)
        if (Math.random() < 0.2) {
          daysToAdd += 1;
          if (Math.random() < 0.1) {
            daysToAdd += 1;
          }
        }
        
        currentDate.setDate(currentDate.getDate() + daysToAdd);
        matchesScheduledToday = 0;
        
        // Recalculate max matches for new day
        currentMaxMatchesForDay = Math.random() < 0.3 ? 0 : Math.random() < 0.7 ? 1 : 2;
        
        // If no matches scheduled for this day, skip it
        if (currentMaxMatchesForDay === 0) {
          currentDate.setDate(currentDate.getDate() + 1);
          currentMaxMatchesForDay = Math.random() < 0.7 ? 1 : 2; // Ensure next day has matches
        }
      }
      
      const matchTime = new Date(currentDate);
      
      // Select time based on how many matches are scheduled today
      let timeIndex;
      if (currentMaxMatchesForDay === 1) {
        timeIndex = 1; // 16:30 for single match
      } else {
        timeIndex = matchesScheduledToday === 0 ? 0 : 2; // 14:00 for first, 19:00 for second
      }
      
      const [hours, minutes] = possibleMatchTimes[timeIndex].split(':').map(Number);
      matchTime.setHours(hours, minutes, 0, 0);

      console.log(`📅 Scheduling match ${i + 1}/${matches.length}: ${match.homeTeamId} vs ${match.awayTeamId} at ${matchTime.toISOString()} (${matchesScheduledToday + 1}/${currentMaxMatchesForDay} today)`);

      // Generate realistic odds
      const odds = this.generateMatchOdds();

      await this.db.run(`
        INSERT INTO matches (
          id, season_id, home_team_id, away_team_id, date, status,
          odds_home_win, odds_away_win, odds_draw, odds_total_over, odds_total_under,
          odds_snitch_home, odds_snitch_away
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        match.id,
        seasonId,
        match.homeTeamId,
        match.awayTeamId,
        matchTime.toISOString(),
        'scheduled',
        odds.homeWin,
        odds.awayWin,
        odds.draw,
        odds.totalPoints.over150,
        odds.totalPoints.under150,
        odds.snitchCatch.home,
        odds.snitchCatch.away
      ]);
      
      matchesScheduledToday++;
    }
  }

  private generateMatchOdds() {
    return {
      homeWin: 1.5 + Math.random() * 2,
      awayWin: 1.5 + Math.random() * 2,
      draw: 5.0 + Math.random() * 5,
      totalPoints: {
        over150: 1.8 + Math.random() * 0.4,
        under150: 1.8 + Math.random() * 0.4
      },
      snitchCatch: {
        home: 1.9 + Math.random() * 0.2,
        away: 1.9 + Math.random() * 0.2
      }
    };
  }

  private async generateStandings(seasonId: string): Promise<StandingEntry[]> {
    const teams = await this.db.all(`
      SELECT t.* FROM teams t
      JOIN season_teams st ON t.id = st.team_id
      WHERE st.season_id = ?
    `, [seasonId]) as TeamRow[];

    const standings: StandingEntry[] = [];

    for (const team of teams) {
      const stats = await this.db.get(`
        SELECT 
          COUNT(*) as matches_played,
          SUM(CASE WHEN (home_team_id = ? AND home_score > away_score) OR (away_team_id = ? AND away_score > home_score) THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN (home_team_id = ? AND home_score < away_score) OR (away_team_id = ? AND away_score < home_score) THEN 1 ELSE 0 END) as losses,
          SUM(CASE WHEN (home_team_id = ? OR away_team_id = ?) AND home_score = away_score THEN 1 ELSE 0 END) as draws,
          SUM(CASE WHEN home_team_id = ? THEN home_score ELSE away_score END) as points_for,
          SUM(CASE WHEN home_team_id = ? THEN away_score ELSE home_score END) as points_against
        FROM matches
        WHERE season_id = ? AND status = 'finished' AND (home_team_id = ? OR away_team_id = ?)
      `, [
        team.id, team.id, team.id, team.id, team.id, team.id,
        team.id, team.id, seasonId, team.id, team.id
      ]) as {
        matches_played: number;
        wins: number;
        losses: number;
        draws: number;
        points_for: number;
        points_against: number;
      };

      const points = (stats.wins * 3) + (stats.draws * 1);
      
      standings.push({
        teamId: team.id,
        team: this.mapTeamRowToTeam(team),
        position: 0, // Will be set after sorting
        points,
        matchesPlayed: stats.matches_played,
        wins: stats.wins,
        losses: stats.losses,
        draws: stats.draws,
        pointsFor: stats.points_for,
        pointsAgainst: stats.points_against,
        pointsDifference: stats.points_for - stats.points_against,
        winRate: stats.matches_played > 0 ? (stats.wins / stats.matches_played) * 100 : 0,
        snitchCatches: 0 // Would need to be calculated from snitch catch events
      });
    }

    // Sort and assign positions
    standings.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.pointsDifference !== b.pointsDifference) return b.pointsDifference - a.pointsDifference;
      return b.pointsFor - a.pointsFor;
    });

    standings.forEach((standing, index) => {
      standing.position = index + 1;
    });

    return standings;
  }

  private mapTeamRowToTeam(row: TeamRow): Team {
    return {
      id: row.id,
      name: row.name,
      logo: (row.logo as string) || '',
      founded: (row.founded as number) || 0,
      description: (row.description as string) || '',
      stadium: (row.stadium as string) || '',
      colors: row.colors ? JSON.parse(row.colors as string) : [],
      stats: {
        matchesPlayed: (row.matches_played as number) || 0,
        wins: (row.wins as number) || 0,
        losses: (row.losses as number) || 0,
        draws: (row.draws as number) || 0,
        pointsFor: (row.points_for as number) || 0,
        pointsAgainst: (row.points_against as number) || 0,
        snitchCatches: (row.snitch_catches as number) || 0,
        winRate: (row.matches_played as number) ? (((row.wins as number) || 0) / ((row.matches_played as number) || 1)) * 100 : 0
      }
    };
  }

  private mapMatchRowToMatch(row: MatchRow): Match {
    return {
      id: row.id,
      seasonId: row.season_id,
      homeTeamId: row.home_team_id,
      awayTeamId: row.away_team_id,
      date: new Date(row.date),
      status: row.status as Match['status'],
      homeScore: row.home_score,
      awayScore: row.away_score,
      snitchCaught: row.snitch_caught,
      snitchCaughtBy: row.snitch_caught_by,
      duration: row.duration,
      events: [],
      odds: {
        homeWin: row.odds_home_win || 2.0,
        awayWin: row.odds_away_win || 2.0,
        draw: row.odds_draw || 5.0,
        totalPoints: {
          over150: row.odds_total_over || 1.8,
          under150: row.odds_total_under || 1.8
        },
        snitchCatch: {
          home: row.odds_snitch_home || 1.9,
          away: row.odds_snitch_away || 1.9
        }
      }
    };
  }
}
