const axios = require('axios');

async function testMatches() {
  try {
    const response = await axios.get('http://localhost:3001/api/matches');
    console.log('First match:', JSON.stringify(response.data.data[0], null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testMatches();
