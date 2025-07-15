const { Database } = require('./backend/src/database/Database');
const { MatchSimulationService } = require('./backend/src/services/MatchSimulationService');

async function diagnoseDuplicateStats() {
  console.log('🔍 Diagnosticando problema de duplicación de estadísticas...');
  
  try {
    // Inicializar base de datos
    await Database.initialize();
    const db = Database.getInstance();
    
    // Obtener algunos partidos en estado 'live'
    const liveMatches = await db.getMatchesByStatus('live');
    console.log(`📊 Partidos en estado 'live': ${liveMatches.length}`);
    
    if (liveMatches.length === 0) {
      console.log('❌ No hay partidos en estado "live" para diagnosticar');
      return;
    }
    
    const match = liveMatches[0];
    console.log(`🎯 Diagnosticando partido: ${match.id}`);
    
    // Obtener estadísticas de los equipos antes
    const homeTeamBefore = await db.getTeamById(match.home_team_id);
    const awayTeamBefore = await db.getTeamById(match.away_team_id);
    
    console.log('📊 Estadísticas antes del partido:');
    console.log(`  Equipo Local (${homeTeamBefore.name}): ${homeTeamBefore.matches_played} partidos jugados`);
    console.log(`  Equipo Visitante (${awayTeamBefore.name}): ${awayTeamBefore.matches_played} partidos jugados`);
    
    // Simular finalización del partido
    const matchSimulationService = new MatchSimulationService();
    const result = await matchSimulationService.simulateMatchComplete(match.id);
    
    console.log(`✅ Partido simulado: ${result.homeScore} - ${result.awayScore}`);
    
    // Obtener estadísticas después
    const homeTeamAfter = await db.getTeamById(match.home_team_id);
    const awayTeamAfter = await db.getTeamById(match.away_team_id);
    
    console.log('📊 Estadísticas después del partido:');
    console.log(`  Equipo Local (${homeTeamAfter.name}): ${homeTeamAfter.matches_played} partidos jugados`);
    console.log(`  Equipo Visitante (${awayTeamAfter.name}): ${awayTeamAfter.matches_played} partidos jugados`);
    
    // Verificar si hubo duplicación
    const homeIncrement = homeTeamAfter.matches_played - homeTeamBefore.matches_played;
    const awayIncrement = awayTeamAfter.matches_played - awayTeamBefore.matches_played;
    
    console.log('🔍 Incrementos:');
    console.log(`  Equipo Local: +${homeIncrement} partidos`);
    console.log(`  Equipo Visitante: +${awayIncrement} partidos`);
    
    if (homeIncrement > 1 || awayIncrement > 1) {
      console.log('❌ ¡PROBLEMA DETECTADO! Duplicación de estadísticas');
      console.log('💡 Recomendación: Verificar que finishMatch no se llame múltiples veces');
    } else {
      console.log('✅ No se detectó duplicación en este partido');
    }
    
    // Verificar el estado actual del partido
    const finalMatch = await db.getMatchById(match.id);
    console.log(`📋 Estado final del partido: ${finalMatch.status}`);
    
    // Intentar simular el mismo partido otra vez para verificar protección
    console.log('🔄 Intentando simular el mismo partido nuevamente...');
    try {
      await matchSimulationService.simulateMatchComplete(match.id);
      console.log('❌ ¡ERROR! El partido se pudo simular dos veces');
    } catch (error) {
      console.log('✅ Correcto: El partido no se puede simular dos veces');
      console.log(`   Error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
  } finally {
    await Database.close();
  }
}

diagnoseDuplicateStats().catch(console.error);
