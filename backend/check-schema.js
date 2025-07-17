const Database = require('better-sqlite3');

const db = new Database('./database/quidditch.db');

try {
  // Get all table names
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('📋 Database Tables:');
  console.log(tables.map(t => t.name).join(', '));
  
  // Check bets table schema
  console.log('\n🎯 BETS Table Schema:');
  const betsSchema = db.prepare("PRAGMA table_info(bets)").all();
  betsSchema.forEach(col => {
    console.log(`  ${col.name} (${col.type})`);
  });
  
  // Check teams table schema  
  console.log('\n👥 TEAMS Table Schema:');
  const teamsSchema = db.prepare("PRAGMA table_info(teams)").all();
  teamsSchema.forEach(col => {
    console.log(`  ${col.name} (${col.type})`);
  });
  
  // Check users table schema
  console.log('\n👤 USERS Table Schema:');
  const usersSchema = db.prepare("PRAGMA table_info(users)").all();
  usersSchema.forEach(col => {
    console.log(`  ${col.name} (${col.type})`);
  });

} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}
