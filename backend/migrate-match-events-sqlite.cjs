#!/usr/bin/env node

/**
 * Script para migrar la tabla match_events usando sqlite3 directamente
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'quidditch.db');

async function migrateMatchEventsTable() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Migrating match_events table to allow all event types...\n');
    
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Database connection established');
    });
    
    db.serialize(() => {
      console.log('Step 1: Backing up existing events...');
      
      db.all('SELECT * FROM match_events', [], (err, existingEvents) => {
        if (err) {
          console.error('❌ Error backing up events:', err.message);
          reject(err);
          return;
        }
        
        console.log(`   Found ${existingEvents.length} existing events`);
        
        console.log('Step 2: Dropping old table...');
        db.run('DROP TABLE IF EXISTS match_events', [], (err) => {
          if (err) {
            console.error('❌ Error dropping table:', err.message);
            reject(err);
            return;
          }
          
          console.log('Step 3: Creating new table without CHECK constraint...');
          db.run(`
            CREATE TABLE match_events (
              id TEXT PRIMARY KEY,
              match_id TEXT NOT NULL,
              minute INTEGER NOT NULL,
              type TEXT NOT NULL,
              team TEXT NOT NULL,
              player TEXT,
              description TEXT NOT NULL,
              points INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
            )
          `, [], (err) => {
            if (err) {
              console.error('❌ Error creating new table:', err.message);
              reject(err);
              return;
            }
            
            console.log('Step 4: Restoring backed up events...');
            let restoredCount = 0;
            let processedCount = 0;
            
            if (existingEvents.length === 0) {
              console.log('   No events to restore');
              console.log('✅ Migration completed successfully!');
              console.log('   The match_events table now accepts all event types from the frontend.');
              db.close();
              resolve();
              return;
            }
            
            existingEvents.forEach((event) => {
              db.run(`
                INSERT INTO match_events (id, match_id, minute, type, team, player, description, points, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `, [
                event.id,
                event.match_id,
                event.minute,
                event.type,
                event.team,
                event.player,
                event.description,
                event.points,
                event.created_at
              ], function(err) {
                processedCount++;
                
                if (err) {
                  console.warn(`⚠️ Could not restore event ${event.id}:`, err.message);
                } else {
                  restoredCount++;
                }
                
                // Check if all events processed
                if (processedCount === existingEvents.length) {
                  console.log(`   Restored ${restoredCount}/${existingEvents.length} events`);
                  console.log('✅ Migration completed successfully!');
                  console.log('   The match_events table now accepts all event types from the frontend.');
                  db.close();
                  resolve();
                }
              });
            });
          });
        });
      });
    });
    
    db.on('error', (err) => {
      console.error('❌ Database error:', err.message);
      reject(err);
    });
  });
}

// Execute the migration
if (require.main === module) {
  migrateMatchEventsTable()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { migrateMatchEventsTable };
