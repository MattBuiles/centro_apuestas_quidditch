const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');
const schemaPath = path.join(__dirname, 'create-idols-achievements-schema.sql');

async function applySchema() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err);
        reject(err);
        return;
      }
      console.log('✅ Connected to database');
    });

    // Read and execute the schema file
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    db.exec(schema, (err) => {
      if (err) {
        console.error('❌ Error executing schema:', err);
        reject(err);
        return;
      }
      
      console.log('✅ Schema applied successfully');
      
      // Verify the new tables exist
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('team_idols', 'team_achievements')", (err, tables) => {
        if (err) {
          console.error('❌ Error checking tables:', err);
          reject(err);
          return;
        }
        
        console.log('📋 New tables created:');
        tables.forEach(table => {
          console.log(`  - ${table.name}`);
        });
        
        // Check data insertion
        db.all("SELECT COUNT(*) as count FROM team_idols", (err, idolsCount) => {
          if (err) {
            console.error('❌ Error counting idols:', err);
            reject(err);
            return;
          }
          
          db.all("SELECT COUNT(*) as count FROM team_achievements", (err, achievementsCount) => {
            if (err) {
              console.error('❌ Error counting achievements:', err);
              reject(err);
              return;
            }
            
            console.log(`🎭 Team idols inserted: ${idolsCount[0].count}`);
            console.log(`🏆 Team achievements inserted: ${achievementsCount[0].count}`);
            
            db.close();
            resolve();
          });
        });
      });
    });
  });
}

applySchema()
  .then(() => {
    console.log('🎉 Database schema update completed!');
  })
  .catch(err => {
    console.error('❌ Schema update failed:', err);
  });
