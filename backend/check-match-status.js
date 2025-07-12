const { Database } = require('./dist/database/Database');

async function checkMatchStatus() {
  const db = Database.getInstance();
  
  try {
    const result = await db.all('SELECT status, COUNT(*) as count FROM matches GROUP BY status');
    console.log('📊 Partidos por estado:', result);
    
    const allMatches = await db.all('SELECT * FROM matches ORDER BY date ASC LIMIT 10');
    console.log('📋 Primeros 10 partidos:', allMatches);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMatchStatus();
