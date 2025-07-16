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
          reject(error);
        }
      });
    });
    request.on('error', reject);
  });
}

async function testTeamData() {
  try {
    console.log('🧪 Testing current team data...\n');
    
    const response = await makeRequest('http://localhost:3001/api/teams/gryffindor');
    
    if (response.status === 200 && response.data.success) {
      const team = response.data.data;
      console.log('=== CURRENT TEAM DATA ===');
      console.log('Name:', team.name);
      console.log('Points (current):', team.points || 'NOT FOUND');
      console.log('Standings points:', team.standings_points || 'NOT FOUND');
      console.log('Matches played:', team.matches_played);
      console.log('Wins:', team.wins);
      console.log('Losses:', team.losses);
      console.log('Draws:', team.draws);
      console.log('Points for:', team.points_for);
      console.log('Points against:', team.points_against);
      console.log('Titles:', team.titles);
      console.log('Achievements:', team.achievements ? JSON.parse(team.achievements) : 'NOT FOUND');
      console.log('Historical idols:', team.historicalIdols ? team.historicalIdols.length : 'NOT FOUND');
      
      // Calculate expected league points
      const expectedPoints = (team.wins * 3) + (team.draws * 1);
      console.log('Expected league points:', expectedPoints);
      
      // Check standings table
      console.log('\n=== CHECKING STANDINGS ===');
      const standingsResp = await makeRequest('http://localhost:3001/api/standings/current');
      
      if (standingsResp.status === 200 && standingsResp.data.success) {
        const gryffindorStanding = standingsResp.data.data.standings?.find(s => s.teamId === 'gryffindor');
        console.log('Gryffindor standings:', gryffindorStanding ? gryffindorStanding.points : 'NOT FOUND IN STANDINGS');
      }
      
    } else {
      console.error('Error:', response.data.error);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testTeamData();
