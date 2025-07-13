#!/usr/bin/env node

/**
 * Script para migrar la tabla match_events y remover la restricción CHECK
 * que está impidiendo que se guarden los eventos del frontend
 */

const { Database } = require('./dist/database/Database');

async function migrateMatchEventsTable() {
  try {
    console.log('🔄 Migrating match_events table to allow all event types...\n');
    
    await Database.initialize();
    const db = Database.getInstance();
    
    console.log('Step 1: Backing up existing events...');
    const existingEvents = await db.all('SELECT * FROM match_events', []);
    console.log(`   Found ${existingEvents.length} existing events`);
    
    console.log('Step 2: Dropping old table...');
    await db.run('DROP TABLE IF EXISTS match_events', []);
    
    console.log('Step 3: Creating new table without CHECK constraint...');
    await db.run(`
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
    `, []);
    
    console.log('Step 4: Restoring backed up events...');
    for (const event of existingEvents) {
      try {
        await db.run(`
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
        ]);
      } catch (eventError) {
        console.warn(`⚠️ Could not restore event ${event.id}:`, eventError.message);
      }
    }
    
    console.log('Step 5: Verifying migration...');
    const restoredEvents = await db.all('SELECT * FROM match_events', []);
    console.log(`   Restored ${restoredEvents.length} events`);
    
    console.log('✅ Migration completed successfully!');
    console.log('   The match_events table now accepts all event types from the frontend.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Execute the migration
if (require.main === module) {
  migrateMatchEventsTable();
}

module.exports = { migrateMatchEventsTable };
