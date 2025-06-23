// Validación completa del sistema de inicialización automática
import { virtualTimeManager } from './virtualTimeManager';
import { standingsCalculator } from './standingsCalculator';
import { Match, Team, Standing } from '@/types/league';

export class ValidacionCompleta {
  async validarInicializacionCompleta(): Promise<boolean> {
    console.log('🔍 INICIANDO VALIDACIÓN COMPLETA DEL SISTEMA');
    console.log('=' .repeat(60));

    try {
      // 1. Verificar que existe una temporada activa
      const temporadaActiva = virtualTimeManager.getTemporadaActivaOInicializar();
      if (!temporadaActiva) {
        console.log('❌ ERROR: No hay temporada activa');
        return false;
      }
      console.log('✅ Temporada activa encontrada:', temporadaActiva.name);

      // 2. Verificar que existen equipos
      const equipos = temporadaActiva.equipos;
      if (!equipos || equipos.length === 0) {
        console.log('❌ ERROR: No hay equipos creados');
        return false;
      }
      console.log('✅ Equipos creados:', equipos.length);

      // 3. Verificar que existen partidos
      const partidos = temporadaActiva.partidos;
      if (!partidos || partidos.length === 0) {
        console.log('❌ ERROR: No hay partidos creados');
        return false;
      }
      console.log('✅ Partidos creados:', partidos.length);

      // 4. Verificar que todos los partidos están programados
      const partidosProgramados = partidos.filter((p: Match) => p.status === 'scheduled');
      if (partidosProgramados.length === 0) {
        console.log('❌ ERROR: No hay partidos programados');
        return false;
      }
      console.log('✅ Partidos programados:', partidosProgramados.length);

      // 5. Verificar que las fechas de los partidos son válidas
      const fechasValidas = partidos.every((p: Match) => 
        p.fecha && !isNaN(new Date(p.fecha).getTime())
      );
      if (!fechasValidas) {
        console.log('❌ ERROR: Algunas fechas de partidos son inválidas');
        return false;
      }
      console.log('✅ Todas las fechas de partidos son válidas');

      // 6. Verificar que existe una tabla de posiciones
      const tablaPosiciones = standingsCalculator.calculateStandings(equipos, partidos);
      if (!tablaPosiciones || tablaPosiciones.length === 0) {
        console.log('❌ ERROR: No hay tabla de posiciones');
        return false;
      }
      console.log('✅ Tabla de posiciones creada:', tablaPosiciones.length, 'equipos');

      // 7. Verificar el estado del localStorage
      const estadoLocalStorage = this.verificarLocalStorage();
      if (!estadoLocalStorage) {
        console.log('❌ ERROR: Problemas con el localStorage');
        return false;
      }
      console.log('✅ localStorage correctamente inicializado');

      console.log('=' .repeat(60));
      console.log('🎉 VALIDACIÓN COMPLETA EXITOSA - SISTEMA TOTALMENTE FUNCIONAL');
      console.log('=' .repeat(60));

      return true;
    } catch (error) {
      console.error('❌ ERROR durante la validación:', error);
      return false;
    }
  }

  private verificarLocalStorage(): boolean {
    try {
      const keys = ['quidditch_virtual_time_state'];
      const missingKeys = keys.filter(key => !localStorage.getItem(key));
      
      if (missingKeys.length > 0) {
        console.log('❌ Claves faltantes en localStorage:', missingKeys);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verificando localStorage:', error);
      return false;
    }
  }

  mostrarEstadoDetallado(): void {
    console.log('📊 ESTADO DETALLADO DEL SISTEMA');
    console.log('=' .repeat(60));

    const temporada = virtualTimeManager.getTemporadaActivaOInicializar();
    const equipos = temporada.equipos;
    const partidos = temporada.partidos;
    const tabla = standingsCalculator.calculateStandings(equipos, partidos);

    if (temporada) {
      console.log('🏆 Temporada:', temporada.name);
      console.log('📅 Fecha inicio:', new Date(temporada.startDate).toLocaleDateString());
      console.log('📅 Fecha fin:', new Date(temporada.endDate).toLocaleDateString());
    }

    console.log('🏠 Equipos (' + equipos.length + '):');
    equipos.forEach((equipo: Team) => {
      console.log(`  - ${equipo.name} (${equipo.house || 'Sin casa'})`);
    });

    console.log('⚡ Partidos por estado:');
    const estadosPartidos = partidos.reduce((acc: Record<string, number>, partido: Match) => {
      acc[partido.status] = (acc[partido.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(estadosPartidos).forEach(([estado, cantidad]) => {
      console.log(`  - ${estado}: ${cantidad}`);
    });    console.log('📊 Tabla de posiciones:');
    tabla.slice(0, 5).forEach((equipo: Standing, index: number) => {
      const teamName = equipo.team?.name || temporada.equipos.find(t => t.id === equipo.teamId)?.name || equipo.teamId;
      console.log(`  ${index + 1}. ${teamName} - ${equipo.points} pts`);
    });

    console.log('=' .repeat(60));
  }

  async resetearYValidar(): Promise<boolean> {
    console.log('🔄 RESETEANDO SISTEMA COMPLETO...');
    
    // Resetear usando el método del VirtualTimeManager
    virtualTimeManager.resetCompleto();
    
    // Esperar un momento para que se complete la inicialización
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Validar nuevamente
    return await this.validarInicializacionCompleta();
  }
}

// Crear instancia global para uso en consola del navegador
declare global {
  interface Window {
    validacionQuidditch: ValidacionCompleta;
  }
}

// Exportar para uso en main.tsx
export const validacionCompleta = new ValidacionCompleta();

// Hacer disponible en window para pruebas manuales
if (typeof window !== 'undefined') {
  window.validacionQuidditch = validacionCompleta;
}
