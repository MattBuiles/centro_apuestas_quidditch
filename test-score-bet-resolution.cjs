const { BetResolutionService } = require('./backend/src/services/BetResolutionService');
const { Database } = require('./backend/src/database/Database');

async function testScoreBetResolution() {
  console.log('🧪 Testing score bet resolution...');
  
  try {
    const db = Database.getInstance();
    const betResolutionService = BetResolutionService.getInstance();
    
    // Primero, veamos las apuestas de score existentes
    console.log('\n📋 Apuestas de score existentes:');
    const scoreBets = await db.all(`
      SELECT b.id, b.type, b.prediction, b.status, b.match_id, 
             m.status as match_status, m.home_score, m.away_score
      FROM bets b 
      JOIN matches m ON b.match_id = m.id 
      WHERE b.type = 'score' 
      LIMIT 5
    `);
    
    scoreBets.forEach(bet => {
      console.log(`  - Bet ${bet.id}: ${bet.prediction} (${bet.status})`);
      console.log(`    Match: ${bet.match_status}, Score: ${bet.home_score}-${bet.away_score}`);
    });
    
    // Ahora veamos las apuestas combinadas con score
    console.log('\n📋 Apuestas combinadas con score:');
    const combinedBets = await db.all(`
      SELECT b.id, b.type, b.prediction, b.status, b.match_id, 
             m.status as match_status, m.home_score, m.away_score
      FROM bets b 
      JOIN matches m ON b.match_id = m.id 
      WHERE b.type = 'combined' AND b.prediction LIKE '%score%'
      LIMIT 5
    `);
    
    combinedBets.forEach(bet => {
      console.log(`  - Bet ${bet.id}: ${bet.prediction} (${bet.status})`);
      console.log(`    Match: ${bet.match_status}, Score: ${bet.home_score}-${bet.away_score}`);
    });
    
    // Probar resolución manual de una apuesta
    console.log('\n🧪 Probando resolución manual con datos de prueba:');
    
    // Crear datos de prueba
    const mockMatchResult = {
      homeScore: 190,
      awayScore: 50,
      duration: 45,
      snitchCaught: true,
      snitchCaughtBy: 'home-team-id'
    };
    
    const mockMatch = {
      home_team_id: 'home-team-id',
      away_team_id: 'away-team-id',
      homeTeamName: 'Home Team',
      awayTeamName: 'Away Team'
    };
    
    // Probar diferentes casos
    const testCases = [
      { prediction: '190-50', expected: 'won' },
      { prediction: '150-90', expected: 'lost' },
      { prediction: 'exact', expected: 'lost' },
      { prediction: 'invalid', expected: 'lost' }
    ];
    
    testCases.forEach(testCase => {
      console.log(`\\n  Testing prediction: ${testCase.prediction}`);
      
      const result = betResolutionService.evaluateScoreBet(
        { prediction: testCase.prediction }, 
        mockMatchResult, 
        mockMatch, 
        testCase.prediction
      );
      
      console.log(`    Result: ${result.isWon ? 'WON' : 'LOST'}`);
      console.log(`    Reason: ${result.reason}`);
      console.log(`    Expected: ${testCase.expected.toUpperCase()}`);
      console.log(`    ✅ ${result.isWon === (testCase.expected === 'won') ? 'CORRECT' : 'FAILED'}`);
    });
    
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testScoreBetResolution();
