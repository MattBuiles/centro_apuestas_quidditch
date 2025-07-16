/**
 * Script para verificar la estructura de la base de datos y diagnosticar problemas
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkDatabase() {
  console.log('🔍 Verificando estructura de la base de datos...\n');

  const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');
  const db = new sqlite3.Database(dbPath);

  try {
    // 1. Listar todas las tablas
    console.log('📊 1. Tablas disponibles:');
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });

    // 2. Verificar estructura de tabla user_transactions
    if (tables.some(t => t.name === 'user_transactions')) {
      console.log('\n📋 2. Estructura de user_transactions:');
      const columns = await new Promise((resolve, reject) => {
        db.all("PRAGMA table_info(user_transactions)", (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      columns.forEach(col => {
        console.log(`  - ${col.name}: ${col.type}`);
      });

      // Ver transacciones recientes
      console.log('\n💰 Transacciones recientes en user_transactions:');
      const recentTransactions = await new Promise((resolve, reject) => {
        db.all(
          "SELECT * FROM user_transactions ORDER BY created_at DESC LIMIT 10",
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      recentTransactions.forEach(tx => {
        console.log(`  - ${tx.type}: ${tx.amount}G (${tx.description || 'Sin descripción'}) - User: ${tx.user_id}`);
      });
    }

    // 3. Verificar apuestas recientes
    if (tables.some(t => t.name === 'bets')) {
      console.log('\n🎲 3. Apuestas recientes:');
      const recentBets = await new Promise((resolve, reject) => {
        db.all(
          `SELECT b.*, u.username 
           FROM bets b 
           JOIN users u ON b.user_id = u.id 
           ORDER BY b.created_at DESC LIMIT 10`,
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      recentBets.forEach(bet => {
        console.log(`  - ${bet.username}: ${bet.status} | ${bet.amount}G → ${bet.potential_win}G | ${bet.prediction}`);
      });
    }

    // 4. Verificar balances de usuarios
    if (tables.some(t => t.name === 'users')) {
      console.log('\n👥 4. Balances de usuarios:');
      const users = await new Promise((resolve, reject) => {
        db.all("SELECT id, username, balance FROM users", (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      users.forEach(user => {
        console.log(`  - ${user.username}: ${user.balance}G`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.close();
  }
}

checkDatabase();
