const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testSeasonCreation() {
  try {
    console.log('🔐 Logging in as admin...');
    
    // Login as admin
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@quidditch.com',
      password: 'admin123'
    });
    
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    
    // Extract token from response
    const token = loginResponse.data.data.tokens.accessToken;
    
    if (!token) {
      throw new Error('No token found in login response');
    }
    
    console.log('✅ Admin login successful, token:', token.substring(0, 20) + '...');
    
    // Test database reset
    console.log('🧹 Executing database reset...');
    
    const resetResponse = await axios.post(`${BASE_URL}/admin/reset-database`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Database reset successful');
    console.log('📊 Reset Stats:', resetResponse.data.data.stats);
    console.log('🏆 New Season Info:');
    console.log('   - Name:', resetResponse.data.data.newSeason.name);
    console.log('   - Status:', resetResponse.data.data.newSeason.status);
    console.log('   - Start Date:', resetResponse.data.data.newSeason.start_date);
    console.log('   - End Date:', resetResponse.data.data.newSeason.end_date);
    
    // Verify the season starts on August 1st
    const startDate = new Date(resetResponse.data.data.newSeason.start_date);
    const expectedMonth = 7; // August is month 7 (0-indexed)
    const expectedDay = 1;
    
    if (startDate.getMonth() === expectedMonth && startDate.getDate() === expectedDay) {
      console.log('✅ Season start date is correct (August 1st)');
    } else {
      console.log('❌ Season start date is incorrect');
      console.log(`   Expected: August 1st, Got: ${startDate.toLocaleDateString()}`);
    }
    
    if (resetResponse.data.data.newSeason.status === 'active') {
      console.log('✅ Season status is correctly set to "active"');
    } else {
      console.log('❌ Season status is NOT active');
      console.log(`   Expected: "active", Got: "${resetResponse.data.data.newSeason.status}"`);
    }
    
    console.log('🎯 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testSeasonCreation();
