/**
 * Test script para verificar la resolución automática de predicciones
 * cuando un partido termina
 */

const { Database } = require('./backend/src/database/Database');
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testPredictionResolution() {
  console.log('🧪 Iniciando test de resolución de predicciones...\n');

  try {
    // 1. Conectar a la base de datos
    console.log('📡 Conectando a la base de datos...');
    await Database.initialize();
    const db = Database.getInstance();

    // 2. Obtener un partido en estado 'live'
    console.log('🔍 Buscando partidos en vivo...');
    const liveMatches = await db.getMatchesByStatus('live');
    
    if (liveMatches.length === 0) {
      console.log('❌ No hay partidos en vivo. Creando uno para testing...');
      
      // Obtener partidos programados
      const scheduledMatches = await db.getMatchesByStatus('scheduled');
      if (scheduledMatches.length === 0) {
        console.log('❌ No hay partidos programados tampoco.');
        return;
      }
      
      const testMatch = scheduledMatches[0];
      console.log(`📝 Usando partido: ${testMatch.id} - ${testMatch.home_team_name} vs ${testMatch.away_team_name}`);
      
      // Cambiar estado a live
      await db.updateMatchStatus(testMatch.id, 'live');
      console.log('✅ Partido marcado como live');
      
      // 3. Crear algunas predicciones de prueba
      console.log('🔮 Creando predicciones de prueba...');
      
      const predictionData = [
        {
          id: `pred-${Date.now()}-1`,
          userId: 'test-user-1',
          matchId: testMatch.id,
          prediction: 'home',
          confidence: 4
        },
        {
          id: `pred-${Date.now()}-2`,
          userId: 'test-user-2',
          matchId: testMatch.id,
          prediction: 'away',
          confidence: 3
        },
        {
          id: `pred-${Date.now()}-3`,
          userId: 'test-user-3',
          matchId: testMatch.id,
          prediction: 'draw',
          confidence: 5
        }
      ];

      for (const pred of predictionData) {
        await db.createPrediction(pred);
        console.log(`✅ Predicción creada: Usuario ${pred.userId} predice ${pred.prediction} (confianza: ${pred.confidence})`);
      }

      // 4. Simular finalización del partido
      console.log('\n🏁 Simulando finalización del partido...');
      
      const finalScore = {
        homeScore: 150,  // Equipo local gana
        awayScore: 120,
        events: [
          {
            id: `event-${Date.now()}-1`,
            minute: 45,
            type: 'goal',
            teamId: testMatch.home_team_id,
            description: 'Goal scored!',
            points: 10
          }
        ],
        duration: 90,
        snitchCaught: true,
        snitchCaughtBy: testMatch.home_team_id,
        finishedAt: new Date().toISOString()
      };

      // Hacer la petición al endpoint de finalización
      try {
        const response = await axios.post(`${BASE_URL}/matches/${testMatch.id}/finish`, finalScore);
        
        console.log('✅ Partido finalizado exitosamente!');
        console.log('📊 Resultado de la respuesta:', {
          homeScore: response.data.data.homeScore,
          awayScore: response.data.data.awayScore,
          predictions: response.data.data.predictions
        });

        // 5. Verificar que las predicciones se resolvieron correctamente
        console.log('\n🔍 Verificando resolución de predicciones...');
        
        const resolvedPredictions = await db.getPredictionsByMatch(testMatch.id);
        console.log(`📈 Se encontraron ${resolvedPredictions.length} predicciones resueltas:`);
        
        resolvedPredictions.forEach((pred, index) => {
          const isCorrect = pred.prediction === 'home'; // El equipo local ganó
          console.log(`${index + 1}. Usuario: ${pred.user_id}`);
          console.log(`   Predicción: ${pred.prediction}`);
          console.log(`   Estado: ${pred.status} ${isCorrect ? '✅' : '❌'}`);
          console.log(`   Puntos: ${pred.points}`);
          console.log(`   Resuelto en: ${pred.resolved_at}`);
          console.log('');
        });

        console.log('🎉 Test completado exitosamente!');
        
      } catch (error) {
        console.error('❌ Error al finalizar el partido:', error.response?.data || error.message);
      }
      
    } else {
      console.log(`✅ Encontrado partido en vivo: ${liveMatches[0].id}`);
    }

  } catch (error) {
    console.error('❌ Error durante el test:', error);
  } finally {
    await Database.close();
  }
}

// Función auxiliar para verificar el estado de las predicciones
async function checkPredictionStatus() {
  try {
    await Database.initialize();
    const db = Database.getInstance();
    
    console.log('📊 Estado actual de todas las predicciones:');
    const allPredictions = await db.getAllPredictions();
    
    const statusCounts = {
      pending: 0,
      correct: 0,
      incorrect: 0
    };

    allPredictions.forEach(pred => {
      statusCounts[pred.status]++;
      console.log(`${pred.id}: ${pred.status} - ${pred.prediction} (${pred.points} pts)`);
    });

    console.log('\n📈 Resumen:', statusCounts);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await Database.close();
  }
}

// Ejecutar el test
if (require.main === module) {
  const action = process.argv[2];
  
  if (action === 'status') {
    checkPredictionStatus();
  } else {
    testPredictionResolution();
  }
}

module.exports = {
  testPredictionResolution,
  checkPredictionStatus
};
