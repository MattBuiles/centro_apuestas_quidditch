const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test admin credentials
const adminCredentials = {
  email: 'admin@quidditch.com',
  password: 'admin123'
};

async function testSeasonCreation() {
  try {
    console.log('🔐 Logging in as admin...');
    
    // Login as admin
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, adminCredentials);
    const token = loginResponse.data.data.accessToken || loginResponse.data.data.access_token;
    
    if (!token) {
      throw new Error('No token received from login response');
    }
    
    console.log('✅ Admin login successful');
    
    // Create axios instance with auth header
    const authAxios = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🧹 Executing database reset...');
    
    // Execute database reset
    const resetResponse = await authAxios.post('/admin/reset-database');
    
    if (resetResponse.data.success) {
      console.log('✅ Database reset successful');
      console.log('📊 Reset Stats:');
      console.log(`   - Teams created: ${resetResponse.data.data.stats.teamsCreated}`);
      console.log(`   - Matches generated: ${resetResponse.data.data.stats.matchesGenerated}`);
      console.log(`   - Season created: ${resetResponse.data.data.stats.seasonCreated}`);
      console.log(`   - New season ID: ${resetResponse.data.data.newSeason.id}`);
      console.log(`   - New season status: ${resetResponse.data.data.newSeason.status}`);
      console.log(`   - New season start: ${resetResponse.data.data.newSeason.start_date}`);
      console.log(`   - New season end: ${resetResponse.data.data.newSeason.end_date}`);
    } else {
      console.error('❌ Database reset failed:', resetResponse.data.message);
      return;
    }
    
    console.log('🔍 Checking system status...');
    
    // Get system status
    const statusResponse = await authAxios.get('/admin/system-status');
    
    if (statusResponse.data.success) {
      const status = statusResponse.data.data;
      console.log('✅ System status retrieved');
      console.log('📈 System Stats:');
      console.log(`   - Active seasons: ${status.stats.activeSeasons}`);
      console.log(`   - Total matches: ${status.stats.totalMatches}`);
      console.log(`   - Scheduled matches: ${status.stats.scheduledMatches}`);
      console.log(`   - System ready: ${status.systemReady}`);
      
      if (status.currentSeason) {
        console.log('🏆 Current Active Season:');
        console.log(`   - Name: ${status.currentSeason.name}`);
        console.log(`   - Status: ${status.currentSeason.status}`);
        console.log(`   - Start date: ${status.currentSeason.start_date}`);
        console.log(`   - End date: ${status.currentSeason.end_date}`);
        console.log(`   - ID: ${status.currentSeason.id}`);
        
        // Verify the season starts on August 1st
        const startDate = new Date(status.currentSeason.start_date);
        const expectedMonth = 7; // August is month 7 (0-indexed)
        const expectedDay = 1;
        
        if (startDate.getMonth() === expectedMonth && startDate.getDate() === expectedDay) {
          console.log('✅ Season start date is correct (August 1st)');
        } else {
          console.log('❌ Season start date is incorrect');
          console.log(`   Expected: August 1st, Got: ${startDate.toLocaleDateString()}`);
        }
        
        if (status.currentSeason.status === 'active') {
          console.log('✅ Season status is correctly set to "active"');
        } else {
          console.log('❌ Season status is NOT active');
          console.log(`   Expected: "active", Got: "${status.currentSeason.status}"`);
        }
      } else {
        console.log('❌ No active season found!');
      }
    } else {
      console.error('❌ Failed to get system status:', statusResponse.data.message);
    }
    
    console.log('🎯 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('   Response data:', error.response.data);
    }
  }
}

// Run the test
testSeasonCreation();
