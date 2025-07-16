/**
 * Script para verificar y actualizar los datos de títulos y logros en el backend
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Datos de equipos con títulos y logros mejorados
const teamsData = [
  {
    id: 'gryffindor',
    name: 'Gryffindor',
    titles: 7,
    achievements: [
      "Campeón de la Copa de las Casas (7 veces)",
      "Récord de la captura más rápida de la Snitch Dorada",
      "Mayor número de victorias consecutivas (23 partidos)",
      "Mejor comeback en una final",
      "Premio al Fair Play por excelencia deportiva"
    ]
  },
  {
    id: 'slytherin',
    name: 'Slytherin',
    titles: 6,
    achievements: [
      "Campeón de Liga Intercasas (6 veces)",
      "Récord de mayor número de títulos consecutivos (4)",
      "Estrategia defensiva más efectiva",
      "Mayor porcentaje de victorias en finales",
      "Innovadores de formaciones tácticas"
    ]
  },
  {
    id: 'ravenclaw',
    name: 'Ravenclaw',
    titles: 4,
    achievements: [
      "Campeón de Torneos Académicos (4 veces)",
      "Creadores del Sistema de Vuelo Helicoidal",
      "Mayor número de jugadas innovadoras",
      "Récord de precisión en pases",
      "Premio a la Excelencia Táctica"
    ]
  },
  {
    id: 'hufflepuff',
    name: 'Hufflepuff',
    titles: 3,
    achievements: [
      "Campeón de Resistencia (3 veces)",
      "Récord de temporada sin derrotas en casa",
      "Mayor número de remontadas exitosas",
      "Premio al Espíritu Deportivo",
      "Mejor cohesión de equipo"
    ]
  },
  {
    id: 'chudley',
    name: 'Chudley Cannons',
    titles: 1,
    achievements: [
      "Campeón de Liga Profesional (1 vez)",
      "Mayor base de fanáticos leales",
      "Récord de asistencia en partidos locales",
      "Premio al Coraje Deportivo",
      "Mejor espíritu de superación"
    ]
  },
  {
    id: 'harpies',
    name: 'Holyhead Harpies',
    titles: 8,
    achievements: [
      "Campeonas de Liga Femenina (8 veces)",
      "Primer equipo completamente femenino profesional",
      "Récord de títulos consecutivos",
      "Mejor porcentaje de victorias",
      "Inspiración para el Quidditch femenino"
    ]
  }
];

async function updateTeamTitlesAndAchievements() {
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
    
    // Función para actualizar un equipo
    const updateTeam = (teamData) => {
      return new Promise((teamResolve, teamReject) => {
        const achievementsJson = JSON.stringify(teamData.achievements);
        
        db.run(
          `UPDATE teams SET 
           titles = ?, 
           achievements = ?,
           history = CASE 
             WHEN history IS NULL OR history = '' THEN 'This team has a rich history in Quidditch.'
             ELSE history 
           END
           WHERE id = ?`,
          [teamData.titles, achievementsJson, teamData.id],
          function(err) {
            if (err) {
              console.error(`❌ Error updating ${teamData.name}:`, err);
              teamReject(err);
            } else {
              console.log(`✅ Updated ${teamData.name} - Titles: ${teamData.titles}, Achievements: ${teamData.achievements.length}`);
              teamResolve(this.changes);
            }
          }
        );
      });
    };
    
    // Actualizar todos los equipos
    Promise.all(teamsData.map(updateTeam))
      .then(() => {
        console.log('🎉 All teams updated successfully');
        
        // Verificar que los datos se guardaron correctamente
        db.all("SELECT id, name, titles, achievements FROM teams", (err, rows) => {
          if (err) {
            console.error('❌ Error verifying updates:', err);
            reject(err);
          } else {
            console.log('\n📊 Current team data:');
            rows.forEach(row => {
              const achievements = JSON.parse(row.achievements || '[]');
              console.log(`- ${row.name}: ${row.titles} títulos, ${achievements.length} logros`);
            });
            resolve(rows);
          }
          
          db.close();
        });
      })
      .catch((err) => {
        console.error('❌ Error in batch update:', err);
        db.close();
        reject(err);
      });
  });
}

// Función para verificar la estructura de la tabla
function checkTableStructure() {
  const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err);
        reject(err);
        return;
      }
    });
    
    db.all("PRAGMA table_info(teams)", (err, columns) => {
      if (err) {
        console.error('❌ Error checking table structure:', err);
        reject(err);
      } else {
        console.log('📋 Teams table structure:');
        columns.forEach(col => {
          console.log(`- ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'NULL'}) ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
        });
        resolve(columns);
      }
      
      db.close();
    });
  });
}

// Ejecutar según el argumento
if (process.argv[2] === '--check') {
  checkTableStructure();
} else {
  updateTeamTitlesAndAchievements();
}

module.exports = { updateTeamTitlesAndAchievements, checkTableStructure };
