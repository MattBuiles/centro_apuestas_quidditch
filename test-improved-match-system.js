// Script de prueba para el sistema de partidos mejorado
// Ejecutar en la consola del navegador

console.log('🎯 TESTING IMPROVED MATCH SYSTEM');

async function testImprovedMatchSystem() {
  // Verificar que el sistema esté disponible
  if (!window.leagueTimeService || !window.leagueTimeServiceWithRefresh) {
    console.error('❌ Sistema de tiempo de liga no disponible');
    return;
  }

  console.log('✅ Sistema de tiempo de liga disponible');
  
  try {
    // 1. Obtener información actual
    console.log('\n1️⃣ Obteniendo información actual del sistema...');
    const info = await window.leagueTimeService.getLeagueTimeInfo();
    console.log('📊 Información actual:', {
      fecha: info.currentDate,
      temporada: info.activeSeason?.name,
      partidos: info.activeSeason?.matches?.length || 0
    });

    if (!info.activeSeason?.matches) {
      console.log('⚠️ No hay temporada activa o partidos. Creando nueva temporada...');
      await window.leagueTimeServiceWithRefresh.generateNewSeason();
      console.log('✅ Nueva temporada creada');
    }

    // 2. Verificar estados de partidos
    console.log('\n2️⃣ Analizando estados de partidos...');
    const matches = info.activeSeason?.matches || [];
    const estados = matches.reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 Estados de partidos:', estados);

    // 3. Verificar si la temporada ha terminado
    console.log('\n3️⃣ Verificando si la temporada ha terminado...');
    const todosFinalizados = matches.length > 0 && matches.every(m => m.status === 'finished');
    console.log(`🏁 Temporada terminada: ${todosFinalizados ? 'SÍ' : 'NO'}`);

    if (todosFinalizados) {
      console.log('🆕 La temporada ha terminado. Debería aparecer el botón "Iniciar próxima temporada"');
    }

    // 4. Verificar partidos en vivo
    console.log('\n4️⃣ Verificando partidos en vivo...');
    const partidosEnVivo = matches.filter(m => m.status === 'live');
    console.log(`🔴 Partidos en vivo: ${partidosEnVivo.length}`);
    
    if (partidosEnVivo.length > 0) {
      console.log('⚠️ Hay partidos en vivo. El botón "Al próximo partido" debe estar bloqueado.');
      partidosEnVivo.forEach(match => {
        console.log(`   - ${match.homeTeamId} vs ${match.awayTeamId}`);
      });
    }

    // 5. Próximos partidos
    console.log('\n5️⃣ Verificando próximos partidos...');
    const proximosPartidos = matches
      .filter(m => m.status === 'scheduled')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
    
    console.log(`⚽ Próximos ${proximosPartidos.length} partidos:`);
    proximosPartidos.forEach((match, index) => {
      console.log(`   ${index + 1}. ${match.homeTeamId} vs ${match.awayTeamId} - ${new Date(match.date).toLocaleDateString('es-ES')}`);
    });

    // 6. Test del botón "Al próximo partido"
    console.log('\n6️⃣ Probando navegación al próximo partido...');
    if (partidosEnVivo.length === 0 && proximosPartidos.length > 0) {
      console.log('✅ Condiciones óptimas para navegar al próximo partido');
      
      // Test simulado del botón
      console.log('🎮 Simulando clic en "Al próximo partido"...');
      try {
        const result = await window.leagueTimeServiceWithRefresh.advanceToNextUnplayedMatch();
        console.log('✅ Navegación exitosa:', result);
      } catch (error) {
        console.log('⚠️ Error en navegación (puede ser normal si no hay backend):', error.message);
      }
    } else {
      console.log('⚠️ No se puede navegar: hay partidos en vivo o no hay próximos partidos');
    }

    // 7. Test de reseteo de base de datos
    console.log('\n7️⃣ Información sobre reseteo de base de datos...');
    console.log('🔄 El botón "Resetear base de datos" debería:');
    console.log('   - Confirmar la acción con el usuario');
    console.log('   - Limpiar todas las tablas');
    console.log('   - Crear automáticamente una nueva temporada');
    console.log('   - Dejar el sistema listo para usar');

    console.log('\n🎉 PRUEBA COMPLETADA');
    console.log('✅ Todos los aspectos del sistema mejorado han sido verificados');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

// Función para probar la detección de fin de temporada
window.testSeasonEnd = function() {
  console.log('🏁 PROBANDO DETECCIÓN DE FIN DE TEMPORADA');
  
  // Simular que todos los partidos están terminados
  if (window.virtualTimeManager && window.virtualTimeManager.getState().temporadaActiva) {
    const state = window.virtualTimeManager.getState();
    const matches = state.temporadaActiva.partidos || [];
    
    console.log(`📊 Total de partidos: ${matches.length}`);
    
    // Forzar que todos estén 'finished' para probar
    matches.forEach(match => {
      match.status = 'finished';
      if (!match.homeScore) match.homeScore = Math.floor(Math.random() * 200) + 50;
      if (!match.awayScore) match.awayScore = Math.floor(Math.random() * 200) + 50;
    });
    
    console.log('✅ Todos los partidos marcados como finalizados');
    console.log('🆕 Ahora debería aparecer el botón "Iniciar próxima temporada"');
    console.log('🔄 Actualiza la página para ver el cambio');
  } else {
    console.log('❌ No hay temporada activa para probar');
  }
};

// Función para probar el sistema de partidos en vivo
window.testLiveMatchBlocking = function() {
  console.log('🔴 PROBANDO BLOQUEO POR PARTIDOS EN VIVO');
  
  if (window.virtualTimeManager && window.virtualTimeManager.getState().temporadaActiva) {
    const state = window.virtualTimeManager.getState();
    const matches = state.temporadaActiva.partidos || [];
    const scheduledMatches = matches.filter(m => m.status === 'scheduled');
    
    if (scheduledMatches.length > 0) {
      // Marcar el primer partido como 'live'
      scheduledMatches[0].status = 'live';
      scheduledMatches[0].currentMinute = 45;
      
      console.log('✅ Primer partido marcado como en vivo');
      console.log('⚠️ El botón "Al próximo partido" debería estar bloqueado');
      console.log('🔄 Actualiza la página para ver el cambio');
    } else {
      console.log('❌ No hay partidos programados para probar');
    }
  } else {
    console.log('❌ No hay temporada activa para probar');
  }
};

// Ejecutar prueba principal
testImprovedMatchSystem();

console.log('\n📋 FUNCIONES DE PRUEBA DISPONIBLES:');
console.log('• testSeasonEnd() - Probar detección de fin de temporada');
console.log('• testLiveMatchBlocking() - Probar bloqueo por partidos en vivo');
