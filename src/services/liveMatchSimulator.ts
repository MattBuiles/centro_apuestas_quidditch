import { Team, Match, MatchState, GameEvent, EventConfig } from '@/types/league';

/**
 * Live Match Simulation Service
 * Implements minute-by-minute match simulation following the schema:
 * "Motor de simulación de partidos - Eventos por minuto"
 */
export class LiveMatchSimulator {
  // Event configuration with probabilities adjusted by team strengths
  private readonly EVENTOS: EventConfig[] = [
    { 
      tipo: 'QUAFFLE_GOAL', 
      probAtaque: 0.15, // Increased from 0.05
      probDefensa: 0.08, // Increased from 0.03
      puntos: 10,
      description: '¡Gol de Quaffle!'
    },
    { 
      tipo: 'QUAFFLE_ATTEMPT', 
      probAtaque: 0.25, // Increased from 0.10
      probDefensa: 0.20, // Increased from 0.08
      puntos: 0,
      description: 'Intento de gol con la Quaffle'
    },
    { 
      tipo: 'QUAFFLE_SAVE', 
      probAtaque: 0.20, // Increased from 0.08
      probDefensa: 0.25, // Increased from 0.12
      puntos: 0,
      description: '¡Parada del Guardián!'
    },
    { 
      tipo: 'SNITCH_SPOTTED', 
      probAtaque: 0.05, // Increased from 0.02
      probDefensa: 0.05, // Increased from 0.02
      puntos: 0,
      description: '¡La Snitch Dorada ha sido avistada!'
    },
    { 
      tipo: 'SNITCH_CAUGHT', 
      probAtaque: 0.015, // Increased from 0.005
      probDefensa: 0.010, // Increased from 0.002
      puntos: 150,
      description: '¡La Snitch Dorada ha sido atrapada!',
      endsMatch: true,
      minTime: 10 // Minimum 10 minutes before snitch can be caught
    },
    { 
      tipo: 'BLUDGER_HIT', 
      probAtaque: 0.15, // Increased from 0.08 
      probDefensa: 0.10, 
      puntos: 0,
      description: '¡Jugador golpeado por una Bludger!'
    },
    { 
      tipo: 'FOUL_BLAGGING', 
      probAtaque: 0.04, 
      probDefensa: 0.04, 
      puntos: 0,
      description: 'Falta: Blagging - Agarrar la cola de la escoba del oponente'
    },
    { 
      tipo: 'FOUL_COBBING', 
      probAtaque: 0.03, 
      probDefensa: 0.03, 
      puntos: 0,
      description: 'Falta: Cobbing - Uso excesivo de codos'
    }
  ];

  private liveMatches: Map<string, MatchState> = new Map();
  private matchIntervals: Map<string, NodeJS.Timeout> = new Map();
  private matchTeams: Map<string, { home: Team; away: Team }> = new Map(); // Store teams for each match
  private backendSavePromises: Map<string, Promise<void>> = new Map(); // Track ongoing backend saves to prevent duplicates

  /**
   * Starts a live match simulation
   * Following schema: simularPartido(local, visitante, duracionEnMinutos)
   */
  startLiveMatch(
    match: Match, 
    localTeam: Team, 
    visitanteTeam: Team, 
    duracionEnMinutos: number = 90
  ): MatchState {
    // Store teams for later reference
    this.matchTeams.set(match.id, { home: localTeam, away: visitanteTeam });
    
    // Initialize match state
    const estado: MatchState = {
      matchId: match.id,
      minuto: 0,
      golesLocal: 0,
      golesVisitante: 0,
      eventos: [],
      isActive: true,
      snitchVisible: false,
      snitchCaught: false,
      duration: duracionEnMinutos,
      lastEventTime: 0,
      spectators: match.attendance || Math.floor(Math.random() * 50000) + 10000,
      weather: match.weather || 'sunny',
      backendSaved: false
    };

    this.liveMatches.set(match.id, estado);

    // Start the minute-by-minute simulation
    this.startMatchTicker(match.id, localTeam, visitanteTeam);

    return estado;
  }

  /**
   * Runs the minute-by-minute simulation ticker
   * Following schema: "recorre 1500 segundos (25 min) o 30 minutos de juego en 'ticks' de 1 minuto"
   */
  private startMatchTicker(matchId: string, local: Team, visitante: Team): void {
    const interval = setInterval(() => {
      const estado = this.liveMatches.get(matchId);
      if (!estado || !estado.isActive) {
        this.stopMatch(matchId);
        return;
      }

      // Advance minute
      estado.minuto++;
      estado.lastEventTime = Date.now();

      // Process events for this minute
      this.processMinuteEvents(estado, local, visitante);

      // Check if match should end
      if (this.shouldEndMatch(estado)) {
        this.endMatch(matchId);
      }

    }, 1000); // 1 second represents 1 minute in simulation

    this.matchIntervals.set(matchId, interval);
  }

  /**
   * Processes all possible events for the current minute
   * Following schema: "Itera eventos, lanza Math.random() y registra los que suceden"
   */
  private processMinuteEvents(estado: MatchState, local: Team, visitante: Team): void {
    console.log(`🎮 Processing minute ${estado.minuto} events`);
    
    this.EVENTOS.forEach(evento => {
      // Check minimum time restrictions
      if (evento.minTime && estado.minuto < evento.minTime) {
        return;
      }

      // Calculate probabilities for both teams
      const probLocal = this.ajustarProb(evento, local, visitante, 'home');
      const probVisitante = this.ajustarProb(evento, visitante, local, 'away');
      
      const randomLocal = Math.random();
      const randomVisitante = Math.random();
      
      console.log(`🎯 Event ${evento.tipo}: Local(${probLocal.toFixed(4)}, roll: ${randomLocal.toFixed(4)}) Away(${probVisitante.toFixed(4)}, roll: ${randomVisitante.toFixed(4)})`);
      
      // Check if local team event occurs
      if (randomLocal < probLocal) {
        console.log(`⚡ LOCAL EVENT: ${evento.tipo} for ${local.name}`);
        this.registrarEvento(estado, evento, local.id, local.name, true);
      }

      // Check if visiting team event occurs (unless match has ended)
      if (estado.isActive && randomVisitante < probVisitante) {
        console.log(`⚡ AWAY EVENT: ${evento.tipo} for ${visitante.name}`);
        this.registrarEvento(estado, evento, visitante.id, visitante.name, false);
      }
    });
    
    console.log(`📊 Minute ${estado.minuto} complete. Events: ${estado.eventos.length}, Score: ${estado.golesLocal}-${estado.golesVisitante}`);
  }

  /**
   * Adjusts probability based on team strengths
   * Following schema: "pEvento = baseProb * (fuerzaAtaqueLocal / fuerzaDefensaVisitante)"
   */
  private ajustarProb(
    evento: EventConfig, 
    equipoAtacante: Team, 
    equipoDefensor: Team, 
    venue: 'home' | 'away'
  ): number {
    const fuerzaAtaque = equipoAtacante.fuerzaAtaque || equipoAtacante.attackStrength || 50;
    const fuerzaDefensa = equipoDefensor.fuerzaDefensa || equipoDefensor.defenseStrength || 50;

    console.log(`🔧 Adjusting probability for ${evento.tipo}:`, {
      team: equipoAtacante.name,
      attackStrength: fuerzaAtaque,
      defenseStrength: fuerzaDefensa,
      baseProb: evento.probAtaque,
      venue
    });

    // Base probability
    let prob = evento.probAtaque;

    // Adjust for team strengths
    const strengthRatio = fuerzaAtaque / fuerzaDefensa;
    prob *= strengthRatio;

    // Home advantage (5% boost for home team)
    if (venue === 'home') {
      prob *= 1.05;
    }

    // Special adjustments for specific events
    switch (evento.tipo) {
      case 'SNITCH_CAUGHT': {
        // Seeker skill matters more for snitch
        const seekerSkill = equipoAtacante.seekerSkill || 50;
        prob *= (seekerSkill / 50);
        break;
      }
      case 'QUAFFLE_GOAL': {
        // Chaser skill for goals
        const chaserSkill = equipoAtacante.chaserSkill || 50;
        prob *= (chaserSkill / 50);
        break;
      }
      case 'QUAFFLE_SAVE': {
        // Keeper skill for saves
        const keeperSkill = equipoDefensor.keeperSkill || 50;
        prob *= (keeperSkill / 50);
        break;
      }
    }

    // Cap probability at reasonable maximum
    return Math.min(prob, 0.25);
  }
  /**
   * Registers an event that occurred during the match
   */
  private registrarEvento(
    estado: MatchState, 
    evento: EventConfig, 
    teamId: string, 
    teamName: string,
    isLocalTeam: boolean
  ): void {
    // Validate inputs to prevent object interpolation errors
    const safeTeamId = typeof teamId === 'string' ? teamId : 'unknown';
    const safeTeamName = typeof teamName === 'string' ? teamName : 'Equipo Desconocido';
    const safeEventDescription = typeof evento.description === 'string' ? evento.description : 'Evento desconocido';
    
    const gameEvent: GameEvent = {
      id: `${estado.matchId}-${estado.eventos.length + 1}`,
      type: evento.tipo,
      minute: estado.minuto,
      second: Math.floor(Math.random() * 60),
      teamId: safeTeamId,
      description: `${safeTeamName}: ${safeEventDescription}`,
      points: evento.puntos,
      success: true
    };

    estado.eventos.push(gameEvent);

    // Update scores - Fixed logic based on team position
    if (evento.puntos > 0) {
      if (isLocalTeam) {
        estado.golesLocal += evento.puntos;
      } else {
        estado.golesVisitante += evento.puntos;
      }
    }

    // Handle special events
    if (evento.tipo === 'SNITCH_CAUGHT') {
      estado.snitchCaught = true;
      // Ensure teamId is a string before assignment
      estado.snitchCaughtBy = typeof teamId === 'string' ? teamId : 'unknown';
      if (evento.endsMatch) {
        estado.isActive = false;
      }
    } else if (evento.tipo === 'SNITCH_SPOTTED') {
      estado.snitchVisible = true;
    }

    console.log(`[MINUTO ${estado.minuto}] ${gameEvent.description}`);
  }

  /**
   * Checks if match should end
   */
  private shouldEndMatch(estado: MatchState): boolean {
    // Match ends if snitch is caught (and configured to end match)
    if (estado.snitchCaught) {
      return true;
    }

    // Match ends if maximum duration reached
    if (estado.minuto >= estado.duration) {
      return true;
    }

    // Match can end early if there's a huge point difference (optional rule)
    const pointDifference = Math.abs(estado.golesLocal - estado.golesVisitante);
    if (pointDifference > 200 && estado.minuto > 60) {
      return true;
    }

    return false;
  }
  /**
   * Ends a live match and prepares for detailed result saving
   */
  private endMatch(matchId: string): MatchState | null {
    const estado = this.liveMatches.get(matchId);
    if (!estado) {
      console.warn(`Cannot end match ${matchId}: Match state not found`);
      return null;
    }

    const teams = this.matchTeams.get(matchId);
    if (!teams) {
      console.warn(`Cannot end match ${matchId}: Teams not found`);
      return null;
    }

    estado.isActive = false;
    estado.duration = estado.minuto;
    
    console.log(`[PARTIDO TERMINADO] ${estado.golesLocal} - ${estado.golesVisitante} (${estado.minuto} minutos)`);
    console.log(`📊 Match ready for detailed result saving: ${matchId}`);
    console.log(`📈 Events recorded: ${estado.eventos.length}`);
    console.log(`⏱️ Final duration: ${estado.minuto} minutes`);
    console.log(`🔄 Backend save will be handled by LiveMatchViewer component`);
    
    // Don't save to backend here - let saveDetailedMatchResult handle it
    // This prevents the race condition where both endMatch and saveDetailedMatchResult
    // try to save simultaneously
    
    this.stopMatch(matchId);
    return estado;
  }
  /**
   * Stops a match simulation
   */
  stopMatch(matchId: string): void {
    const interval = this.matchIntervals.get(matchId);
    if (interval) {
      clearInterval(interval);
      this.matchIntervals.delete(matchId);
    }

    const estado = this.liveMatches.get(matchId);
    if (estado) {
      estado.isActive = false;
    }

    // Clean up teams reference
    this.matchTeams.delete(matchId);
    
    // Clean up any pending backend save promises
    this.backendSavePromises.delete(matchId);
  }

  /**
   * Gets current match state
   */
  getMatchState(matchId: string): MatchState | undefined {
    return this.liveMatches.get(matchId);
  }

  /**
   * Gets all active live matches
   */
  getActiveLiveMatches(): MatchState[] {
    return Array.from(this.liveMatches.values()).filter(state => state.isActive);
  }

  /**
   * Gets match events stream (for live updates)
   */
  getEventStream(matchId: string): GameEvent[] {
    const estado = this.liveMatches.get(matchId);
    return estado ? estado.eventos : [];
  }

  /**
   * Gets current match summary for display
   */
  getMatchSummary(matchId: string): {
    minute: number;
    homeScore: number;
    awayScore: number;
    isActive: boolean;
    lastEvent?: GameEvent;
  } | null {
    const estado = this.liveMatches.get(matchId);
    if (!estado) return null;

    return {
      minute: estado.minuto,
      homeScore: estado.golesLocal,
      awayScore: estado.golesVisitante,
      isActive: estado.isActive,
      lastEvent: estado.eventos[estado.eventos.length - 1]
    };
  }

  /**
   * Cleans up finished matches to prevent memory leaks
   */
  cleanupFinishedMatches(): void {
    const toRemove: string[] = [];
    
    this.liveMatches.forEach((estado, matchId) => {
      if (!estado.isActive) {
        const timeSinceEnd = Date.now() - estado.lastEventTime;
        const oneHour = 60 * 60 * 1000;
        
        if (timeSinceEnd > oneHour) {
          toRemove.push(matchId);
        }
      }
    });

    toRemove.forEach(matchId => {
      this.liveMatches.delete(matchId);
      this.stopMatch(matchId);
    });
  }

  /**
   * Saves detailed match result (called from components with full match data)
   */
  async saveDetailedMatchResult(
    matchId: string,
    match: Match,
    homeTeam: Team,
    awayTeam: Team
  ): Promise<void> {
    const estado = this.liveMatches.get(matchId);
    if (!estado) {
      console.warn(`Cannot save match result: Match state not found for ${matchId}`);
      return;
    }

    try {
      // Import the service here to avoid circular dependencies
      const { matchResultsService } = await import('./matchResultsService');
      const detailedResult = matchResultsService.saveMatchResult(match, estado, homeTeam, awayTeam);
      console.log(`✅ Detailed match result saved successfully for ${matchId}`);
      console.log(`📊 Result ID: ${detailedResult.id}`);
      
      // Always try to save to backend - the saveMatchToBackend method will handle duplicates
      console.log('💾 Saving to backend...');
      await this.saveMatchToBackend(matchId, estado, homeTeam, awayTeam);
      
      // Emit custom event for components to listen to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('matchResultSaved', {
          detail: { matchId, resultId: detailedResult.id, result: detailedResult }
        }));
      }
    } catch (error) {
      console.error('Error saving detailed match result:', error);
    }
  }

  /**
   * Save match result to backend database
   */
  private async saveMatchToBackend(
    matchId: string,
    estado: MatchState,
    homeTeam: Team,
    awayTeam: Team
  ): Promise<void> {
    // Check if already saved
    if (estado.backendSaved) {
      console.log(`ℹ️ Match ${matchId} already saved to backend, skipping`);
      return;
    }

    // Check if there's already an ongoing save for this match
    const existingPromise = this.backendSavePromises.get(matchId);
    if (existingPromise) {
      console.log(`⏩ Backend save already in progress for match ${matchId}, waiting...`);
      return existingPromise;
    }

    // Create and store the save promise
    const savePromise = this.performBackendSave(matchId, estado, homeTeam, awayTeam);
    this.backendSavePromises.set(matchId, savePromise);

    try {
      await savePromise;
    } finally {
      // Clean up the promise once completed
      this.backendSavePromises.delete(matchId);
    }
  }

  /**
   * Performs the actual backend save operation
   */
  private async performBackendSave(
    matchId: string,
    estado: MatchState,
    homeTeam: Team,
    awayTeam: Team
  ): Promise<void> {
    try {
      const { apiClient } = await import('@/utils/apiClient');
      
      const matchResult = {
        matchId,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeScore: estado.golesLocal,
        awayScore: estado.golesVisitante,
        status: 'finished',
        events: estado.eventos.map(event => ({
          id: event.id,
          type: event.type,
          minute: event.minute,
          second: event.second,
          teamId: event.teamId,
          description: event.description,
          points: event.points,
          success: event.success
        })),
        duration: estado.minuto,
        snitchCaught: estado.snitchCaught,
        snitchCaughtBy: estado.snitchCaughtBy,
        finishedAt: new Date().toISOString()
      };

      console.log('💾 Saving match result to backend:', matchResult);

      const response = await apiClient.post(`/matches/${matchId}/finish`, matchResult);
      
      if (response.success) {
        console.log('✅ Match result saved to backend successfully');
        // Mark as saved in backend
        const matchState = this.liveMatches.get(matchId);
        if (matchState) {
          matchState.backendSaved = true;
        }
      } else {
        console.error('❌ Failed to save match result to backend:', response.error);
      }
    } catch (error) {
      console.error('❌ Error saving match result to backend:', error);
      
      // If the error is because the match is already finished, that's actually OK
      if (error instanceof Error && (error.message.includes('400') || error.message.includes('already finished'))) {
        console.log('ℹ️ Match was already finished on backend (this is expected in some cases)');
        // Mark as saved since it's already finished
        const matchState = this.liveMatches.get(matchId);
        if (matchState) {
          matchState.backendSaved = true;
        }
      } else {
        // Re-throw other errors
        throw error;
      }
    }
  }
}

// Export singleton instance
export const liveMatchSimulator = new LiveMatchSimulator();
