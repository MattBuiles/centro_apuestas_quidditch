const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');

async function testTeamHistoricalIdols() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🔍 Testing Historical Idols Integration...\n');
  
  const teams = ['holyhead-harpies', 'chudley-cannons'];
  
  for (const teamId of teams) {
    console.log(`\n=== Testing ${teamId} ===`);
    
    // Test the same query used in the backend
    const query = `
      SELECT 
        ti.id,
        ti.name,
        ti.position,
        ti.period,
        ti.years_active,
        ti.description,
        ti.achievements,
        ti.legendary_stats
      FROM team_idols ti
      WHERE ti.team_id = ?
        AND ti.is_active = 1
      ORDER BY ti.years_active DESC, ti.name ASC
    `;
    
    const idols = await new Promise((resolve, reject) => {
      db.all(query, [teamId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    if (idols.length > 0) {
      console.log(`✅ Found ${idols.length} historical idols:`);
      
      idols.forEach((idol, index) => {
        console.log(`\n${index + 1}. ${idol.name} (${idol.position})`);
        console.log(`   Period: ${idol.period}`);
        console.log(`   Years Active: ${idol.years_active}`);
        console.log(`   Description: ${idol.description}`);
        console.log(`   Achievements: ${idol.achievements}`);
        console.log(`   Legendary Stats: ${idol.legendary_stats}`);
      });
    } else {
      console.log('❌ No historical idols found');
    }
  }
  
  db.close();
  console.log('\n✅ Test completed successfully!');
}

testTeamHistoricalIdols().catch(console.error);
