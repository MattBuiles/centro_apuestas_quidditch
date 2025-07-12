import fetch from 'node-fetch';

async function testAdvanceEndpoint() {
  try {
    // First, login to get the token
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@quidditch.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('Login failed:', loginData);
      return;
    }

    const token = loginData.data.tokens.accessToken;
    console.log('Login successful, token obtained');

    // Now test the advance endpoint
    const advanceResponse = await fetch('http://localhost:3001/api/league-time/advance-to-next-match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({})
    });

    const advanceData = await advanceResponse.json();
    
    console.log('Advance endpoint response:', JSON.stringify(advanceData, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAdvanceEndpoint();
