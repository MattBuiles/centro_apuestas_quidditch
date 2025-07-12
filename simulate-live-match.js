const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Abrir la base de datos
const dbPath = path.join(__dirname, 'backend/database', 'quidditch.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando partidos en vivo...\n');

// Verificar partidos en vivo
db.all(`
  SELECT 
    m.*,
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
  
  console.log('🔴 Partidos en vivo:');
  if (liveMatches.length > 0) {
    liveMatches.forEach((match, index) => {
      console.log(`   ${index + 1}. ${match.homeTeamName} vs ${match.awayTeamName}`);
      console.log(`      ID: ${match.id}`);
      console.log(`      Status: ${match.status}`);
      console.log(`      Fecha: ${new Date(match.date).toLocaleString('es-ES')}`);
      console.log(`      Puntaje: ${match.home_score} - ${match.away_score}`);
      console.log('');
    });
    
    // Simular el primer partido en vivo
    const firstLiveMatch = liveMatches[0];
    console.log(`🎯 Simulando partido: ${firstLiveMatch.homeTeamName} vs ${firstLiveMatch.awayTeamName}...`);
    
    // Generar puntajes aleatorios
    const homeScore = Math.floor(Math.random() * 200) + 50; // 50-249
    const awayScore = Math.floor(Math.random() * 200) + 50; // 50-249
    
    db.run(`
      UPDATE matches 
      SET status = 'finished', 
          home_score = ?, 
          away_score = ?, 
          updated_at = datetime('now')
      WHERE id = ?
    `, [homeScore, awayScore, firstLiveMatch.id], function(err) {
      if (err) {
        console.error('Error simulando partido:', err);
        return;
      }
      
      console.log(`✅ Partido simulado exitosamente:`);
      console.log(`   📊 Resultado final: ${firstLiveMatch.homeTeamName} ${homeScore} - ${awayScore} ${firstLiveMatch.awayTeamName}`);
      console.log(`   🎯 Estado: finished`);
      console.log('\n🎮 Ahora puedes intentar avanzar al próximo partido');
      
      // Cerrar la base de datos
      db.close();
    });
  } else {
    console.log('   ✅ No hay partidos en vivo');
    console.log('\n🎮 Puedes intentar avanzar al próximo partido');
    
    // Cerrar la base de datos
    db.close();
  }
});
