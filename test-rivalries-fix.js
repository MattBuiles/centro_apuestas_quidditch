const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testRivalriesFix() {
  try {
    console.log('🧪 Testing rivalries fix...\n');
    
    // Test con varios equipos
    const testTeams = [
      'holyhead-harpies',
      'chudley-cannons',
      'puddlemere-united',
      'falmouth-falcons'
    ];
    
    for (const teamId of testTeams) {
      console.log(`\n📋 Testing team: ${teamId}`);
      console.log('=' .repeat(50));
      
      try {
        const response = await axios.get(`${BASE_URL}/api/teams/${teamId}`);
        const team = response.data;
        
        console.log(`✅ Team: ${team.name}`);
        console.log(`🏆 Rivalries found: ${team.rivalries?.length || 0}`);
        
        if (team.rivalries && team.rivalries.length > 0) {
          team.rivalries.forEach((rivalry, index) => {
            console.log(`\n  🏴‍☠️ Rivalry ${index + 1}: vs ${rivalry.opponentName}`);
            console.log(`     Total matches: ${rivalry.totalMatches}`);
            console.log(`     Record: ${rivalry.wins}W - ${rivalry.losses}L - ${rivalry.draws}D`);
            console.log(`     Win %: ${rivalry.winPercentage}%`);
            
            if (rivalry.lastMatch) {
              console.log(`     ⚡ Last match: ${rivalry.lastMatch.date}`);
              console.log(`     📊 Result: ${rivalry.lastMatch.result}`);
              console.log(`     ⚽ Score: ${rivalry.lastMatch.score}`);
              
              // Verificar que el score no sea 0-0
              if (rivalry.lastMatch.score === '0-0') {
                console.log(`     ⚠️  WARNING: Score is still 0-0!`);
              } else {
                console.log(`     ✅ Score looks correct!`);
              }
            } else {
              console.log(`     ❌ No last match data`);
            }
          });
        } else {
          console.log(`  ❌ No rivalries found for ${teamId}`);
        }
        
      } catch (error) {
        console.error(`❌ Error testing team ${teamId}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Función para verificar matches en la base de datos
async function checkDatabaseMatches() {
  console.log('\n🔍 Checking database for finished matches...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/matches`);
    const matches = response.data;
    
    const finishedMatches = matches.filter(match => match.status === 'finished');
    console.log(`✅ Found ${finishedMatches.length} finished matches`);
    
    // Mostrar algunos ejemplos
    finishedMatches.slice(0, 5).forEach((match, index) => {
      console.log(`\n  📋 Match ${index + 1}:`);
      console.log(`     Teams: ${match.homeTeam?.name || match.homeTeamId} vs ${match.awayTeam?.name || match.awayTeamId}`);
      console.log(`     Score: ${match.homeScore}-${match.awayScore}`);
      console.log(`     Date: ${match.date}`);
      console.log(`     Status: ${match.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking matches:', error.message);
  }
}

// Ejecutar las pruebas
async function runTests() {
  await checkDatabaseMatches();
  await testRivalriesFix();
}

runTests();
