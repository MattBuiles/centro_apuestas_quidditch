/**
 * Test de inicialización automática del sistema
 */
import { virtualTimeManager } from './virtualTimeManager';

export function testInicializacionAutomatica(): void {
  console.log('🧪 === TEST DE INICIALIZACIÓN AUTOMÁTICA ===');
  
  // Test 1: Verificar que el VirtualTimeManager está inicializado
  console.log('🧪 Test 1: Estado del VirtualTimeManager');
  const state = virtualTimeManager.getState();
  console.log('Estado actual:', {
    temporadaActiva: state.temporadaActiva ? '✅ SÍ' : '❌ NO',
    fechaVirtual: state.fechaVirtualActual.toISOString().split('T')[0],
    partidosSimulados: state.partidosSimulados.size
  });
  
  // Si no hay temporada, mostrar instrucciones de debug
  if (!state.temporadaActiva) {
    console.log('⚠️ ¡NO HAY TEMPORADA ACTIVA!');
    console.log('📋 Para solucionarlo, ejecuta en la consola:');
    console.log('   window.debugQuidditch.resetCompleto()');
    console.log('   Luego recarga la página');
    return;
  }
  
  // Test 2: Verificar datos de la temporada
  console.log('🧪 Test 2: Datos de la temporada');
  const temporada = state.temporadaActiva;
  console.log('Temporada encontrada:', {
    nombre: temporada.name,
    equipos: temporada.equipos?.length || 0,
    partidos: temporada.partidos?.length || 0,
    partidosProgramados: temporada.partidos?.filter(p => p.status === 'scheduled').length || 0,
    fechaInicio: temporada.startDate,
    fechaFin: temporada.endDate
  });
  
  // Test 3: Verificar algunos partidos
  if (temporada.partidos && temporada.partidos.length > 0) {
    console.log('🧪 Test 3: Primeros 3 partidos programados');
    const proximosPartidos = temporada.partidos
      .filter(p => p.status === 'scheduled')
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(0, 3);
    
    if (proximosPartidos.length > 0) {
      proximosPartidos.forEach((partido, index) => {
        const equipoLocal = temporada.equipos?.find(t => t.id === partido.localId);
        const equipoVisitante = temporada.equipos?.find(t => t.id === partido.visitanteId);
        console.log(`Partido ${index + 1}: ${equipoLocal?.name || 'N/A'} vs ${equipoVisitante?.name || 'N/A'} - ${new Date(partido.fecha).toISOString().split('T')[0]}`);
      });
    } else {
      console.log('⚠️ No se encontraron partidos programados');
    }
  } else {
    console.log('⚠️ No hay partidos en la temporada');
  }
  
  console.log('🧪 === FIN DEL TEST ===');
  console.log('📋 Herramientas disponibles: window.debugQuidditch');
}

// Ejecutar test automáticamente después de un pequeño delay
setTimeout(() => {
  testInicializacionAutomatica();
}, 1000);
