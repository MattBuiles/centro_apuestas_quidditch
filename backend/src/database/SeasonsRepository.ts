import { DatabaseConnection } from './DatabaseConnection';

export class SeasonsRepository {
  private connection: DatabaseConnection;

  constructor() {
    this.connection = DatabaseConnection.getInstance();
  }

  public async getAllSeasons(): Promise<unknown[]> {
    const sql = `
      SELECT 
        s.*,
        COUNT(DISTINCT st.team_id) as teamsCount,
        COUNT(DISTINCT m.id) as matchesCount,
        COUNT(CASE WHEN m.status = 'finished' THEN 1 END) as finishedMatches,
        COUNT(CASE WHEN m.status = 'scheduled' THEN 1 END) as scheduledMatches
      FROM seasons s
      LEFT JOIN season_teams st ON s.id = st.season_id
      LEFT JOIN matches m ON s.id = m.season_id
      GROUP BY s.id
      ORDER BY s.start_date DESC
    `;
    return await this.connection.all(sql);
  }

  public async getSeasonById(id: string): Promise<unknown> {
    const sql = `
      SELECT 
        s.*,
        COUNT(DISTINCT st.team_id) as teamsCount,
        COUNT(DISTINCT m.id) as matchesCount,
        COUNT(CASE WHEN m.status = 'finished' THEN 1 END) as finishedMatches,
        COUNT(CASE WHEN m.status = 'scheduled' THEN 1 END) as scheduledMatches
      FROM seasons s
      LEFT JOIN season_teams st ON s.id = st.season_id
      LEFT JOIN matches m ON s.id = m.season_id
      WHERE s.id = ?
      GROUP BY s.id
    `;
    return await this.connection.get(sql, [id]);
  }

  public async getCurrentSeason(): Promise<unknown> {
    const sql = `
      SELECT 
        s.*,
        COUNT(DISTINCT st.team_id) as teamsCount,
        COUNT(DISTINCT m.id) as matchesCount,
        COUNT(CASE WHEN m.status = 'finished' THEN 1 END) as finishedMatches,
        COUNT(CASE WHEN m.status = 'scheduled' THEN 1 END) as scheduledMatches
      FROM seasons s
      LEFT JOIN season_teams st ON s.id = st.season_id
      LEFT JOIN matches m ON s.id = m.season_id
      WHERE s.status = 'active'
      GROUP BY s.id
      ORDER BY s.start_date DESC
      LIMIT 1
    `;
    return await this.connection.get(sql);
  }

  public async getSeasonStandings(seasonId: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        st.*,
        t.name as teamName,
        t.logo as teamLogo,
        t.colors as teamColors
      FROM standings st
      JOIN teams t ON st.team_id = t.id
      WHERE st.season_id = ?
      ORDER BY st.points DESC, st.points_difference DESC, st.points_for DESC
    `;
    return await this.connection.all(sql, [seasonId]);
  }

  public async getSeasonMatches(seasonId: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        m.*,
        ht.name as homeTeamName,
        ht.logo as homeTeamLogo,
        at.name as awayTeamName,
        at.logo as awayTeamLogo
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.season_id = ?
      ORDER BY m.date ASC
    `;
    return await this.connection.all(sql, [seasonId]);
  }
}
