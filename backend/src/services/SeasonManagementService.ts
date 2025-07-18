import { Database } from '../database/Database';
import { Season, Team, Match, StandingEntry, TeamRow, MatchRow } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface SeasonCreateData {
  name: string;
  startDate: Date;
  endDate: Date;
  teamIds: string[];
}

export class SeasonManagementService {
  private db = Database.getInstance();

  async createSeason(data: SeasonCreateData): Promise<Season> {
    const seasonId = uuidv4();
    
    // Create season record
    await this.db.run(`
      INSERT INTO seasons (id, name, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?)
    `, [seasonId, data.name, data.startDate.toISOString(), data.endDate.toISOString(), 'upcoming']);

    // Link teams to season
    for (const teamId of data.teamIds) {
      await this.db.run(`
        INSERT INTO season_teams (season_id, team_id)
        VALUES (?, ?)
      `, [seasonId, teamId]);
    }

    // Generate matches
    await this.generateSeasonMatches(seasonId, data.teamIds, data.startDate, data.endDate);

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

  async activateSeason(seasonId: string): Promise<void> {
    // Deactivate current active season
    await this.db.run(`
      UPDATE seasons SET status = 'finished' WHERE status = 'active'
    `);

    // Activate new season
    await this.db.run(`
      UPDATE seasons SET status = 'active' WHERE id = ?
    `, [seasonId]);
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

    // Distribute matches evenly across the season
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const matchesPerDay = Math.ceil(matches.length / totalDays);
    let currentDate = new Date(startDate);

    for (let i = 0; i < matches.length; i++) {
      if (i > 0 && i % matchesPerDay === 0) {
        currentDate = new Date(currentDate.getTime() + (1000 * 60 * 60 * 24));
      }

      const match = matches[i];
      const matchTime = new Date(currentDate);
      matchTime.setHours(14 + (i % 3) * 2, 0, 0, 0); // Spread matches throughout the day

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
