const axios = require('axios');

async function testResetDatabase() {
  try {
    console.log('🔄 Testing database reset...');
    
    // First, let's login to get a token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Now test the reset
    const resetResponse = await axios.post(
      'http://localhost:3001/api/league-time/reset-database',
      { complete: false }, // Reset for new season only
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Reset response:', resetResponse.data);
    
    // Check the league time after reset
    const timeResponse = await axios.get('http://localhost:3001/api/league-time');
    console.log('📅 League time after reset:', timeResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testResetDatabase();
