/**
 * Script para verificar que las estadísticas de equipos se actualicen correctamente
 * cuando se simula un partido usando la cronología en vivo
 */

const { Database } = require('./backend/src/database/Database');

async function testTeamStatsUpdate() {
  console.log('🧪 Iniciando prueba de actualización de estadísticas de equipos...\n');

  try {
    // Inicializar base de datos
    await Database.initialize();
    const db = Database.getInstance();

    // Obtener un partido en estado 'live'
    const liveMatches = await db.getMatchesByStatus('live');
    
    if (liveMatches.length === 0) {
      console.log('❌ No hay partidos en estado "live" para probar');
      return;
    }

    const match = liveMatches[0];
    console.log(`🏆 Partido seleccionado: ${match.home_team_name} vs ${match.away_team_name}`);
    console.log(`📅 Match ID: ${match.id}\n`);

    // Obtener estadísticas ANTES de la simulación
    const homeTeamBefore = await db.getTeamStatistics(match.home_team_id);
    const awayTeamBefore = await db.getTeamStatistics(match.away_team_id);

    console.log('📊 ESTADÍSTICAS ANTES DE LA SIMULACIÓN:');
    console.log(`${match.home_team_name}:`);
    console.log(`  - Partidos jugados: ${homeTeamBefore.matches_played || 0}`);
    console.log(`  - Ganados: ${homeTeamBefore.matches_won || 0}`);
    console.log(`  - Perdidos: ${homeTeamBefore.matches_lost || 0}`);
    console.log(`  - Puntos: ${homeTeamBefore.points || 0}`);
    
    console.log(`${match.away_team_name}:`);
    console.log(`  - Partidos jugados: ${awayTeamBefore.matches_played || 0}`);
    console.log(`  - Ganados: ${awayTeamBefore.matches_won || 0}`);
    console.log(`  - Perdidos: ${awayTeamBefore.matches_lost || 0}`);
    console.log(`  - Puntos: ${awayTeamBefore.points || 0}\n`);

    // Simular resultado del partido
    const homeScore = Math.floor(Math.random() * 200) + 50; // 50-250 puntos
    const awayScore = Math.floor(Math.random() * 200) + 50; // 50-250 puntos
    const snitchCaught = Math.random() > 0.5;
    const snitchCaughtBy = snitchCaught ? (homeScore > awayScore ? match.home_team_id : match.away_team_id) : null;

    console.log('🎯 SIMULANDO RESULTADO:');
    console.log(`${match.home_team_name}: ${homeScore} puntos`);
    console.log(`${match.away_team_name}: ${awayScore} puntos`);
    console.log(`Snitch atrapada: ${snitchCaught ? 'Sí' : 'No'}${snitchCaught ? ` por ${snitchCaughtBy === match.home_team_id ? match.home_team_name : match.away_team_name}` : ''}\n`);

    // Usar el método finishMatch centralizado
    const matchResult = {
      homeScore,
      awayScore,
      snitchCaught,
      snitchCaughtBy,
      finishedAt: new Date().toISOString()
    };

    console.log('⚡ Finalizando partido usando db.finishMatch()...\n');
    await db.finishMatch(match.id, matchResult);

    // Obtener estadísticas DESPUÉS de la simulación
    const homeTeamAfter = await db.getTeamStatistics(match.home_team_id);
    const awayTeamAfter = await db.getTeamStatistics(match.away_team_id);

    console.log('📊 ESTADÍSTICAS DESPUÉS DE LA SIMULACIÓN:');
    console.log(`${match.home_team_name}:`);
    console.log(`  - Partidos jugados: ${homeTeamAfter.matches_played || 0} (cambio: +${(homeTeamAfter.matches_played || 0) - (homeTeamBefore.matches_played || 0)})`);
    console.log(`  - Ganados: ${homeTeamAfter.matches_won || 0} (cambio: +${(homeTeamAfter.matches_won || 0) - (homeTeamBefore.matches_won || 0)})`);
    console.log(`  - Perdidos: ${homeTeamAfter.matches_lost || 0} (cambio: +${(homeTeamAfter.matches_lost || 0) - (homeTeamBefore.matches_lost || 0)})`);
    console.log(`  - Puntos: ${homeTeamAfter.points || 0} (cambio: +${(homeTeamAfter.points || 0) - (homeTeamBefore.points || 0)})`);
    
    console.log(`${match.away_team_name}:`);
    console.log(`  - Partidos jugados: ${awayTeamAfter.matches_played || 0} (cambio: +${(awayTeamAfter.matches_played || 0) - (awayTeamBefore.matches_played || 0)})`);
    console.log(`  - Ganados: ${awayTeamAfter.matches_won || 0} (cambio: +${(awayTeamAfter.matches_won || 0) - (awayTeamBefore.matches_won || 0)})`);
    console.log(`  - Perdidos: ${awayTeamAfter.matches_lost || 0} (cambio: +${(awayTeamAfter.matches_lost || 0) - (awayTeamBefore.matches_lost || 0)})`);
    console.log(`  - Puntos: ${awayTeamAfter.points || 0} (cambio: +${(awayTeamAfter.points || 0) - (awayTeamBefore.points || 0)})\n`);

    // Verificar que los cambios sean correctos
    const homePlayedChange = (homeTeamAfter.matches_played || 0) - (homeTeamBefore.matches_played || 0);
    const awayPlayedChange = (awayTeamAfter.matches_played || 0) - (awayTeamBefore.matches_played || 0);

    console.log('🔍 VERIFICACIÓN:');
    
    if (homePlayedChange === 1 && awayPlayedChange === 1) {
      console.log('✅ Correcto: Ambos equipos aumentaron exactamente 1 partido jugado');
    } else {
      console.log(`❌ Error: Cambios incorrectos en partidos jugados (${match.home_team_name}: +${homePlayedChange}, ${match.away_team_name}: +${awayPlayedChange})`);
    }

    // Verificar ganador
    const winner = homeScore > awayScore ? 'home' : 'away';
    const homeWonChange = (homeTeamAfter.matches_won || 0) - (homeTeamBefore.matches_won || 0);
    const awayWonChange = (awayTeamAfter.matches_won || 0) - (awayTeamBefore.matches_won || 0);

    if (winner === 'home' && homeWonChange === 1 && awayWonChange === 0) {
      console.log(`✅ Correcto: ${match.home_team_name} ganó y se actualizó correctamente`);
    } else if (winner === 'away' && awayWonChange === 1 && homeWonChange === 0) {
      console.log(`✅ Correcto: ${match.away_team_name} ganó y se actualizó correctamente`);
    } else {
      console.log(`❌ Error: Cambios incorrectos en partidos ganados`);
    }

    // Verificar estado del partido
    const updatedMatch = await db.getMatchById(match.id);
    if (updatedMatch.status === 'finished') {
      console.log('✅ Correcto: El partido se marcó como "finished"');
    } else {
      console.log(`❌ Error: El partido debería estar "finished" pero está "${updatedMatch.status}"`);
    }

    // Verificar que las predicciones se resolvieron
    const predictions = await db.getPredictionsByMatch(match.id);
    const resolvedPredictions = predictions.filter(p => p.status === 'resolved');
    console.log(`✅ Predicciones resueltas: ${resolvedPredictions.length}/${predictions.length}`);

    console.log('\n🎉 Prueba completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await Database.close();
  }
}

// Ejecutar la prueba
testTeamStatsUpdate();
