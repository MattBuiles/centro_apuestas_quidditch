const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Abrir la base de datos
const dbPath = path.join(__dirname, 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Investigando el problema con los partidos...\n');

// Verificar datos básicos
db.all(`
  SELECT 
    m.id,
    m.status,
    m.date,
    m.home_score,
    m.away_score,
    ht.name as homeTeamName,
    at.name as awayTeamName
  FROM matches m
  JOIN teams ht ON m.home_team_id = ht.id
  JOIN teams at ON m.away_team_id = at.id
  WHERE m.status = 'scheduled'
  ORDER BY m.date ASC
  LIMIT 5
`, (err, matches) => {
  if (err) {
    console.error('Error obteniendo partidos:', err);
    return;
  }
  
  console.log('📋 Primeros 5 partidos programados:');
  matches.forEach((match, index) => {
    console.log(`   ${index + 1}. ${match.homeTeamName} vs ${match.awayTeamName}`);
    console.log(`      ID: ${match.id}`);
    console.log(`      Status: ${match.status}`);
    console.log(`      Fecha: ${match.date}`);
    console.log(`      Home Score: ${match.home_score}`);
    console.log(`      Away Score: ${match.away_score}`);
    console.log(`      Home Score IS NULL: ${match.home_score === null}`);
    console.log(`      Away Score IS NULL: ${match.away_score === null}`);
    console.log(`      Condición (m.home_score IS NULL OR m.away_score IS NULL): ${match.home_score === null || match.away_score === null}`);
    console.log('');
  });
  
  // Verificar partidos que cumplen todas las condiciones
  db.all(`
    SELECT 
      m.id,
      m.status,
      m.date,
      m.home_score,
      m.away_score,
      ht.name as homeTeamName,
      at.name as awayTeamName
    FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE m.status = 'scheduled' 
      AND (m.home_score IS NULL OR m.away_score IS NULL)
    ORDER BY m.date ASC
    LIMIT 3
  `, (err, filteredMatches) => {
    if (err) {
      console.error('Error obteniendo partidos filtrados:', err);
      return;
    }
    
    console.log('🎯 Partidos que cumplen condiciones (sin filtro de fecha):');
    if (filteredMatches.length > 0) {
      filteredMatches.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.homeTeamName} vs ${match.awayTeamName}`);
        console.log(`      Status: ${match.status}`);
        console.log(`      Fecha: ${match.date}`);
        console.log(`      Scores: ${match.home_score} - ${match.away_score}`);
        console.log('');
      });
    } else {
      console.log('   ❌ No se encontraron partidos que cumplan las condiciones');
    }
    
    // Cerrar la base de datos
    db.close();
  });
});
