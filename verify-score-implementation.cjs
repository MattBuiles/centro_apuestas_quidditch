const sqlite3 = require('sqlite3').verbose();

async function verifyScoreImplementation() {
  console.log('🔍 Verificando implementación de apuestas de score...\n');
  
  const db = new sqlite3.Database('./backend/database/quidditch.db');
  
  try {
    // 1. Verificar que las apuestas de score se están guardando correctamente
    console.log('📋 1. Verificando apuestas de score en la base de datos:');
    const scoreBets = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, type, prediction, status, match_id, amount, odds
        FROM bets 
        WHERE type = 'score' OR prediction LIKE '%score:%'
        ORDER BY placed_at DESC
        LIMIT 10
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`   Encontradas ${scoreBets.length} apuestas de score:`);
    for (const bet of scoreBets) {
      console.log(`   - ID: ${bet.id.substring(0, 8)}...`);
      console.log(`     Tipo: ${bet.type}`);
      console.log(`     Predicción: ${bet.prediction}`);
      console.log(`     Estado: ${bet.status}`);
      console.log(`     Monto: ${bet.amount}`);
      console.log('');
    }
    
    // 2. Verificar partidos terminados con apuestas de score
    console.log('📊 2. Verificando partidos terminados con apuestas de score:');
    const finishedMatches = await new Promise((resolve, reject) => {
      db.all(`
        SELECT m.id, m.home_score, m.away_score, m.duration, m.snitch_caught, m.snitch_caught_by,
               ht.name as home_team_name, at.name as away_team_name,
               COUNT(b.id) as bet_count
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        LEFT JOIN bets b ON m.id = b.match_id AND (b.type = 'score' OR b.prediction LIKE '%score:%')
        WHERE m.status = 'finished'
        GROUP BY m.id, m.home_score, m.away_score, m.duration, m.snitch_caught, m.snitch_caught_by, ht.name, at.name
        HAVING bet_count > 0
        ORDER BY m.updated_at DESC
        LIMIT 5
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`   Encontrados ${finishedMatches.length} partidos terminados con apuestas de score:`);
    for (const match of finishedMatches) {
      console.log(`   - ${match.home_team_name} ${match.home_score} - ${match.away_score} ${match.away_team_name}`);
      console.log(`     Duración: ${match.duration} min, Snitch: ${match.snitch_caught ? 'Sí' : 'No'}`);
      console.log(`     Apuestas: ${match.bet_count}`);
      console.log('');
    }
    
    // 3. Analizar la resolución de apuestas de score específicas
    console.log('🎯 3. Analizando resolución de apuestas de score:');
    const resolvedScoreBets = await new Promise((resolve, reject) => {
      db.all(`
        SELECT b.id, b.type, b.prediction, b.status, b.amount, b.odds,
               m.home_score, m.away_score, m.duration, m.snitch_caught, m.snitch_caught_by,
               ht.name as home_team_name, at.name as away_team_name
        FROM bets b
        JOIN matches m ON b.match_id = m.id
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        WHERE (b.type = 'score' OR b.prediction LIKE '%score:%') 
          AND m.status = 'finished'
          AND b.status IN ('won', 'lost')
        ORDER BY b.placed_at DESC
        LIMIT 10
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`   Analizando ${resolvedScoreBets.length} apuestas de score resueltas:`);
    let correctResolutions = 0;
    let totalResolutions = 0;
    
    for (const bet of resolvedScoreBets) {
      console.log(`   - Apuesta ${bet.id.substring(0, 8)}...`);
      console.log(`     Partido: ${bet.home_team_name} ${bet.home_score} - ${bet.away_score} ${bet.away_team_name}`);
      console.log(`     Tipo: ${bet.type}`);
      console.log(`     Predicción: ${bet.prediction}`);
      console.log(`     Estado: ${bet.status}`);
      
      // Verificar si la resolución es correcta
      if (bet.type === 'score') {
        const scoreMatch = bet.prediction.match(/^(\d+)-(\d+)$/);
        if (scoreMatch) {
          const predictedHome = parseInt(scoreMatch[1]);
          const predictedAway = parseInt(scoreMatch[2]);
          const actualHome = bet.home_score;
          const actualAway = bet.away_score;
          
          const shouldBeWon = (predictedHome === actualHome && predictedAway === actualAway);
          const actuallyWon = bet.status === 'won';
          const correct = shouldBeWon === actuallyWon;
          
          console.log(`     Análisis: Predicho ${predictedHome}-${predictedAway} vs Real ${actualHome}-${actualAway}`);
          console.log(`     Debería ser: ${shouldBeWon ? 'WON' : 'LOST'}, Es: ${actuallyWon ? 'WON' : 'LOST'} ${correct ? '✅' : '❌'}`);
          
          if (correct) correctResolutions++;
          totalResolutions++;
        }
      } else if (bet.type === 'combined') {
        // Análisis simplificado para apuestas combinadas
        const predictions = bet.prediction.split(',');
        const scorePredicton = predictions.find(p => p.startsWith('score:'));
        
        if (scorePredicton) {
          const [, scoreValue] = scorePredicton.split(':');
          const scoreMatch = scoreValue.match(/^(\d+)-(\d+)$/);
          
          if (scoreMatch) {
            const predictedHome = parseInt(scoreMatch[1]);
            const predictedAway = parseInt(scoreMatch[2]);
            const actualHome = bet.home_score;
            const actualAway = bet.away_score;
            
            const scoreCorrect = (predictedHome === actualHome && predictedAway === actualAway);
            console.log(`     Score en combinada: Predicho ${predictedHome}-${predictedAway} vs Real ${actualHome}-${actualAway} ${scoreCorrect ? '✅' : '❌'}`);
            
            // Para apuestas combinadas, necesitamos verificar todas las predicciones
            // Por ahora solo verificamos que si el score está mal, la apuesta debe ser 'lost'
            if (!scoreCorrect && bet.status === 'won') {
              console.log(`     ❌ ERROR: Apuesta combinada con score incorrecto marcada como WON`);
            } else if (!scoreCorrect && bet.status === 'lost') {
              console.log(`     ✅ OK: Apuesta combinada con score incorrecto correctamente marcada como LOST`);
              correctResolutions++;
            }
            totalResolutions++;
          }
        }
      }
      
      console.log('');
    }
    
    // 4. Resumen de resultados
    console.log('📈 4. Resumen de la implementación:');
    console.log(`   - Apuestas de score encontradas: ${scoreBets.length}`);
    console.log(`   - Partidos terminados con apuestas de score: ${finishedMatches.length}`);
    console.log(`   - Apuestas de score resueltas: ${resolvedScoreBets.length}`);
    console.log(`   - Resoluciones correctas: ${correctResolutions}/${totalResolutions} (${totalResolutions > 0 ? Math.round((correctResolutions/totalResolutions)*100) : 0}%)`);
    
    if (totalResolutions > 0) {
      if (correctResolutions === totalResolutions) {
        console.log('   ✅ Todas las resoluciones son correctas!');
      } else {
        console.log('   ⚠️  Algunas resoluciones podrían necesitar revisión');
      }
    }
    
    // 5. Verificar estructura de datos
    console.log('\\n🔧 5. Verificando estructura de datos:');
    
    // Verificar que las apuestas de score tienen el formato correcto
    const scoreFormats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT DISTINCT prediction, COUNT(*) as count
        FROM bets 
        WHERE type = 'score'
        GROUP BY prediction
        ORDER BY count DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('   Formatos de predicción de score encontrados:');
    for (const format of scoreFormats) {
      const isValid = format.prediction.match(/^\\d+-\\d+$/);
      console.log(`   - "${format.prediction}" (${format.count} veces) ${isValid ? '✅' : '❌'}`);
    }
    
    // Verificar apuestas combinadas con score
    const combinedFormats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT prediction, COUNT(*) as count
        FROM bets 
        WHERE type = 'combined' AND prediction LIKE '%score:%'
        GROUP BY prediction
        ORDER BY count DESC
        LIMIT 5
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('\\n   Formatos de apuestas combinadas con score:');
    for (const format of combinedFormats) {
      const hasValidScore = format.prediction.match(/score:\\d+-\\d+/);
      console.log(`   - "${format.prediction}" (${format.count} veces) ${hasValidScore ? '✅' : '❌'}`);
    }
    
    console.log('\\n✅ Verificación de implementación completada!');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    db.close();
  }
}

verifyScoreImplementation();
