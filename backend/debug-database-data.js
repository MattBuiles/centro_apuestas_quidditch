const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'quidditch.db');
console.log('📦 Connecting to database:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    return;
  }
  console.log('✅ Connected to SQLite database');
});

// Check users
db.get("SELECT COUNT(*) as count FROM users WHERE role = 'user'", (err, row) => {
  if (err) {
    console.error('❌ Error querying users:', err);
  } else {
    console.log('👥 Total users:', row.count);
  }
});

// Check all users
db.all("SELECT id, username, role, balance FROM users", (err, rows) => {
  if (err) {
    console.error('❌ Error querying all users:', err);
  } else {
    console.log('👤 All users:');
    rows.forEach(user => {
      console.log(`  - ${user.username} (${user.role}) - Balance: ${user.balance}`);
    });
  }
});

// Check bets
db.get("SELECT COUNT(*) as count FROM bets", (err, row) => {
  if (err) {
    console.error('❌ Error querying bets:', err);
  } else {
    console.log('🎯 Total bets:', row.count);
  }
});

// Check all bets
db.all("SELECT id, user_id, amount, status, placed_at FROM bets LIMIT 10", (err, rows) => {
  if (err) {
    console.error('❌ Error querying all bets:', err);
  } else {
    console.log('🎲 Recent bets:');
    rows.forEach(bet => {
      console.log(`  - ${bet.id}: ${bet.amount} galeones (${bet.status}) - ${bet.placed_at}`);
    });
  }
});

// Check teams
db.all("SELECT id, name FROM teams", (err, rows) => {
  if (err) {
    console.error('❌ Error querying teams:', err);
  } else {
    console.log('🏏 Teams:');
    rows.forEach(team => {
      console.log(`  - ${team.name} (${team.id})`);
    });
  }
});

// Check matches
db.get("SELECT COUNT(*) as count FROM matches", (err, row) => {
  if (err) {
    console.error('❌ Error querying matches:', err);
  } else {
    console.log('⚽ Total matches:', row.count);
  }
});

// Check recent activity like the dashboard does
db.all(`
  SELECT 
    'user_register' as type,
    u.username,
    'Nuevo usuario registrado' as description,
    u.created_at as timestamp,
    NULL as amount
  FROM users u
  WHERE u.role = 'user' AND u.created_at >= datetime('now', '-7 days')
  
  UNION ALL
  
  SELECT 
    CASE 
      WHEN b.status = 'won' THEN 'bet_won'
      WHEN b.status = 'lost' THEN 'bet_lost'
      ELSE 'bet_placed'
    END as type,
    u.username,
    'Apuesta realizada' as description,
    b.placed_at as timestamp,
    b.amount
  FROM bets b
  JOIN users u ON b.user_id = u.id
  WHERE b.placed_at >= datetime('now', '-7 days')
  
  ORDER BY timestamp DESC
  LIMIT 5
`, (err, rows) => {
  if (err) {
    console.error('❌ Error querying recent activity:', err);
  } else {
    console.log('📈 Recent activity:');
    rows.forEach(activity => {
      console.log(`  - ${activity.type}: ${activity.username} - ${activity.description} (${activity.timestamp})`);
    });
  }
});

// Test the exact query from AdminController
db.get(`
  SELECT 
    (SELECT COUNT(*) FROM users WHERE role = "user") as totalUsers,
    (SELECT COUNT(DISTINCT user_id) FROM bets WHERE placed_at >= datetime('now', '-30 days')) as activeUsers,
    (SELECT COUNT(*) FROM bets) as totalBets,
    (SELECT COUNT(*) FROM bets WHERE DATE(placed_at) = DATE('now')) as betsToday,
    (SELECT COALESCE(SUM(amount), 0) FROM bets) as totalRevenue,
    (SELECT COALESCE(AVG(amount), 0) FROM bets) as averageBet,
    (SELECT COUNT(*) FROM bets WHERE status IN ('won', 'lost')) as totalResolved,
    (SELECT COUNT(*) FROM bets WHERE status = 'won') as totalWon
`, (err, row) => {
  if (err) {
    console.error('❌ Error running dashboard stats query:', err);
  } else {
    console.log('📊 Dashboard stats (exact query):');
    console.log('  - Total Users:', row.totalUsers);
    console.log('  - Active Users:', row.activeUsers);
    console.log('  - Total Bets:', row.totalBets);
    console.log('  - Bets Today:', row.betsToday);
    console.log('  - Total Revenue:', row.totalRevenue);
    console.log('  - Average Bet:', row.averageBet);
    console.log('  - Total Resolved:', row.totalResolved);
    console.log('  - Total Won:', row.totalWon);
  }
  
  // Close database after last query
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err);
    } else {
      console.log('✅ Database connection closed');
    }
  });
});
