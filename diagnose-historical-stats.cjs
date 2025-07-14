const sqlite3 = require('sqlite3');
const path = require('path');

async function diagnoseHistoricalStats() {
  const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');
  console.log('🔍 Diagnosticando estadísticas históricas...');
  console.log('📁 Base de datos:', dbPath);

  const db = new sqlite3.Database(dbPath);

  // Promisificar métodos de la base de datos
  const all = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const get = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  try {
    // 1. Verificar estructura de historical_team_stats
    console.log('\n📊 Estructura de historical_team_stats:');
    const tableInfo = await all("PRAGMA table_info(historical_team_stats)");
    console.table(tableInfo);

    // 2. Verificar contenido actual de historical_team_stats
    console.log('\n📋 Contenido actual de historical_team_stats:');
    const historicalStats = await all("SELECT * FROM historical_team_stats");
    console.log(`Total de registros: ${historicalStats.length}`);
    if (historicalStats.length > 0) {
      console.table(historicalStats);
    } else {
      console.log('⚠️ La tabla está vacía');
    }

    // 3. Verificar equipos existentes
    console.log('\n🏆 Equipos en la base de datos:');
    const teams = await all("SELECT id, name, matches_played, wins, losses, draws, points_for, points_against, snitch_catches FROM teams");
    console.table(teams);

    // 4. Verificar temporadas
    console.log('\n📅 Temporadas en la base de datos:');
    const seasons = await all("SELECT id, name, status, start_date, end_date FROM seasons");
    console.table(seasons);

    // 5. Verificar standings
    console.log('\n🏅 Standings por temporada:');
    const standings = await all(`
      SELECT 
        s.season_id,
        se.name as season_name,
        s.team_id,
        t.name as team_name,
        s.position,
        s.matches_played,
        s.wins,
        s.losses,
        s.draws,
        s.points_for,
        s.points_against,
        s.snitch_catches
      FROM standings s
      JOIN teams t ON s.team_id = t.id
      JOIN seasons se ON s.season_id = se.id
      ORDER BY s.season_id, s.position
    `);
    console.table(standings);

    // 6. Verificar partidos finalizados
    console.log('\n⚽ Partidos finalizados:');
    const finishedMatches = await all(`
      SELECT 
        season_id,
        COUNT(*) as finished_matches
      FROM matches 
      WHERE status = 'finished'
      GROUP BY season_id
    `);
    console.table(finishedMatches);

    // 7. Verificar historical_seasons
    console.log('\n📚 Temporadas históricas:');
    const historicalSeasons = await all("SELECT * FROM historical_seasons");
    console.table(historicalSeasons);

    // 8. Generar estadísticas que deberían estar en historical_team_stats
    console.log('\n🧮 Calculando estadísticas que deberían existir:');
    const calculatedStats = await all(`
      SELECT 
        t.id as team_id,
        t.name as team_name,
        COUNT(DISTINCT s.season_id) as total_seasons_participated,
        COALESCE(SUM(s.matches_played), 0) as total_matches,
        COALESCE(SUM(s.wins), 0) as total_wins,
        COALESCE(SUM(s.losses), 0) as total_losses,
        COALESCE(SUM(s.draws), 0) as total_draws,
        COALESCE(SUM(s.points_for), 0) as total_points_for,
        COALESCE(SUM(s.points_against), 0) as total_points_against,
        COALESCE(SUM(s.snitch_catches), 0) as total_snitch_catches,
        COUNT(CASE WHEN s.position = 1 THEN 1 END) as championships_won,
        MIN(s.position) as best_position,
        MAX(s.position) as worst_position
      FROM teams t
      LEFT JOIN standings s ON t.id = s.team_id
      GROUP BY t.id, t.name
      ORDER BY championships_won DESC, total_wins DESC
    `);
    console.table(calculatedStats);

  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
  } finally {
    db.close();
  }
}

diagnoseHistoricalStats();
