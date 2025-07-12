const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Usar la misma ruta que usa el backend
const dbPath = path.join(__dirname, 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Encontrando y simulando partidos en vivo...\n');

// Encontrar todos los partidos en vivo
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
  WHERE m.status = 'live'
`, (err, liveMatches) => {
  if (err) {
    console.error('Error obteniendo partidos en vivo:', err);
    return;
  }
  
  console.log(`📋 Partidos en vivo encontrados: ${liveMatches.length}`);
  
  if (liveMatches.length === 0) {
    console.log('✅ No hay partidos en vivo');
    db.close();
    return;
  }
  
  // Simular cada partido en vivo
  let simulatedCount = 0;
  
  liveMatches.forEach((match, index) => {
    const homeScore = Math.floor(Math.random() * 200) + 50;
    const awayScore = Math.floor(Math.random() * 200) + 50;
    
    console.log(`🎯 Simulando partido ${index + 1}: ${match.homeTeamName} vs ${match.awayTeamName}`);
    
    db.run(`
      UPDATE matches 
      SET status = 'finished', 
          home_score = ?, 
          away_score = ?, 
          updated_at = datetime('now')
      WHERE id = ?
    `, [homeScore, awayScore, match.id], function(err) {
      if (err) {
        console.error(`Error simulando partido ${match.id}:`, err);
        return;
      }
      
      console.log(`✅ ${match.homeTeamName} ${homeScore} - ${awayScore} ${match.awayTeamName} (${match.id})`);
      
      simulatedCount++;
      
      // Verificar cuando todos los partidos han sido simulados
      if (simulatedCount === liveMatches.length) {
        console.log(`\n🎮 ¡Todos los ${simulatedCount} partidos en vivo han sido simulados!`);
        console.log('🎯 Ahora puedes avanzar al próximo partido');
        db.close();
      }
    });
  });
});
