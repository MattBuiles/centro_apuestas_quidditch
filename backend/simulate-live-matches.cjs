const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Usar la misma ruta que usa el backend
const dbPath = path.join(__dirname, 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Simulando partidos en vivo desde el backend...\n');
console.log('📂 Usando base de datos:', dbPath);

// Simular los partidos en vivo específicos
const liveMatchIds = [
  'match-season-2025-6',
  'match-season-2025-7', 
  'match-season-2025-8'
];

liveMatchIds.forEach(matchId => {
  const homeScore = Math.floor(Math.random() * 200) + 50;
  const awayScore = Math.floor(Math.random() * 200) + 50;
  
  db.run(`
    UPDATE matches 
    SET status = 'finished', 
        home_score = ?, 
        away_score = ?, 
        updated_at = datetime('now')
    WHERE id = ?
  `, [homeScore, awayScore, matchId], function(err) {
    if (err) {
      console.error(`Error simulando partido ${matchId}:`, err);
      return;
    }
    
    if (this.changes > 0) {
      console.log(`✅ Partido ${matchId} simulado: ${homeScore} - ${awayScore}`);
    } else {
      console.log(`⚠️ Partido ${matchId} no encontrado`);
    }
  });
});

// Verificar después de 1 segundo
setTimeout(() => {
  db.all(`
    SELECT id, status FROM matches 
    WHERE status = 'live'
  `, (err, liveMatches) => {
    if (err) {
      console.error('Error verificando partidos en vivo:', err);
      return;
    }
    
    console.log(`\n🔍 Partidos en vivo restantes: ${liveMatches.length}`);
    if (liveMatches.length === 0) {
      console.log('🎮 ¡Ahora puedes avanzar al próximo partido!');
    } else {
      console.log('⚠️ Todavía hay partidos en vivo:', liveMatches.map(m => m.id));
    }
    
    db.close();
  });
}, 1000);
