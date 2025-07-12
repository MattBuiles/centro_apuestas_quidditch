const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Analizando problema de simulación de partidos de HOY...\n');

// Simular el tiempo virtual actual (asumiendo fecha actual del sistema)
const virtualTime = new Date();
console.log(`⏰ Tiempo virtual simulado: ${virtualTime.toISOString()}`);
console.log(`📅 Fecha actual: ${virtualTime.toDateString()}\n`);

// Obtener partidos scheduled con análisis detallado
db.all(`
  SELECT m.*, ht.name as home_name, at.name as away_name
  FROM matches m
  JOIN teams ht ON m.home_team_id = ht.id
  JOIN teams at ON m.away_team_id = at.id
  WHERE m.status = 'scheduled'
  ORDER BY m.date ASC
  LIMIT 10
`, (err, matches) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log(`📅 Análisis de partidos scheduled:`);
  console.log(`Total encontrados: ${matches.length}\n`);
  
  if (matches.length > 0) {
    matches.forEach((match, index) => {
      const matchDate = new Date(match.date);
      const diffMs = matchDate.getTime() - virtualTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      // Criterios de simulación
      const shouldSimulateByDate = matchDate <= virtualTime;
      const shouldSimulateByDateEqual = matchDate.toDateString() === virtualTime.toDateString();
      const shouldSimulateByTime = diffMs <= 0;
      
      console.log(`${index + 1}. ${match.home_name} vs ${match.away_name}`);
      console.log(`   📅 Fecha del partido: ${match.date}`);
      console.log(`   📅 Fecha parseada: ${matchDate.toISOString()}`);
      console.log(`   ⏱️  Diferencia: ${diffHours.toFixed(2)} horas (${diffDays.toFixed(2)} días)`);
      console.log(`   🔍 ¿Debería simularse por fecha? ${shouldSimulateByDate ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   🔍 ¿Es del mismo día? ${shouldSimulateByDateEqual ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   🔍 ¿Tiempo pasado? ${shouldSimulateByTime ? '✅ SÍ' : '❌ NO'}`);
      
      // Simular las consultas SQL que usa el sistema
      const currentDateISO = virtualTime.toISOString();
      const matchDateISO = match.date;
      
      console.log(`   🔍 Consulta SQL actual: date <= '${currentDateISO}' AND date >= '${currentDateISO}'`);
      console.log(`   🔍 ¿Cumple date <= ? ${matchDateISO <= currentDateISO ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   🔍 ¿Cumple date >= ? ${matchDateISO >= currentDateISO ? '✅ SÍ' : '❌ NO'}`);
      console.log('');
    });
  }
  
  db.close();
});
