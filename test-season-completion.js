/**
 * Script de prueba para verificar la funcionalidad de finalización automática de temporada
 */

const fetch = require('node-fetch').default || require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function testSeasonCompletion() {
  console.log('🧪 Iniciando prueba de finalización automática de temporada...\n');

  try {
    // 1. Verificar estado actual de la temporada
    console.log('1️⃣ Verificando estado actual de la temporada...');
    const leagueTimeResponse = await fetch(`${API_BASE}/league-time`);
    const leagueTimeData = await leagueTimeResponse.json();
    
    if (leagueTimeData.success && leagueTimeData.data.activeSeason) {
      const season = leagueTimeData.data.activeSeason;
      console.log(`   ✅ Temporada activa encontrada: ${season.name} (${season.status})`);
      console.log(`   📊 Partidos en la temporada: ${season.matches?.length || 0}`);
      
      if (season.matches) {
        const statusCounts = season.matches.reduce((acc, match) => {
          acc[match.status] = (acc[match.status] || 0) + 1;
          return acc;
        }, {});
        
        console.log('   📈 Estado de los partidos:');
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`      - ${status}: ${count}`);
        });
      }
    } else {
      console.log('   ❌ No hay temporada activa');
      return;
    }

    // 2. Llamar al endpoint de verificación manual
    console.log('\n2️⃣ Ejecutando verificación manual de finalización...');
    const checkResponse = await fetch(`${API_BASE}/seasons/check-completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const checkData = await checkResponse.json();
    
    if (checkData.success) {
      if (checkData.data.seasonFinished) {
        console.log(`   🏆 ¡Temporada finalizada! ID: ${checkData.data.seasonId}`);
        console.log(`   💬 ${checkData.data.message}`);
      } else {
        console.log('   ⏳ La temporada aún está activa');
        console.log(`   💬 ${checkData.data.message}`);
      }
    } else {
      console.log('   ❌ Error en la verificación:', checkData.message);
    }

    // 3. Verificar estado después de la verificación
    console.log('\n3️⃣ Verificando estado después de la verificación...');
    const finalLeagueResponse = await fetch(`${API_BASE}/league-time`);
    const finalLeagueData = await finalLeagueResponse.json();
    
    if (finalLeagueData.success && finalLeagueData.data.activeSeason) {
      const finalSeason = finalLeagueData.data.activeSeason;
      console.log(`   📋 Estado final de la temporada: ${finalSeason.status}`);
      
      if (finalSeason.status === 'finished') {
        console.log('   🎉 ¡La temporada ha sido marcada como finalizada correctamente!');
      }
    } else {
      console.log('   🔄 Ya no hay temporada activa (posiblemente finalizada)');
    }

    console.log('\n✅ Prueba completada exitosamente');

  } catch (error) {
    console.error('\n❌ Error durante la prueba:', error.message);
    console.error('Asegúrate de que el backend esté ejecutándose en el puerto 3001');
  }
}

// Ejecutar la prueba
testSeasonCompletion().catch(console.error);
