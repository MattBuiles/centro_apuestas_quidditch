const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to SQLite database');
});

async function testTeamPerformance() {
  try {
    // Test 1: Check if teams table exists and has data
    console.log('\n🔍 Testing teams table...');
    
    const teams = await new Promise((resolve, reject) => {
      // First check table structure
      db.all(`PRAGMA table_info(teams)`, (err, columns) => {
        if (err) {
          console.error('Error getting table info:', err);
          reject(err);
          return;
        }
        console.log('📋 Teams table structure:', columns);
        
        // Now get teams data with correct columns
        db.all(`
          SELECT *
          FROM teams
          ORDER BY name
        `, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    });
    
    console.log('📊 Teams found:', teams);
    
    if (!teams || teams.length === 0) {
      console.log('❌ No teams found in database');
      return;
    }

    // Test 2: Check matches table
    console.log('\n🔍 Testing matches table...');
    
    const matches = await new Promise((resolve, reject) => {
      db.all(`
        SELECT m.id, m.home_team_id, m.away_team_id, t1.name as home_team, t2.name as away_team
        FROM matches m
        LEFT JOIN teams t1 ON m.home_team_id = t1.id
        LEFT JOIN teams t2 ON m.away_team_id = t2.id
        LIMIT 5
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('📊 Sample matches:', matches);

    // Test 3: Check bets table
    console.log('\n🔍 Testing bets table...');
    
    const bets = await new Promise((resolve, reject) => {
      db.all(`
        SELECT b.id, b.match_id, b.amount, b.status, m.home_team_id, m.away_team_id
        FROM bets b
        LEFT JOIN matches m ON b.match_id = m.id
        LIMIT 5
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('📊 Sample bets:', bets);

    // Test 4: Test the exact query from getTeamPerformance
    console.log('\n🔍 Testing team performance query...');
    
    for (const team of teams) {
      console.log(`\n🏆 Testing team: ${team.name} (ID: ${team.id})`);
      
      const teamBets = await new Promise((resolve, reject) => {
        db.get(`
          SELECT 
            COUNT(b.id) as totalBets,
            COUNT(CASE WHEN b.status = 'won' THEN 1 END) as wonBets,
            COALESCE(SUM(b.amount), 0) as totalVolume
          FROM bets b
          JOIN matches m ON b.match_id = m.id
          JOIN users u ON b.user_id = u.id
          WHERE (m.home_team_id = ? OR m.away_team_id = ?)
        `, [team.id, team.id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      console.log(`📊 ${team.name} stats:`, teamBets);
    }

    // Test 5: Check overall bet count
    console.log('\n🔍 Testing overall bet statistics...');
    
    const overallStats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as totalBets,
          COUNT(CASE WHEN status = 'won' THEN 1 END) as wonBets,
          COUNT(CASE WHEN status = 'lost' THEN 1 END) as lostBets,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingBets,
          COALESCE(SUM(amount), 0) as totalVolume
        FROM bets
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    console.log('📊 Overall statistics:', overallStats);

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('✅ Database connection closed');
      }
    });
  }
}

testTeamPerformance();
