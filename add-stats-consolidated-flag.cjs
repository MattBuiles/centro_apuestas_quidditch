const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function addStatsConsolidatedFlag() {
  console.log('🔧 Agregando flag is_stats_consolidated a la tabla matches...');
  
  const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Verificar si la columna ya existe
    const tableInfo = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(matches)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    const hasStatsConsolidated = tableInfo.some(column => column.name === 'is_stats_consolidated');
    
    if (hasStatsConsolidated) {
      console.log('✅ La columna is_stats_consolidated ya existe');
    } else {
      console.log('🔄 Agregando columna is_stats_consolidated...');
      
      // Agregar la columna
      await new Promise((resolve, reject) => {
        db.run("ALTER TABLE matches ADD COLUMN is_stats_consolidated BOOLEAN DEFAULT FALSE", (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      console.log('✅ Columna is_stats_consolidated agregada');
    }
    
    // Marcar todos los partidos terminados como ya consolidados
    console.log('🔄 Marcando partidos terminados como consolidados...');
    
    const updateResult = await new Promise((resolve, reject) => {
      db.run(`
        UPDATE matches 
        SET is_stats_consolidated = TRUE 
        WHERE status = 'finished' AND (is_stats_consolidated IS NULL OR is_stats_consolidated = FALSE)
      `, function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
    
    console.log(`✅ ${updateResult} partidos marcados como consolidados`);
    
    // Verificar el resultado
    const consolidatedCount = await new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM matches WHERE is_stats_consolidated = TRUE", (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    const finishedCount = await new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM matches WHERE status = 'finished'", (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    console.log(`📊 Partidos terminados: ${finishedCount}`);
    console.log(`📊 Partidos consolidados: ${consolidatedCount}`);
    
    if (consolidatedCount === finishedCount) {
      console.log('✅ Todos los partidos terminados están marcados como consolidados');
    } else {
      console.log('⚠️  Hay discrepancia entre partidos terminados y consolidados');
    }
    
    console.log('\n🎉 Proceso completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error al agregar flag:', error);
  } finally {
    db.close();
  }
}

addStatsConsolidatedFlag().catch(console.error);
