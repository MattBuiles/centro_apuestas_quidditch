const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

async function optimizeDatabasePerformance() {
  const dbPath = path.join(__dirname, 'backend', 'database.db');
  
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found at:', dbPath);
    console.log('Available databases:');
    
    // Look for database files
    const backendDir = path.join(__dirname, 'backend');
    if (fs.existsSync(backendDir)) {
      const files = fs.readdirSync(backendDir);
      const dbFiles = files.filter(file => file.endsWith('.db') || file.endsWith('.sqlite'));
      if (dbFiles.length > 0) {
        dbFiles.forEach(file => console.log(`  - ${file}`));
      } else {
        console.log('  No database files found in backend directory');
      }
    }
    return;
  }

  const db = new sqlite3.Database(dbPath);
  
  console.log('🔧 Optimizing database performance for dashboard...');
  
  // Read the SQL optimization script
  const sqlScript = fs.readFileSync(path.join(__dirname, 'optimize-dashboard-performance.sql'), 'utf8');
  const statements = sqlScript.split(';').filter(stmt => stmt.trim().length > 0);
  
  for (const statement of statements) {
    if (statement.trim().startsWith('--') || statement.trim().length === 0) {
      continue;
    }
    
    try {
      await new Promise((resolve, reject) => {
        db.run(statement.trim(), function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      if (statement.includes('CREATE INDEX')) {
        const indexName = statement.match(/idx_\w+/)?.[0];
        console.log(`✅ Created index: ${indexName}`);
      }
    } catch (error) {
      if (error.message.includes('already exists')) {
        const indexName = statement.match(/idx_\w+/)?.[0];
        console.log(`ℹ️  Index already exists: ${indexName}`);
      } else {
        console.error('❌ Error executing statement:', error.message);
        console.error('Statement:', statement.trim());
      }
    }
  }
  
  // Check created indexes
  console.log('\n📊 Checking created indexes...');
  db.all("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'", (err, rows) => {
    if (err) {
      console.error('Error checking indexes:', err);
    } else {
      console.log(`✅ Found ${rows.length} optimization indexes:`);
      rows.forEach(row => console.log(`  - ${row.name}`));
    }
    
    db.close();
    console.log('\n🎉 Database optimization completed!');
    console.log('Dashboard queries should now perform significantly better.');
  });
}

// Run the optimization
optimizeDatabasePerformance().catch(console.error);
