import { Season, Match, MatchState, Team } from '@/types/league';
import { quidditchSimulator } from './quidditchSimulator';
import { liveMatchSimulator } from './liveMatchSimulator';
import { quidditchLeagueManager } from './quidditchLeagueManager';

/**
 * Virtual Time Manager
 * Handles the virtual time system for controlled match simulation
 * Following the interactive mode approach: user controls when matches happen
 */

export interface SeasonHistory {
  id: string;
  name: string;
  numeroTemporada: number;
  fechaCompletada: string;
  startDate: Date;
  endDate: Date;
  equipos: Team[];
  partidos: Match[];
}

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
  private readonly STORAGE_KEY = 'quidditch_virtual_time_state';  constructor() {
    console.log('🔧 VirtualTimeManager: Inicializando constructor...');
    this.state = this.loadState();
    console.log('🔧 VirtualTimeManager: Estado cargado:', {
      temporadaActiva: this.state.temporadaActiva ? 'SÍ' : 'NO',
      fechaVirtual: this.state.fechaVirtualActual
    });
    
    // Si no hay temporada activa, crear una automáticamente
    // Usamos setTimeout para asegurar que todos los módulos estén cargados
    if (!this.state.temporadaActiva) {
      console.log('🔧 VirtualTimeManager: No hay temporada activa, programando inicialización...');
      setTimeout(() => {
        this.inicializarTemporadaInicial();
      }, 100);
    } else {
      console.log('🔧 VirtualTimeManager: Temporada ya existe:', this.state.temporadaActiva.name);
    }
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
        }        // Simular el partido con el ID correcto
        const resultado = quidditchSimulator.simulateMatch(equipoLocal, equipoVisitante, partido.id);
        
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
   * Avanza hasta el próximo partido y lo pone en estado "live" listo para simular
   */
  async avanzarHastaProximoPartidoEnVivo(): Promise<{
    nuevaFecha: Date;
    partidoEnVivo: Match | null;
    partidosSimulados: Match[];
  }> {
    if (!this.state.temporadaActiva) {
      throw new Error('No hay temporada activa');
    }

    const fechaAnterior = new Date(this.state.fechaVirtualActual);
    const nuevaFecha = this.calcularFechaProximoPartido();

    // Obtear partido que debe ponerse en vivo
    const proximoPartido = this.state.temporadaActiva.partidos.find(partido => {
      const fechaPartido = new Date(partido.fecha);
      return fechaPartido.getTime() === nuevaFecha.getTime() && 
             !this.state.partidosSimulados.has(partido.id) &&
             partido.status === 'scheduled';
    });

    // Simular partidos anteriores si los hay
    const partidosParaSimular = this.obtenerPartidosPendientes(fechaAnterior, nuevaFecha);
    const partidosSimulados = partidosParaSimular.filter(p => p.id !== proximoPartido?.id);
    
    await this.simularPartidosPendientes(partidosSimulados);

    // Actualizar fecha virtual
    this.state.fechaVirtualActual = nuevaFecha;

    // Poner el próximo partido en estado "live" si existe
    if (proximoPartido) {
      proximoPartido.status = 'live';
      proximoPartido.currentMinute = 0;
      proximoPartido.homeScore = 0;
      proximoPartido.awayScore = 0;
      proximoPartido.events = [];
    }

    this.saveState();

    return {
      nuevaFecha,
      partidoEnVivo: proximoPartido || null,
      partidosSimulados
    };
  }
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
   * Comienza la simulación en vivo de un partido que está listo
   */
  async comenzarPartidoEnVivo(partidoId: string): Promise<MatchState | null> {
    if (!this.state.temporadaActiva) return null;

    const partido = this.state.temporadaActiva.partidos.find(p => p.id === partidoId);
    if (!partido || partido.status !== 'live') return null;

    const equipoLocal = this.state.temporadaActiva.equipos.find(t => t.id === partido.localId);
    const equipoVisitante = this.state.temporadaActiva.equipos.find(t => t.id === partido.visitanteId);

    if (!equipoLocal || !equipoVisitante) return null;

    // Iniciar simulación en vivo
    const estadoPartido = liveMatchSimulator.startLiveMatch(
      partido, 
      equipoLocal, 
      equipoVisitante,
      90 // duración estándar
    );

    this.state.partidosEnVivo.set(partidoId, estadoPartido);
    this.saveState();
    
    return estadoPartido;
  }  /**
   * Finaliza un partido que estaba en estado live y lo marca como terminado
   */
  finalizarPartidoEnVivo(partidoId: string): void {
    const estado = this.state.partidosEnVivo.get(partidoId);
    if (!estado || !this.state.temporadaActiva) return;

    const partido = this.state.temporadaActiva.partidos.find(p => p.id === partidoId);
    if (!partido) return;

    // Actualizar partido con resultados finales
    partido.status = 'finished';
    partido.homeScore = estado.golesLocal;
    partido.awayScore = estado.golesVisitante;
    partido.events = estado.eventos;
    partido.currentMinute = estado.minuto;
    partido.snitchCaught = estado.snitchCaught;    // Resolve bets and predictions for the finished match
    console.log(`💰 Match ${partidoId} finished, resolving bets and predictions...`);
      // Determine match result for predictions
    const actualResult: 'home' | 'away' | 'draw' = 
      partido.homeScore! > partido.awayScore! ? 'home' :
      partido.awayScore! > partido.homeScore! ? 'away' : 'draw';
    
    console.log(`🏆 Match result determination for ${partidoId}:`);
    console.log(`   - Local team (home): ${partido.localId} - Score: ${partido.homeScore}`);
    console.log(`   - Visitante team (away): ${partido.visitanteId} - Score: ${partido.awayScore}`);
    console.log(`   - Determined result: ${actualResult}`);
    
    try {
      // Import services dynamically to avoid circular dependencies
      Promise.all([
        import('../services/betResolutionService'),
        import('../services/predictionsService')
      ]).then(([{ betResolutionService }, { predictionsService }]) => {
        // Resolve bets
        betResolutionService.resolveMatchBets(partidoId).then((results) => {
          console.log(`✅ Resolved ${results.length} bets for match ${partidoId}`);
          
          // Emit custom event for UI components to listen to
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('betsResolved', {
              detail: { matchId: partidoId, results }
            }));
          }
        }).catch((error) => {
          console.error('❌ Error resolving bets:', error);
        });

        // Update prediction results
        predictionsService.updatePredictionResult(partidoId, actualResult);
        console.log(`🔮 Updated prediction result for match ${partidoId}: ${actualResult}`);
        
        // Emit custom event for predictions update
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('predictionsUpdated', {
            detail: { matchId: partidoId, result: actualResult }
          }));
        }
      }).catch((error) => {
        console.error('❌ Error importing services:', error);
      });
    } catch (error) {
      console.error('❌ Error resolving match results:', error);
    }

    // Limpiar estado en vivo
    liveMatchSimulator.stopMatch(partidoId);
    this.state.partidosEnVivo.delete(partidoId);
    this.state.partidosSimulados.add(partidoId);
    
    this.saveState();
  }

  /**
   * Obtiene el estado actual de un partido en vivo
   */
  getEstadoPartidoEnVivo(partidoId: string): MatchState | null {
    return this.state.partidosEnVivo.get(partidoId) || null;
  }

  /**
   * Obtiene todos los partidos actualmente en estado "live"
   */
  getPartidosEnVivo(): Match[] {
    if (!this.state.temporadaActiva) return [];

    return this.state.temporadaActiva.partidos.filter(partido => 
      partido.status === 'live'
    );
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
        partido.events = [];
        partido.snitchCaught = false;
      });
    }

    this.saveState();
  }  /**
   * Avanza a la siguiente temporada manteniendo historial
   */
  async siguienteTemporada(): Promise<void> {
    // Guardar temporada actual en historial si existe
    if (this.state.temporadaActiva) {
      const historialKey = `${this.STORAGE_KEY}_historial`;
      try {
        const historial = JSON.parse(localStorage.getItem(historialKey) || '[]');
        historial.push({
          ...this.state.temporadaActiva,
          fechaCompletada: new Date().toISOString(),
          numeroTemporada: historial.length + 1
        });
        localStorage.setItem(historialKey, JSON.stringify(historial));
      } catch (error) {
        console.error('Error saving season to history:', error);
      }
    }    // Crear nueva temporada
    const { QuidditchSystem } = await import('./quidditchSystem');
    const nuevaTemporada = QuidditchSystem.createProfessionalLeague();
    
    // Obtener el año actual del tiempo virtual para la nueva temporada
    const currentDate = new Date(this.state.fechaVirtualActual);
    const nextYear = currentDate.getFullYear() + 1;
    
    // La nueva temporada siempre empieza en julio del año siguiente
    const inicioNuevaTemporada = new Date(`${nextYear}-07-01T10:00:00`);
    
    // Actualizar fechas de todos los partidos
    const diferenciaDias = inicioNuevaTemporada.getTime() - new Date(nuevaTemporada.startDate).getTime();
    nuevaTemporada.partidos.forEach((partido: Match) => {
      const nuevaFecha = new Date(partido.fecha.getTime() + diferenciaDias);
      partido.fecha = nuevaFecha;
    });
    
    nuevaTemporada.startDate = inicioNuevaTemporada;
    const finTemporada = new Date(inicioNuevaTemporada);
    finTemporada.setMonth(finTemporada.getMonth() + 10); // 10 meses de temporada
    nuevaTemporada.endDate = finTemporada;
    
    // Actualizar nombre de temporada
    const numeroTemporada = this.getNumeroSiguienteTemporada();
    nuevaTemporada.name = `Liga Profesional de Quidditch - Temporada ${numeroTemporada}`;
    nuevaTemporada.id = `season-${numeroTemporada}`;

    // Establecer nueva temporada
    this.state.temporadaActiva = nuevaTemporada;
    this.state.fechaVirtualActual = inicioNuevaTemporada;
    this.state.partidosSimulados.clear();
    this.state.partidosEnVivo.clear();

    this.saveState();
  }

  /**
   * Obtiene el número de la siguiente temporada
   */
  private getNumeroSiguienteTemporada(): number {
    try {
      const historialKey = `${this.STORAGE_KEY}_historial`;
      const historial = JSON.parse(localStorage.getItem(historialKey) || '[]');
      return historial.length + 1;
    } catch {
      return 1;
    }
  }
  /**
   * Obtiene historial de temporadas completadas
   */
  getHistorialTemporadas(): SeasonHistory[] {
    try {
      const historialKey = `${this.STORAGE_KEY}_historial`;
      return JSON.parse(localStorage.getItem(historialKey) || '[]');
    } catch {
      return [];
    }
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
    }    // Estado por defecto - empieza en junio 2025, antes del inicio de temporada
    return {
      fechaVirtualActual: new Date('2025-06-15T10:00:00'),
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
  /**
   * Inicializa automáticamente una temporada cuando se inicia el sistema
   * y no hay ninguna temporada activa
   */
  private inicializarTemporadaInicial(): void {
    try {
      console.log('🚀 Inicializando temporada inicial automáticamente...');
      
      // Crear una temporada demo con todos los partidos programados
      const temporadaDemo = quidditchLeagueManager.createDemoSeason();
      
      // Establecer la temporada como activa
      this.setTemporadaActiva(temporadaDemo);
      
      console.log(`✅ Temporada inicial creada exitosamente:`, {
        nombre: temporadaDemo.name,
        equipos: temporadaDemo.equipos.length,
        partidos: temporadaDemo.partidos.length,
        fechaInicio: temporadaDemo.startDate.toISOString().split('T')[0],
        fechaFin: temporadaDemo.endDate.toISOString().split('T')[0],
        fechaVirtualActual: this.state.fechaVirtualActual.toISOString().split('T')[0]
      });

      // Log de los primeros 3 partidos próximos
      const proximosPartidos = temporadaDemo.partidos
        .filter(p => p.status === 'scheduled')
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
        .slice(0, 3);

      console.log('📅 Próximos partidos programados:', proximosPartidos.map(p => {
        const homeTeam = temporadaDemo.equipos.find(t => t.id === p.localId);
        const awayTeam = temporadaDemo.equipos.find(t => t.id === p.visitanteId);
        return `${homeTeam?.name || p.localId} vs ${awayTeam?.name || p.visitanteId} - ${p.fecha.toISOString().split('T')[0]}`;
      }));
      
    } catch (error) {
      console.error('❌ Error inicializando temporada inicial:', error);
    }
  }  /**
   * Obtiene la temporada activa, inicializando una si no existe
   */
  getTemporadaActivaOInicializar(): Season {
    console.log('🔍 getTemporadaActivaOInicializar: Verificando temporada activa...');
    if (!this.state.temporadaActiva) {
      console.log('🔍 getTemporadaActivaOInicializar: No hay temporada, inicializando ahora...');
      this.inicializarTemporadaInicial();
    } else {
      console.log('🔍 getTemporadaActivaOInicializar: Temporada encontrada:', this.state.temporadaActiva.name);
    }
    return this.state.temporadaActiva!;
  }  /**
   * Método de debugging para limpiar el localStorage y forzar reinicialización
   */
  public limpiarYReinicializar(): void {
    console.log('🧹 Limpiando localStorage y reinicializando...');
    localStorage.removeItem(this.STORAGE_KEY);
    this.state = this.loadState();
    
    if (!this.state.temporadaActiva) {
      this.inicializarTemporadaInicial();
    }
    
    console.log('✅ Reinicialización completada');
    console.log('📅 Nueva fecha virtual:', this.state.fechaVirtualActual);
    console.log('🏟️ Temporada activa:', this.state.temporadaActiva?.name);
  }
  /**
   * Limpia completamente el localStorage y reinicia el sistema
   */
  public resetCompleto(): void {
    console.log('🔄 Realizando reset completo del sistema...');
    
    // Limpiar todos los localStorage keys relacionados
    const keysToRemove = [
      this.STORAGE_KEY,
      'quidditch_predictions',
      'quidditch_mock_predictions',
      'quidditch_auth',
      'quidditch_user'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removido: ${key}`);
    });
    
    // Reinicializar estado
    this.state = this.loadState();
    
    // Forzar creación de temporada
    this.inicializarTemporadaInicial();
    
    console.log('✅ Reset completo finalizado');
  }
}

// Export singleton instance
export const virtualTimeManager = new VirtualTimeManager();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as unknown as { virtualTimeManager: VirtualTimeManager }).virtualTimeManager = virtualTimeManager;
  (window as unknown as { 
    debugQuidditch: {
      limpiarYReinicializar: () => void;
      resetCompleto: () => void;
      getState: () => VirtualTimeState;
      createNewSeason: () => Season;
      checkInit: () => void;
    }
  }).debugQuidditch = {
    limpiarYReinicializar: () => virtualTimeManager.limpiarYReinicializar(),
    resetCompleto: () => virtualTimeManager.resetCompleto(),
    getState: () => virtualTimeManager.getState(),
    createNewSeason: () => {
      const newSeason = quidditchLeagueManager.createDemoSeason();
      virtualTimeManager.setTemporadaActiva(newSeason);
      return newSeason;
    },
    checkInit: () => {
      const state = virtualTimeManager.getState();
      console.log('🔍 Estado actual:', {
        temporadaActiva: !!state.temporadaActiva,
        nombreTemporada: state.temporadaActiva?.name,
        equipos: state.temporadaActiva?.equipos?.length,
        partidos: state.temporadaActiva?.partidos?.length,
        fechaVirtual: state.fechaVirtualActual
      });
    }
  };
  console.log('🐛 Debug tools available: window.debugQuidditch');
  console.log('🐛 Commands: resetCompleto(), checkInit(), getState()');
}
