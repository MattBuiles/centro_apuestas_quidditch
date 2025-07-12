// Test script para verificar la funcionalidad de simulación de partidos
const API_BASE = 'http://localhost:3001/api';

async function testMatchSimulation() {
  try {
    console.log('🎯 Testing Match Simulation System...\n');

    // 1. Obtener lista de partidos
    console.log('📋 Getting matches list...');
    const matchesResponse = await fetch(`${API_BASE}/matches`);
    const matchesData = await matchesResponse.json();
    
    if (!matchesData.success) {
      throw new Error('Failed to get matches');
    }

    const matches = matchesData.data;
    console.log(`✅ Found ${matches.length} matches`);

    // 2. Buscar un partido programado (scheduled)
    const scheduledMatch = matches.find(match => match.status === 'scheduled');
    
    if (!scheduledMatch) {
      console.log('❌ No scheduled matches found for testing');
      return;
    }

    console.log(`🎮 Selected match: ${scheduledMatch.home_team_name} vs ${scheduledMatch.away_team_name}`);
    console.log(`📅 Match status: ${scheduledMatch.status}`);
    console.log(`🆔 Match ID: ${scheduledMatch.id}\n`);

    // 3. Iniciar simulación
    console.log('🚀 Starting match simulation...');
    const simulationResponse = await fetch(`${API_BASE}/matches/${scheduledMatch.id}/iniciar-simulacion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const simulationData = await simulationResponse.json();
    
    if (!simulationData.success) {
      throw new Error(`Failed to start simulation: ${simulationData.error}`);
    }

    console.log('✅ Match simulation started successfully!');
    console.log(`🎯 Status: ${simulationData.data.status}`);
    console.log(`🕐 Started at: ${simulationData.timestamp}\n`);

    // 4. Monitorear el estado de la simulación
    console.log('👁️  Monitoring simulation status...');
    
    let attempts = 0;
    const maxAttempts = 60; // 60 segundos máximo
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
      
      const statusResponse = await fetch(`${API_BASE}/matches/${scheduledMatch.id}/simulation-status`);
      const statusData = await statusResponse.json();
      
      if (statusData.success) {
        const status = statusData.data;
        console.log(`📊 [${attempts + 1}s] Status: ${status.status} | Score: ${status.homeScore} - ${status.awayScore} | Events: ${status.events.length}`);
        
        if (status.status === 'finished') {
          console.log('\n🏆 Match finished!');
          console.log(`🎯 Final Score: ${status.homeScore} - ${status.awayScore}`);
          console.log(`📝 Total Events: ${status.events.length}`);
          
          // Mostrar últimos eventos
          if (status.events.length > 0) {
            console.log('\n📋 Recent events:');
            status.events.slice(-5).forEach(event => {
              console.log(`   • ${event.minute}' - ${event.description} (+${event.points} pts)`);
            });
          }
          
          break;
        }
      }
      
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.log('⏰ Simulation monitoring timeout reached');
    }

  } catch (error) {
    console.error('❌ Error testing match simulation:', error.message);
  }
}

// Ejecutar el test
testMatchSimulation();
