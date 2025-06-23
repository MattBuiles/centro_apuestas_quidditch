// Test Script for Predictions System
// To be run in browser console

console.log('🧪 Testing Predictions System...');

// Helper function to wait for async operations
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testPredictionsSystem() {
  try {
    console.log('\n1️⃣ Getting current time state...');
    const timeManager = window.debugQuidditch?.virtualTimeManager;
    if (!timeManager) {
      console.error('❌ VirtualTimeManager not available');
      return;
    }

    const state = timeManager.getState();
    if (!state.temporadaActiva) {
      console.error('❌ No active season found');
      return;
    }

    // Find an upcoming match
    const upcomingMatches = state.temporadaActiva.partidos.filter(m => 
      m.status === 'scheduled' && new Date(m.fecha) > state.fechaVirtual
    );

    if (upcomingMatches.length === 0) {
      console.error('❌ No upcoming matches found');
      return;
    }

    const testMatch = upcomingMatches[0];
    console.log(`📅 Testing with match: ${testMatch.localId} vs ${testMatch.visitanteId} (ID: ${testMatch.id})`);

    // Import predictions service
    const { predictionsService } = await import('./src/services/predictionsService.js');
    console.log('✅ PredictionsService loaded');

    console.log('\n2️⃣ Creating test prediction...');
    const prediction = predictionsService.createPrediction(testMatch.id, 'home', 4);
    console.log('✅ Test prediction created:', prediction);

    console.log('\n3️⃣ Getting prediction stats...');
    const stats = predictionsService.getMatchPredictionStats(testMatch.id);
    console.log('✅ Prediction stats:', stats);

    console.log('\n4️⃣ Simulating match to test resolution...');
    
    // Listen for prediction updates
    let predictionUpdateReceived = false;
    const predictionListener = (event) => {
      console.log('🔮 Prediction update event received:', event.detail);
      predictionUpdateReceived = true;
    };
    window.addEventListener('predictionsUpdated', predictionListener);

    // Advance virtual time to reach the match
    const matchDate = new Date(testMatch.fecha);
    const daysToAdvance = Math.ceil((matchDate.getTime() - state.fechaVirtual.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysToAdvance > 0) {
      console.log(`⏰ Advancing ${daysToAdvance} days to reach match date...`);
      for (let i = 0; i < daysToAdvance; i++) {
        timeManager.avanzarTiempo(1, 'dias');
        await wait(100); // Small delay to allow processing
      }
    }

    // Start the match simulation
    console.log('🏁 Starting match simulation...');
    const updatedState = timeManager.getState();
    const currentMatch = updatedState.temporadaActiva.partidos.find(m => m.id === testMatch.id);
    
    if (currentMatch && currentMatch.status === 'live') {
      // Wait for the live match to finish
      console.log('⚡ Match is live, waiting for completion...');
      let attempts = 0;
      while (currentMatch.status === 'live' && attempts < 30) {
        await wait(1000);
        attempts++;
        const checkState = timeManager.getState();
        const checkMatch = checkState.temporadaActiva.partidos.find(m => m.id === testMatch.id);
        if (checkMatch && checkMatch.status === 'finished') {
          break;
        }
      }
    }

    console.log('\n5️⃣ Checking prediction result...');
    
    // Wait a bit for async operations to complete
    await wait(2000);
    
    const updatedPrediction = predictionsService.getUserPrediction(testMatch.id);
    if (updatedPrediction) {
      console.log('🎯 Updated prediction:', updatedPrediction);
      
      if (updatedPrediction.isCorrect !== undefined) {
        console.log(`✅ Prediction was ${updatedPrediction.isCorrect ? 'CORRECT' : 'INCORRECT'}`);
      } else {
        console.log('⚠️ Prediction result not yet updated');
      }
    }

    // Check if we received the prediction update event
    if (predictionUpdateReceived) {
      console.log('✅ Prediction update event was received');
    } else {
      console.log('⚠️ Prediction update event was not received');
    }

    // Cleanup
    window.removeEventListener('predictionsUpdated', predictionListener);

    console.log('\n🎉 Predictions test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPredictionsSystem();
