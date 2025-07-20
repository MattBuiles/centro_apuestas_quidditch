#!/usr/bin/env node

/**
 * Test script to verify that the duplicate match finish issue is fixed
 * This simulates the scenario where multiple finish calls are made
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testDuplicateFinishProtection() {
  try {
    console.log('🧪 Testing duplicate match finish protection...\n');
    
    // Step 1: Get a match to test with
    console.log('🔍 Step 1: Finding a match to test...');
    const matchesResponse = await axios.get(`${API_BASE}/matches/status/scheduled`);
    
    let testMatch = null;
    if (matchesResponse.data.success && matchesResponse.data.data.length > 0) {
      testMatch = matchesResponse.data.data[0];
    } else {
      // Try live matches
      const liveResponse = await axios.get(`${API_BASE}/matches/status/live`);
      if (liveResponse.data.success && liveResponse.data.data.length > 0) {
        testMatch = liveResponse.data.data[0];
      }
    }
    
    if (!testMatch) {
      console.log('❌ No suitable matches found for testing');
      return;
    }
    
    console.log(`✅ Found test match: ${testMatch.id}`);
    console.log(`   ${testMatch.homeTeamName} vs ${testMatch.awayTeamName}\n`);
    
    // Step 2: Prepare match result data
    const matchResult = {
      homeScore: 180,
      awayScore: 120,
      status: 'finished',
      events: [
        {
          id: 'evt-' + Date.now() + '-1',
          type: 'QUAFFLE_GOAL',
          minute: 5,
          second: 30,
          teamId: testMatch.home_team_id,
          description: '¡Gol de Quaffle!',
          points: 10
        },
        {
          id: 'evt-' + Date.now() + '-2',
          type: 'SNITCH_CATCH',
          minute: 25,
          second: 45,
          teamId: testMatch.home_team_id,
          description: '¡Snitch capturada!',
          points: 150
        }
      ],
      duration: 25,
      snitchCaught: true,
      snitchCaughtBy: testMatch.home_team_id,
      finishedAt: new Date().toISOString()
    };
    
    console.log('🔄 Step 2: Making first finish call...');
    
    // Step 3: Make first finish call
    const firstCall = axios.post(
      `${API_BASE}/matches/${testMatch.id}/finish`,
      matchResult,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('🔄 Step 3: Making second finish call (simulating duplicate)...');
    
    // Step 4: Make second finish call immediately (simulating the race condition)
    const secondCall = axios.post(
      `${API_BASE}/matches/${testMatch.id}/finish`,
      matchResult,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    // Wait for both calls to complete
    console.log('⏳ Waiting for both calls to complete...\n');
    
    const [firstResponse, secondResponse] = await Promise.allSettled([firstCall, secondCall]);
    
    // Analyze results
    console.log('📊 RESULTS ANALYSIS:');
    
    console.log('\n🥇 First call:');
    if (firstResponse.status === 'fulfilled') {
      console.log('   ✅ Status: Success');
      console.log(`   📝 Response: ${firstResponse.value.data.message}`);
    } else {
      console.log('   ❌ Status: Failed');
      console.log(`   📝 Error: ${firstResponse.reason.message}`);
    }
    
    console.log('\n🥈 Second call:');
    if (secondResponse.status === 'fulfilled') {
      console.log('   ✅ Status: Success');
      console.log(`   📝 Response: ${secondResponse.value.data.message}`);
    } else {
      console.log('   ❌ Status: Failed (this is expected)');
      if (secondResponse.reason.response) {
        console.log(`   📝 Error code: ${secondResponse.reason.response.status}`);
        console.log(`   📝 Error message: ${secondResponse.reason.response.data.message}`);
        
        // Check if it's the expected "already finished" error
        if (secondResponse.reason.response.status === 400 && 
            secondResponse.reason.response.data.message.includes('already finished')) {
          console.log('   🎯 This is the expected "already finished" error - GOOD!');
        }
      } else {
        console.log(`   📝 Error: ${secondResponse.reason.message}`);
      }
    }
    
    // Step 5: Verify final state
    console.log('\n🔍 Step 4: Verifying final match state...');
    const verifyResponse = await axios.get(`${API_BASE}/matches/${testMatch.id}`);
    
    if (verifyResponse.data.success) {
      const finalMatch = verifyResponse.data.data;
      console.log('✅ Final verification successful:');
      console.log(`   Status: ${finalMatch.status}`);
      console.log(`   Score: ${finalMatch.home_score} - ${finalMatch.away_score}`);
      console.log(`   Duration: ${finalMatch.duration} minutes`);
    }
    
    // Test conclusion
    console.log('\n🎯 TEST CONCLUSION:');
    if (firstResponse.status === 'fulfilled' && 
        secondResponse.status === 'rejected' && 
        secondResponse.reason.response?.status === 400) {
      console.log('✅ SUCCESS: Protection against duplicate finish calls is working!');
      console.log('   - First call succeeded');
      console.log('   - Second call was properly rejected with 400 error');
      console.log('   - Backend is protected against duplicate operations');
    } else {
      console.log('❌ ISSUE: The protection may not be working as expected');
      console.log('   Please review the results above');
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
  testDuplicateFinishProtection();
}

module.exports = { testDuplicateFinishProtection };
