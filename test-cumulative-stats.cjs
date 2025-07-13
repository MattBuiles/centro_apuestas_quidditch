const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testCumulativeStats() {
  try {
    console.log('🧪 Probando endpoint de estadísticas acumulativas...');
    
    // Primero hacer login como admin
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@quidditch.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');

    // Crear cliente con autenticación
    const apiClient = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Probar el endpoint de estadísticas acumulativas
    console.log('\n🔍 Consultando estadísticas acumulativas...');
    const statsResponse = await apiClient.get('/teams/cumulative-stats');
    
    console.log('✅ Respuesta recibida:');
    console.log('Success:', statsResponse.data.success);
    console.log('Message:', statsResponse.data.message);
    console.log('Data count:', statsResponse.data.data?.length || 0);
    
    if (statsResponse.data.data && statsResponse.data.data.length > 0) {
      console.log('\n📊 Primeros 3 equipos:');
      statsResponse.data.data.slice(0, 3).forEach((team, index) => {
        console.log(`${index + 1}. ${team.teamName}:`);
        console.log(`   - Temporadas: ${team.totalSeasons}`);
        console.log(`   - Partidos: ${team.totalMatches}`);
        console.log(`   - Puntos: ${team.totalPoints}`);
        console.log(`   - Campeonatos: ${team.championships}`);
        console.log(`   - % Victorias: ${team.winPercentage}%`);
        console.log('');
      });
    } else {
      console.log('⚠️ No se encontraron datos de estadísticas');
    }

    // También probar el endpoint normal de teams para verificar que hay equipos
    console.log('\n🔍 Verificando equipos disponibles...');
    const teamsResponse = await apiClient.get('/teams');
    console.log('Teams count:', teamsResponse.data.data?.length || 0);

    // Y verificar temporadas
    console.log('\n🔍 Verificando temporadas...');
    const seasonsResponse = await apiClient.get('/seasons');
    console.log('Seasons count:', seasonsResponse.data.data?.length || 0);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCumulativeStats();
