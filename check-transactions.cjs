const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath);

console.log('=== USER_TRANSACTIONS TABLE STRUCTURE ===');
db.all('PRAGMA table_info(user_transactions)', (err, columns) => {
  if (err) {
    console.error('Error getting table info:', err);
  } else {
    console.log('Columns:');
    columns.forEach(col => {
      console.log(`- ${col.name} (${col.type})`);
    });
  }
  
  console.log('\n=== EXISTING TRANSACTIONS ===');
  db.all('SELECT * FROM user_transactions ORDER BY created_at DESC LIMIT 5', (err, rows) => {
    if (err) {
      console.error('Error querying transactions:', err);
    } else {
      console.log('Transactions found:', rows.length);
      rows.forEach(trans => {
        console.log(`- ID: ${trans.id}, User: ${trans.user_id}, Type: ${trans.type}, Amount: ${trans.amount}`);
      });
    }
    db.close();
  });
});
