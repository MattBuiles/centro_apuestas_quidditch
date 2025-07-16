const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  console.log('Connected to SQLite database');
});

// Insert historical idols for Holyhead Harpies
const insertStmt = db.prepare('INSERT OR REPLACE INTO team_idols (id, team_id, name, position, period, years_active, description, achievements, legendary_stats) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

// Holyhead Harpies idols
insertStmt.run([
  'harpies-gwenog-jones', 
  'holyhead-harpies', 
  'Gwenog Jones', 
  'Golpeadora', 
  '1980-1993', 
  13, 
  'Capitana legendaria conocida por su agresividad en el campo y liderazgo feroz. Llevó a las Harpies a múltiples victorias durante su época dorada.',
  '["Capitana durante 10 años", "Mejor Golpeadora de la Liga (5 veces)", "Líder histórica del equipo más exitoso"]',
  'Liderazgo legendario: 87% victorias como capitana, 245 golpes decisivos'
]);

insertStmt.run([
  'harpies-meghan-trulawney', 
  'holyhead-harpies', 
  'Meghan Trulawney', 
  'Guardiana', 
  '1995-2003', 
  8, 
  'Reconocida por sus reflejos extraordinarios y liderazgo defensivo. Su capacidad para anticipar jugadas la convirtió en una leyenda.',
  '["Mejor Guardiana del torneo (3 veces)", "Récord de paradas en una temporada", "Líder defensiva de la época moderna"]',
  '91% efectividad en paradas, 78 partidos sin gol en contra'
]);

// Chudley Cannons idols
insertStmt.run([
  'cannons-carl-prewett', 
  'chudley-cannons', 
  'Carl Prewett', 
  'Cazador', 
  '1972-1981', 
  9, 
  'Figura clave durante la época dorada del equipo. Su habilidad para marcar goles bajo presión lo convirtió en el héroe de los fanáticos.',
  '["Goleador histórico del equipo", "Jugador del año (2 veces)", "Héroe de la época dorada"]',
  '156 goles en carrera, 82% efectividad en tiros libres'
]);

insertStmt.run([
  'cannons-david-munch', 
  'chudley-cannons', 
  'David Munch', 
  'Buscador', 
  '1990-1999', 
  9, 
  'Famoso por capturar la Snitch en tiempo récord y por su determinación inquebrantable. Representó la resistencia del equipo en tiempos difíciles.',
  '["Récord de captura más rápida del equipo", "Buscador más consistente", "Símbolo de perseverancia"]',
  'Captura promedio: 15 minutos, 73% tasa de éxito, récord: 4 minutos'
]);

insertStmt.finalize((err) => {
  if (err) {
    console.error('Error finalizing statement:', err);
    return;
  }
  
  console.log('✅ Historical idols inserted successfully!');
  
  // Verify the insertions
  db.all(`SELECT ti.team_id, ti.name, ti.position, ti.period, t.name as team_name 
          FROM team_idols ti 
          JOIN teams t ON ti.team_id = t.id 
          WHERE t.id IN ('holyhead-harpies', 'chudley-cannons') 
          ORDER BY ti.team_id, ti.name`, (err, idols) => {
    if (err) {
      console.error('Error verifying insertions:', err);
      return;
    }
    
    console.log('\n📋 Verification - Historical idols inserted:');
    console.table(idols);
    
    db.close();
  });
});
