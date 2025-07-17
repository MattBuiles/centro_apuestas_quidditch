const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Simulación de la lógica de evaluación de apuestas de score
function evaluateScoreBet(prediction, actualHomeScore, actualAwayScore) {
  if (prediction === 'exact') {
    return {
      isWon: false,
      reason: `Apuesta de marcador con predicción 'exact' no soportada - necesita marcador específico (ej: '150-90')`
    };
  }

  const scoreMatch = prediction.match(/^(\d+)-(\d+)$/);
  if (!scoreMatch) {
    return {
      isWon: false,
      reason: `Formato de marcador inválido: ${prediction}`
    };
  }

  const predictedHomeScore = parseInt(scoreMatch[1]);
  const predictedAwayScore = parseInt(scoreMatch[2]);

  if (predictedHomeScore === actualHomeScore && predictedAwayScore === actualAwayScore) {
    return {
      isWon: true,
      reason: `Marcador exacto acertado: ${predictedHomeScore}-${predictedAwayScore}`
    };
  } else {
    return {
      isWon: false,
      reason: `Marcador real ${actualHomeScore}-${actualAwayScore} no coincide con predicción ${predictedHomeScore}-${predictedAwayScore}`
    };
  }
}

// Simulación de evaluación de apuesta combinada con score
function evaluateCombinedBetWithScore(predictions, matchResult) {
  const results = [];
  
  for (const pred of predictions) {
    let result;
    
    switch (pred.type) {
      case 'winner':
        if (matchResult.homeScore > matchResult.awayScore && pred.value === 'home') {
          result = { isWon: true, reason: 'Home team won' };
        } else if (matchResult.awayScore > matchResult.homeScore && pred.value === 'away') {
          result = { isWon: true, reason: 'Away team won' };
        } else {
          result = { isWon: false, reason: 'Winner prediction failed' };
        }
        break;
        
      case 'score':
        result = evaluateScoreBet(pred.value, matchResult.homeScore, matchResult.awayScore);
        break;
        
      case 'snitch':
        if (matchResult.snitchCaught && pred.value === 'home') {
          result = { isWon: true, reason: 'Home team caught snitch' };
        } else if (matchResult.snitchCaught && pred.value === 'away') {
          result = { isWon: true, reason: 'Away team caught snitch' };
        } else {
          result = { isWon: false, reason: 'Snitch prediction failed' };
        }
        break;
        
      case 'time':
        const timeMatch = pred.value.match(/^(\d+)-(\d+)$/);
        if (timeMatch) {
          const minTime = parseInt(timeMatch[1]);
          const maxTime = parseInt(timeMatch[2]);
          if (matchResult.duration >= minTime && matchResult.duration <= maxTime) {
            result = { isWon: true, reason: `Duration ${matchResult.duration} within range ${minTime}-${maxTime}` };
          } else {
            result = { isWon: false, reason: `Duration ${matchResult.duration} outside range ${minTime}-${maxTime}` };
          }
        } else {
          result = { isWon: false, reason: 'Invalid time format' };
        }
        break;
        
      default:
        result = { isWon: false, reason: `Unknown type: ${pred.type}` };
    }
    
    results.push({
      type: pred.type,
      value: pred.value,
      ...result
    });
  }
  
  const allWon = results.every(r => r.isWon);
  return {
    allWon,
    results,
    reason: allWon ? 'All predictions correct' : 'Some predictions failed'
  };
}

async function testScoreResolution() {
  console.log('🧪 Testing score bet resolution...\n');
  
  const db = new sqlite3.Database('./backend/database/quidditch.db');
  
  try {
    // Get some real bet data from database
    const bets = await new Promise((resolve, reject) => {
      db.all(`
        SELECT b.id, b.type, b.prediction, b.status, b.match_id,
               m.home_score, m.away_score, m.duration, m.snitch_caught, m.snitch_caught_by
        FROM bets b
        JOIN matches m ON b.match_id = m.id
        WHERE (b.type = 'score' OR b.prediction LIKE '%score:%') 
          AND m.status = 'finished'
        LIMIT 5
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📋 Found ${bets.length} score bets to test:\n`);
    
    for (const bet of bets) {
      console.log(`🎯 Testing bet ${bet.id}:`);
      console.log(`   Type: ${bet.type}`);
      console.log(`   Prediction: ${bet.prediction}`);
      console.log(`   Actual result: ${bet.home_score}-${bet.away_score}`);
      console.log(`   Current status: ${bet.status}`);
      
      const matchResult = {
        homeScore: bet.home_score,
        awayScore: bet.away_score,
        duration: bet.duration,
        snitchCaught: bet.snitch_caught,
        snitchCaughtBy: bet.snitch_caught_by
      };
      
      if (bet.type === 'score') {
        // Individual score bet
        const result = evaluateScoreBet(bet.prediction, bet.home_score, bet.away_score);
        console.log(`   Expected result: ${result.isWon ? 'WON' : 'LOST'}`);
        console.log(`   Reason: ${result.reason}`);
        console.log(`   Status correct: ${(result.isWon && bet.status === 'won') || (!result.isWon && bet.status === 'lost') ? '✅' : '❌'}`);
      } else if (bet.type === 'combined') {
        // Combined bet
        const predictions = bet.prediction.split(',').map(pred => {
          const [type, value] = pred.split(':');
          return { type, value };
        });
        
        const result = evaluateCombinedBetWithScore(predictions, matchResult);
        console.log(`   Expected result: ${result.allWon ? 'WON' : 'LOST'}`);
        console.log(`   Individual results:`);
        for (const res of result.results) {
          console.log(`     - ${res.type}:${res.value} -> ${res.isWon ? '✅' : '❌'} (${res.reason})`);
        }
        console.log(`   Status correct: ${(result.allWon && bet.status === 'won') || (!result.allWon && bet.status === 'lost') ? '✅' : '❌'}`);
      }
      
      console.log('');
    }
    
    // Test specific cases
    console.log('🔬 Testing specific cases:\n');
    
    // Test 1: Exact score match
    console.log('Test 1: Exact score match (150-90 vs 150-90)');
    const test1 = evaluateScoreBet('150-90', 150, 90);
    console.log(`Result: ${test1.isWon ? 'WON' : 'LOST'} - ${test1.reason}\n`);
    
    // Test 2: Score mismatch
    console.log('Test 2: Score mismatch (150-90 vs 140-100)');
    const test2 = evaluateScoreBet('150-90', 140, 100);
    console.log(`Result: ${test2.isWon ? 'WON' : 'LOST'} - ${test2.reason}\n`);
    
    // Test 3: Combined bet with score (all correct)
    console.log('Test 3: Combined bet with score (all correct)');
    const test3 = evaluateCombinedBetWithScore([
      { type: 'winner', value: 'home' },
      { type: 'score', value: '150-90' },
      { type: 'time', value: '30-60' }
    ], {
      homeScore: 150,
      awayScore: 90,
      duration: 45,
      snitchCaught: true,
      snitchCaughtBy: 'home'
    });
    console.log(`Result: ${test3.allWon ? 'WON' : 'LOST'}`);
    console.log(`Details: ${test3.results.map(r => `${r.type}(${r.isWon ? '✅' : '❌'})`).join(', ')}\n`);
    
    // Test 4: Combined bet with score (score wrong)
    console.log('Test 4: Combined bet with score (score wrong)');
    const test4 = evaluateCombinedBetWithScore([
      { type: 'winner', value: 'home' },
      { type: 'score', value: '150-90' },
      { type: 'time', value: '30-60' }
    ], {
      homeScore: 150,
      awayScore: 100, // Different score
      duration: 45,
      snitchCaught: true,
      snitchCaughtBy: 'home'
    });
    console.log(`Result: ${test4.allWon ? 'WON' : 'LOST'}`);
    console.log(`Details: ${test4.results.map(r => `${r.type}(${r.isWon ? '✅' : '❌'})`).join(', ')}\n`);
    
    console.log('✅ Score resolution tests completed!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    db.close();
  }
}

testScoreResolution();
