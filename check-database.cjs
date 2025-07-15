const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('=== USERS TABLE ===');
  db.all('SELECT id, username, email, balance FROM users', (err, rows) => {
    if (err) {
      console.error('Error querying users:', err);
    } else {
      console.log('Users found:', rows.length);
      rows.forEach(user => console.log(`- ${user.username} (ID: ${user.id})`));
    }
    
    console.log('\n=== BETS TABLE ===');
    db.all('SELECT * FROM bets ORDER BY placed_at DESC LIMIT 5', (err, rows) => {
      if (err) {
        console.error('Error querying bets:', err);
      } else {
        console.log('Bets found:', rows.length);
        rows.forEach(bet => {
          console.log(`- Bet ID: ${bet.id}, User: ${bet.user_id}, Match: ${bet.match_id}, Amount: ${bet.amount}, Status: ${bet.status}`);
        });
      }
      
      console.log('\n=== MATCHES TABLE ===');
      db.all('SELECT id, home_team_id, away_team_id, date, status FROM matches ORDER BY date DESC LIMIT 3', (err, rows) => {
        if (err) {
          console.error('Error querying matches:', err);
        } else {
          console.log('Matches found:', rows.length);
          rows.forEach(match => {
            console.log(`- Match ID: ${match.id}, Teams: ${match.home_team_id} vs ${match.away_team_id}, Status: ${match.status}`);
          });
        }
        
        db.close();
      });
    });
  });
});
