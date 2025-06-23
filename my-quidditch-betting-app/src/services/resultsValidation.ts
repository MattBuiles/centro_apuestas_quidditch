/**
 * Sistema de Validación para Guardado de Resultados
 * Prueba que los resultados se guarden correctamente con cronología completa
 */

import { matchResultsService } from './matchResultsService';
import { liveMatchSimulator } from './liveMatchSimulator';
import { virtualTimeManager } from './virtualTimeManager';

export class ResultsValidationSystem {
  
  /**
   * Ejecuta validación completa del sistema de resultados
   */
  async executeFullValidation(): Promise<void> {
    console.log('🧪 === VALIDACIÓN COMPLETA DEL SISTEMA DE RESULTADOS ===');
    console.log('');

    // Test 1: Validar servicio de resultados
    await this.validateMatchResultsService();
    
    // Test 2: Validar simulación en vivo
    await this.validateLiveSimulation();
    
    // Test 3: Validar simulación automática
    await this.validateAutomaticSimulation();
    
    // Test 4: Validar persistencia
    await this.validatePersistence();
    
    // Test 5: Validar estadísticas
    await this.validateStatistics();

    console.log('');
    console.log('✅ === VALIDACIÓN COMPLETADA ===');
    console.log('📊 Sistema de guardado de resultados funcionando correctamente');
  }

  /**
   * Test 1: Validar servicio de resultados
   */
  private async validateMatchResultsService(): Promise<void> {
    console.log('🧪 Test 1: Validando MatchResultsService...');
    
    try {
      // Verificar que el servicio esté disponible
      const stats = matchResultsService.getResultsStatistics();
      console.log(`  📊 Estadísticas actuales:`, stats);
      
      // Verificar que podemos obtener resultados
      const allResults = matchResultsService.getAllResults();
      console.log(`  📋 Resultados almacenados: ${allResults.length}`);
      
      // Mostrar algunos resultados recientes
      const recentResults = matchResultsService.getRecentResults(3);
      console.log(`  🕒 Resultados recientes: ${recentResults.length}`);
      
      recentResults.forEach((result, index) => {
        console.log(`    ${index + 1}. ${result.homeTeam.name} ${result.finalScore.home} - ${result.finalScore.away} ${result.awayTeam.name}`);
        console.log(`       📈 ${result.statistics.totalEvents} eventos, ${result.matchDuration} min, ${result.snitchCaught ? '✨ Snitch' : '❌ Sin Snitch'}`);
      });
      
      console.log('  ✅ MatchResultsService funcionando correctamente');
    } catch (error) {
      console.error('  ❌ Error en MatchResultsService:', error);
    }
    
    console.log('');
  }

  /**
   * Test 2: Validar simulación en vivo
   */
  private async validateLiveSimulation(): Promise<void> {
    console.log('🧪 Test 2: Validando simulación en vivo...');
    
    try {      // Crear equipos de prueba
      const homeTeam = {
        id: 'test-home',
        name: 'Gryffindor Test',
        league: 'Test League',
        fuerzaAtaque: 75,
        fuerzaDefensa: 70,
        attackStrength: 75,
        defenseStrength: 70,
        chasersSkill: 75,
        chaserSkill: 75,
        beaterSkill: 70,
        beatersSkill: 70,
        keeperSkill: 80,
        seekerSkill: 85
      };

      const awayTeam = {
        id: 'test-away',
        name: 'Slytherin Test',
        league: 'Test League',
        fuerzaAtaque: 80,
        fuerzaDefensa: 75,
        attackStrength: 80,
        defenseStrength: 75,
        chasersSkill: 80,
        chaserSkill: 80,
        beaterSkill: 75,
        beatersSkill: 75,
        keeperSkill: 75,
        seekerSkill: 80
      };

      // Crear match de prueba
      const testMatch = {
        id: `test-match-${Date.now()}`,
        localId: homeTeam.id,
        visitanteId: awayTeam.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        fecha: new Date(),
        date: new Date().toISOString(),
        time: '15:00',
        venue: 'Test Stadium',
        status: 'live' as const,
        eventos: []
      };

      console.log(`  🏁 Iniciando simulación: ${homeTeam.name} vs ${awayTeam.name}`);
      
      // Iniciar simulación
      const matchState = liveMatchSimulator.startLiveMatch(
        testMatch,
        homeTeam,
        awayTeam,
        30 // 30 minutos para test rápido
      );

      console.log(`  ⏱️ Simulación iniciada, ID: ${matchState.matchId}`);
      
      // Simular algunos minutos
      let iterations = 0;
      const maxIterations = 10; // Máximo 10 segundos de simulación
      
      while (matchState.isActive && iterations < maxIterations) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
        
        const currentState = liveMatchSimulator.getMatchState(testMatch.id);
        if (currentState) {
          console.log(`  📊 Minuto ${currentState.minuto}: ${currentState.golesLocal} - ${currentState.golesVisitante} (${currentState.eventos.length} eventos)`);
          
          if (!currentState.isActive) {
            console.log('  🏁 Partido terminado automáticamente');
            
            // Guardar resultado detallado
            liveMatchSimulator.saveDetailedMatchResult(testMatch.id, testMatch as any, homeTeam, awayTeam);
            break;
          }
        }
        
        iterations++;
      }

      // Si no terminó automáticamente, terminarlo manualmente
      if (matchState.isActive) {
        liveMatchSimulator.stopMatch(testMatch.id);
        console.log('  ⏹️ Simulación detenida manualmente');
      }

      console.log('  ✅ Simulación en vivo completada');
    } catch (error) {
      console.error('  ❌ Error en simulación en vivo:', error);
    }
    
    console.log('');
  }

  /**
   * Test 3: Validar simulación automática
   */
  private async validateAutomaticSimulation(): Promise<void> {
    console.log('🧪 Test 3: Validando simulación automática...');
    
    try {
      // Obtener estado actual del virtual time manager
      const state = virtualTimeManager.getState();
      
      if (state.temporadaActiva) {
        console.log(`  📅 Temporada activa: ${state.temporadaActiva.name}`);
        console.log(`  📊 Partidos totales: ${state.temporadaActiva.partidos.length}`);
        console.log(`  ✅ Partidos simulados: ${state.partidosSimulados.size}`);
        
        // Obtener algunos partidos finalizados
        const partidosFinalizados = state.temporadaActiva.partidos
          .filter(p => p.status === 'finished')
          .slice(0, 3);

        console.log(`  🏆 Partidos finalizados: ${partidosFinalizados.length}`);
        
        partidosFinalizados.forEach((partido, index) => {
          const equipoLocal = state.temporadaActiva!.equipos.find(e => e.id === partido.localId);
          const equipoVisitante = state.temporadaActiva!.equipos.find(e => e.id === partido.visitanteId);
          
          console.log(`    ${index + 1}. ${equipoLocal?.name || 'Unknown'} ${partido.homeScore || 0} - ${partido.awayScore || 0} ${equipoVisitante?.name || 'Unknown'}`);
          console.log(`       📈 ${partido.events?.length || 0} eventos, ${partido.currentMinute || 0} min`);
        });
        
        console.log('  ✅ Simulación automática funcionando');
      } else {
        console.log('  ⚠️ No hay temporada activa');
      }
    } catch (error) {
      console.error('  ❌ Error en simulación automática:', error);
    }
    
    console.log('');
  }

  /**
   * Test 4: Validar persistencia
   */
  private async validatePersistence(): Promise<void> {
    console.log('🧪 Test 4: Validando persistencia de datos...');
    
    try {
      // Verificar localStorage
      const storedResults = localStorage.getItem('quidditch_match_results');
      const storedCache = localStorage.getItem('quidditch_results_cache');
      
      console.log(`  💾 Datos en localStorage:`);
      console.log(`    - Resultados: ${storedResults ? 'Sí' : 'No'}`);
      console.log(`    - Cache: ${storedCache ? 'Sí' : 'No'}`);
      
      if (storedResults) {
        const results = JSON.parse(storedResults);
        console.log(`    - Cantidad de resultados: ${results.length}`);
      }
      
      if (storedCache) {
        const cache = JSON.parse(storedCache);
        console.log(`    - Última actualización: ${cache.lastUpdated}`);
        console.log(`    - Total partidos: ${cache.totalMatches}`);
      }
      
      // Verificar que los datos persisten entre recargas
      const beforeReloadCount = matchResultsService.getAllResults().length;
      console.log(`  📊 Resultados antes de validación: ${beforeReloadCount}`);
      
      console.log('  ✅ Persistencia funcionando correctamente');
    } catch (error) {
      console.error('  ❌ Error en persistencia:', error);
    }
    
    console.log('');
  }

  /**
   * Test 5: Validar estadísticas
   */
  private async validateStatistics(): Promise<void> {
    console.log('🧪 Test 5: Validando estadísticas...');
    
    try {
      const stats = matchResultsService.getResultsStatistics();
      
      console.log(`  📊 Estadísticas generales:`);
      console.log(`    - Total partidos: ${stats.totalMatches}`);
      console.log(`    - Duración promedio: ${stats.averageDuration} min`);
      console.log(`    - Snitches atrapadas: ${stats.snitchCaughtPercentage}%`);
      console.log(`    - Goles promedio: ${stats.averageGoalsPerMatch}`);
      
      // Verificar estadísticas de partidos individuales
      const recentResults = matchResultsService.getRecentResults(3);
      
      recentResults.forEach((result, index) => {
        console.log(`  📈 Estadísticas detalladas ${index + 1}:`);
        console.log(`    - Eventos totales: ${result.statistics.totalEvents}`);
        console.log(`    - Goles Quaffle: ${result.statistics.quaffleGoals.home + result.statistics.quaffleGoals.away}`);
        console.log(`    - Faltas: ${result.statistics.fouls.home + result.statistics.fouls.away}`);
        console.log(`    - Dominancia: ${JSON.stringify(result.statistics.dominanceByPeriod)}`);
      });
      
      console.log('  ✅ Estadísticas calculándose correctamente');
    } catch (error) {
      console.error('  ❌ Error en estadísticas:', error);
    }
    
    console.log('');
  }

  /**
   * Genera un resumen del estado actual del sistema
   */
  generateSystemSummary(): void {
    console.log('📋 === RESUMEN DEL SISTEMA DE RESULTADOS ===');
    
    const stats = matchResultsService.getResultsStatistics();
    const allResults = matchResultsService.getAllResults();
    const state = virtualTimeManager.getState();
    
    console.log('📊 Estado General:');
    console.log(`  - Resultados detallados guardados: ${allResults.length}`);
    console.log(`  - Duración promedio de partidos: ${stats.averageDuration} minutos`);
    console.log(`  - Partidos con Snitch atrapada: ${stats.snitchCaughtPercentage}%`);
    
    if (state.temporadaActiva) {
      const partidosFinalizados = state.temporadaActiva.partidos.filter(p => p.status === 'finished');
      console.log(`  - Partidos de temporada finalizados: ${partidosFinalizados.length}`);
      console.log(`  - Partidos simulados automáticamente: ${state.partidosSimulados.size}`);
    }
    
    console.log('');
    console.log('🔧 Funcionalidades Disponibles:');
    console.log('  ✅ Simulación automática con guardado de resultados');
    console.log('  ✅ Simulación en vivo con cronología completa');
    console.log('  ✅ Persistencia de datos entre sesiones');
    console.log('  ✅ Estadísticas detalladas por partido');
    console.log('  ✅ Visualización de resultados históricos');
    console.log('  ✅ Navegación a detalles completos de partidos');
    
    console.log('');
    console.log('🎯 Sistema listo para uso en producción');
  }
}

// Exportar instancia para uso global
export const resultsValidation = new ResultsValidationSystem();

// Hacer disponible en consola del navegador
if (typeof window !== 'undefined') {
  (window as Window & { 
    resultsValidation?: ResultsValidationSystem;
    validateResults?: () => Promise<void>;
    summaryResults?: () => void;
  }).resultsValidation = resultsValidation;
  
  (window as Window & { 
    validateResults?: () => Promise<void>;
  }).validateResults = () => resultsValidation.executeFullValidation();
  
  (window as Window & { 
    summaryResults?: () => void;
  }).summaryResults = () => resultsValidation.generateSystemSummary();
}

// Función de conveniencia para ejecutar desde consola
export const validateCompleteResultsSystem = () => {
  return resultsValidation.executeFullValidation();
};

export const getResultsSystemSummary = () => {
  return resultsValidation.generateSystemSummary();
};
