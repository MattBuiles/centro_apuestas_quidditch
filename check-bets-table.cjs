/**
 * Script para verificar la estructura específica de la tabla bets
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkBetsTable() {
  console.log('🔍 Verificando estructura de la tabla bets...\n');

  const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');
  const db = new sqlite3.Database(dbPath);

  try {
    // 1. Verificar estructura de tabla bets
    console.log('📋 Estructura de la tabla bets:');
    const columns = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(bets)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    columns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type}`);
    });

    // 2. Ver apuestas recientes
    console.log('\n🎲 Apuestas recientes:');
    const recentBets = await new Promise((resolve, reject) => {
      db.all(
        `SELECT b.*, u.username 
         FROM bets b 
         JOIN users u ON b.user_id = u.id 
         ORDER BY b.id DESC LIMIT 10`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    recentBets.forEach(bet => {
      console.log(`  - ${bet.username}: ${bet.status} | ${bet.amount}G → ${bet.potential_win}G | ${bet.prediction} | ${bet.id}`);
    });

    // 3. Verificar transacciones de apuestas específicas
    console.log('\n💰 Verificando relación entre apuestas y transacciones:');
    
    const wonBets = recentBets.filter(bet => bet.status === 'won');
    
    for (const bet of wonBets) {
      console.log(`\n📊 Analizando apuesta ganadora: ${bet.id}`);
      console.log(`   Usuario: ${bet.username}`);
      console.log(`   Apuesta: ${bet.amount}G → ${bet.potential_win}G`);
      
      // Buscar transacciones relacionadas
      const relatedTransactions = await new Promise((resolve, reject) => {
        db.all(
          `SELECT * FROM user_transactions 
           WHERE reference_id = ? 
           ORDER BY created_at ASC`,
          [bet.id],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
      
      console.log(`   Transacciones encontradas: ${relatedTransactions.length}`);
      relatedTransactions.forEach(tx => {
        console.log(`     - ${tx.type}: ${tx.amount}G (${tx.description})`);
      });
      
      // Verificar si hay problema
      const winTransactions = relatedTransactions.filter(tx => tx.type === 'bet_won');
      if (winTransactions.length > 1) {
        console.log(`   ❌ PROBLEMA: ${winTransactions.length} transacciones de ganancia para una sola apuesta!`);
      } else if (winTransactions.length === 1 && winTransactions[0].amount !== bet.potential_win) {
        console.log(`   ❌ PROBLEMA: Monto incorrecto en transacción (${winTransactions[0].amount}G vs ${bet.potential_win}G esperado)!`);
      } else {
        console.log(`   ✅ Transacciones correctas`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.close();
  }
}

checkBetsTable();
