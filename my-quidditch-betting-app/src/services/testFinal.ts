// Test final - Verificación manual del sistema
console.log('🎯 INICIANDO TEST FINAL - VERIFICACIÓN MANUAL DEL SISTEMA');
console.log('=' .repeat(80));

// Función para verificar el estado completo del sistema
function verificarSistemaCompleto() {
  console.log('📋 VERIFICACIÓN MANUAL DEL SISTEMA DE INICIALIZACIÓN AUTOMÁTICA');
  console.log('-' .repeat(60));
  
  try {
    // Verificar que window.debugQuidditch existe
    if (typeof window !== 'undefined' && 'debugQuidditch' in window) {
      console.log('✅ Debug tools disponibles en window.debugQuidditch');
    } else {
      console.log('❌ Debug tools NO disponibles');
    }
    
    // Verificar que window.validacionQuidditch existe
    if (typeof window !== 'undefined' && 'validacionQuidditch' in window) {
      console.log('✅ Validation tools disponibles en window.validacionQuidditch');
    } else {
      console.log('❌ Validation tools NO disponibles');
    }
    
    // Verificar localStorage
    if (typeof localStorage !== 'undefined') {
      const timeState = localStorage.getItem('quidditch_virtual_time_state');
      if (timeState) {
        console.log('✅ localStorage tiene datos del sistema');
        try {
          const parsed = JSON.parse(timeState);
          console.log('📊 Estado guardado:', {
            hasActiveSeason: !!parsed.temporadaActiva,
            virtualDate: parsed.fechaVirtualActual,
            matchesCount: parsed.temporadaActiva?.partidos?.length || 0
          });        } catch {
          console.log('❌ Error parseando datos de localStorage');
        }
      } else {
        console.log('❌ localStorage NO tiene datos del sistema');
      }
    }
    
    console.log('\n🎮 INSTRUCCIONES PARA PRUEBAS MANUALES:');
    console.log('-' .repeat(60));
    console.log('1. Para validar el sistema completo:');
    console.log('   window.validacionQuidditch.validarInicializacionCompleta()');
    console.log('');
    console.log('2. Para mostrar estado detallado:');
    console.log('   window.validacionQuidditch.mostrarEstadoDetallado()');
    console.log('');
    console.log('3. Para resetear y validar:');
    console.log('   window.validacionQuidditch.resetearYValidar()');
    console.log('');
    console.log('4. Para reset completo del sistema:');
    console.log('   window.debugQuidditch.resetCompleto()');
    console.log('');
    console.log('5. Para verificar tiempo virtual:');
    console.log('   window.debugQuidditch.verEstado()');
    console.log('');
    console.log('🎯 OBJETIVO: Verificar que en un navegador limpio (sin localStorage),');
    console.log('   el sistema crea automáticamente una temporada completa con partidos programados.');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

// Ejecutar verificación después de que el sistema se haya cargado
if (typeof window !== 'undefined') {
  setTimeout(verificarSistemaCompleto, 1000);
} else {
  // Si estamos en Node.js, solo logear
  console.log('ℹ️  Test ejecutándose en Node.js - verificación de browser pendiente');
}

export { verificarSistemaCompleto };
