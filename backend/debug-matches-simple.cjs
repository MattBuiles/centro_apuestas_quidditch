const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Abrir la base de datos
const dbPath = path.join(__dirname, 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando estado de los partidos...\n');

// Verificar tiempo virtual actual
db.get("SELECT * FROM virtual_time_state ORDER BY id DESC LIMIT 1", (err, row) => {
  if (err) {
    console.error('Error obteniendo tiempo virtual:', err);
    return;
  }
  
  const currentVirtualTime = row ? row.current_date : new Date().toISOString();
  console.log('⏰ Tiempo virtual actual:', currentVirtualTime);
  console.log('📅 Fecha legible:', new Date(currentVirtualTime).toLocaleString('es-ES'));
  console.log('');
  
  // Verificar estado de todos los partidos
  db.all(`
    SELECT status, COUNT(*) as count 
    FROM matches 
    GROUP BY status
  `, (err, statusCounts) => {
    if (err) {
      console.error('Error obteniendo estado de partidos:', err);
      return;
    }
    
    console.log('📊 Partidos por estado:');
    statusCounts.forEach(row => {
      console.log(`   ${row.status}: ${row.count} partidos`);
    });
    console.log('');
    
    // Verificar fechas de los partidos programados
    db.all(`
      SELECT 
        m.date,
        ht.name as homeTeamName,
        at.name as awayTeamName,
        m.status,
        CASE 
          WHEN m.date >= ? THEN 'FUTURO'
          ELSE 'PASADO'
        END as timeStatus
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.status = 'scheduled'
      ORDER BY m.date ASC
      LIMIT 5
    `, [currentVirtualTime], (err, matches) => {
      if (err) {
        console.error('Error obteniendo partidos:', err);
        return;
      }
      
      console.log('📅 Primeros 5 partidos programados:');
      if (matches && matches.length > 0) {
        matches.forEach((match, index) => {
          const matchDate = new Date(match.date);
          console.log(`   ${index + 1}. ${match.homeTeamName} vs ${match.awayTeamName}`);
          console.log(`      Fecha: ${matchDate.toLocaleString('es-ES')} (${match.timeStatus})`);
          console.log(`      Status: ${match.status}`);
          console.log('');
        });
      } else {
        console.log('   ❌ No se encontraron partidos programados');
      }
      
      // Cerrar la base de datos
      db.close();
    });
  });
});
