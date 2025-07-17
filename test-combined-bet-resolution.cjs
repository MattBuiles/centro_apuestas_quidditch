const { Database } = require('./backend/src/database/Database');
const { BetResolutionService } = require('./backend/src/services/BetResolutionService');
const { v4: uuidv4 } = require('uuid');

/**
 * Test combined bet resolution functionality
 */
async function testCombinedBetResolution() {
  console.log('🎯 Testing Combined Bet Resolution System');
  console.log('==========================================\n');

  const db = new Database();
  await db.initialize();
  
  const betResolutionService = BetResolutionService.getInstance();

  try {
    // 1. Find existing matches or create test matches
    console.log('1️⃣ Finding existing matches...');
    const matches = await db.all('SELECT * FROM matches WHERE status = "scheduled" ORDER BY date ASC LIMIT 3');
    
    if (matches.length < 2) {
      console.log('❌ Not enough scheduled matches found. Need at least 2 matches for combined bet testing.');
      return;
    }

    const match1 = matches[0];
    const match2 = matches[1];
    
    console.log(`   Match 1: ${match1.id} (${match1.homeTeamName || 'Home'} vs ${match1.awayTeamName || 'Away'})`);
    console.log(`   Match 2: ${match2.id} (${match2.homeTeamName || 'Home'} vs ${match2.awayTeamName || 'Away'})\n`);

    // 2. Create a test user
    console.log('2️⃣ Creating test user...');
    const testUserId = 'test_combined_user_' + Date.now();
    await db.run(
      `INSERT OR REPLACE INTO users (id, username, email, password_hash, balance, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [testUserId, 'TestCombinedUser', 'test.combined@example.com', 'hashedpass', 1000, 'user']
    );
    console.log(`   User created: ${testUserId} with 1000G balance\n`);

    // 3. Create single-match combined bet (multiple predictions on one match)
    console.log('3️⃣ Creating single-match combined bet...');
    const singleMatchCombinedBetId = 'combined_bet_single_' + Date.now();
    const singleMatchPrediction = JSON.stringify([
      { type: 'winner', value: 'home' },
      { type: 'snitch_catcher', value: match1.homeTeamName || 'home' }
    ]);
    
    await db.run(
      `INSERT INTO bets (id, user_id, match_id, type, prediction, odds, amount, potential_win, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [singleMatchCombinedBetId, testUserId, match1.id, 'combined', singleMatchPrediction, 3.5, 100, 350, 'pending']
    );
    console.log(`   Single-match combined bet created: ${singleMatchCombinedBetId}\n`);

    // 4. Create multi-match combined bet (if we had the format for it)
    // For now, we'll simulate this by creating separate bets that would be combined
    console.log('4️⃣ Creating separate bets that simulate multi-match combined bet...');
    const bet1Id = 'bet1_' + Date.now();
    const bet2Id = 'bet2_' + Date.now();
    
    await db.run(
      `INSERT INTO bets (id, user_id, match_id, type, prediction, odds, amount, potential_win, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bet1Id, testUserId, match1.id, 'winner', 'home', 2.0, 50, 100, 'pending']
    );
    
    await db.run(
      `INSERT INTO bets (id, user_id, match_id, type, prediction, odds, amount, potential_win, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bet2Id, testUserId, match2.id, 'winner', 'home', 1.8, 50, 90, 'pending']
    );
    console.log(`   Individual bets created: ${bet1Id}, ${bet2Id}\n`);

    // 5. Check initial bet status
    console.log('5️⃣ Checking initial bet status...');
    const initialBets = await db.all('SELECT * FROM bets WHERE user_id = ?', [testUserId]);
    console.log(`   Total bets created: ${initialBets.length}`);
    initialBets.forEach(bet => {
      console.log(`     - ${bet.id}: ${bet.type} (${bet.prediction}) - ${bet.status} - ${bet.amount}G`);
    });
    console.log();

    // 6. Finish first match with home team winning
    console.log('6️⃣ Finishing first match with home team victory...');
    await db.run(
      `UPDATE matches SET 
       status = ?, 
       home_score = ?, 
       away_score = ?, 
       duration = ?,
       snitch_caught = ?,
       snitch_caught_by = ?
       WHERE id = ?`,
      ['finished', 170, 120, 95, true, match1.homeTeamName || 'home', match1.id]
    );

    // 7. Resolve bets for first match
    console.log('7️⃣ Resolving bets for first match...');
    const resolution1 = await betResolutionService.resolveBetsForMatch(match1.id);
    console.log(`   Resolution result: ${resolution1.resolved} bets resolved, ${resolution1.errors.length} errors`);
    if (resolution1.errors.length > 0) {
      console.log('   Errors:', resolution1.errors);
    }

    // 8. Check bet status after first match
    console.log('\n8️⃣ Checking bet status after first match...');
    const afterMatch1Bets = await db.all('SELECT * FROM bets WHERE user_id = ?', [testUserId]);
    afterMatch1Bets.forEach(bet => {
      console.log(`     - ${bet.id}: ${bet.type} (${bet.prediction}) - ${bet.status} - ${bet.amount}G → ${bet.potential_win}G`);
    });

    // 9. Check if single-match combined bet is resolved
    const singleMatchBet = afterMatch1Bets.find(bet => bet.id === singleMatchCombinedBetId);
    if (singleMatchBet) {
      console.log(`\n   Single-match combined bet status: ${singleMatchBet.status}`);
      if (singleMatchBet.status !== 'pending') {
        console.log('   ✅ Single-match combined bet was resolved!');
      } else {
        console.log('   ❌ Single-match combined bet was NOT resolved');
      }
    }

    // 10. Finish second match with home team winning
    console.log('\n🔟 Finishing second match with home team victory...');
    await db.run(
      `UPDATE matches SET 
       status = ?, 
       home_score = ?, 
       away_score = ?, 
       duration = ?,
       snitch_caught = ?,
       snitch_caught_by = ?
       WHERE id = ?`,
      ['finished', 190, 140, 105, true, match2.homeTeamName || 'home', match2.id]
    );

    // 11. Resolve bets for second match
    console.log('1️⃣1️⃣ Resolving bets for second match...');
    const resolution2 = await betResolutionService.resolveBetsForMatch(match2.id);
    console.log(`   Resolution result: ${resolution2.resolved} bets resolved, ${resolution2.errors.length} errors`);
    if (resolution2.errors.length > 0) {
      console.log('   Errors:', resolution2.errors);
    }

    // 12. Check final bet status
    console.log('\n1️⃣2️⃣ Checking final bet status...');
    const finalBets = await db.all('SELECT * FROM bets WHERE user_id = ?', [testUserId]);
    finalBets.forEach(bet => {
      console.log(`     - ${bet.id}: ${bet.type} (${bet.prediction}) - ${bet.status} - ${bet.amount}G → ${bet.potential_win}G`);
    });

    // 13. Check user balance
    console.log('\n1️⃣3️⃣ Checking final user balance...');
    const finalUser = await db.get('SELECT * FROM users WHERE id = ?', [testUserId]);
    console.log(`   Final balance: ${finalUser.balance}G (started with 1000G)`);
    console.log(`   Balance change: ${finalUser.balance - 1000}G`);

    // 14. Test the resolveAllPendingCombinedBets method explicitly
    console.log('\n1️⃣4️⃣ Testing explicit combined bet resolution...');
    const combinedResult = await betResolutionService.resolveAllPendingCombinedBets();
    console.log(`   Combined bet resolution: ${combinedResult.resolved} resolved, ${combinedResult.errors.length} errors`);

    // 15. Summary
    console.log('\n📊 SUMMARY:');
    const resolvedBets = finalBets.filter(bet => bet.status !== 'pending');
    const wonBets = finalBets.filter(bet => bet.status === 'won');
    const lostBets = finalBets.filter(bet => bet.status === 'lost');
    
    console.log(`   Total bets: ${finalBets.length}`);
    console.log(`   Resolved: ${resolvedBets.length}`);
    console.log(`   Won: ${wonBets.length}`);
    console.log(`   Lost: ${lostBets.length}`);
    console.log(`   Still pending: ${finalBets.length - resolvedBets.length}`);
    
    if (resolvedBets.length === finalBets.length) {
      console.log('   ✅ All bets were resolved successfully!');
    } else {
      console.log('   ⚠️ Some bets are still pending');
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await db.run('DELETE FROM bets WHERE user_id = ?', [testUserId]);
    await db.run('DELETE FROM users WHERE id = ?', [testUserId]);
    console.log('   Test data cleaned up');

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await db.close();
  }
}

// Run the test
if (require.main === module) {
  testCombinedBetResolution()
    .then(() => {
      console.log('\n✅ Combined bet resolution test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testCombinedBetResolution };
