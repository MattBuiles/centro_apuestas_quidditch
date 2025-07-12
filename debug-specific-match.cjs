const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Usar la ruta correcta de la base de datos del backend
const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Investigando el partido en vivo reportado por el backend...\n');
console.log('📂 Usando base de datos:', dbPath);

// Buscar el partido específico que reporta el backend
const targetMatchId = 'match-season-2025-9';

db.all(`
  SELECT 
    m.id,
    m.status,
    m.home_score,
    m.away_score,
    ht.name as homeTeamName,
    at.name as awayTeamName
  FROM matches m
  JOIN teams ht ON m.home_team_id = ht.id
  JOIN teams at ON m.away_team_id = at.id
  WHERE m.id = ?
`, [targetMatchId], (err, specificMatch) => {
  if (err) {
    console.error('Error buscando partido específico:', err);
    return;
  }
  
  if (specificMatch.length > 0) {
    const match = specificMatch[0];
    console.log(`📋 Partido encontrado: ${match.homeTeamName} vs ${match.awayTeamName}`);
    console.log(`   ID: ${match.id}`);
    console.log(`   Status: ${match.status}`);
    console.log(`   Scores: ${match.home_score} - ${match.away_score}`);
    
    if (match.status === 'live') {
      console.log(`\n🎯 Simulando el partido en vivo...`);
      
      const homeScore = Math.floor(Math.random() * 200) + 50;
      const awayScore = Math.floor(Math.random() * 200) + 50;
      
      db.run(`
        UPDATE matches 
        SET status = 'finished', 
            home_score = ?, 
            away_score = ?, 
            updated_at = datetime('now')
        WHERE id = ?
      `, [homeScore, awayScore, match.id], function(err) {
        if (err) {
          console.error('Error simulando partido:', err);
          return;
        }
        
        console.log(`✅ Partido simulado: ${match.homeTeamName} ${homeScore} - ${awayScore} ${match.awayTeamName}`);
        console.log('🎮 Ahora puedes avanzar al próximo partido');
        db.close();
      });
    } else {
      console.log(`⚠️ El partido no está en estado 'live', está en '${match.status}'`);
      db.close();
    }
  } else {
    console.log(`❌ No se encontró el partido ${targetMatchId}`);
    
    // Buscar todos los partidos para ver qué hay
    db.all(`
      SELECT id, status, COUNT(*) OVER() as total_count
      FROM matches 
      WHERE status = 'live'
      LIMIT 5
    `, (err, allLive) => {
      if (err) {
        console.error('Error buscando partidos en vivo:', err);
        return;
      }
      
      console.log(`🔍 Partidos en vivo encontrados: ${allLive.length}`);
      allLive.forEach(match => {
        console.log(`   - ${match.id} (${match.status})`);
      });
      
      db.close();
    });
  }
});
