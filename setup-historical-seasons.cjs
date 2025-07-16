/**
 * Script para inicializar temporadas históricas de ejemplo
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

// Función para generar UUID simple
function generateUUID() {
  return crypto.randomUUID();
}

// Datos de temporadas históricas de ejemplo
const historicalSeasons = [
  {
    name: 'Temporada 2020-2021',
    startDate: '2020-09-01',
    endDate: '2021-05-31',
    championTeamId: 'gryffindor',
    championTeamName: 'Gryffindor'
  },
  {
    name: 'Temporada 2021-2022',
    startDate: '2021-09-01',
    endDate: '2022-05-31',
    championTeamId: 'slytherin',
    championTeamName: 'Slytherin'
  },
  {
    name: 'Temporada 2022-2023',
    startDate: '2022-09-01',
    endDate: '2023-05-31',
    championTeamId: 'gryffindor',
    championTeamName: 'Gryffindor'
  },
  {
    name: 'Temporada 2023-2024',
    startDate: '2023-09-01',
    endDate: '2024-05-31',
    championTeamId: 'ravenclaw',
    championTeamName: 'Ravenclaw'
  },
  {
    name: 'Temporada 2024-2025',
    startDate: '2024-09-01',
    endDate: '2025-05-31',
    championTeamId: 'slytherin',
    championTeamName: 'Slytherin'
  }
];

async function initializeHistoricalSeasons() {
  const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err);
        reject(err);
        return;
      }
      console.log('✅ Connected to database');
    });
    
    // Función para crear la tabla si no existe
    const createHistoricalSeasonsTable = () => {
      return new Promise((tableResolve, tableReject) => {
        db.run(`
          CREATE TABLE IF NOT EXISTS historical_seasons (
            id TEXT PRIMARY KEY,
            original_season_id TEXT,
            name TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            status TEXT DEFAULT 'completed',
            archived_at TEXT NOT NULL,
            total_teams INTEGER DEFAULT 0,
            total_matches INTEGER DEFAULT 0,
            total_bets INTEGER DEFAULT 0,
            total_predictions INTEGER DEFAULT 0,
            total_revenue REAL DEFAULT 0,
            champion_team_id TEXT,
            champion_team_name TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error('❌ Error creating historical_seasons table:', err);
            tableReject(err);
          } else {
            console.log('✅ Historical seasons table ready');
            tableResolve();
          }
        });
      });
    };
    
    // Función para insertar temporadas históricas
    const insertHistoricalSeasons = async () => {
      console.log('📚 Inserting historical seasons...');
      
      for (const season of historicalSeasons) {
        try {
          await new Promise((insertResolve, insertReject) => {
            const id = generateUUID();
            const originalSeasonId = generateUUID();
            
            db.run(`
              INSERT OR REPLACE INTO historical_seasons (
                id, original_season_id, name, start_date, end_date, status, archived_at,
                total_teams, total_matches, total_bets, total_predictions, total_revenue,
                champion_team_id, champion_team_name
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              id,
              originalSeasonId,
              season.name,
              season.startDate,
              season.endDate,
              'completed',
              new Date().toISOString(),
              6, // Total teams
              30, // Total matches (ejemplo)
              0, // Total bets
              0, // Total predictions
              0, // Total revenue
              season.championTeamId,
              season.championTeamName
            ], (err) => {
              if (err) {
                console.error(`❌ Error inserting season ${season.name}:`, err);
                insertReject(err);
              } else {
                console.log(`✅ Inserted season: ${season.name} (Champion: ${season.championTeamName})`);
                insertResolve();
              }
            });
          });
        } catch (error) {
          console.error(`❌ Failed to insert season ${season.name}:`, error);
        }
      }
    };
    
    // Función para verificar los datos insertados
    const verifyData = () => {
      return new Promise((verifyResolve, verifyReject) => {
        db.all(`
          SELECT name, champion_team_name, start_date, end_date 
          FROM historical_seasons 
          ORDER BY start_date DESC
        `, (err, rows) => {
          if (err) {
            console.error('❌ Error verifying data:', err);
            verifyReject(err);
          } else {
            console.log('\n📊 Historical seasons in database:');
            rows.forEach((row, index) => {
              console.log(`${index + 1}. ${row.name} - Champion: ${row.champion_team_name} (${row.start_date} to ${row.end_date})`);
            });
            
            // Contar títulos por equipo
            db.all(`
              SELECT champion_team_name, COUNT(*) as titles
              FROM historical_seasons
              WHERE champion_team_id IS NOT NULL
              GROUP BY champion_team_id, champion_team_name
              ORDER BY titles DESC
            `, (err, titleRows) => {
              if (err) {
                console.error('❌ Error counting titles:', err);
                verifyReject(err);
              } else {
                console.log('\n🏆 Titles by team:');
                titleRows.forEach((row, index) => {
                  console.log(`${index + 1}. ${row.champion_team_name}: ${row.titles} títulos`);
                });
                verifyResolve(rows);
              }
            });
          }
        });
      });
    };
    
    // Ejecutar secuencialmente
    createHistoricalSeasonsTable()
      .then(insertHistoricalSeasons)
      .then(verifyData)
      .then((data) => {
        console.log('\n🎉 Historical seasons initialized successfully!');
        db.close();
        resolve(data);
      })
      .catch((err) => {
        console.error('❌ Error in initialization process:', err);
        db.close();
        reject(err);
      });
  });
}

// Función para limpiar temporadas históricas
async function clearHistoricalSeasons() {
  const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err);
        reject(err);
        return;
      }
    });
    
    db.run('DELETE FROM historical_seasons', (err) => {
      if (err) {
        console.error('❌ Error clearing historical seasons:', err);
        reject(err);
      } else {
        console.log('✅ Historical seasons cleared');
        resolve();
      }
      db.close();
    });
  });
}

// Función para verificar la estructura actual
async function checkCurrentStructure() {
  const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err);
        reject(err);
        return;
      }
    });
    
    // Verificar tabla teams
    db.all('SELECT id, name, titles FROM teams', (err, teams) => {
      if (err) {
        console.error('❌ Error checking teams:', err);
        reject(err);
        return;
      }
      
      console.log('\n📋 Current teams:');
      teams.forEach(team => {
        console.log(`- ${team.name} (${team.id}): ${team.titles || 0} títulos`);
      });
      
      // Verificar tabla historical_seasons
      db.all('SELECT COUNT(*) as count FROM historical_seasons', (err, result) => {
        if (err) {
          console.log('⚠️ Historical seasons table does not exist or is empty');
        } else {
          console.log(`📚 Historical seasons count: ${result[0].count}`);
        }
        
        // Verificar tabla seasons
        db.all('SELECT COUNT(*) as count FROM seasons', (err, result) => {
          if (err) {
            console.log('⚠️ Seasons table does not exist or is empty');
          } else {
            console.log(`📅 Current seasons count: ${result[0].count}`);
          }
          
          // Verificar tabla standings
          db.all('SELECT COUNT(*) as count FROM standings', (err, result) => {
            if (err) {
              console.log('⚠️ Standings table does not exist or is empty');
            } else {
              console.log(`📊 Standings records count: ${result[0].count}`);
            }
            
            db.close();
            resolve();
          });
        });
      });
    });
  });
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--clear')) {
    await clearHistoricalSeasons();
  } else if (args.includes('--check')) {
    await checkCurrentStructure();
  } else {
    await initializeHistoricalSeasons();
  }
}

// Ejecutar
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { initializeHistoricalSeasons, clearHistoricalSeasons, checkCurrentStructure };
