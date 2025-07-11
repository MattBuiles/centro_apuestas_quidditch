const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Abrir la base de datos
const dbPath = path.join(__dirname, 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando estado de las temporadas...\n');

// Verificar todas las temporadas
db.all("SELECT * FROM seasons ORDER BY created_at DESC", (err, seasons) => {
  if (err) {
    console.error('Error obteniendo temporadas:', err);
    return;
  }
  
  console.log('📅 Temporadas existentes:');
  if (seasons && seasons.length > 0) {
    seasons.forEach((season, index) => {
      console.log(`   ${index + 1}. ${season.name} (${season.id})`);
      console.log(`      Creada: ${new Date(season.created_at).toLocaleString('es-ES')}`);
      console.log(`      Estado: ${season.status}`);
      console.log(`      Fecha inicio: ${season.start_date ? new Date(season.start_date).toLocaleString('es-ES') : 'N/A'}`);
      console.log(`      Fecha fin: ${season.end_date ? new Date(season.end_date).toLocaleString('es-ES') : 'N/A'}`);
      console.log('');
    });
  } else {
    console.log('   ❌ No se encontraron temporadas');
  }
  
  // Verificar partidos de la temporada más reciente
  if (seasons && seasons.length > 0) {
    const latestSeason = seasons[0];
    
    db.all(`
      SELECT 
        m.*,
        ht.name as homeTeamName,
        at.name as awayTeamName
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.season_id = ?
      ORDER BY m.date ASC
      LIMIT 20
    `, [latestSeason.id], (err, matches) => {
      if (err) {
        console.error('Error obteniendo partidos de la temporada:', err);
        return;
      }
      
      console.log(`🏆 Partidos de la temporada "${latestSeason.name}":`);
      if (matches && matches.length > 0) {
        matches.forEach((match, index) => {
          const matchDate = new Date(match.date);
          console.log(`   ${index + 1}. ${match.homeTeamName} vs ${match.awayTeamName}`);
          console.log(`      Fecha: ${matchDate.toLocaleString('es-ES')}`);
          console.log(`      Estado: ${match.status}`);
          console.log(`      Resultado: ${match.home_score !== null ? match.home_score : '?'} - ${match.away_score !== null ? match.away_score : '?'}`);
          console.log('');
        });
      } else {
        console.log('   ❌ No se encontraron partidos para esta temporada');
      }
      
      db.close();
    });
  } else {
    db.close();
  }
});
