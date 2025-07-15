const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function repairDuplicateStats() {
  console.log('🔧 Iniciando reparación de estadísticas duplicadas...');
  
  const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Obtener todos los equipos
    const teams = await new Promise((resolve, reject) => {
      db.all("SELECT id, name, matches_played, wins, losses, draws FROM teams", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`🔍 Procesando ${teams.length} equipos...`);
    
    for (const team of teams) {
      // Contar partidos realmente terminados para este equipo
      const finishedMatches = await new Promise((resolve, reject) => {
        db.all(`
          SELECT m.*, 
                 CASE 
                   WHEN m.home_team_id = ? AND m.home_score > m.away_score THEN 'win'
                   WHEN m.away_team_id = ? AND m.away_score > m.home_score THEN 'win'
                   WHEN m.home_score = m.away_score THEN 'draw'
                   ELSE 'loss'
                 END as result
          FROM matches m 
          WHERE m.status = 'finished' AND (m.home_team_id = ? OR m.away_team_id = ?)
        `, [team.id, team.id, team.id, team.id], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      // Calcular estadísticas correctas
      const correctStats = {
        matches_played: finishedMatches.length,
        wins: finishedMatches.filter(m => m.result === 'win').length,
        losses: finishedMatches.filter(m => m.result === 'loss').length,
        draws: finishedMatches.filter(m => m.result === 'draw').length,
        points_for: 0,
        points_against: 0
      };
      
      // Calcular puntos
      finishedMatches.forEach(match => {
        if (match.home_team_id === team.id) {
          correctStats.points_for += match.home_score;
          correctStats.points_against += match.away_score;
        } else {
          correctStats.points_for += match.away_score;
          correctStats.points_against += match.home_score;
        }
      });
      
      // Comparar con estadísticas actuales
      const needsUpdate = 
        team.matches_played !== correctStats.matches_played ||
        team.wins !== correctStats.wins ||
        team.losses !== correctStats.losses ||
        team.draws !== correctStats.draws;
      
      if (needsUpdate) {
        console.log(`🔧 Reparando ${team.name}:`);
        console.log(`  Antes: ${team.matches_played} partidos (${team.wins}W-${team.losses}L-${team.draws}D)`);
        console.log(`  Después: ${correctStats.matches_played} partidos (${correctStats.wins}W-${correctStats.losses}L-${correctStats.draws}D)`);
        
        // Actualizar estadísticas
        await new Promise((resolve, reject) => {
          db.run(`
            UPDATE teams 
            SET matches_played = ?, 
                wins = ?, 
                losses = ?, 
                draws = ?, 
                points_for = ?, 
                points_against = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [
            correctStats.matches_played,
            correctStats.wins,
            correctStats.losses,
            correctStats.draws,
            correctStats.points_for,
            correctStats.points_against,
            team.id
          ], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        console.log(`  ✅ ${team.name} actualizado correctamente`);
      } else {
        console.log(`  ✅ ${team.name} - estadísticas correctas`);
      }
    }
    
    console.log('\n🎉 Reparación completada exitosamente!');
    
    // Verificar que todo está correcto
    console.log('\n🔍 Verificación final...');
    const verification = await new Promise((resolve, reject) => {
      db.all(`
        SELECT t.name, t.matches_played, 
               COUNT(CASE WHEN m.status = 'finished' AND (m.home_team_id = t.id OR m.away_team_id = t.id) THEN 1 END) as actual_finished_matches
        FROM teams t
        LEFT JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id)
        GROUP BY t.id, t.name, t.matches_played
        HAVING t.matches_played != actual_finished_matches
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    if (verification.length === 0) {
      console.log('✅ Todas las estadísticas están correctas');
    } else {
      console.log('❌ Aún hay inconsistencias:');
      verification.forEach(team => {
        console.log(`  ${team.name}: registra ${team.matches_played} pero tiene ${team.actual_finished_matches} terminados`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error en la reparación:', error);
  } finally {
    db.close();
  }
}

repairDuplicateStats().catch(console.error);
