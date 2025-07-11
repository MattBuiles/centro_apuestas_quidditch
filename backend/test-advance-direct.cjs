const { LeagueTimeService } = require('./dist/services/LeagueTimeService');
const { Database } = require('./dist/database/Database');

async function testAdvanceToNextMatch() {
  try {
    console.log('🧪 Probando el método advanceToNextMatch directamente...\n');
    
    // Inicializar servicios
    const leagueTimeService = new LeagueTimeService();
    await leagueTimeService.initialize();
    
    const db = Database.getInstance();
    
    // Obtener estado actual del tiempo virtual
    const { VirtualTimeService } = await import('./dist/services/VirtualTimeService');
    const virtualTimeService = new VirtualTimeService();
    await virtualTimeService.initialize();
    const currentState = await virtualTimeService.getCurrentState();
    
    console.log('⏰ Estado actual del tiempo virtual:');
    console.log(`   Fecha: ${currentState.currentDate.toLocaleString('es-ES')}`);
    console.log('');
    
    // Verificar si hay partidos en vivo
    const liveMatches = await db.all(`SELECT * FROM matches WHERE status = 'live'`);
    console.log(`🔴 Partidos en vivo: ${liveMatches.length}`);
    
    // Buscar próximo partido
    const nextMatch = await db.getNextUnplayedMatch(currentState.currentDate.toISOString());
    console.log(`🎯 Próximo partido encontrado: ${nextMatch ? 'Sí' : 'No'}`);
    
    if (!nextMatch) {
      console.log('🔄 No hay partidos pendientes, intentando generar nueva temporada...');
      
      // Intentar generar nueva temporada
      const newSeason = await leagueTimeService.generateSeasonIfNeeded();
      
      if (newSeason) {
        console.log('✅ Nueva temporada generada:');
        console.log(`   Nombre: ${newSeason.name}`);
        console.log(`   ID: ${newSeason.id}`);
        console.log(`   Fecha inicio: ${new Date(newSeason.startDate).toLocaleString('es-ES')}`);
        console.log(`   Fecha fin: ${new Date(newSeason.endDate).toLocaleString('es-ES')}`);
        
        // Buscar próximo partido después de generar la temporada
        const nextMatchAfterGeneration = await db.getNextUnplayedMatch(currentState.currentDate.toISOString());
        
        if (nextMatchAfterGeneration) {
          console.log('🎯 Próximo partido encontrado después de generar temporada:');
          console.log(`   Fecha: ${new Date(nextMatchAfterGeneration.date).toLocaleString('es-ES')}`);
          
          // Avanzar tiempo al partido
          const matchDate = new Date(nextMatchAfterGeneration.date);
          await leagueTimeService.setCurrentDate(matchDate);
          
          // Marcar el partido como live
          await db.run(`UPDATE matches SET status = 'live' WHERE id = ?`, [nextMatchAfterGeneration.id]);
          
          console.log('✅ Tiempo avanzado y partido marcado como live');
        } else {
          console.log('❌ No se encontraron partidos después de generar la temporada');
        }
      } else {
        console.log('❌ No se pudo generar nueva temporada');
      }
    } else {
      console.log('✅ Hay partidos pendientes, el problema no es la generación de temporada');
    }
    
  } catch (error) {
    console.error('Error ejecutando la prueba:', error);
  }
}

testAdvanceToNextMatch();
