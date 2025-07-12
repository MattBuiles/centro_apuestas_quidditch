const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando estructura de la tabla matches...\n');

// Ver estructura de la tabla matches
db.all("PRAGMA table_info(matches)", (err, columns) => {
  if (err) {
    console.error('Error obteniendo estructura de matches:', err);
  } else {
    console.log('📋 Estructura de la tabla matches:');
    columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
  }
  
  // Ahora consultar con la columna correcta
  db.all('SELECT * FROM matches ORDER BY date LIMIT 10', (err, matches) => {
    if (err) {
      console.error('Error consultando matches:', err);
    } else {
      console.log('\n📅 Partidos en la tabla matches:');
      console.log(`Total encontrados: ${matches.length}`);
      if (matches.length > 0) {
        matches.forEach((match, index) => {
          console.log(`  ${index + 1}. ${match.home_team_id} vs ${match.away_team_id} - ${match.date} (${match.status})`);
        });
      } else {
        console.log('  ❌ No hay partidos en la tabla matches');
      }
    }
    db.close();
  });
});
