const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testSystemStatus() {
  try {
    console.log('🔐 Logging in as admin...');
    
    // Login as admin
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@quidditch.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Admin login successful');
    
    // Get system status
    console.log('🔍 Checking system status...');
    
    const statusResponse = await axios.get(`${BASE_URL}/admin/system-status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
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
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testSystemStatus();
