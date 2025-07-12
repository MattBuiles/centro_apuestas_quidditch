const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Diagnosticando partidos programados para hoy...\n');

// Obtener fecha actual virtual si existe
const getCurrentVirtualTime = () => {
  return new Promise((resolve) => {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='virtual_time'", (err, table) => {
      if (table) {
        db.get('SELECT * FROM virtual_time ORDER BY created_at DESC LIMIT 1', (err, row) => {
          if (row) {
            resolve(new Date(row.current_date));
          } else {
            resolve(new Date());
          }
        });
      } else {
        resolve(new Date());
      }
    });
  });
};

const checkMatches = async () => {
  const virtualTime = await getCurrentVirtualTime();
  console.log(`⏰ Tiempo virtual actual: ${virtualTime.toISOString()}`);
  
  // Obtener todos los partidos scheduled
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
    
    console.log(`\n📅 Partidos programados (scheduled):`);
    console.log(`Total encontrados: ${matches.length}`);
    
    if (matches.length > 0) {
      matches.forEach((match, index) => {
        const matchDate = new Date(match.date);
        const daysDiff = Math.ceil((matchDate - virtualTime) / (1000 * 60 * 60 * 24));
        const status = daysDiff <= 0 ? '🔴 DEBERÍA SIMULARSE' : 
                      daysDiff === 1 ? '🟡 MAÑANA' : 
                      '🟢 FUTURO';
        
        console.log(`  ${index + 1}. ${match.home_name} vs ${match.away_name}`);
        console.log(`      📅 ${match.date}`);
        console.log(`      ⏱️  Diferencia: ${daysDiff} días ${status}`);
        console.log('');
      });
    }
    
    // Verificar partidos en vivo
    db.all(`
      SELECT m.*, ht.name as home_name, at.name as away_name
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.status = 'live'
    `, (err, liveMatches) => {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log(`🔴 Partidos en vivo:`);
        console.log(`Total: ${liveMatches.length}`);
        liveMatches.forEach((match, index) => {
          console.log(`  ${index + 1}. ${match.home_name} vs ${match.away_name} - ${match.date}`);
        });
      }
      
      db.close();
    });
  });
};

checkMatches();
