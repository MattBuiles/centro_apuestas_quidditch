// Script para verificar los equipos en la base de datos
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('🔍 Connected to SQLite database');
});

// Verificar todos los equipos
db.all("SELECT id, name FROM teams", (err, rows) => {
  if (err) {
    console.error('Error querying teams:', err);
    return;
  }
  
  console.log('\n📋 EQUIPOS EN LA BASE DE DATOS:');
  console.log('================================');
  rows.forEach(row => {
    console.log(`ID: ${row.id} | Name: ${row.name}`);
  });
  
  // Verificar específicamente gryffindor
  console.log('\n🔍 VERIFICANDO GRYFFINDOR:');
  console.log('==========================');
  
  db.get("SELECT id, name FROM teams WHERE id = 'gryffindor' OR LOWER(name) = 'gryffindor'", (err, row) => {
    if (err) {
      console.error('Error searching for gryffindor:', err);
      return;
    }
    
    if (row) {
      console.log(`✅ Gryffindor encontrado: ID=${row.id}, Name=${row.name}`);
    } else {
      console.log('❌ Gryffindor NO encontrado en la base de datos');
    }
    
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
      console.log('\n🔍 Database connection closed');
    });
  });
});
