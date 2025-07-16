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

async function checkTeamPoints() {
  try {
    console.log('🧪 Checking team points implementation...\n');
    
    // Test team endpoint
    const response = await makeRequest('http://localhost:3001/api/teams/gryffindor');
    
    if (response.status === 200 && response.data.success) {
      const team = response.data.data;
      console.log('=== TEAM DATA ===');
      console.log('Name:', team.name);
      console.log('Wins:', team.wins);
      console.log('Losses:', team.losses);
      console.log('Draws:', team.draws);
      console.log('Points for:', team.points_for);
      console.log('Points against:', team.points_against);
      console.log('Titles:', team.titles);
      console.log('Expected league points:', (team.wins * 3) + (team.draws * 1));
      
      // Check if league points field exists
      console.log('League points field:', team.league_points || 'NOT FOUND');
      console.log('Points field:', team.points || 'NOT FOUND');
      
      console.log('\n=== IDOLS AND ACHIEVEMENTS ===');
      console.log('Historical idols count:', team.historicalIdols ? team.historicalIdols.length : 'NOT FOUND');
      console.log('Achievements:', team.achievements ? 'EXISTS' : 'NOT FOUND');
      
      if (team.achievements) {
        try {
          const achievements = JSON.parse(team.achievements);
          console.log('Achievements count:', achievements.length);
        } catch (e) {
          console.log('Achievement parsing error:', e.message);
        }
      }
      
    } else {
      console.error('Error:', response.data);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

checkTeamPoints();
