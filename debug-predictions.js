// Debug Script for Predictions Issue
// Run this in browser console to diagnose the problem

console.log('🔍 Diagnosing Predictions Issue...');

async function debugPredictions() {
  try {
    // Get time manager
    const timeManager = window.debugQuidditch?.virtualTimeManager;
    if (!timeManager) {
      console.error('❌ VirtualTimeManager not available');
      return;
    }

    const state = timeManager.getState();
    if (!state.temporadaActiva) {
      console.error('❌ No active season');
      return;
    }

    // Find a finished match with predictions
    const { predictionsService } = await import('./src/services/predictionsService.js');
    
    const finishedMatches = state.temporadaActiva.partidos.filter(m => m.status === 'finished');
    console.log(`🏁 Found ${finishedMatches.length} finished matches`);

    for (const match of finishedMatches.slice(0, 3)) {
      console.log(`\n📊 Analyzing match: ${match.id}`);
      console.log(`   Local: ${match.localId} (Score: ${match.homeScore})`);
      console.log(`   Visitante: ${match.visitanteId} (Score: ${match.awayScore})`);
      
      // Check if user has prediction for this match
      const userPrediction = predictionsService.getUserPrediction(match.id);
      if (userPrediction) {
        console.log(`🔮 User prediction found:`);
        console.log(`   - Predicted winner: ${userPrediction.predictedWinner}`);
        console.log(`   - Is correct: ${userPrediction.isCorrect}`);
        console.log(`   - Timestamp: ${new Date(userPrediction.timestamp).toLocaleString()}`);
        
        // Manually calculate what the result should be
        const actualWinner = match.homeScore > match.awayScore ? 'home' :
                           match.awayScore > match.homeScore ? 'away' : 'draw';
        
        console.log(`📋 Manual calculation:`);
        console.log(`   - homeScore (${match.homeScore}) vs awayScore (${match.awayScore})`);
        console.log(`   - Should be: ${actualWinner}`);
        console.log(`   - User predicted: ${userPrediction.predictedWinner}`);
        console.log(`   - Should be correct: ${userPrediction.predictedWinner === actualWinner}`);
        console.log(`   - System says: ${userPrediction.isCorrect}`);
        
        if ((userPrediction.predictedWinner === actualWinner) !== userPrediction.isCorrect) {
          console.log(`🚨 MISMATCH DETECTED! System result is wrong.`);
          
          // Let's check the team mapping
          const localTeam = state.temporadaActiva.equipos.find(t => t.id === match.localId);
          const visitanteTeam = state.temporadaActiva.equipos.find(t => t.id === match.visitanteId);
          
          console.log(`🏠 Team mapping:`);
          console.log(`   - Local (home): ${match.localId} = ${localTeam?.name}`);
          console.log(`   - Visitante (away): ${match.visitanteId} = ${visitanteTeam?.name}`);
          
          return {
            problem: 'MISMATCH_DETECTED',
            match,
            prediction: userPrediction,
            calculated: actualWinner,
            systemResult: userPrediction.isCorrect
          };
        }
      } else {
        console.log(`⚪ No user prediction for this match`);
      }
    }
    
    console.log('\n✅ Diagnosis complete');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugPredictions().then(result => {
  if (result) {
    console.log('\n🎯 PROBLEM IDENTIFIED:', result);
  }
});
