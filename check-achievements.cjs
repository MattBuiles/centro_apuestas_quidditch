const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');

function checkAchievements() {
  const db = new sqlite3.Database(dbPath);
  
  db.all("SELECT id, name, achievements FROM teams WHERE achievements IS NOT NULL", (err, rows) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    
    console.log('=== ACHIEVEMENTS CHECK ===');
    rows.forEach(row => {
      console.log(`\nTeam: ${row.name}`);
      console.log(`Raw achievements: ${row.achievements}`);
      console.log(`Type: ${typeof row.achievements}`);
      
      try {
        const parsed = JSON.parse(row.achievements);
        console.log(`Parsed successfully: ${parsed.length} achievements`);
      } catch (e) {
        console.log(`Parse error: ${e.message}`);
        console.log(`This looks like: ${row.achievements.substring(0, 100)}...`);
      }
    });
    
    db.close();
  });
}

checkAchievements();
