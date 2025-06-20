import { Season, Match, MatchState } from '@/types/league';
import { quidditchSimulator } from './quidditchSimulator';
import { liveMatchSimulator } from './liveMatchSimulator';

/**
 * Virtual Time Manager
 * Handles the virtual time system for controlled match simulation
 * Following the interactive mode approach: user controls when matches happen
 */

export interface VirtualTimeState {
  fechaVirtualActual: Date;
  temporadaActiva: Season | null;
  partidosSimulados: Set<string>;
  partidosEnVivo: Map<string, MatchState>;
  velocidadSimulacion: 'lento' | 'medio' | 'rapido';
  modoAutomatico: boolean;
}

export interface TimeAdvanceOptions {
  dias?: number;
  horas?: number;
  hastaProximoPartido?: boolean;
  simularPartidosPendientes?: boolean;
}

export class VirtualTimeManager {
  private state: VirtualTimeState;
  private readonly STORAGE_KEY = 'quidditch_virtual_time_state';

  constructor() {
    this.state = this.loadState();
  }

  /**
   * Obtiene el estado actual del tiempo virtual
   */
  getState(): VirtualTimeState {
    return { ...this.state };
  }

  /**
   * Obtiene la fecha virtual actual
   */
  getFechaVirtualActual(): Date {
    return new Date(this.state.fechaVirtualActual);
  }

  /**
   * Establece una nueva temporada activa
   */
  setTemporadaActiva(temporada: Season): void {
    this.state.temporadaActiva = temporada;
    
    // Si no hay fecha virtual establecida, usar el inicio de la temporada
    if (!this.state.fechaVirtualActual) {
      this.state.fechaVirtualActual = new Date(temporada.startDate);
    }
    
    this.saveState();
  }

  /**
   * Avanza el tiempo virtual
   */
  async avanzarTiempo(options: TimeAdvanceOptions = {}): Promise<{
    nuevaFecha: Date;
    partidosDisparados: Match[];
    partidosSimulados: Match[];
  }> {
    if (!this.state.temporadaActiva) {
      throw new Error('No hay temporada activa');
    }

    const fechaAnterior = new Date(this.state.fechaVirtualActual);
    let nuevaFecha: Date;

    if (options.hastaProximoPartido) {
      nuevaFecha = this.calcularFechaProximoPartido();
    } else {
      const diasAvanzar = options.dias || 1;
      const horasAvanzar = options.horas || 0;
      nuevaFecha = new Date(fechaAnterior);
      nuevaFecha.setDate(nuevaFecha.getDate() + diasAvanzar);
      nuevaFecha.setHours(nuevaFecha.getHours() + horasAvanzar);
    }

    // Actualizar fecha virtual
    this.state.fechaVirtualActual = nuevaFecha;

    // Obtener partidos que deben jugarse en este período
    const partidosDisparados = this.obtenerPartidosPendientes(fechaAnterior, nuevaFecha);
    
    let partidosSimulados: Match[] = [];
    
    if (options.simularPartidosPendientes !== false) {
      partidosSimulados = await this.simularPartidosPendientes(partidosDisparados);
    }

    this.saveState();

    return {
      nuevaFecha,
      partidosDisparados,
      partidosSimulados
    };
  }

  /**
   * Obtiene partidos pendientes entre dos fechas
   */
  private obtenerPartidosPendientes(fechaInicio: Date, fechaFin: Date): Match[] {
    if (!this.state.temporadaActiva) return [];

    return this.state.temporadaActiva.partidos.filter(partido => {
      const fechaPartido = new Date(partido.fecha);
      return fechaPartido > fechaInicio && 
             fechaPartido <= fechaFin && 
             !this.state.partidosSimulados.has(partido.id) &&
             partido.status === 'scheduled';
    });
  }

  /**
   * Simula partidos pendientes
   */
  private async simularPartidosPendientes(partidos: Match[]): Promise<Match[]> {
    const partidosSimulados: Match[] = [];

    for (const partido of partidos) {
      try {
        const equipoLocal = this.state.temporadaActiva!.equipos.find(t => t.id === partido.localId);
        const equipoVisitante = this.state.temporadaActiva!.equipos.find(t => t.id === partido.visitanteId);

        if (!equipoLocal || !equipoVisitante) {
          console.warn(`Equipos no encontrados para el partido ${partido.id}`);
          continue;
        }        // Simular el partido
        const resultado = quidditchSimulator.simulateMatch(equipoLocal, equipoVisitante);
        
        // Actualizar el partido con el resultado
        partido.homeScore = resultado.homeScore;
        partido.awayScore = resultado.awayScore;
        partido.status = 'finished';
        partido.events = resultado.events;
        partido.currentMinute = resultado.duration;

        // Marcar como simulado
        this.state.partidosSimulados.add(partido.id);
        partidosSimulados.push(partido);

        console.log(`✅ Partido simulado: ${equipoLocal.name} ${resultado.homeScore} - ${resultado.awayScore} ${equipoVisitante.name}`);

      } catch (error) {
        console.error(`Error simulando partido ${partido.id}:`, error);
      }
    }

    return partidosSimulados;
  }

  /**
   * Calcula la fecha del próximo partido
   */
  private calcularFechaProximoPartido(): Date {
    if (!this.state.temporadaActiva) {
      return new Date(this.state.fechaVirtualActual);
    }

    const proximoPartido = this.state.temporadaActiva.partidos
      .filter(p => new Date(p.fecha) > this.state.fechaVirtualActual && !this.state.partidosSimulados.has(p.id))
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())[0];

    return proximoPartido ? new Date(proximoPartido.fecha) : new Date(this.state.fechaVirtualActual);
  }

  /**
   * Obtiene partidos próximos basados en el tiempo virtual
   */
  getPartidosProximos(limite: number = 5): Match[] {
    if (!this.state.temporadaActiva) return [];

    return this.state.temporadaActiva.partidos
      .filter(partido => {
        const fechaPartido = new Date(partido.fecha);
        return fechaPartido > this.state.fechaVirtualActual && 
               !this.state.partidosSimulados.has(partido.id);
      })
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(0, limite);
  }

  /**
   * Obtiene partidos de hoy (en tiempo virtual)
   */
  getPartidosHoy(): Match[] {
    if (!this.state.temporadaActiva) return [];

    const hoy = new Date(this.state.fechaVirtualActual);
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finHoy = new Date(inicioHoy);
    finHoy.setDate(finHoy.getDate() + 1);

    return this.state.temporadaActiva.partidos.filter(partido => {
      const fechaPartido = new Date(partido.fecha);
      return fechaPartido >= inicioHoy && fechaPartido < finHoy;
    });
  }

  /**
   * Obtiene resultados recientes
   */
  getResultadosRecientes(limite: number = 10): Match[] {
    if (!this.state.temporadaActiva) return [];

    return this.state.temporadaActiva.partidos
      .filter(partido => this.state.partidosSimulados.has(partido.id))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, limite);
  }

  /**
   * Inicia simulación en vivo de un partido
   */
  async iniciarPartidoEnVivo(partidoId: string): Promise<MatchState | null> {
    if (!this.state.temporadaActiva) return null;

    const partido = this.state.temporadaActiva.partidos.find(p => p.id === partidoId);
    if (!partido) return null;

    const equipoLocal = this.state.temporadaActiva.equipos.find(t => t.id === partido.localId);
    const equipoVisitante = this.state.temporadaActiva.equipos.find(t => t.id === partido.visitanteId);

    if (!equipoLocal || !equipoVisitante) return null;    // Iniciar simulación en vivo
    const estadoPartido = liveMatchSimulator.startLiveMatch(
      partido, 
      equipoLocal, 
      equipoVisitante,
      90 // duración estándar
    );

    this.state.partidosEnVivo.set(partidoId, estadoPartido);
    
    return estadoPartido;
  }

  /**
   * Detiene simulación en vivo
   */
  detenerPartidoEnVivo(partidoId: string): void {
    liveMatchSimulator.stopMatch(partidoId);
    this.state.partidosEnVivo.delete(partidoId);
    this.state.partidosSimulados.add(partidoId);
    this.saveState();
  }

  /**
   * Simula toda la temporada restante
   */
  async simularTemporadaCompleta(): Promise<{
    partidosSimulados: Match[];
    fechaFinal: Date;
  }> {
    if (!this.state.temporadaActiva) {
      throw new Error('No hay temporada activa');
    }

    const fechaFinal = new Date(this.state.temporadaActiva.endDate);
    const resultado = await this.avanzarTiempo({
      hastaProximoPartido: false,
      simularPartidosPendientes: true
    });

    // Avanzar hasta el final de la temporada
    this.state.fechaVirtualActual = fechaFinal;
    
    // Simular todos los partidos restantes
    const partidosRestantes = this.state.temporadaActiva.partidos.filter(
      p => !this.state.partidosSimulados.has(p.id)
    );

    const partidosSimulados = await this.simularPartidosPendientes(partidosRestantes);

    this.saveState();

    return {
      partidosSimulados: [...resultado.partidosSimulados, ...partidosSimulados],
      fechaFinal
    };
  }

  /**
   * Reinicia el tiempo virtual
   */
  reiniciarTiempo(): void {
    if (this.state.temporadaActiva) {
      this.state.fechaVirtualActual = new Date(this.state.temporadaActiva.startDate);
    }
    this.state.partidosSimulados.clear();
    this.state.partidosEnVivo.clear();
    
    // Reiniciar estado de partidos
    if (this.state.temporadaActiva) {
      this.state.temporadaActiva.partidos.forEach(partido => {
        partido.status = 'scheduled';
        partido.homeScore = 0;
        partido.awayScore = 0;
        partido.eventos = [];
        partido.snitchCaught = false;
      });
    }

    this.saveState();
  }

  /**
   * Establece la velocidad de simulación
   */
  setVelocidadSimulacion(velocidad: 'lento' | 'medio' | 'rapido'): void {
    this.state.velocidadSimulacion = velocidad;
    this.saveState();
  }

  /**
   * Activa/desactiva modo automático
   */
  setModoAutomatico(automatico: boolean): void {
    this.state.modoAutomatico = automatico;
    this.saveState();
  }

  /**
   * Carga el estado desde localStorage
   */
  private loadState(): VirtualTimeState {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          fechaVirtualActual: new Date(parsed.fechaVirtualActual),
          partidosSimulados: new Set(parsed.partidosSimulados || []),
          partidosEnVivo: new Map(parsed.partidosEnVivo || []),
          temporadaActiva: parsed.temporadaActiva ? {
            ...parsed.temporadaActiva,
            startDate: new Date(parsed.temporadaActiva.startDate),
            endDate: new Date(parsed.temporadaActiva.endDate),
            partidos: parsed.temporadaActiva.partidos?.map((p: Match) => ({
              ...p,
              fecha: new Date(p.fecha)
            })) || []
          } : null
        };
      }
    } catch (error) {
      console.error('Error loading virtual time state:', error);
    }

    // Estado por defecto
    return {
      fechaVirtualActual: new Date(),
      temporadaActiva: null,
      partidosSimulados: new Set(),
      partidosEnVivo: new Map(),
      velocidadSimulacion: 'medio',
      modoAutomatico: false
    };
  }

  /**
   * Guarda el estado en localStorage
   */
  private saveState(): void {
    try {
      const stateToSave = {
        ...this.state,
        partidosSimulados: Array.from(this.state.partidosSimulados),
        partidosEnVivo: Array.from(this.state.partidosEnVivo.entries()),
        temporadaActiva: this.state.temporadaActiva ? {
          ...this.state.temporadaActiva,
          partidos: this.state.temporadaActiva.partidos?.map(p => ({
            ...p,
            fecha: p.fecha.toISOString()
          })) || []
        } : null
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving virtual time state:', error);
    }
  }
}

// Export singleton instance
export const virtualTimeManager = new VirtualTimeManager();
