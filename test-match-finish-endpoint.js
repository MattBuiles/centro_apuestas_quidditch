#!/usr/bin/env node

/**
 * Test script to verify the POST /api/matches/:id/finish endpoint works correctly
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Mock match data similar to what the frontend sends
const mockMatchResult = {
  homeScore: 150,
  awayScore: 130,
  duration: 90,
  snitchCaught: true,
  snitchCaughtBy: 'Gryffindor',
  finishedAt: new Date().toISOString(),
  events: [
    {
      id: 'evt-1',
      minute: 5,
      type: 'QUAFFLE_GOAL',
      teamId: 'gryffindor',
      playerId: 'player-1',
      description: '¡Gol de Quaffle!',
      points: 10
    },
    {
      id: 'evt-2',
      minute: 10,
      type: 'QUAFFLE_SAVE',
      teamId: 'slytherin',
      playerId: 'player-2',
      description: '¡Parada del Guardián!',
      points: 0
    },
    {
      id: 'evt-3',
      minute: 90,
      type: 'SNITCH_CAUGHT',
      teamId: 'gryffindor',
      playerId: 'player-3',
      description: '¡La Snitch Dorada ha sido atrapada!',
      points: 150
    }
  ]
};

async function testMatchFinishEndpoint() {
  try {
    console.log('🧪 Testing POST /api/matches/:id/finish endpoint...\n');
    
    // First, get all matches to find one to finish
    console.log('🔍 Finding a match to finish...');
    const matchesResponse = await axios.get(`${API_BASE}/matches`);
    
    if (!matchesResponse.data.success || !matchesResponse.data.data.length) {
      console.log('❌ No matches found in the database');
      return;
    }
    
    // Find a match that's not finished
    const availableMatch = matchesResponse.data.data.find(match => 
      match.status !== 'finished'
    );
    
    if (!availableMatch) {
      console.log('❌ No unfinished matches found');
      return;
    }
    
    console.log(`✅ Found match to finish: ${availableMatch.id}`);
    console.log(`   ${availableMatch.homeTeamName} vs ${availableMatch.awayTeamName}`);
    console.log(`   Current status: ${availableMatch.status}\n`);
    
    // Test the finish endpoint
    console.log('🔄 Calling finish endpoint...');
    const finishResponse = await axios.post(
      `${API_BASE}/matches/${availableMatch.id}/finish`,
      mockMatchResult,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (finishResponse.data.success) {
      console.log('✅ Match finished successfully!');
      console.log('Response:', JSON.stringify(finishResponse.data, null, 2));
      
      // Verify the match was updated
      console.log('\n🔍 Verifying match was updated...');
      const updatedMatchResponse = await axios.get(`${API_BASE}/matches/${availableMatch.id}`);
      
      if (updatedMatchResponse.data.success) {
        const updatedMatch = updatedMatchResponse.data.data;
        console.log('✅ Match verification successful:');
        console.log(`   Status: ${updatedMatch.status}`);
        console.log(`   Score: ${updatedMatch.home_score} - ${updatedMatch.away_score}`);
        console.log(`   Duration: ${updatedMatch.duration} minutes`);
        console.log(`   Snitch caught: ${updatedMatch.snitch_caught}`);
        console.log(`   Snitch caught by: ${updatedMatch.snitch_caught_by}`);
      } else {
        console.log('❌ Failed to verify match update');
      }
    } else {
      console.log('❌ Failed to finish match:');
      console.log('Error:', finishResponse.data.error);
      console.log('Message:', finishResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Execute the test
if (require.main === module) {
  testMatchFinishEndpoint();
}

module.exports = { testMatchFinishEndpoint };
