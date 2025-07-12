const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando estado de la base de datos...\n');

// Verificar partidos
db.all('SELECT * FROM matches ORDER BY scheduled_date LIMIT 10', (err, matches) => {
  if (err) {
    console.error('Error consultando matches:', err);
  } else {
    console.log('📅 Partidos en la tabla matches:');
    console.log(`Total encontrados: ${matches.length}`);
    if (matches.length > 0) {
      matches.forEach((match, index) => {
        console.log(`  ${index + 1}. ${match.home_team_id} vs ${match.away_team_id} - ${match.scheduled_date} (${match.status})`);
      });
    } else {
      console.log('  ❌ No hay partidos en la tabla matches');
    }
  }
  
  // Verificar temporadas
  db.all('SELECT * FROM seasons ORDER BY start_date DESC', (err, seasons) => {
    if (err) {
      console.error('Error consultando seasons:', err);
    } else {
      console.log('\n🏆 Temporadas en la tabla seasons:');
      console.log(`Total encontradas: ${seasons.length}`);
      if (seasons.length > 0) {
        seasons.forEach((season, index) => {
          console.log(`  ${index + 1}. ${season.name} (${season.status}) - ${season.start_date} a ${season.end_date}`);
        });
      } else {
        console.log('  ❌ No hay temporadas en la tabla seasons');
      }
    }
    
    // Verificar equipos
    db.all('SELECT * FROM teams', (err, teams) => {
      if (err) {
        console.error('Error consultando teams:', err);
      } else {
        console.log('\n🏠 Equipos en la tabla teams:');
        console.log(`Total encontrados: ${teams.length}`);
        if (teams.length > 0) {
          teams.forEach((team, index) => {
            console.log(`  ${index + 1}. ${team.name} (ID: ${team.id})`);
          });
        } else {
          console.log('  ❌ No hay equipos en la tabla teams');
        }
      }
      
      db.close();
    });
  });
});
