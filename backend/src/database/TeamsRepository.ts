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
}
