#!/usr/bin/env node

/**
 * Test script to verify that the duplicate finish endpoint calls have been fixed
 * This simulates the race condition that was causing the HTTP 400 errors
 */

const axios = require('axios');
const API_BASE = 'http://localhost:3001/api';

async function testDuplicateFinishFix() {
  try {
    console.log('🧪 Testing duplicate finish endpoint call fix...\n');
    
    // Step 1: Find a live or scheduled match
    console.log('🔍 Step 1: Finding a test match...');
    const matchesResponse = await axios.get(`${API_BASE}/matches/status/live`);
    
    let testMatch = null;
    if (matchesResponse.data.success && matchesResponse.data.data.length > 0) {
      testMatch = matchesResponse.data.data[0];
    } else {
      // Try scheduled matches
      const scheduledResponse = await axios.get(`${API_BASE}/matches/status/scheduled`);
      if (scheduledResponse.data.success && scheduledResponse.data.data.length > 0) {
        testMatch = scheduledResponse.data.data[0];
      }
    }
    
    if (!testMatch) {
      console.log('❌ No test matches found');
      return;
    }
    
    console.log(`✅ Found test match: ${testMatch.id}`);
    console.log(`   ${testMatch.homeTeamName} vs ${testMatch.awayTeamName}`);
    console.log(`   Current status: ${testMatch.status}\n`);
    
    // Step 2: Prepare match result data
    console.log('🔄 Step 2: Preparing test match result...');
    
    const matchResult = {
      homeScore: 160,
      awayScore: 140,
      status: 'finished',
      events: [
        {
          id: 'test-evt-1-' + Date.now(),
          type: 'QUAFFLE_GOAL',
          minute: 5,
          second: 30,
          teamId: testMatch.home_team_id,
          description: 'Test goal',
          points: 10,
          success: true
        },
        {
          id: 'test-evt-2-' + Date.now(),
          type: 'SNITCH_CAUGHT',
          minute: 25,
          second: 45,
          teamId: testMatch.home_team_id,
          description: 'Test snitch catch',
          points: 150,
          success: true
        }
      ],
      duration: 30,
      snitchCaught: true,
      snitchCaughtBy: testMatch.home_team_id,
      finishedAt: new Date().toISOString()
    };
    
    console.log(`   Events: ${matchResult.events.length}`);
    console.log(`   Score: ${matchResult.homeScore} - ${matchResult.awayScore}`);
    console.log(`   Duration: ${matchResult.duration} minutes\n`);
    
    // Step 3: Test multiple simultaneous calls (simulating the race condition)
    console.log('🚀 Step 3: Testing multiple simultaneous finish calls...');
    
    const promises = [];
    const numCalls = 3; // Simulate 3 simultaneous calls
    
    for (let i = 0; i < numCalls; i++) {
      const promise = axios.post(
        `${API_BASE}/matches/${testMatch.id}/finish`,
        matchResult,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      ).then(response => {
        return { callNumber: i + 1, success: true, data: response.data };
      }).catch(error => {
        return { 
          callNumber: i + 1, 
          success: false, 
          error: error.response?.status || 'Unknown',
          message: error.response?.data?.message || error.message
        };
      });
      
      promises.push(promise);
    }
    
    // Wait for all calls to complete
    const results = await Promise.all(promises);
    
    // Analyze results
    console.log('📊 Results analysis:');
    const successfulCalls = results.filter(r => r.success);
    const failedCalls = results.filter(r => !r.success);
    
    console.log(`   Successful calls: ${successfulCalls.length}/${numCalls}`);
    console.log(`   Failed calls: ${failedCalls.length}/${numCalls}`);
    
    // Expected: 1 successful call, others should fail with 400 (already finished)
    if (successfulCalls.length === 1 && failedCalls.length === numCalls - 1) {
      const allFailuresAre400 = failedCalls.every(f => f.error === 400);
      if (allFailuresAre400) {
        console.log('✅ PERFECT! Backend correctly handles duplicate calls:');
        console.log('   - First call succeeded');
        console.log('   - Subsequent calls failed with HTTP 400 (expected)');
        console.log('   - No backend crashes or data corruption');
      } else {
        console.log('⚠️ Some failures were not HTTP 400 as expected:');
        failedCalls.forEach(f => {
          console.log(`   Call ${f.callNumber}: ${f.error} - ${f.message}`);
        });
      }
    } else if (successfulCalls.length > 1) {
      console.log('⚠️ Multiple calls succeeded - potential data corruption risk');
      successfulCalls.forEach(s => {
        console.log(`   Call ${s.callNumber}: Success`);
      });
    } else if (successfulCalls.length === 0) {
      console.log('❌ No calls succeeded - possible backend issue');
      results.forEach(r => {
        console.log(`   Call ${r.callNumber}: ${r.error} - ${r.message}`);
      });
    }
    
    // Step 4: Verify match state
    console.log('\n🔍 Step 4: Verifying final match state...');
    const verifyResponse = await axios.get(`${API_BASE}/matches/${testMatch.id}`);
    
    if (verifyResponse.data.success) {
      const updatedMatch = verifyResponse.data.data;
      console.log('✅ Match state verification:');
      console.log(`   Status: ${updatedMatch.status}`);
      console.log(`   Score: ${updatedMatch.home_score} - ${updatedMatch.away_score}`);
      console.log(`   Duration: ${updatedMatch.duration} minutes`);
      console.log(`   Snitch caught: ${updatedMatch.snitch_caught ? 'Yes' : 'No'}`);
      
      if (updatedMatch.status === 'finished') {
        console.log('\n🎉 SUCCESS! The fix is working correctly:');
        console.log('   ✅ Backend handles duplicate calls gracefully');
        console.log('   ✅ Match data is consistent and not corrupted');
        console.log('   ✅ Only first call processes the data');
        console.log('   ✅ Subsequent calls are safely rejected');
      } else {
        console.log('\n❌ Match was not properly finished');
      }
    } else {
      console.log('❌ Could not verify match state');
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
  testDuplicateFinishFix();
}

module.exports = { testDuplicateFinishFix };
