const { Database } = require('./backend/src/database/Database');

async function testRivalriesDirectly() {
  console.log('🧪 Testing rivalries directly from database...\n');
  
  try {
    const db = new Database();
    await db.initialize();
    
    // Probar con un equipo específico
    const teamId = 'holyhead-harpies';
    console.log(`📋 Testing rivalries for team: ${teamId}`);
    console.log('=' .repeat(50));
    
    const rivalries = await db.getTeamRivalries(teamId);
    console.log(`✅ Found ${rivalries.length} rivalries`);
    
    rivalries.forEach((rivalry, index) => {
      console.log(`\n🏴‍☠️ Rivalry ${index + 1}:`);
      console.log(`   Opponent: ${rivalry.opponent_name} (${rivalry.opponent_id})`);
      console.log(`   Total matches: ${rivalry.total_matches}`);
      console.log(`   Record: ${rivalry.wins}W - ${rivalry.losses}L - ${rivalry.draws}D`);
      console.log(`   Win percentage: ${rivalry.win_percentage}%`);
      
      if (rivalry.last_match_date) {
        console.log(`   📅 Last match: ${rivalry.last_match_date}`);
        console.log(`   📊 Result: ${rivalry.last_match_result}`);
        console.log(`   ⚽ Score: ${rivalry.last_match_team_score}-${rivalry.last_match_opponent_score}`);
        
        // Verificar que los scores no sean 0-0
        if (rivalry.last_match_team_score === 0 && rivalry.last_match_opponent_score === 0) {
          console.log(`   ⚠️  WARNING: Score is still 0-0!`);
        } else {
          console.log(`   ✅ Score looks correct!`);
        }
      } else {
        console.log(`   ❌ No last match data`);
      }
    });
    
    // Verificar que existan matches finished en la base de datos
    console.log('\n🔍 Checking finished matches in database...');
    const finishedMatches = await db.connection.all(`
      SELECT 
        m.id,
        m.home_team_id,
        m.away_team_id,
        ht.name as home_team_name,
        at.name as away_team_name,
        m.home_score,
        m.away_score,
        m.date,
        m.status
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.status = 'finished'
        AND m.home_score IS NOT NULL
        AND m.away_score IS NOT NULL
      ORDER BY m.date DESC
      LIMIT 10
    `);
    
    console.log(`✅ Found ${finishedMatches.length} finished matches`);
    
    finishedMatches.forEach((match, index) => {
      console.log(`\n  📋 Match ${index + 1}:`);
      console.log(`     ${match.home_team_name} ${match.home_score} - ${match.away_score} ${match.away_team_name}`);
      console.log(`     Date: ${match.date}`);
      console.log(`     Status: ${match.status}`);
    });
    
    await db.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRivalriesDirectly();
