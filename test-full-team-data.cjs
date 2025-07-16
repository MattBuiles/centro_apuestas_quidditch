const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ status: response.statusCode, data: parsedData });
        } catch (error) {
          console.error('JSON parse error:', error.message);
          console.error('Raw data:', data.substring(0, 500));
          reject(error);
        }
      });
    });
    request.on('error', reject);
  });
}

async function testFullTeamData() {
  try {
    console.log('🧪 Testing full team data implementation...\n');
    
    const response = await makeRequest('http://localhost:3001/api/teams/gryffindor');
    
    if (response.status === 200 && response.data.success) {
      const team = response.data.data;
      console.log('=== TEAM DATA ===');
      console.log('Name:', team.name);
      console.log('League points:', team.points);
      console.log('Wins:', team.wins);
      console.log('Losses:', team.losses);
      console.log('Draws:', team.draws);
      console.log('Points for:', team.points_for);
      console.log('Points against:', team.points_against);
      console.log('Titles:', team.titles);
      
      console.log('\n=== ACHIEVEMENTS ===');
      if (Array.isArray(team.achievements)) {
        console.log('Achievement count:', team.achievements.length);
        team.achievements.forEach((ach, index) => {
          console.log(`${index + 1}. ${ach}`);
        });
      } else {
        console.log('Achievements type:', typeof team.achievements);
        console.log('Achievements value:', team.achievements);
      }
      
      console.log('\n=== HISTORICAL IDOLS ===');
      if (Array.isArray(team.historicalIdols)) {
        console.log('Historical idols count:', team.historicalIdols.length);
        team.historicalIdols.forEach((idol, index) => {
          console.log(`${index + 1}. ${idol.name} (${idol.position}) - ${idol.period}`);
          console.log(`   Description: ${idol.description}`);
          console.log(`   Legendary stats: ${idol.legendaryStats}`);
        });
      } else {
        console.log('Historical idols type:', typeof team.historicalIdols);
      }
      
    } else {
      console.error('Error:', response.data);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testFullTeamData();
