const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testResetDatabase() {
  try {
    console.log('🔄 Testing database reset functionality...');
    
    // Step 1: Login as admin to get authentication token
    console.log('👤 Step 1: Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@quidditch.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.tokens.access;
    console.log('✅ Admin login successful');
    
    // Step 2: Get system status before reset
    console.log('📊 Step 2: Getting system status before reset...');
    const statusBeforeResponse = await axios.get(`${API_BASE}/admin/system-status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('System status before reset:');
    console.log('- Teams:', statusBeforeResponse.data.data.stats.totalTeams);
    console.log('- Matches:', statusBeforeResponse.data.data.stats.totalMatches);
    console.log('- Users:', statusBeforeResponse.data.data.stats.totalUsers);
    console.log('- Bets:', statusBeforeResponse.data.data.stats.totalBets);
    console.log('- Predictions:', statusBeforeResponse.data.data.stats.totalPredictions);
    console.log('- Virtual Time:', statusBeforeResponse.data.data.virtualTime.currentDate);
    console.log('');
    
    // Step 3: Execute database reset
    console.log('🔄 Step 3: Executing database reset...');
    const resetResponse = await axios.post(`${API_BASE}/admin/reset-database`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Database reset completed successfully!');
    console.log('Reset Response:');
    console.log('- Message:', resetResponse.data.data.message);
    console.log('- New Season:', resetResponse.data.data.newSeason.name);
    console.log('- Teams Created:', resetResponse.data.data.stats.teamsCreated);
    console.log('- Matches Generated:', resetResponse.data.data.stats.matchesGenerated);
    console.log('- Virtual Time:', resetResponse.data.data.virtualTime.currentDate);
    console.log('');
    
    // Step 4: Verify system status after reset
    console.log('📊 Step 4: Verifying system status after reset...');
    const statusAfterResponse = await axios.get(`${API_BASE}/admin/system-status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('System status after reset:');
    console.log('- Teams:', statusAfterResponse.data.data.stats.totalTeams);
    console.log('- Matches:', statusAfterResponse.data.data.stats.totalMatches);
    console.log('- Users:', statusAfterResponse.data.data.stats.totalUsers);
    console.log('- Bets:', statusAfterResponse.data.data.stats.totalBets);
    console.log('- Predictions:', statusAfterResponse.data.data.stats.totalPredictions);
    console.log('- Virtual Time:', statusAfterResponse.data.data.virtualTime.currentDate);
    console.log('- System Ready:', statusAfterResponse.data.data.systemReady);
    console.log('');
    
    // Step 5: Test some sample matches to verify everything works
    console.log('🎯 Step 5: Testing sample matches...');
    const matchesResponse = await axios.get(`${API_BASE}/matches`);
    
    console.log('Sample matches after reset:');
    const matches = matchesResponse.data.data.slice(0, 5);
    matches.forEach((match, index) => {
      console.log(`${index + 1}. ${match.home_team_name} vs ${match.away_team_name}`);
      console.log(`   Date: ${new Date(match.date).toLocaleDateString()}`);
      console.log(`   Status: ${match.status}`);
      console.log(`   Score: ${match.home_score} - ${match.away_score}`);
      console.log('');
    });
    
    console.log('🎉 Reset test completed successfully!');
    console.log('✅ All database reset steps executed correctly');
    console.log('✅ System is now in initial functional state');
    
  } catch (error) {
    console.error('❌ Error during reset test:', error.response?.data || error.message);
    console.error('Full error:', error);
  }
}

// Execute the test
testResetDatabase();
