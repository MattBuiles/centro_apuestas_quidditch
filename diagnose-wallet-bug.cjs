/**
 * Script para diagnosticar el problema del saldo del monedero
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function diagnoseProblem() {
  console.log('🔍 Diagnóstico del problema del saldo del monedero...\n');

  // Conectar a la base de datos
  const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');
  const db = new sqlite3.Database(dbPath);

  try {
    // 1. Verificar estructura de transacciones
    console.log('📊 1. Analizando transacciones recientes...');
    const transactions = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM transactions 
         WHERE type IN ('bet_placed', 'bet_won', 'bet_lost') 
         ORDER BY timestamp DESC LIMIT 20`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    console.log(`Encontradas ${transactions.length} transacciones de apuestas:`);
    transactions.forEach(tx => {
      console.log(`  - ${tx.type}: ${tx.amount}G (${tx.description}) - ${tx.timestamp}`);
    });

    // 2. Verificar apuestas resueltas
    console.log('\n🎲 2. Verificando apuestas resueltas...');
    const bets = await new Promise((resolve, reject) => {
      db.all(
        `SELECT b.*, u.username 
         FROM bets b 
         JOIN users u ON b.user_id = u.id 
         WHERE b.status IN ('won', 'lost') 
         ORDER BY b.resolved_at DESC LIMIT 10`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    console.log(`Encontradas ${bets.length} apuestas resueltas:`);
    bets.forEach(bet => {
      console.log(`  - ${bet.username}: ${bet.status} | ${bet.amount}G → ${bet.potential_win}G | ${bet.resolved_at}`);
    });

    // 3. Buscar transacciones duplicadas o incorrectas
    console.log('\n⚠️  3. Buscando posibles duplicaciones...');
    const duplicateCheck = await new Promise((resolve, reject) => {
      db.all(
        `SELECT reference_id, type, COUNT(*) as count, SUM(amount) as total_amount
         FROM transactions 
         WHERE reference_id IS NOT NULL 
         GROUP BY reference_id, type 
         HAVING COUNT(*) > 1`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    if (duplicateCheck.length > 0) {
      console.log('❌ ¡PROBLEMA ENCONTRADO! Transacciones duplicadas:');
      duplicateCheck.forEach(dup => {
        console.log(`  - Ref: ${dup.reference_id}, Tipo: ${dup.type}, Count: ${dup.count}, Total: ${dup.total_amount}G`);
      });
    } else {
      console.log('✅ No se encontraron transacciones duplicadas');
    }

    // 4. Verificar balances inconsistentes
    console.log('\n💰 4. Verificando consistencia de balances...');
    const userBalances = await new Promise((resolve, reject) => {
      db.all(
        `SELECT u.id, u.username, u.balance,
                SUM(CASE WHEN t.type = 'deposit' THEN t.amount ELSE 0 END) as deposits,
                SUM(CASE WHEN t.type = 'bet_placed' THEN t.amount ELSE 0 END) as bet_costs,
                SUM(CASE WHEN t.type = 'bet_won' THEN t.amount ELSE 0 END) as winnings
         FROM users u
         LEFT JOIN transactions t ON u.id = t.userId
         GROUP BY u.id, u.username, u.balance`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    console.log('Balances de usuarios:');
    userBalances.forEach(user => {
      const expectedBalance = (user.deposits || 0) + (user.bet_costs || 0) + (user.winnings || 0);
      const isConsistent = Math.abs(user.balance - expectedBalance) < 0.01;
      console.log(`  - ${user.username}: ${user.balance}G (esperado: ${expectedBalance}G) ${isConsistent ? '✅' : '❌'}`);
    });

    // 5. Buscar apuestas ganadoras con transacciones múltiples
    console.log('\n🔍 5. Buscando apuestas ganadoras con múltiples transacciones...');
    const multipleWinnings = await new Promise((resolve, reject) => {
      db.all(
        `SELECT b.id as bet_id, b.status, b.potential_win, 
                COUNT(t.id) as transaction_count, 
                SUM(t.amount) as total_winnings
         FROM bets b
         LEFT JOIN transactions t ON b.id = t.reference_id AND t.type = 'bet_won'
         WHERE b.status = 'won'
         GROUP BY b.id
         HAVING COUNT(t.id) > 1 OR SUM(t.amount) != b.potential_win`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    if (multipleWinnings.length > 0) {
      console.log('❌ ¡PROBLEMA ENCONTRADO! Apuestas con transacciones incorrectas:');
      multipleWinnings.forEach(bet => {
        console.log(`  - Bet ${bet.bet_id}: ${bet.transaction_count} transacciones, Total: ${bet.total_winnings}G (esperado: ${bet.potential_win}G)`);
      });
    } else {
      console.log('✅ Todas las apuestas ganadoras tienen transacciones correctas');
    }

    console.log('\n📝 Diagnóstico completado.');

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  } finally {
    db.close();
  }
}

diagnoseProblem();
