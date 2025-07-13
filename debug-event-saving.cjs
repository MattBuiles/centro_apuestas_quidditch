#!/usr/bin/env node

/**
 * Script para debuggear por qué los eventos no se guardan en la base de datos
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function debugEventSaving() {
  try {
    console.log('🔍 Debugging event saving issue...\n');
    
    // Encontrar un partido para probar
    console.log('Step 1: Finding a match to test...');
    const matchesResponse = await axios.get(`${API_BASE}/matches`);
    
    if (!matchesResponse.data.success || !matchesResponse.data.data.length) {
      console.log('❌ No matches found');
      return;
    }
    
    const testMatch = matchesResponse.data.data.find(match => 
      match.status !== 'finished'
    );
    
    if (!testMatch) {
      console.log('❌ No unfinished matches found');
      return;
    }
    
    console.log(`✅ Using match: ${testMatch.id}`);
    console.log(`   ${testMatch.homeTeamName} vs ${testMatch.awayTeamName}\n`);
    
    // Probar con diferentes tipos de eventos
    console.log('Step 2: Testing with different event types...');
    
    const testCases = [
      {
        name: 'Original types (as sent by frontend)',
        events: [
          {
            id: 'test-evt-1',
            minute: 5,
            type: 'QUAFFLE_GOAL',
            teamId: testMatch.home_team_id,
            description: 'Test Quaffle Goal',
            points: 10
          }
        ]
      },
      {
        name: 'Schema-compatible types',
        events: [
          {
            id: 'test-evt-2',
            minute: 10,
            type: 'goal',
            teamId: testMatch.home_team_id,
            description: 'Test Goal',
            points: 10
          }
        ]
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      
      const matchResult = {
        homeScore: 10,
        awayScore: 0,
        duration: 10,
        snitchCaught: false,
        snitchCaughtBy: '',
        finishedAt: new Date().toISOString(),
        events: testCase.events
      };
      
      try {
        const response = await axios.post(
          `${API_BASE}/matches/${testMatch.id}/finish`,
          matchResult,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.success) {
          console.log(`✅ API call successful`);
          console.log(`   Events reported saved: ${response.data.data.events}`);
          
          // Verificar si realmente se guardaron
          console.log('   Checking database...');
          // Note: No podemos verificar directamente la DB desde aquí debido a problemas de conexión
          // pero los logs del backend nos dirán si se guardaron
          
        } else {
          console.log(`❌ API call failed: ${response.data.error}`);
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        if (error.response && error.response.data) {
          console.log('   Response:', JSON.stringify(error.response.data, null, 2));
        }
      }
      
      // Reset match status for next test
      // (This is a hack since we don't have a reset endpoint)
      try {
        await axios.post(`${API_BASE}/matches/${testMatch.id}/finish`, {
          homeScore: 0,
          awayScore: 0,
          duration: 0,
          snitchCaught: false,
          snitchCaughtBy: '',
          finishedAt: new Date().toISOString(),
          events: []
        });
      } catch (e) {
        // Ignore reset errors
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Execute the debug
if (require.main === module) {
  debugEventSaving();
}

module.exports = { debugEventSaving };
