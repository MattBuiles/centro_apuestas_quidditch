// Script temporal para debugging de la página de partidos
// Ejecutar en la consola del navegador

console.log('🔍 DEBUGGING MATCHES PAGE');

// Verificar el estado del virtual time manager
const timeManager = window.debugQuidditch?.virtualTimeManager;
if (timeManager) {
  console.log('✅ VirtualTimeManager disponible');
  
  const state = timeManager.getState();
  console.log('📊 Estado actual:', {
    fechaVirtual: state.fechaVirtualActual,
    temporadaActiva: state.temporadaActiva ? 'SÍ' : 'NO',
    totalPartidos: state.temporadaActiva?.partidos?.length || 0
  });
  
  if (state.temporadaActiva) {
    const partidos = state.temporadaActiva.partidos || [];
    const fechaVirtual = state.fechaVirtualActual;
    
    console.log('📅 Análisis de partidos:');
    console.log('Fecha virtual actual:', fechaVirtual.toISOString());
    
    // Contar partidos por estado
    const porStatus = partidos.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Partidos por estado:', porStatus);
    
    // Verificar partidos próximos
    const proximosPartidos = partidos.filter(match => {
      const matchDate = new Date(match.fecha);
      return matchDate > fechaVirtual && match.status === 'scheduled';
    });
    
    console.log(`Partidos próximos encontrados: ${proximosPartidos.length}`);
    
    if (proximosPartidos.length > 0) {
      console.log('Primeros 5 partidos próximos:');
      proximosPartidos
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
        .slice(0, 5)
        .forEach((match, index) => {
          const homeTeam = state.temporadaActiva.equipos.find(t => t.id === match.localId);
          const awayTeam = state.temporadaActiva.equipos.find(t => t.id === match.visitanteId);
          console.log(`${index + 1}. ${homeTeam?.name} vs ${awayTeam?.name} - ${match.fecha.toISOString()}`);
        });
    } else {
      console.log('❌ NO HAY PARTIDOS PRÓXIMOS');
      console.log('🔍 Verificando problema de fechas...');
      
      // Verificar el rango de fechas de los partidos
      const fechasPartidos = partidos.map(p => new Date(p.fecha));
      const fechaMinima = new Date(Math.min(...fechasPartidos));
      const fechaMaxima = new Date(Math.max(...fechasPartidos));
      
      console.log('📅 Rango de fechas de partidos:', {
        minima: fechaMinima.toISOString(),
        maxima: fechaMaxima.toISOString()
      });
      
      console.log('🔍 Comparación de fechas:', {
        fechaVirtual: fechaVirtual.toISOString(),
        fechaVirtualEsAnterior: fechaVirtual < fechaMinima,
        fechaVirtualEsPosterior: fechaVirtual > fechaMaxima,
        solucionSugerida: fechaVirtual > fechaMaxima ? 'Fecha virtual está después de la temporada - necesita reinicializarse' : 'Fecha virtual está antes de la temporada - debería estar bien'
      });
      
      // Sugerir corrección
      if (fechaVirtual > fechaMaxima) {
        console.log('🔧 CORRECCIÓN NECESARIA: ejecutar timeManager.limpiarYReinicializar()');
      }
    }
    
    // Verificar partidos de hoy
    const today = new Date(fechaVirtual);
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const partidosHoy = partidos.filter(match => {
      const matchDate = new Date(match.fecha);
      return matchDate >= startOfDay && matchDate <= endOfDay;
    });
    
    console.log(`Partidos de hoy: ${partidosHoy.length}`);
    
    // Verificar el primer partido de la temporada
    const primerPartido = partidos
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())[0];
    
    if (primerPartido) {
      console.log('Primer partido de la temporada:', {
        fecha: primerPartido.fecha.toISOString(),
        diferenciaDias: Math.floor((new Date(primerPartido.fecha).getTime() - fechaVirtual.getTime()) / (1000 * 60 * 60 * 24))
      });
    }
  }
} else {
  console.log('❌ VirtualTimeManager no disponible');
}

// Función para corregir automáticamente el problema
window.fixMatchesProblem = function() {
  console.log('🔧 Aplicando corrección automática...');
  if (timeManager) {
    timeManager.limpiarYReinicializar();
    console.log('✅ Sistema reinicializado. Recarga la página para ver los cambios.');
  } else {
    console.log('❌ No se pudo acceder al VirtualTimeManager');
  }
};

console.log('💡 Para corregir automáticamente, ejecuta: fixMatchesProblem()');

// Verificar el componente de React
const matchesPageElement = document.querySelector('[data-testid="matches-page"]') || 
                           document.querySelector('.matchesPageContainer') ||
                           document.querySelector('.matches-page');

if (matchesPageElement) {
  console.log('✅ MatchesPage encontrada en DOM');
} else {
  console.log('❌ MatchesPage no encontrada en DOM');
}
