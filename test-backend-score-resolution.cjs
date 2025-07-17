const path = require('path');
const { BetResolutionService } = require('./backend/src/services/BetResolutionService');
const { Database } = require('./backend/src/database/Database');

async function testRealBackendResolution() {
  console.log('🧪 Testing real backend resolution for score bets...\n');
  
  try {
    const db = Database.getInstance();
    const betResolutionService = BetResolutionService.getInstance();
    
    // Get a finished match to test with
    const match = await db.get('SELECT * FROM matches WHERE status = "finished" LIMIT 1');
    if (!match) {
      console.log('❌ No finished matches found');
      return;
    }
    
    console.log('📋 Testing with match:', match.id);
    console.log('   Result:', match.home_score + '-' + match.away_score);
    console.log('   Duration:', match.duration, 'minutes');
    console.log('   Snitch caught:', match.snitch_caught, 'by', match.snitch_caught_by);
    
    // Test resolution for this match
    console.log('\n🔄 Running bet resolution...');
    const result = await betResolutionService.resolveBetsForMatch(match.id);
    console.log('✅ Resolution result:', result.resolved, 'resolved,', result.errors.length, 'errors');
    
    if (result.errors.length > 0) {
      console.log('❌ Errors:', result.errors);
    }
    
    // Get all bets for this match to see what was resolved
    console.log('\n📊 Bets for this match:');
    const bets = await db.all('SELECT * FROM bets WHERE match_id = ?', [match.id]);
    
    for (const bet of bets) {
      console.log(`   🎯 Bet ${bet.id}:`);
      console.log(`      Type: ${bet.type}`);
      console.log(`      Prediction: ${bet.prediction}`);
      console.log(`      Status: ${bet.status}`);
      console.log(`      Amount: ${bet.amount}`);
      
      if (bet.type === 'score') {
        // Analyze score bet
        const scoreMatch = bet.prediction.match(/^(\d+)-(\d+)$/);
        if (scoreMatch) {
          const predictedHome = parseInt(scoreMatch[1]);
          const predictedAway = parseInt(scoreMatch[2]);
          const actualHome = match.home_score;
          const actualAway = match.away_score;
          
          const correct = (predictedHome === actualHome && predictedAway === actualAway);
          console.log(`      Score analysis: Predicted ${predictedHome}-${predictedAway} vs Actual ${actualHome}-${actualAway} -> ${correct ? '✅ CORRECT' : '❌ WRONG'}`);
        }
      } else if (bet.type === 'combined' && bet.prediction.includes('score:')) {
        // Analyze combined bet with score
        const predictions = bet.prediction.split(',');
        console.log(`      Combined predictions:`);
        
        for (const pred of predictions) {
          const [type, value] = pred.split(':');
          let analysis = '';
          
          switch (type) {
            case 'winner':
              const actualWinner = match.home_score > match.away_score ? 'home' : 
                                 match.away_score > match.home_score ? 'away' : 'draw';
              analysis = value === actualWinner ? '✅' : '❌';
              break;
              
            case 'score':
              const scoreMatch = value.match(/^(\d+)-(\d+)$/);
              if (scoreMatch) {
                const predictedHome = parseInt(scoreMatch[1]);
                const predictedAway = parseInt(scoreMatch[2]);
                const correct = (predictedHome === match.home_score && predictedAway === match.away_score);
                analysis = correct ? '✅' : '❌';
              }
              break;
              
            case 'snitch':
              // Simplified snitch analysis
              analysis = '⚠️';
              break;
              
            case 'time':
              const timeMatch = value.match(/^(\d+)-(\d+)$/);
              if (timeMatch) {
                const minTime = parseInt(timeMatch[1]);
                const maxTime = parseInt(timeMatch[2]);
                const withinRange = (match.duration >= minTime && match.duration <= maxTime);
                analysis = withinRange ? '✅' : '❌';
              }
              break;
          }
          
          console.log(`        - ${type}:${value} ${analysis}`);
        }
      }
      
      console.log('');
    }
    
    // Test resolution of all pending combined bets
    console.log('🔄 Testing resolution of all pending combined bets...');
    const combinedResult = await betResolutionService.resolveAllPendingCombinedBets();
    console.log('✅ Combined resolution result:', combinedResult.resolved, 'resolved,', combinedResult.errors.length, 'errors');
    
    if (combinedResult.errors.length > 0) {
      console.log('❌ Combined resolution errors:', combinedResult.errors);
    }
    
    console.log('\n✅ Backend resolution tests completed!');
    
  } catch (error) {
    console.error('❌ Error during backend test:', error);
  }
}

testRealBackendResolution();
