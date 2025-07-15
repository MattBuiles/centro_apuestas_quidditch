const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function diagnoseDuplicateStats() {
  console.log('🔍 Diagnosticando problema de duplicación de estadísticas...');
  
  const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Verificar que hay datos en la base de datos
    const allMatches = await new Promise((resolve, reject) => {
      db.all("SELECT status, COUNT(*) as count FROM matches GROUP BY status", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('📊 Resumen de partidos por estado:');
    allMatches.forEach(row => {
      console.log(`  ${row.status}: ${row.count} partidos`);
    });
    
    // Verificar equipos
    const allTeams = await new Promise((resolve, reject) => {
      db.all("SELECT name, matches_played, wins, losses, draws FROM teams LIMIT 10", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('\n📊 Estadísticas de equipos:');
    allTeams.forEach(team => {
      console.log(`  ${team.name}: ${team.matches_played} partidos (${team.wins}W-${team.losses}L-${team.draws}D)`);
    });
    
    // Obtener algunos partidos terminados para análisis
    const finishedMatches = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM matches WHERE status = 'finished' LIMIT 5", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`\n📊 Partidos terminados: ${finishedMatches.length}`);
    
    if (finishedMatches.length > 0) {
      console.log('🔍 Analizando partidos terminados...');
      
      // Revisar eventos de partidos terminados
      for (const match of finishedMatches) {
        const events = await new Promise((resolve, reject) => {
          db.all("SELECT * FROM match_events WHERE match_id = ?", [match.id], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
        
        console.log(`  Partido ${match.id}: ${match.home_score}-${match.away_score}, ${events.length} eventos`);
      }
    }
    
    // Obtener partidos en estado 'live'
    const liveMatches = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM matches WHERE status = 'live' LIMIT 5", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`\n� Partidos en estado 'live': ${liveMatches.length}`);
    
    // Obtener partidos scheduled
    const scheduledMatches = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM matches WHERE status = 'scheduled' LIMIT 5", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📊 Partidos scheduled: ${scheduledMatches.length}`);
    
    // Revisar si hay inconsistencias evidentes
    const teamStats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT t.name, t.matches_played, 
               COUNT(CASE WHEN m.status = 'finished' AND (m.home_team_id = t.id OR m.away_team_id = t.id) THEN 1 END) as actual_finished_matches
        FROM teams t
        LEFT JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id)
        GROUP BY t.id, t.name, t.matches_played
        HAVING t.matches_played != actual_finished_matches
        LIMIT 5
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`\n🔍 Inconsistencias detectadas: ${teamStats.length}`);
    if (teamStats.length > 0) {
      console.log('❌ Equipos con discrepancias en matches_played:');
      teamStats.forEach(team => {
        console.log(`  ${team.name}: registra ${team.matches_played} pero tiene ${team.actual_finished_matches} terminados`);
      });
    } else {
      console.log('✅ No se detectaron inconsistencias obvias');
    }
    
  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
  } finally {
    db.close();
  }
}

diagnoseDuplicateStats().catch(console.error);
