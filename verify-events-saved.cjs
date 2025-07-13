#!/usr/bin/env node

/**
 * Script para verificar que los eventos realmente se guardaron en la base de datos
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');

async function checkSavedEvents() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Checking if events were saved in the database...\n');
    
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err.message);
        reject(err);
        return;
      }
    });
    
    // Get the most recent match that was finished
    db.get(`
      SELECT id, home_team_id, away_team_id, status, updated_at
      FROM matches 
      WHERE status = 'finished' 
      ORDER BY updated_at DESC 
      LIMIT 1
    `, [], (err, recentMatch) => {
      if (err) {
        console.error('❌ Error getting recent match:', err.message);
        reject(err);
        return;
      }
      
      if (!recentMatch) {
        console.log('❌ No finished matches found');
        resolve();
        return;
      }
      
      console.log(`✅ Most recent finished match: ${recentMatch.id}`);
      console.log(`   Status: ${recentMatch.status}`);
      console.log(`   Updated: ${recentMatch.updated_at}\n`);
      
      // Get events for this match
      db.all(`
        SELECT id, minute, type, team, player, description, points, created_at
        FROM match_events 
        WHERE match_id = ?
        ORDER BY minute ASC
      `, [recentMatch.id], (err, events) => {
        if (err) {
          console.error('❌ Error getting events:', err.message);
          reject(err);
          return;
        }
        
        console.log(`📊 Events found for match ${recentMatch.id}: ${events.length}`);
        
        if (events.length > 0) {
          console.log('\n📋 Event details:');
          events.forEach((event, index) => {
            console.log(`   ${index + 1}. [${event.minute}'] ${event.type} - ${event.description}`);
            console.log(`      Team: ${event.team}, Points: ${event.points}`);
            console.log(`      Created: ${event.created_at}`);
            console.log('');
          });
          
          console.log('✅ Events were successfully saved to the database!');
        } else {
          console.log('❌ No events found - they were not saved properly');
        }
        
        db.close();
        resolve();
      });
    });
  });
}

// Execute the check
if (require.main === module) {
  checkSavedEvents()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Check failed:', error.message);
      process.exit(1);
    });
}

module.exports = { checkSavedEvents };
