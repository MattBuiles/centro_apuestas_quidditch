const Database = require('./backend/src/database/Database.js').Database;
const BetResolutionService = require('./backend/src/services/BetResolutionService.js').BetResolutionService;

/**
 * Script completo para probar el sistema de resolución de apuestas y actualización de balance
 */
async function testCompleteSystemBetResolution() {
  console.log('🎯 Testing Complete Bet Resolution System...\n');
  
  try {
    const db = Database.getInstance();
    const betResolutionService = new BetResolutionService();
    
    // 1. Crear un usuario de prueba
    console.log('👤 Creating test user...');
    const userId = 'test_user_' + Date.now();
    await db.run(
      'INSERT INTO users (id, username, email, password, balance) VALUES (?, ?, ?, ?, ?)',
      [userId, 'testuser', 'test@example.com', 'hashed_password', 500]
    );
    
    // 2. Crear un partido de prueba
    console.log('⚽ Creating test match...');
    const matchId = 'test_match_' + Date.now();
    await db.run(
      `INSERT INTO matches (id, home_team_id, away_team_id, date, time, status, 
       season_id, week_id, home_score, away_score) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [matchId, 'team1', 'team2', '2025-01-15', '15:00', 'scheduled', 'season1', 'week1', 0, 0]
    );
    
    // 3. Crear apuesta ganadora (home team)
    console.log('💰 Creating winning bet (home)...');
    const winningBetId = 'bet_winning_' + Date.now();
    await db.run(
      `INSERT INTO bets (id, user_id, match_id, type, prediction, odds, amount, potential_win, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [winningBetId, userId, matchId, 'winner', 'home', 2.0, 100, 200, 'pending']
    );
    
    // 4. Crear apuesta perdedora (away team)
    console.log('💸 Creating losing bet (away)...');
    const losingBetId = 'bet_losing_' + Date.now();
    await db.run(
      `INSERT INTO bets (id, user_id, match_id, type, prediction, odds, amount, potential_win, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [losingBetId, userId, matchId, 'winner', 'away', 1.8, 50, 90, 'pending']
    );
    
    // 5. Verificar balance inicial
    const userBefore = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    console.log(`\n📊 User balance before resolution: ${userBefore.balance}G`);
    
    const betsBefore = await db.all('SELECT * FROM bets WHERE user_id = ?', [userId]);
    console.log(`📋 Bets before resolution:`);
    betsBefore.forEach(bet => {
      console.log(`   - Bet ${bet.id}: ${bet.prediction} (${bet.amount}G → ${bet.potential_win}G) - ${bet.status}`);
    });
    
    // 6. Finalizar el partido con victoria del equipo home
    console.log('\n🏆 Finishing match with home team victory...');
    await db.run(
      `UPDATE matches SET status = ?, home_score = ?, away_score = ?, duration = ? WHERE id = ?`,
      ['finished', 150, 120, 90, matchId]
    );
    
    // 7. Resolver apuestas usando el servicio
    console.log('🔄 Resolving bets...');
    const resolutionResult = await betResolutionService.resolveMatchBets(matchId);
    console.log(`✅ Resolution result: ${resolutionResult.resolved} bets resolved, ${resolutionResult.errors.length} errors`);
    
    if (resolutionResult.errors.length > 0) {
      console.log('❌ Errors:', resolutionResult.errors);
    }
    
    // 8. Verificar balance después de la resolución
    const userAfter = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    console.log(`\n📊 User balance after resolution: ${userAfter.balance}G`);
    console.log(`💰 Balance change: ${userAfter.balance - userBefore.balance}G`);
    
    const betsAfter = await db.all('SELECT * FROM bets WHERE user_id = ?', [userId]);
    console.log(`📋 Bets after resolution:`);
    betsAfter.forEach(bet => {
      console.log(`   - Bet ${bet.id}: ${bet.prediction} (${bet.amount}G → ${bet.potential_win}G) - ${bet.status}`);
    });
    
    // 9. Verificar transacciones
    const transactions = await db.all('SELECT * FROM transactions WHERE userId = ?', [userId]);
    console.log(`\n💳 Transactions created: ${transactions.length}`);
    transactions.forEach(tx => {
      console.log(`   - ${tx.type}: ${tx.amount}G (${tx.description})`);
    });
    
    // 10. Verificación de resultados
    console.log('\n🧪 Test Results Verification:');
    
    const expectedBalance = userBefore.balance + 200; // Ganancia de la apuesta ganadora
    const actualBalance = userAfter.balance;
    
    if (actualBalance === expectedBalance) {
      console.log('✅ Balance updated correctly!');
    } else {
      console.log(`❌ Balance mismatch! Expected: ${expectedBalance}G, Got: ${actualBalance}G`);
    }
    
    const winningBet = betsAfter.find(bet => bet.id === winningBetId);
    const losingBet = betsAfter.find(bet => bet.id === losingBetId);
    
    if (winningBet?.status === 'won' && losingBet?.status === 'lost') {
      console.log('✅ Bet statuses updated correctly!');
    } else {
      console.log(`❌ Bet status error! Winning bet: ${winningBet?.status}, Losing bet: ${losingBet?.status}`);
    }
    
    if (transactions.length > 0) {
      console.log('✅ Transactions created correctly!');
    } else {
      console.log('❌ No transactions were created!');
    }
    
    console.log('\n🎉 Test completed! The system should now update user balance automatically when bets are resolved.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // No cleanup - leaving test data for debugging
    console.log('\n📝 Test data preserved for debugging purposes.');
  }
}

// Ejecutar la prueba
testCompleteSystemBetResolution().catch(console.error);
