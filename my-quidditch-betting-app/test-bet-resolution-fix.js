/**
 * Comprehensive test script to validate bet resolution system
 * Run this in the browser console to test the bet resolution process
 */

// Test function to create a test bet and validate resolution
window.testBetResolution = async function(matchId) {
  console.log(`🧪 TESTING BET RESOLUTION for match ${matchId}`);
  
  // Step 1: Check if services are available
  if (!window.betResolutionService) {
    console.error('❌ betResolutionService not available');
    return;
  }
  
  if (!window.predictionsService) {
    console.error('❌ predictionsService not available');
    return;
  }
  
  // Step 2: Create a test prediction
  console.log('📝 Creating test prediction...');
  const prediction = window.predictionsService.createPrediction(matchId, 'home', 4);
  console.log('✅ Test prediction created:', prediction);
  
  // Step 3: Create a test bet (simulate one)
  console.log('💰 Simulating test bet...');
  const testBet = {
    id: `test_bet_${Date.now()}`,
    userId: 'current_user',
    matchId: matchId,
    matchName: 'Test Match',
    options: [{
      id: 'opt1',
      type: 'winner',
      selection: 'home',
      odds: 2.5,
      description: 'Home team to win',
      matchId: matchId
    }],
    amount: 100,
    combinedOdds: 2.5,
    potentialWin: 250,
    date: new Date().toISOString(),
    status: 'active'
  };
  
  // Save test bet
  const existingBets = JSON.parse(localStorage.getItem('userBets_current_user') || '[]');
  existingBets.push(testBet);
  localStorage.setItem('userBets_current_user', JSON.stringify(existingBets));
  console.log('✅ Test bet created and saved');
  
  // Step 4: Check current bets
  console.log('🔍 Checking current bets...');
  window.debugMatchBets(matchId);
  
  // Step 5: Get virtual time manager and simulate match
  if (window.virtualTimeManager) {
    console.log('⏰ Using virtual time manager to simulate match...');
    
    try {
      // Advance time to trigger match simulation
      const result = await window.virtualTimeManager.avanzarTiempo({
        dias: 1,
        simularPartidosPendientes: true
      });
      
      console.log('✅ Time advanced, matches simulated:', result);
      
      // Check if our test match was resolved
      setTimeout(() => {
        console.log('🔍 Checking resolution results...');
        
        // Check prediction
        const updatedPrediction = window.predictionsService.getUserPrediction(matchId);
        console.log('🔮 Updated prediction:', updatedPrediction);
        
        // Check bet
        const updatedBets = JSON.parse(localStorage.getItem('userBets_current_user') || '[]');
        const ourBet = updatedBets.find(b => b.id === testBet.id);
        console.log('💰 Updated bet:', ourBet);
        
        if (updatedPrediction && updatedPrediction.isCorrect !== undefined) {
          console.log('✅ Prediction was resolved!');
        } else {
          console.log('❌ Prediction was NOT resolved');
        }
        
        if (ourBet && ourBet.status !== 'active') {
          console.log('✅ Bet was resolved!');
        } else {
          console.log('❌ Bet was NOT resolved');
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error during simulation:', error);
    }
  } else {
    console.log('⚠️ Virtual time manager not available, trying manual resolution...');
    
    // Try manual resolution
    setTimeout(async () => {
      await window.debugResolveMatch(matchId);
    }, 1000);
  }
};

// Simple test function for quick validation
window.quickTestBetResolution = function() {
  // Find first available match
  if (window.virtualTimeManager) {
    const state = window.virtualTimeManager.getState();
    if (state.temporadaActiva && state.temporadaActiva.partidos.length > 0) {
      const firstMatch = state.temporadaActiva.partidos[0];
      console.log(`🎯 Testing with first available match: ${firstMatch.id}`);
      window.testBetResolution(firstMatch.id);
    } else {
      console.log('❌ No matches available for testing');
    }
  } else {
    console.log('❌ Virtual time manager not available');
  }
};

// Function to check system status
window.checkBetResolutionSystem = function() {
  console.log('🔧 CHECKING BET RESOLUTION SYSTEM STATUS:');
  
  // Check services availability
  const services = [
    'virtualTimeManager',
    'betResolutionService', 
    'predictionsService',
    'quidditchSimulator'
  ];
  
  services.forEach(service => {
    if (window[service]) {
      console.log(`✅ ${service} is available`);
    } else {
      console.log(`❌ ${service} is NOT available`);
    }
  });
  
  // Check debug functions
  const debugFunctions = [
    'debugMatchBets',
    'debugResolveMatch',
    'debugPrediction',
    'testPredictionFlow'
  ];
  
  debugFunctions.forEach(func => {
    if (window[func]) {
      console.log(`✅ ${func} is available`);
    } else {
      console.log(`❌ ${func} is NOT available`);
    }
  });
  
  // Check localStorage data
  const storageKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('bet') || key.includes('prediction') || key.includes('quidditch'))) {
      storageKeys.push(key);
    }
  }
  
  console.log(`📊 Found ${storageKeys.length} relevant localStorage keys:`, storageKeys);
  
  // Check current season
  if (window.virtualTimeManager) {
    const state = window.virtualTimeManager.getState();
    if (state.temporadaActiva) {
      console.log(`🏆 Active season: ${state.temporadaActiva.name}`);
      console.log(`📅 Virtual date: ${state.fechaVirtualActual}`);
      console.log(`⚽ Total matches: ${state.temporadaActiva.partidos.length}`);
      
      const finished = state.temporadaActiva.partidos.filter(p => p.status === 'finished').length;
      const scheduled = state.temporadaActiva.partidos.filter(p => p.status === 'scheduled').length;
      const live = state.temporadaActiva.partidos.filter(p => p.status === 'live').length;
      
      console.log(`   - Finished: ${finished}`);
      console.log(`   - Scheduled: ${scheduled}`);
      console.log(`   - Live: ${live}`);
    } else {
      console.log('❌ No active season found');
    }
  }
};

// Function to reset test data
window.resetTestData = function() {
  console.log('🧹 RESETTING TEST DATA...');
  
  // Remove test bets
  const userBets = JSON.parse(localStorage.getItem('userBets_current_user') || '[]');
  const filteredBets = userBets.filter(bet => !bet.id.includes('test_bet'));
  localStorage.setItem('userBets_current_user', JSON.stringify(filteredBets));
  
  // Remove test predictions
  const predictions = JSON.parse(localStorage.getItem('quidditch_predictions') || '[]');
  const filteredPredictions = predictions.filter(pred => !pred.id.includes('test_'));
  localStorage.setItem('quidditch_predictions', JSON.stringify(filteredPredictions));
  
  console.log('✅ Test data reset complete');
};

// Advanced test function that simulates real betting scenario
window.advancedBetTest = async function() {
  console.log('🎯 ADVANCED BET RESOLUTION TEST');
  
  // Check system status first
  window.checkBetResolutionSystem();
  
  if (!window.virtualTimeManager) {
    console.error('❌ Cannot run advanced test: virtualTimeManager not available');
    return;
  }
  
  const state = window.virtualTimeManager.getState();
  if (!state.temporadaActiva || state.temporadaActiva.partidos.length === 0) {
    console.error('❌ Cannot run advanced test: No active season or matches');
    return;
  }
  
  // Find a scheduled match
  const scheduledMatch = state.temporadaActiva.partidos.find(p => p.status === 'scheduled');
  if (!scheduledMatch) {
    console.error('❌ Cannot run advanced test: No scheduled matches available');
    return;
  }
  
  console.log(`🎮 Selected match: ${scheduledMatch.id}`);
  
  // Get team names
  const homeTeam = state.temporadaActiva.equipos.find(t => t.id === scheduledMatch.localId);
  const awayTeam = state.temporadaActiva.equipos.find(t => t.id === scheduledMatch.visitanteId);
  
  console.log(`🏠 Home: ${homeTeam?.name || 'Unknown'}`);
  console.log(`🚗 Away: ${awayTeam?.name || 'Unknown'}`);
  
  // Create prediction
  console.log('📝 Creating prediction...');
  const prediction = window.predictionsService.createPrediction(scheduledMatch.id, 'home', 4);
  console.log('✅ Prediction created:', prediction);
  
  // Create multiple bets
  console.log('💰 Creating test bets...');
  const testBets = [
    {
      id: `adv_test_bet_winner_${Date.now()}`,
      userId: 'current_user',
      matchId: scheduledMatch.id,
      matchName: `${homeTeam?.name || 'Home'} vs ${awayTeam?.name || 'Away'}`,
      options: [{
        id: 'winner_home',
        type: 'winner',
        selection: 'home',
        odds: 2.1,
        description: `${homeTeam?.name || 'Home'} to win`,
        matchId: scheduledMatch.id
      }],
      amount: 50,
      combinedOdds: 2.1,
      potentialWin: 105,
      date: new Date().toISOString(),
      status: 'active'
    },
    {
      id: `adv_test_bet_snitch_${Date.now()}`,
      userId: 'current_user',
      matchId: scheduledMatch.id,
      matchName: `${homeTeam?.name || 'Home'} vs ${awayTeam?.name || 'Away'}`,
      options: [{
        id: 'snitch_home',
        type: 'snitch',
        selection: homeTeam?.name || 'home',
        odds: 1.8,
        description: `${homeTeam?.name || 'Home'} to catch the snitch`,
        matchId: scheduledMatch.id
      }],
      amount: 25,
      combinedOdds: 1.8,
      potentialWin: 45,
      date: new Date().toISOString(),
      status: 'active'
    }
  ];
  
  // Save bets
  const existingBets = JSON.parse(localStorage.getItem('userBets_current_user') || '[]');
  testBets.forEach(bet => existingBets.push(bet));
  localStorage.setItem('userBets_current_user', JSON.stringify(existingBets));
  console.log(`✅ Created ${testBets.length} test bets`);
  
  // Simulate match
  console.log('🎮 Simulating match...');
  try {
    const result = await window.virtualTimeManager.avanzarTiempo({
      hastaProximoPartido: true,
      simularPartidosPendientes: true
    });
    
    console.log('✅ Match simulation completed:', result);
    
    // Wait for resolution
    setTimeout(() => {
      console.log('🔍 CHECKING RESOLUTION RESULTS:');
      
      // Check prediction
      const updatedPrediction = window.predictionsService.getUserPrediction(scheduledMatch.id);
      console.log('🔮 Prediction result:', {
        original: prediction.predictedWinner,
        isCorrect: updatedPrediction?.isCorrect,
        status: updatedPrediction?.isCorrect !== undefined ? 'RESOLVED' : 'PENDING'
      });
      
      // Check bets
      const updatedBets = JSON.parse(localStorage.getItem('userBets_current_user') || '[]');
      testBets.forEach(originalBet => {
        const updatedBet = updatedBets.find(b => b.id === originalBet.id);
        if (updatedBet) {
          console.log(`💰 Bet ${originalBet.id}:`, {
            type: originalBet.options[0].type,
            selection: originalBet.options[0].selection,
            amount: originalBet.amount,
            status: updatedBet.status,
            resolved: updatedBet.status !== 'active' ? 'YES' : 'NO'
          });
          
          if (updatedBet.resolutionDetails) {
            console.log(`   📊 Resolution details:`, updatedBet.resolutionDetails.reason);
          }
        }
      });
      
      // Check match result
      const match = state.temporadaActiva.partidos.find(p => p.id === scheduledMatch.id);
      if (match && match.status === 'finished') {
        console.log('🏆 Final match result:', {
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          winner: match.homeScore > match.awayScore ? 'home' : 
                 match.awayScore > match.homeScore ? 'away' : 'draw'
        });
      }
      
      console.log('🎯 ADVANCED TEST COMPLETED');
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error during advanced test:', error);
  }
};

console.log('🧪 Comprehensive test functions loaded:');
console.log('   - checkBetResolutionSystem() - Check system status');
console.log('   - testBetResolution(matchId) - Test bet resolution for specific match');
console.log('   - quickTestBetResolution() - Quick test with first available match');
console.log('   - advancedBetTest() - Advanced test with real betting scenario');
console.log('   - resetTestData() - Reset test data');
console.log('   - debugMatchBets(matchId) - Debug bets for a match');
console.log('   - debugResolveMatch(matchId) - Force resolve bets for a match');
console.log('');
console.log('🎯 Run checkBetResolutionSystem() first to verify system status');
