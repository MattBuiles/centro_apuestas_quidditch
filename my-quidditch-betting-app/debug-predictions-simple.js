// Simple debug script to test prediction logic
// This simulates the exact conditions that might be causing the issue

console.log('🔍 Testing Prediction Logic...');

// Mock data to simulate a real scenario
const mockMatch = {
  id: 'test-match-1',
  localId: 'slytherin',
  visitanteId: 'gryffindor',
  homeScore: 150,  // Slytherin wins
  awayScore: 130   // Gryffindor loses
};

// Mock prediction where user predicted Slytherin (home team)
const mockPrediction = {
  id: 'pred_test',
  matchId: 'test-match-1',
  userId: 'test_user',
  predictedWinner: 'home', // User predicted home team (Slytherin)
  confidence: 4,
  timestamp: new Date(),
  isCorrect: undefined
};

console.log('🎯 Testing scenario:');
console.log('Match data:', mockMatch);
console.log('User prediction:', mockPrediction);

// Simulate the logic from virtualTimeManager.ts
function calculateActualResult(homeScore, awayScore) {
  if (homeScore > awayScore) return 'home';
  if (awayScore > homeScore) return 'away';
  return 'draw';
}

// Test the calculation
const actualResult = calculateActualResult(mockMatch.homeScore, mockMatch.awayScore);
console.log('🏆 Calculated result:', actualResult);

// Test the prediction evaluation
const isCorrect = mockPrediction.predictedWinner === actualResult;
console.log('✅ Prediction evaluation:');
console.log(`   - User predicted: ${mockPrediction.predictedWinner}`);
console.log(`   - Actual result: ${actualResult}`);
console.log(`   - Should be correct: ${isCorrect}`);

// Test with the names mapping
console.log('\n🔍 Testing name mapping:');
console.log('In UI:');
console.log(`   - homeTeam name: "Slytherin" (corresponds to localId: "${mockMatch.localId}")`);
console.log(`   - awayTeam name: "Gryffindor" (corresponds to visitanteId: "${mockMatch.visitanteId}")`);
console.log('In backend:');
console.log(`   - homeScore: ${mockMatch.homeScore} (goals by localId team)`);
console.log(`   - awayScore: ${mockMatch.awayScore} (goals by visitanteId team)`);

// Test all possible scenarios
console.log('\n🧪 Testing all scenarios:');
const scenarios = [
  { homeScore: 150, awayScore: 130, userPred: 'home', expected: true },
  { homeScore: 150, awayScore: 130, userPred: 'away', expected: false },
  { homeScore: 150, awayScore: 130, userPred: 'draw', expected: false },
  { homeScore: 130, awayScore: 150, userPred: 'home', expected: false },
  { homeScore: 130, awayScore: 150, userPred: 'away', expected: true },
  { homeScore: 150, awayScore: 150, userPred: 'draw', expected: true },
];

scenarios.forEach((scenario, index) => {
  const result = calculateActualResult(scenario.homeScore, scenario.awayScore);
  const correct = scenario.userPred === result;
  const status = correct === scenario.expected ? '✅' : '❌';
  
  console.log(`${status} Scenario ${index + 1}: ${scenario.homeScore}-${scenario.awayScore}, predicted ${scenario.userPred}, result ${result}, correct: ${correct}`);
});

console.log('\n🎯 If all scenarios show ✅, the logic is correct.');
console.log('If you see ❌, there might be a mapping issue between UI and backend.');
