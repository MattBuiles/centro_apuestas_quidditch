const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Reprogramando partidos para que estén disponibles HOY...\n');

// Obtener la fecha actual
const today = new Date();
console.log(`📅 Fecha actual: ${today.toISOString()}`);

// Obtener todos los partidos scheduled
db.all('SELECT * FROM matches WHERE status = "scheduled" ORDER BY date ASC', (err, matches) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log(`📅 Reprogramando ${matches.length} partidos...\n`);
  
  let updateCount = 0;
  const updates = [];
  
  matches.forEach((match, index) => {
    // Programar los primeros 4 partidos para hoy, y el resto para los próximos días
    const newDate = new Date(today);
    
    if (index < 4) {
      // Los primeros 4 partidos para HOY (diferentes horas)
      newDate.setHours(14 + (index * 2), 0, 0, 0); // 14:00, 16:00, 18:00, 20:00
    } else {
      // El resto para los próximos días
      const daysToAdd = Math.floor((index - 4) / 4) + 1;
      newDate.setDate(newDate.getDate() + daysToAdd);
      newDate.setHours(14 + ((index - 4) % 4) * 2, 0, 0, 0);
    }
    
    updates.push({
      id: match.id,
      newDate: newDate.toISOString(),
      description: index < 4 ? 'HOY' : `+${Math.floor((index - 4) / 4) + 1} días`
    });
  });
  
  // Ejecutar las actualizaciones
  const updatePromises = updates.map((update, index) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE matches SET date = ? WHERE id = ?',
        [update.newDate, update.id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`✅ Partido ${index + 1}: ${update.description} - ${update.newDate}`);
            resolve();
          }
        }
      );
    });
  });
  
  Promise.all(updatePromises)
    .then(() => {
      console.log(`\n🎉 Se han reprogramado ${updates.length} partidos exitosamente!`);
      console.log('✅ Los primeros 4 partidos están programados para HOY');
      console.log('✅ Los siguientes partidos están distribuidos en los próximos días');
      db.close();
    })
    .catch((err) => {
      console.error('Error actualizando partidos:', err);
      db.close();
    });
});
