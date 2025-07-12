// Test script to verify finished matches data structure
const fetch = require('node-fetch');

async function testFinishedMatches() {
  try {
    console.log('🔍 Testing finished matches endpoint...');
    
    const response = await fetch('http://localhost:3001/api/matches/status/finished');
    const data = await response.json();
    
    console.log('✅ Response structure:');
    console.log('Success:', data.success);
    console.log('Data type:', typeof data.data);
    console.log('Is array:', Array.isArray(data.data));
    console.log('Number of matches:', data.data?.length || 0);
    
    if (data.data && data.data.length > 0) {
      console.log('\n📊 First match sample:');
      const firstMatch = data.data[0];
      console.log(JSON.stringify(firstMatch, null, 2));
      
      console.log('\n🏷️ Match fields:');
      Object.keys(firstMatch).forEach(key => {
        console.log(`${key}: ${typeof firstMatch[key]} = ${firstMatch[key]}`);
      });
    }
    
    // Test teams endpoint to see team names
    console.log('\n🏠 Testing teams endpoint...');
    const teamsResponse = await fetch('http://localhost:3001/api/teams');
    const teamsData = await teamsResponse.json();
    
    if (teamsData.data && teamsData.data.length > 0) {
      console.log('Teams available:');
      teamsData.data.forEach(team => {
        console.log(`- ${team.name} (ID: ${team.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFinishedMatches();
