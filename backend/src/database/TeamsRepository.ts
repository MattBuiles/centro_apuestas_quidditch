import { DatabaseConnection } from './DatabaseConnection';

export class TeamsRepository {
  private connection: DatabaseConnection;

  constructor() {
    this.connection = DatabaseConnection.getInstance();
  }

  public async getAllTeams(): Promise<unknown[]> {
    const sql = `
      SELECT 
        id, name, logo, founded, description, stadium, colors,
        matches_played, wins, losses, draws, points_for, points_against, snitch_catches
      FROM teams
      ORDER BY name ASC
    `;
    return await this.connection.all(sql);
  }

  public async getTeamById(teamId: string): Promise<unknown> {
    const sql = `
      SELECT 
        t.*,
        COUNT(DISTINCT p.id) as total_players,
        COUNT(CASE WHEN p.is_starting = 1 THEN 1 END) as starting_players
      FROM teams t
      LEFT JOIN players p ON t.id = p.team_id
      WHERE t.id = ?
      GROUP BY t.id
    `;
    return await this.connection.get(sql, [teamId]);
  }

  public async getTeamPlayers(teamId: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        id, name, position, skill_level, is_starting, number, years_active, achievements,
        created_at, updated_at
      FROM players
      WHERE team_id = ?
      ORDER BY is_starting DESC, position ASC, number ASC
    `;
    return await this.connection.all(sql, [teamId]);
  }

  public async getTeamStartingLineup(teamId: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        id, name, position, skill_level, number, years_active, achievements
      FROM players
      WHERE team_id = ? AND is_starting = 1
      ORDER BY position ASC, number ASC
    `;
    return await this.connection.all(sql, [teamId]);
  }

  public async getPlayersByPosition(teamId: string, position: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        id, name, skill_level, is_starting, number, years_active, achievements
      FROM players
      WHERE team_id = ? AND position = ?
      ORDER BY is_starting DESC, skill_level DESC
    `;
    return await this.connection.all(sql, [teamId, position]);
  }

  public async getTeamStatistics(teamId: string): Promise<unknown> {
    const sql = `
      SELECT 
        t.id, t.name, t.logo, t.founded, t.description, t.stadium, t.colors,
        t.slogan, t.history, t.titles, t.achievements,
        t.matches_played, t.wins, t.losses, t.draws,
        t.points_for, t.points_against, t.snitch_catches,
        t.attack_strength, t.defense_strength, t.seeker_skill,
        t.keeper_skill, t.chaser_skill, t.beater_skill,
        ROUND(CAST(t.wins AS FLOAT) / NULLIF(t.matches_played, 0) * 100, 1) as win_percentage,
        (t.points_for - t.points_against) as point_difference
      FROM teams t
      WHERE t.id = ?
    `;
    return await this.connection.get(sql, [teamId]);
  }

  public async getTeamUpcomingMatches(teamId: string, limit: number = 5): Promise<unknown[]> {
    const sql = `
      SELECT 
        m.*,
        ht.name as home_team_name,
        at.name as away_team_name,
        ht.logo as home_team_logo,
        at.logo as away_team_logo
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE 
        (m.home_team_id = ? OR m.away_team_id = ?)
        AND m.status IN ('scheduled', 'live')
        AND m.date > datetime('now')
      ORDER BY m.date ASC
      LIMIT ?
    `;
    return await this.connection.all(sql, [teamId, teamId, limit]);
  }

  public async getTeamRecentMatches(teamId: string, limit: number = 5): Promise<unknown[]> {
    const sql = `
      SELECT 
        m.*,
        ht.name as home_team_name,
        at.name as away_team_name,
        ht.logo as home_team_logo,
        at.logo as away_team_logo
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE 
        (m.home_team_id = ? OR m.away_team_id = ?)
        AND m.status = 'finished'
        AND m.home_score IS NOT NULL 
        AND m.away_score IS NOT NULL
      ORDER BY m.date DESC
      LIMIT ?
    `;
    return await this.connection.all(sql, [teamId, teamId, limit]);
  }

  public async getTeamRivalries(teamId: string): Promise<unknown[]> {
    const sql = `
      WITH RivalryStats AS (
        SELECT 
          CASE 
            WHEN m.home_team_id = ? THEN m.away_team_id
            ELSE m.home_team_id
          END as opponent_id,
          CASE 
            WHEN m.home_team_id = ? THEN at.name
            ELSE ht.name
          END as opponent_name,
          COUNT(*) as total_matches,
          SUM(CASE 
            WHEN m.home_team_id = ? AND m.home_score > m.away_score THEN 1
            WHEN m.away_team_id = ? AND m.away_score > m.home_score THEN 1
            ELSE 0
          END) as wins,
          SUM(CASE 
            WHEN m.home_team_id = ? AND m.home_score < m.away_score THEN 1
            WHEN m.away_team_id = ? AND m.away_score < m.home_score THEN 1
            ELSE 0
          END) as losses,
          SUM(CASE 
            WHEN m.home_score = m.away_score THEN 1
            ELSE 0
          END) as draws,
          ROUND(AVG(CASE 
            WHEN m.home_team_id = ? AND m.home_score > m.away_score THEN 1.0
            WHEN m.away_team_id = ? AND m.away_score > m.home_score THEN 1.0
            ELSE 0.0
          END) * 100, 1) as win_percentage
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        WHERE 
          (m.home_team_id = ? OR m.away_team_id = ?)
          AND m.status = 'finished'
          AND m.home_score IS NOT NULL 
          AND m.away_score IS NOT NULL
        GROUP BY opponent_id, opponent_name
        HAVING total_matches >= 2
      ),
      LastMatches AS (
        SELECT 
          CASE 
            WHEN m.home_team_id = ? THEN m.away_team_id
            ELSE m.home_team_id
          END as opponent_id,
          m.date as last_match_date,
          CASE 
            WHEN m.home_team_id = ? AND m.home_score > m.away_score THEN 'win'
            WHEN m.away_team_id = ? AND m.away_score > m.home_score THEN 'win'
            WHEN m.home_score = m.away_score THEN 'draw'
            ELSE 'loss'
          END as last_match_result,
          CASE 
            WHEN m.home_team_id = ? THEN m.home_score
            ELSE m.away_score
          END as last_match_team_score,
          CASE 
            WHEN m.home_team_id = ? THEN m.away_score
            ELSE m.home_score
          END as last_match_opponent_score,
          ROW_NUMBER() OVER (PARTITION BY 
            CASE 
              WHEN m.home_team_id = ? THEN m.away_team_id
              ELSE m.home_team_id
            END
            ORDER BY m.date DESC
          ) as rn
        FROM matches m
        WHERE 
          (m.home_team_id = ? OR m.away_team_id = ?)
          AND m.status = 'finished'
          AND m.home_score IS NOT NULL 
          AND m.away_score IS NOT NULL
      )
      SELECT 
        rs.opponent_id,
        rs.opponent_name,
        rs.total_matches,
        rs.wins,
        rs.losses,
        rs.draws,
        rs.win_percentage,
        lm.last_match_date,
        lm.last_match_result,
        lm.last_match_team_score,
        lm.last_match_opponent_score
      FROM RivalryStats rs
      LEFT JOIN LastMatches lm ON rs.opponent_id = lm.opponent_id AND lm.rn = 1
      ORDER BY rs.total_matches DESC, rs.win_percentage DESC
      LIMIT 10
    `;
    return await this.connection.all(sql, [
      teamId, teamId, teamId, teamId, teamId, teamId, teamId, teamId, teamId, teamId,
      teamId, teamId, teamId, teamId, teamId, teamId, teamId, teamId
    ]);
  }

  public async getTeamHistoricalIdols(teamId: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        ti.id,
        ti.name,
        ti.position,
        ti.period,
        ti.years_active,
        ti.description,
        ti.achievements,
        ti.legendary_stats
      FROM team_idols ti
      WHERE ti.team_id = ?
        AND ti.is_active = 1
      ORDER BY ti.years_active DESC, ti.name ASC
    `;
    return await this.connection.all(sql, [teamId]);
  }

  public async getTeamAchievements(teamId: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        ta.id,
        ta.title,
        ta.description,
        ta.year,
        ta.category
      FROM team_achievements ta
      WHERE ta.team_id = ?
        AND ta.is_active = 1
      ORDER BY ta.year DESC, ta.title ASC
    `;
    return await this.connection.all(sql, [teamId]);
  }
}
