const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');

console.log('🔧 Actualizando apuestas de score en la base de datos...');

const db = new sqlite3.Database(dbPath);

// Función para actualizar apuestas de score
async function updateScoreBets() {
  return new Promise((resolve, reject) => {
    // Primero, ver las apuestas de score actuales
    db.all(`
      SELECT b.id, b.prediction, b.match_id, m.home_score, m.away_score, m.status
      FROM bets b
      JOIN matches m ON b.match_id = m.id
      WHERE b.type = 'score'
    `, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('📋 Apuestas de score encontradas:');
      rows.forEach(row => {
        console.log(`  - ID: ${row.id}`);
        console.log(`    Predicción actual: ${row.prediction}`);
        console.log(`    Partido: ${row.match_id} (${row.status})`);
        console.log(`    Marcador real: ${row.home_score}-${row.away_score}`);
        console.log('');
      });
      
      // Por ahora, las apuestas de score con 'exact' no se pueden resolver
      // porque no sabemos qué marcador específico apostaron
      console.log('⚠️  Las apuestas de score actuales tienen predicción "exact" pero no almacenan el marcador específico.');
      console.log('💡 Para nuevas apuestas, el sistema ahora soporta predicciones como "150-90"');
      
      resolve();
    });
  });
}

// Función para demostrar cómo crear apuestas de score correctas
async function createSampleScoreBets() {
  return new Promise((resolve, reject) => {
    // Obtener un partido programado para crear apuestas de ejemplo
    db.get(`
      SELECT id, home_team_id, away_team_id 
      FROM matches 
      WHERE status = 'scheduled' 
      LIMIT 1
    `, (err, match) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!match) {
        console.log('❌ No hay partidos programados para crear apuestas de ejemplo');
        resolve();
        return;
      }
      
      console.log('\\n🎯 Creando apuestas de score de ejemplo...');
      
      const sampleBets = [
        {
          id: 'score-bet-1',
          prediction: '150-90',
          description: 'Apuesta de marcador exacto: 150-90'
        },
        {
          id: 'score-bet-2', 
          prediction: '200-120',
          description: 'Apuesta de marcador exacto: 200-120'
        }
      ];
      
      let completed = 0;
      
      sampleBets.forEach(bet => {
        db.run(`
          INSERT OR REPLACE INTO bets (
            id, user_id, match_id, type, prediction, odds, amount, potential_win, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          bet.id,
          'demo-user',
          match.id,
          'score',
          bet.prediction,
          5.0,
          10.0,
          50.0,
          'pending'
        ], (err) => {
          if (err) {
            console.error('❌ Error creando apuesta:', err);
          } else {
            console.log(`✅ Creada apuesta de ejemplo: ${bet.description}`);
          }
          
          completed++;
          if (completed === sampleBets.length) {
            resolve();
          }
        });
      });
    });
  });
}

// Función para crear una apuesta combinada de ejemplo
async function createSampleCombinedBet() {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT id FROM matches WHERE status = 'scheduled' LIMIT 1
    `, (err, match) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!match) {
        resolve();
        return;
      }
      
      console.log('\\n🎯 Creando apuesta combinada de ejemplo con score...');
      
      const combinedPrediction = 'winner:home,score:180-70,snitch:home,time:30-60';
      
      db.run(`
        INSERT OR REPLACE INTO bets (
          id, user_id, match_id, type, prediction, odds, amount, potential_win, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'combined-score-bet-1',
        'demo-user',
        match.id,
        'combined',
        combinedPrediction,
        15.0,
        5.0,
        75.0,
        'pending'
      ], (err) => {
        if (err) {
          console.error('❌ Error creando apuesta combinada:', err);
        } else {
          console.log(`✅ Creada apuesta combinada de ejemplo: ${combinedPrediction}`);
        }
        resolve();
      });
    });
  });
}

// Ejecutar las funciones
async function main() {
  try {
    await updateScoreBets();
    await createSampleScoreBets();
    await createSampleCombinedBet();
    
    console.log('\\n📊 Verificando apuestas creadas...');
    
    db.all(`
      SELECT id, type, prediction, status 
      FROM bets 
      WHERE type IN ('score', 'combined') 
      AND prediction NOT LIKE '%exact%'
      ORDER BY type, id
    `, (err, rows) => {
      if (err) {
        console.error('❌ Error consultando apuestas:', err);
      } else {
        console.log('\\n✅ Apuestas con formato correcto:');
        rows.forEach(row => {
          console.log(`  - ${row.type}: ${row.prediction} (${row.status})`);
        });
      }
      
      db.close();
      console.log('\\n🎉 Proceso completado');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    db.close();
  }
}

main();
