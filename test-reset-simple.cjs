const axios = require('axios');

async function testDatabaseReset() {
  try {
    console.log('🔍 Testing database reset functionality...');
    
    // Let's first check what users exist
    const usersResponse = await axios.get('http://localhost:3001/api/users', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('👥 Users response:', usersResponse.data);
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('ℹ️ Users endpoint not found, trying direct reset...');
      
      // Try to call the reset without authentication (in development mode)
      try {
        const resetResponse = await axios.post(
          'http://localhost:3001/api/league-time/reset-database',
          { complete: false },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ Reset successful:', resetResponse.data);
        
      } catch (resetError) {
        console.log('❌ Reset failed:', resetError.response?.data || resetError.message);
        
        // Maybe authentication is required, let's try to create a user first
        console.log('🔐 Trying authentication...');
        
        try {
          const registerResponse = await axios.post('http://localhost:3001/api/auth/register', {
            username: 'testuser',
            email: 'test@example.com',
            password: 'test123'
          });
          
          console.log('📝 Registration:', registerResponse.data);
          
          if (registerResponse.data.success) {
            const token = registerResponse.data.token;
            
            // Now try the reset with authentication
            const authResetResponse = await axios.post(
              'http://localhost:3001/api/league-time/reset-database',
              { complete: false },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            console.log('✅ Authenticated reset successful:', authResetResponse.data);
          }
          
        } catch (authError) {
          console.log('❌ Authentication error:', authError.response?.data || authError.message);
        }
      }
    } else {
      console.error('❌ Error checking users:', error.response?.data || error.message);
    }
  }
}

testDatabaseReset();
