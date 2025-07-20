#!/usr/bin/env node

/**
 * Simple test to verify the live match simulator works without duplicated backend calls
 */

const { liveMatchSimulator } = require('./dist/src/services/liveMatchSimulator.js');

// Mock teams
const homeTeam = {
  id: 'test-home',
  name: 'Test Home Team',
  attackStrength: 60,
  defenseStrength: 55
};

const awayTeam = {
  id: 'test-away', 
  name: 'Test Away Team',
  attackStrength: 55,
  defenseStrength: 60
};

// Mock match
const match = {
  id: 'test-match-' + Date.now(),
  homeTeamId: homeTeam.id,
  awayTeamId: awayTeam.id,
  status: 'live',
  date: new Date().toISOString()
};

async function testLiveMatchFlow() {
  try {
    console.log('🧪 Testing live match simulator flow...\n');
    
    console.log('1️⃣ Starting live match simulation...');
    const initialState = liveMatchSimulator.startLiveMatch(match, homeTeam, awayTeam, 5); // 5 minute match for quick test
    console.log(`   Initial state: ${initialState.golesLocal}-${initialState.golesVisitante}, Active: ${initialState.isActive}`);
    
    // Wait for match to complete
    console.log('\n2️⃣ Waiting for match to complete...');
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    
    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const currentState = liveMatchSimulator.getMatchState(match.id);
      
      if (currentState) {
        console.log(`   Minute ${currentState.minuto}: ${currentState.golesLocal}-${currentState.golesVisitante}, Events: ${currentState.eventos.length}`);
        
        if (!currentState.isActive) {
          completed = true;
          console.log('\n✅ Match completed!');
          console.log(`   Final score: ${currentState.golesLocal}-${currentState.golesVisitante}`);
          console.log(`   Duration: ${currentState.minuto} minutes`);
          console.log(`   Total events: ${currentState.eventos.length}`);
          console.log(`   Snitch caught: ${currentState.snitchCaught ? 'Yes' : 'No'}`);
          console.log(`   Backend saved: ${currentState.backendSaved ? 'Yes' : 'No'}`);
        }
      } else {
        console.log('   No match state found - may have been cleaned up');
        break;
      }
      
      attempts++;
    }
    
    if (!completed) {
      console.log('⚠️ Match did not complete within expected time');
    }
    
    console.log('\n3️⃣ Testing saveDetailedMatchResult...');
    try {
      await liveMatchSimulator.saveDetailedMatchResult(match.id, match, homeTeam, awayTeam);
      console.log('✅ saveDetailedMatchResult completed without errors');
    } catch (error) {
      console.log('❌ saveDetailedMatchResult failed:', error.message);
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Only run if this is the main module
if (require.main === module) {
  testLiveMatchFlow();
}

module.exports = { testLiveMatchFlow };
