const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testNewSeasonCreation() {
  console.log('🧪 Probando creación de nueva temporada con partidos programados correctamente...\n');
  
  try {
    // 1. Crear nueva temporada
    console.log('1️⃣ Creando nueva temporada...');
    const response = await axios.post(`${BASE_URL}/admin/create-season`, {}, {
      headers: {
        'Authorization': 'Bearer admin-token',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ Nueva temporada creada exitosamente');
      console.log(`   - Temporada: ${response.data.data.season.name}`);
      console.log(`   - Partidos generados: ${response.data.data.matchesGenerated}`);
      console.log(`   - Equipos participantes: ${response.data.data.teamsParticipating}`);
      console.log(`   - Temporada anterior finalizada: ${response.data.data.previousSeasonFinalized ? 'Sí' : 'No'}`);
    } else {
      console.error('❌ Error en la respuesta:', response.data);
      return;
    }
    
    // 2. Verificar partidos programados
    console.log('\n2️⃣ Verificando partidos programados...');
    const matchesResponse = await axios.get(`${BASE_URL}/matches/upcoming`);
    
    if (matchesResponse.data.length > 0) {
      console.log(`✅ Partidos encontrados: ${matchesResponse.data.length}`);
      const firstMatch = matchesResponse.data[0];
      const matchDate = new Date(firstMatch.date);
      const now = new Date();
      const timeDiff = matchDate.getTime() - now.getTime();
      const hoursUntilMatch = Math.round(timeDiff / (1000 * 60 * 60));
      
      console.log(`   - Primer partido: ${firstMatch.homeTeam.name} vs ${firstMatch.awayTeam.name}`);
      console.log(`   - Programado para: ${matchDate.toLocaleString()}`);
      console.log(`   - Tiempo hasta el partido: ${hoursUntilMatch} horas`);
      console.log(`   - Estado: ${firstMatch.status}`);
      
      if (hoursUntilMatch <= 24) {
        console.log('✅ El primer partido está programado para las próximas 24 horas - ¡perfecto!');
      } else {
        console.warn(`⚠️ El primer partido está programado para ${hoursUntilMatch} horas en el futuro`);
      }
    } else {
      console.error('❌ No se encontraron partidos próximos');
    }
    
    // 3. Verificar estado del tiempo virtual
    console.log('\n3️⃣ Verificando estado del tiempo virtual...');
    const timeResponse = await axios.get(`${BASE_URL}/admin/system-status`, {
      headers: {
        'Authorization': 'Bearer admin-token'
      }
    });
    
    if (timeResponse.data.virtualTime) {
      const virtualDate = new Date(timeResponse.data.virtualTime.currentDate);
      console.log(`✅ Tiempo virtual actual: ${virtualDate.toLocaleString()}`);
      console.log(`   - Velocidad: ${timeResponse.data.virtualTime.speed}x`);
      console.log(`   - Activo: ${timeResponse.data.virtualTime.isActive ? 'Sí' : 'No'}`);
    }
    
    console.log('\n🎉 ¡Prueba completada! La nueva temporada debería funcionar correctamente.');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.response?.data || error.message);
  }
}

// Ejecutar prueba
testNewSeasonCreation();
