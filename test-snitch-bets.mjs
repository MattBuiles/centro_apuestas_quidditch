import { BetResolutionService } from './backend/src/services/BetResolutionService.js';
import { Database } from './backend/src/database/Database.js';

async function testSnitchBets() {
  console.log('🧪 Testing snitch bet resolution...');
  
  try {
    const db = Database.getInstance();
    const betResolutionService = BetResolutionService.getInstance();
    
    // Get pending snitch bets
    const pendingBets = await db.all('SELECT * FROM bets WHERE status = "pending" AND type = "snitch" LIMIT 5');
    console.log(`📋 Found ${pendingBets.length} pending snitch bets`);
    
    for (const bet of pendingBets) {
      console.log(`\n🎯 Testing bet ${bet.id}:`);
      console.log(`   Type: ${bet.type}`);
      console.log(`   Prediction: ${bet.prediction}`);
      console.log(`   Match: ${bet.match_id}`);
      
      // Get match details
      const match = await db.get('SELECT * FROM matches WHERE id = ?', [bet.match_id]);
      if (match && match.status === 'finished') {
        console.log(`   Match: ${match.home_team_id} vs ${match.away_team_id}`);
        console.log(`   Snitch caught: ${match.snitch_caught} by ${match.snitch_caught_by}`);
        
        // Try to resolve this bet
        const result = await betResolutionService.resolveBetsForMatch(bet.match_id);
        console.log(`   Resolution result: ${result.resolved} resolved, ${result.errors.length} errors`);
        
        if (result.errors.length > 0) {
          console.log(`   Errors: ${result.errors.join(', ')}`);
        }
      }
    }
    
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testSnitchBets();
