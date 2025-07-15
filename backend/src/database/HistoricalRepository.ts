import { DatabaseConnection } from './DatabaseConnection';
import { Season } from './interfaces';

export class HistoricalRepository {
  private connection: DatabaseConnection;

  constructor() {
    this.connection = DatabaseConnection.getInstance();
  }

  public async archiveCompletedSeason(seasonId: string): Promise<void> {
    const { SeasonsRepository } = await import('./SeasonsRepository');
    const seasonsRepo = new SeasonsRepository();
    const season = await seasonsRepo.getSeasonById(seasonId) as Season | undefined;
    if (!season) return;

    console.log(`📚 Archivando temporada completada: ${season.name} (${seasonId})`);

    // Archive season
    const historicalSeasonId = `hist-${seasonId}-${Date.now()}`;
    await this.connection.run(`
      INSERT INTO historical_seasons (
        id, original_season_id, name, start_date, end_date, 
        total_teams, total_matches, total_bets, total_predictions, champion_team_id, champion_team_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      historicalSeasonId,
      seasonId,
      season.name,
      season.start_date,
      season.end_date,
      season.teamsCount || 0,
      season.matchesCount || 0,
      0, // Will be calculated
      0, // Will be calculated
      null, // Will be determined from standings
      null
    ]);

    console.log(`📊 Actualizando estadísticas históricas de equipos...`);
    
    // Update team historical stats
    await this.updateHistoricalTeamStats();
    
    console.log(`👥 Actualizando estadísticas históricas de usuarios...`);
    
    // Update user historical stats
    await this.updateHistoricalUserStats();

    console.log(`✅ Temporada ${season.name} archivada correctamente`);
  }

  public async forceUpdateHistoricalTeamStats(): Promise<void> {
    console.log(`🔧 Forzando actualización de estadísticas históricas de equipos...`);
    await this.updateHistoricalTeamStats();
    console.log(`✅ Estadísticas históricas de equipos actualizadas forzadamente`);
  }

  public async repairHistoricalTeamStats(): Promise<void> {
    console.log(`🔧 Reparando estadísticas históricas de equipos...`);
    
    try {
      // Primero, limpiar registros con datos NULL
      await this.connection.run(`
        DELETE FROM historical_team_stats 
        WHERE total_seasons IS NULL OR total_matches IS NULL
      `);
      
      // Forzar la actualización completa
      await this.forceUpdateHistoricalTeamStats();
      
      // Verificar resultados
      const stats = await this.connection.all(`
        SELECT team_id, team_name, total_seasons, total_matches, championships_won 
        FROM historical_team_stats 
        ORDER BY championships_won DESC, total_wins DESC
      `);
      
      console.log(`✅ Reparación completada. ${(stats as any[]).length} equipos actualizados`);
      console.table(stats);
      
    } catch (error) {
      console.error('❌ Error reparando estadísticas históricas:', error);
      throw error;
    }
  }

  private async updateHistoricalTeamStats(): Promise<void> {
    // Complex query to aggregate all team statistics across all seasons
    const sql = `
      INSERT OR REPLACE INTO historical_team_stats (
        id, team_id, team_name, total_seasons, total_matches, total_wins, 
        total_losses, total_draws, total_points_for, total_points_against, 
        total_snitch_catches, championships_won, best_season_position, 
        worst_season_position, updated_at
      )
      SELECT 
        'hist-' || t.id as id,
        t.id as team_id,
        t.name as team_name,
        COUNT(DISTINCT st.season_id) as total_seasons,
        COALESCE(SUM(st.matches_played), 0) as total_matches,
        COALESCE(SUM(st.wins), 0) as total_wins,
        COALESCE(SUM(st.losses), 0) as total_losses,
        COALESCE(SUM(st.draws), 0) as total_draws,
        COALESCE(SUM(st.points_for), 0) as total_points_for,
        COALESCE(SUM(st.points_against), 0) as total_points_against,
        COALESCE(SUM(st.snitch_catches), 0) as total_snitch_catches,
        COUNT(CASE WHEN st.position = 1 THEN 1 END) as championships_won,
        MIN(st.position) as best_season_position,
        MAX(st.position) as worst_season_position,
        CURRENT_TIMESTAMP as updated_at
      FROM teams t
      LEFT JOIN standings st ON t.id = st.team_id
      WHERE st.season_id IS NOT NULL OR t.id IN (
        SELECT DISTINCT team_id FROM season_teams
      )
      GROUP BY t.id, t.name
    `;
    await this.connection.run(sql);
  }

  private async updateHistoricalUserStats(): Promise<void> {
    // Complex query to aggregate all user statistics
    const sql = `
      INSERT OR REPLACE INTO historical_user_stats (
        id, user_id, username, total_bets, total_amount_bet, total_winnings,
        total_losses, total_predictions, correct_predictions, prediction_accuracy, account_created
      )
      SELECT 
        'hist-' || u.id as id,
        u.id as user_id,
        u.username,
        COUNT(DISTINCT b.id) as total_bets,
        COALESCE(SUM(b.amount), 0) as total_amount_bet,
        COALESCE(SUM(CASE WHEN b.status = 'won' THEN b.potential_win - b.amount ELSE 0 END), 0) as total_winnings,
        COALESCE(SUM(CASE WHEN b.status = 'lost' THEN b.amount ELSE 0 END), 0) as total_losses,
        COUNT(DISTINCT p.id) as total_predictions,
        COUNT(CASE WHEN p.status = 'correct' THEN 1 END) as correct_predictions,
        CASE 
          WHEN COUNT(DISTINCT p.id) > 0 
          THEN (COUNT(CASE WHEN p.status = 'correct' THEN 1 END) * 100.0 / COUNT(DISTINCT p.id))
          ELSE 0 
        END as prediction_accuracy,
        u.created_at as account_created
      FROM users u
      LEFT JOIN bets b ON u.id = b.user_id
      LEFT JOIN predictions p ON u.id = p.user_id
      WHERE u.role = 'user'
      GROUP BY u.id, u.username, u.created_at
    `;
    await this.connection.run(sql);
  }
}
