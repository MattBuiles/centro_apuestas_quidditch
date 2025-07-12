/**
 * Script de prueba para verificar que los standings se guardan correctamente en la base de datos
 */

console.log('🧪 Probando sistema de standings...');

const testStandings = async () => {
  try {
    // 1. Verificar que existe una temporada activa
    console.log('1. Verificando temporada activa...');
    const seasonResponse = await fetch('http://localhost:3001/api/seasons/current');
    const seasonData = await seasonResponse.json();
    
    if (!seasonData.success) {
      console.log('❌ No hay temporada activa');
      return;
    }
    
    console.log(`✅ Temporada activa: ${seasonData.data.name}`);
    
    // 2. Obtener standings actuales desde la base de datos
    console.log('2. Obteniendo standings desde base de datos...');
    const standingsResponse = await fetch('http://localhost:3001/api/seasons/standings/current');
    const standingsData = await standingsResponse.json();
    
    if (standingsData.success) {
      console.log(`✅ Standings encontrados: ${standingsData.data.standings.length} equipos`);
      console.log('🏆 Top 3:');
      standingsData.data.standings.slice(0, 3).forEach((standing, index) => {
        console.log(`   ${index + 1}. ${standing.team.name} - ${standing.points} puntos (${standing.matchesPlayed} PJ)`);
      });
    } else {
      console.log('⚠️ No se encontraron standings en la base de datos');
    }
    
    // 3. Verificar endpoint por ID de temporada
    console.log('3. Verificando endpoint por ID de temporada...');
    const seasonId = seasonData.data.id;
    const standingsByIdResponse = await fetch(`http://localhost:3001/api/seasons/${seasonId}/standings`);
    const standingsByIdData = await standingsByIdResponse.json();
    
    if (standingsByIdData.success) {
      console.log(`✅ Standings por ID obtenidos: ${standingsByIdData.data.length} equipos`);
    } else {
      console.log('❌ Error obteniendo standings por ID');
    }
    
    console.log('🎉 ¡Prueba completada!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
};

// Ejecutar prueba
testStandings();
