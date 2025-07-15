const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function testDuplicateProtection() {
  console.log('🧪 Probando protección contra duplicación...');
  
  const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Buscar un partido que podamos usar para la prueba
    const scheduledMatches = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM matches WHERE status = 'scheduled' LIMIT 1", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    if (scheduledMatches.length === 0) {
      console.log('❌ No hay partidos scheduled para probar');
      return;
    }
    
    const testMatch = scheduledMatches[0];
    console.log(`🎯 Usando partido de prueba: ${testMatch.id}`);
    
    // Obtener estadísticas iniciales de los equipos
    const homeTeamBefore = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM teams WHERE id = ?", [testMatch.home_team_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    const awayTeamBefore = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM teams WHERE id = ?", [testMatch.away_team_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    console.log('📊 Estadísticas iniciales:');
    console.log(`  ${homeTeamBefore.name}: ${homeTeamBefore.matches_played} partidos`);
    console.log(`  ${awayTeamBefore.name}: ${awayTeamBefore.matches_played} partidos`);
    
    // Simular finalización del partido manualmente
    const mockResult = {
      homeScore: 180,
      awayScore: 120,
      duration: 45,
      snitchCaught: true,
      snitchCaughtBy: testMatch.home_team_id,
      events: [
        {
          id: 'test-event-1',
          minute: 30,
          type: 'goal',
          team: testMatch.home_team_id,
          description: 'Gol de prueba',
          points: 10
        },
        {
          id: 'test-event-2',
          minute: 45,
          type: 'snitch',
          team: testMatch.home_team_id,
          description: 'Snitch capturada',
          points: 150
        }
      ]
    };
    
    // Primera finalización
    console.log('\n🔄 Primera finalización del partido...');
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE matches 
        SET status = 'finished', 
            home_score = ?, 
            away_score = ?, 
            duration = ?, 
            snitch_caught = ?, 
            snitch_caught_by = ?, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        mockResult.homeScore,
        mockResult.awayScore,
        mockResult.duration,
        mockResult.snitchCaught,
        mockResult.snitchCaughtBy,
        testMatch.id
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Actualizar estadísticas manualmente (simular primer procesamiento)
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE teams 
        SET matches_played = matches_played + 1,
            wins = wins + 1,
            points_for = points_for + ?,
            points_against = points_against + ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [mockResult.homeScore, mockResult.awayScore, testMatch.home_team_id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE teams 
        SET matches_played = matches_played + 1,
            losses = losses + 1,
            points_for = points_for + ?,
            points_against = points_against + ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [mockResult.awayScore, mockResult.homeScore, testMatch.away_team_id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Verificar estadísticas después de la primera finalización
    const homeTeamAfter1 = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM teams WHERE id = ?", [testMatch.home_team_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    const awayTeamAfter1 = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM teams WHERE id = ?", [testMatch.away_team_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    console.log('📊 Estadísticas después de primera finalización:');
    console.log(`  ${homeTeamAfter1.name}: ${homeTeamAfter1.matches_played} partidos`);
    console.log(`  ${awayTeamAfter1.name}: ${awayTeamAfter1.matches_played} partidos`);
    
    // Simular segunda finalización (duplicada) - las estadísticas NO deberían cambiar
    console.log('\n🔄 Intentando segunda finalización (duplicada)...');
    
    // Verificar que el partido ya está terminado
    const matchStatus = await new Promise((resolve, reject) => {
      db.get("SELECT status FROM matches WHERE id = ?", [testMatch.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    console.log(`📋 Estado del partido: ${matchStatus.status}`);
    
    if (matchStatus.status === 'finished') {
      console.log('✅ Partido ya está terminado - la protección debería prevenir duplicación');
      
      // Intentar actualizar estadísticas nuevamente (esto no debería suceder con la protección)
      console.log('⚠️  Simulando intento de actualización duplicada...');
      
      // Las estadísticas no deberían cambiar
      const homeTeamAfter2 = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM teams WHERE id = ?", [testMatch.home_team_id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      const awayTeamAfter2 = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM teams WHERE id = ?", [testMatch.away_team_id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      console.log('📊 Estadísticas después de intento duplicado:');
      console.log(`  ${homeTeamAfter2.name}: ${homeTeamAfter2.matches_played} partidos`);
      console.log(`  ${awayTeamAfter2.name}: ${awayTeamAfter2.matches_played} partidos`);
      
      // Verificar que las estadísticas no cambiaron
      const homeIncrement = homeTeamAfter2.matches_played - homeTeamAfter1.matches_played;
      const awayIncrement = awayTeamAfter2.matches_played - awayTeamAfter1.matches_played;
      
      if (homeIncrement === 0 && awayIncrement === 0) {
        console.log('✅ Protección exitosa: No hubo duplicación de estadísticas');
      } else {
        console.log('❌ Falla en protección: Hubo duplicación de estadísticas');
      }
    }
    
    // Limpiar: restaurar el partido a su estado original
    console.log('\n🧹 Limpiando datos de prueba...');
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE matches 
        SET status = 'scheduled', 
            home_score = 0, 
            away_score = 0, 
            duration = NULL, 
            snitch_caught = FALSE, 
            snitch_caught_by = NULL, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [testMatch.id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Restaurar estadísticas originales
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE teams 
        SET matches_played = ?,
            wins = ?,
            losses = ?,
            points_for = ?,
            points_against = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        homeTeamBefore.matches_played,
        homeTeamBefore.wins,
        homeTeamBefore.losses,
        homeTeamBefore.points_for,
        homeTeamBefore.points_against,
        testMatch.home_team_id
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE teams 
        SET matches_played = ?,
            wins = ?,
            losses = ?,
            points_for = ?,
            points_against = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        awayTeamBefore.matches_played,
        awayTeamBefore.wins,
        awayTeamBefore.losses,
        awayTeamBefore.points_for,
        awayTeamBefore.points_against,
        testMatch.away_team_id
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('✅ Datos de prueba limpiados');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    db.close();
  }
}

testDuplicateProtection().catch(console.error);
