const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Diagnóstico del primer partido...\n');

// 1. Ver el estado del tiempo virtual
db.get('SELECT * FROM virtual_time LIMIT 1', (err, virtualTime) => {
  if (err) {
    console.error('Error obteniendo tiempo virtual:', err);
  } else {
    console.log('⏰ Estado del tiempo virtual:');
    if (virtualTime) {
      console.log(`   - Fecha actual: ${virtualTime.current_date}`);
      console.log(`   - Velocidad: ${virtualTime.speed_multiplier}x`);
      console.log(`   - Activo: ${virtualTime.is_active ? 'Sí' : 'No'}`);
    } else {
      console.log('   ❌ No hay registro de tiempo virtual');
    }
  }
  
  // 2. Ver el primer partido scheduled
  db.get('SELECT * FROM matches WHERE status = "scheduled" ORDER BY date ASC LIMIT 1', (err, match) => {
    if (err) {
      console.error('Error obteniendo primer partido:', err);
    } else {
      console.log('\n🏐 Primer partido programado:');
      if (match) {
        console.log(`   - ID: ${match.id}`);
        console.log(`   - Equipos: ${match.home_team_id} vs ${match.away_team_id}`);
        console.log(`   - Fecha programada: ${match.date}`);
        console.log(`   - Estado: ${match.status}`);
        
        // Comparar fechas
        const matchDate = new Date(match.date);
        const now = new Date();
        console.log(`   - Fecha actual: ${now.toISOString()}`);
        console.log(`   - Diferencia: ${Math.round((matchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} días`);
        
        if (virtualTime) {
          const virtualDate = new Date(virtualTime.current_date);
          console.log(`   - Fecha virtual: ${virtualDate.toISOString()}`);
          console.log(`   - Diferencia virtual: ${Math.round((matchDate.getTime() - virtualDate.getTime()) / (1000 * 60 * 60 * 24))} días`);
          
          if (virtualDate >= matchDate) {
            console.log('   ✅ El tiempo virtual ha pasado la fecha del partido');
          } else {
            console.log('   ⚠️ El tiempo virtual AÚN NO ha llegado a la fecha del partido');
          }
        }
      } else {
        console.log('   ❌ No hay partidos programados');
      }
    }
    
    // 3. Ver partidos en live
    db.all('SELECT * FROM matches WHERE status = "live"', (err, liveMatches) => {
      if (err) {
        console.error('Error obteniendo partidos en vivo:', err);
      } else {
        console.log(`\n🔴 Partidos en vivo: ${liveMatches.length}`);
        liveMatches.forEach((match, index) => {
          console.log(`   ${index + 1}. ${match.home_team_id} vs ${match.away_team_id} - ${match.date}`);
        });
      }
      
      // 4. Ver estadísticas generales
      db.get(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
          COUNT(CASE WHEN status = 'live' THEN 1 END) as live,
          COUNT(CASE WHEN status = 'finished' THEN 1 END) as finished
        FROM matches
      `, (err, stats) => {
        if (err) {
          console.error('Error obteniendo estadísticas:', err);
        } else {
          console.log('\n📊 Estadísticas de partidos:');
          console.log(`   - Total: ${stats.total}`);
          console.log(`   - Programados: ${stats.scheduled}`);
          console.log(`   - En vivo: ${stats.live}`);
          console.log(`   - Finalizados: ${stats.finished}`);
        }
        
        db.close();
      });
    });
  });
});
