const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Abrir la base de datos
const dbPath = path.join(__dirname, 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Probando la consulta exacta del backend...\n');

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
  
  // Ejecutar la consulta exacta del backend
  const sql = `
    SELECT 
      m.*,
      ht.name as homeTeamName,
      ht.logo as homeTeamLogo,
      at.name as awayTeamName,
      at.logo as awayTeamLogo,
      s.name as seasonName
    FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    JOIN seasons s ON m.season_id = s.id
    WHERE m.status = 'scheduled' 
      AND (m.home_score IS NULL OR m.away_score IS NULL)
      AND m.date >= ?
    ORDER BY m.date ASC
    LIMIT 1
  `;
  
  db.get(sql, [currentVirtualTime], (err, match) => {
    if (err) {
      console.error('Error ejecutando consulta:', err);
      return;
    }
    
    console.log('🎯 Resultado de la consulta del backend:');
    if (match) {
      console.log('   ✅ Próximo partido encontrado:');
      console.log(`   📅 ${match.homeTeamName} vs ${match.awayTeamName}`);
      console.log(`   🕐 Fecha: ${new Date(match.date).toLocaleString('es-ES')}`);
      console.log(`   🎯 Status: ${match.status}`);
      console.log(`   🏆 Temporada: ${match.seasonName}`);
    } else {
      console.log('   ❌ No se encontró próximo partido');
      console.log('   🔍 Verificando por qué...');
      
      // Verificar si hay partidos programados sin filtro de fecha
      db.get(`
        SELECT 
          m.*,
          ht.name as homeTeamName,
          at.name as awayTeamName
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        WHERE m.status = 'scheduled' 
          AND (m.home_score IS NULL OR m.away_score IS NULL)
        ORDER BY m.date ASC
        LIMIT 1
      `, (err, anyMatch) => {
        if (err) {
          console.error('Error verificando partidos:', err);
          return;
        }
        
        if (anyMatch) {
          console.log('   📋 Primer partido programado (sin filtro de fecha):');
          console.log(`   📅 ${anyMatch.homeTeamName} vs ${anyMatch.awayTeamName}`);
          console.log(`   🕐 Fecha: ${new Date(anyMatch.date).toLocaleString('es-ES')}`);
          console.log(`   🔍 Comparación de fechas:`);
          console.log(`      Tiempo virtual: ${currentVirtualTime}`);
          console.log(`      Fecha partido:  ${anyMatch.date}`);
          console.log(`      Partido >= Virtual: ${anyMatch.date >= currentVirtualTime}`);
        } else {
          console.log('   ❌ No hay partidos programados en absoluto');
        }
        
        // Cerrar la base de datos
        db.close();
      });
    }
  });
});
