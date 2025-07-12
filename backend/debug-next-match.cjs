const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Abrir la base de datos
const dbPath = path.join(__dirname, 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando estado del tiempo virtual y partidos...\n');

// Verificar qué tablas existen
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error obteniendo tablas:', err);
    return;
  }
  
  console.log('📋 Tablas existentes:');
  tables.forEach(table => {
    console.log(`   - ${table.name}`);
  });
  console.log('');
  
  // Verificar tiempo virtual actual
  db.get("SELECT * FROM virtual_time_state ORDER BY id DESC LIMIT 1", (err, row) => {
    if (err) {
      console.error('Error obteniendo tiempo virtual:', err);
      console.log('⚠️  No se encontró configuración de tiempo virtual. Usando fecha actual.');
      procesarPartidos(new Date().toISOString());
      return;
    }
    
    console.log('⏰ Tiempo virtual actual:');
    console.log(`   Fecha: ${row ? row.current_date : 'No configurado'}`);
    console.log(`   Timestamp: ${row ? new Date(row.current_date).toLocaleString('es-ES') : 'N/A'}\n`);
    
    const currentVirtualTime = row ? row.current_date : new Date().toISOString();
    procesarPartidos(currentVirtualTime);
  });
});

function procesarPartidos(currentVirtualTime) {
  
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
  });
  
  // Verificar partidos programados
  db.all(`
    SELECT 
      m.*,
      ht.name as homeTeamName,
      at.name as awayTeamName,
      s.name as seasonName,
      CASE 
        WHEN m.date >= ? THEN 'En rango de tiempo'
        ELSE 'Fuera de rango de tiempo'
      END as timeStatus
    FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    JOIN seasons s ON m.season_id = s.id
    WHERE m.status = 'scheduled'
    ORDER BY m.date ASC
    LIMIT 5
  `, [currentVirtualTime], (err, rows) => {
    if (err) {
      console.error('Error obteniendo partidos programados:', err);
      return;
    }
    
    console.log('📅 Partidos programados:');
    if (rows.length > 0) {
      rows.forEach(row => {
        console.log(`   📅 ${row.homeTeamName} vs ${row.awayTeamName}`);
        console.log(`      Fecha: ${row.date} (${new Date(row.date).toLocaleString('es-ES')})`);
        console.log(`      Estado: ${row.status} - ${row.timeStatus}`);
        console.log('');
      });
    } else {
      console.log('   ❌ No se encontraron partidos programados');
    }
    
    // Verificar próximo partido sin filtro de fecha
    db.get(`
    SELECT 
      m.*,
      ht.name as homeTeamName,
      at.name as awayTeamName,
      s.name as seasonName,
      CASE 
        WHEN m.date >= ? THEN 'FUTURO'
        ELSE 'PASADO'
      END as time_status
    FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    JOIN seasons s ON m.season_id = s.id
    WHERE m.status = 'scheduled' 
      AND (m.home_score IS NULL OR m.away_score IS NULL)
    ORDER BY m.date ASC
    LIMIT 10
  `, [currentVirtualTime], (err, matches) => {
    if (err) {
      console.error('Error obteniendo partidos:', err);
      return;
    }
    
    console.log('📅 Partidos programados:');
    if (matches && matches.length > 0) {
      matches.forEach((match, index) => {
        const matchDate = new Date(match.date);
        console.log(`   ${index + 1}. ${match.homeTeamName} vs ${match.awayTeamName}`);
        console.log(`      Fecha: ${matchDate.toLocaleString('es-ES')} (${match.time_status})`);
        console.log(`      Status: ${match.status}`);
        console.log(`      Temporada: ${match.seasonName}`);
        console.log('');
      });
    } else {
      console.log('   ❌ No se encontraron partidos programados');
    }
    
    // Verificar específicamente el próximo partido
    db.get(`
      SELECT 
        m.*,
        ht.name as homeTeamName,
        at.name as awayTeamName,
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
    `, [currentVirtualTime], (err, nextMatch) => {
      if (err) {
        console.error('Error obteniendo próximo partido:', err);
        return;
      }
      
      console.log('🎯 Próximo partido (según lógica actual):');
      if (nextMatch) {
        const matchDate = new Date(nextMatch.date);
        console.log(`   ${nextMatch.homeTeamName} vs ${nextMatch.awayTeamName}`);
        console.log(`   Fecha: ${matchDate.toLocaleString('es-ES')}`);
        console.log(`   Status: ${nextMatch.status}`);
        console.log(`   Temporada: ${nextMatch.seasonName}`);
      } else {
        console.log('   ❌ No se encontró próximo partido');
        console.log('   Esto es lo que causa el error "No se encontraron partidos pendientes"');
      }
      
      // Verificar si hay partidos en vivo
      db.all("SELECT * FROM matches WHERE status = 'live'", (err, liveMatches) => {
        if (err) {
          console.error('Error obteniendo partidos en vivo:', err);
          return;
        }
        
        console.log('\n🔴 Partidos en vivo:');
        if (liveMatches && liveMatches.length > 0) {
          liveMatches.forEach((match, index) => {
            console.log(`   ${index + 1}. ID: ${match.id}, Fecha: ${new Date(match.date).toLocaleString('es-ES')}`);
          });
        } else {
          console.log('   ✅ No hay partidos en vivo');
        }
        
        db.close();
      });
    });
  });
};
