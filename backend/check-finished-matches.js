const { Database } = require('./dist/database/Database');

async function checkFinishedMatches() {
  try {
    console.log('🔍 Connecting to database...');
    await Database.initialize();
    const db = Database.getInstance();
    
    console.log('🔍 Checking finished matches in database...');
    const finishedMatches = await db.all('SELECT * FROM matches WHERE status = "finished" LIMIT 3');
    
    console.log(`📊 Found ${finishedMatches.length} finished matches in DB:`);
    finishedMatches.forEach((match, index) => {
      console.log(`\n--- Match ${index + 1} ---`);
      Object.keys(match).forEach(key => {
        console.log(`${key}: ${match[key]}`);
      });
    });
    
    console.log('\n🏠 Checking teams in database...');
    const teams = await db.all('SELECT id, name FROM teams LIMIT 5');
    console.log('Teams:', teams);
    
    console.log('\n🗃️ Database schema for matches table:');
    const schema = await db.all('PRAGMA table_info(matches)');
    console.log('Matches table columns:');
    schema.forEach(col => {
      console.log(`- ${col.name}: ${col.type}`);
    });
    
    await Database.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkFinishedMatches();
