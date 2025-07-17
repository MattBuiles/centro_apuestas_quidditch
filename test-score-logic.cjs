console.log('🧪 Testing score bet resolution logic...');

// Simular la función de evaluación de marcador
function evaluateScoreBet(prediction, matchResult) {
  if (prediction === 'exact') {
    return {
      isWon: false,
      reason: `Apuesta de marcador con predicción 'exact' no soportada - necesita marcador específico (ej: '150-90')`
    };
  }

  // Format: "150-90" (home_score-away_score)
  const scoreMatch = prediction.match(/^(\d+)-(\d+)$/);
  if (!scoreMatch) {
    return {
      isWon: false,
      reason: `Formato de marcador inválido: ${prediction}. Use formato como '150-90'`
    };
  }

  const predictedHomeScore = parseInt(scoreMatch[1]);
  const predictedAwayScore = parseInt(scoreMatch[2]);

  if (matchResult.homeScore === predictedHomeScore && matchResult.awayScore === predictedAwayScore) {
    return {
      isWon: true,
      reason: `Marcador exacto acertado: ${predictedHomeScore}-${predictedAwayScore}`
    };
  } else {
    return {
      isWon: false,
      reason: `Marcador predicho ${predictedHomeScore}-${predictedAwayScore}, marcador real ${matchResult.homeScore}-${matchResult.awayScore}`
    };
  }
}

// Datos de prueba
const mockMatchResult = {
  homeScore: 190,
  awayScore: 50,
  duration: 45,
  snitchCaught: true,
  snitchCaughtBy: 'home-team-id'
};

// Probar diferentes casos
const testCases = [
  { prediction: '190-50', expected: 'won' },
  { prediction: '150-90', expected: 'lost' },
  { prediction: 'exact', expected: 'lost' },
  { prediction: 'invalid', expected: 'lost' },
  { prediction: '190-51', expected: 'lost' },
  { prediction: '189-50', expected: 'lost' }
];

console.log(`\\n🎯 Resultado real del partido: ${mockMatchResult.homeScore}-${mockMatchResult.awayScore}`);

testCases.forEach((testCase, index) => {
  console.log(`\\n📊 Test ${index + 1}: Predicción "${testCase.prediction}"`);
  
  const result = evaluateScoreBet(testCase.prediction, mockMatchResult);
  
  console.log(`   Resultado: ${result.isWon ? 'GANADA' : 'PERDIDA'}`);
  console.log(`   Razón: ${result.reason}`);
  console.log(`   Esperado: ${testCase.expected.toUpperCase()}`);
  
  const isCorrect = result.isWon === (testCase.expected === 'won');
  console.log(`   ✅ ${isCorrect ? 'CORRECTO' : '❌ FALLIDO'}`);
});

console.log('\\n🔄 Probando apuestas combinadas...');

// Simular evaluación combinada
function evaluateCombinedBet(predictions, matchResult) {
  const results = [];
  
  for (const pred of predictions) {
    let predResult;
    
    switch (pred.type) {
      case 'winner':
        // Simular evaluación de ganador
        const actualWinner = matchResult.homeScore > matchResult.awayScore ? 'home' : 'away';
        predResult = {
          isWon: pred.value === actualWinner,
          reason: `Winner: predicted ${pred.value}, actual ${actualWinner}`
        };
        break;
        
      case 'score':
        predResult = evaluateScoreBet(pred.value, matchResult);
        break;
        
      case 'snitch':
        predResult = {
          isWon: pred.value === 'home', // Simular que home capturó la snitch
          reason: `Snitch: predicted ${pred.value}, actual home`
        };
        break;
        
      case 'time':
        const timeMatch = pred.value.match(/^(\d+)-(\d+)$/);
        if (timeMatch) {
          const minTime = parseInt(timeMatch[1]);
          const maxTime = parseInt(timeMatch[2]);
          const inRange = matchResult.duration >= minTime && matchResult.duration <= maxTime;
          predResult = {
            isWon: inRange,
            reason: `Time: duration ${matchResult.duration} ${inRange ? 'within' : 'outside'} range ${pred.value}`
          };
        }
        break;
    }
    
    results.push({
      type: pred.type,
      value: pred.value,
      ...predResult
    });
  }
  
  const allWon = results.every(r => r.isWon);
  
  return {
    isWon: allWon,
    results,
    reason: allWon ? 'All predictions correct' : 'Some predictions failed'
  };
}

// Probar apuestas combinadas
const combinedTests = [
  {
    name: 'Winner + Score (ambos correctos)',
    predictions: [
      { type: 'winner', value: 'home' },
      { type: 'score', value: '190-50' }
    ],
    expected: 'won'
  },
  {
    name: 'Winner + Score (score incorrecto)',
    predictions: [
      { type: 'winner', value: 'home' },
      { type: 'score', value: '150-90' }
    ],
    expected: 'lost'
  },
  {
    name: 'Winner + Score + Snitch + Time (todos correctos)',
    predictions: [
      { type: 'winner', value: 'home' },
      { type: 'score', value: '190-50' },
      { type: 'snitch', value: 'home' },
      { type: 'time', value: '30-60' }
    ],
    expected: 'won'
  }
];

combinedTests.forEach((test, index) => {
  console.log(`\\n🎯 Test combinado ${index + 1}: ${test.name}`);
  
  const result = evaluateCombinedBet(test.predictions, mockMatchResult);
  
  console.log(`   Resultado: ${result.isWon ? 'GANADA' : 'PERDIDA'}`);
  console.log(`   Detalles:`);
  
  result.results.forEach(r => {
    console.log(`     ${r.type}:${r.value} -> ${r.isWon ? '✅' : '❌'} (${r.reason})`);
  });
  
  const isCorrect = result.isWon === (test.expected === 'won');
  console.log(`   Esperado: ${test.expected.toUpperCase()}`);
  console.log(`   ✅ ${isCorrect ? 'CORRECTO' : '❌ FALLIDO'}`);
});

console.log('\\n✅ Pruebas completadas');
