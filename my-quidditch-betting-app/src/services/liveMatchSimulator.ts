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
      probAtaque: 0.05, 
      probDefensa: 0.03, 
      puntos: 10,
      description: '¡Gol de Quaffle!'
    },
    { 
      tipo: 'QUAFFLE_ATTEMPT', 
      probAtaque: 0.10, 
      probDefensa: 0.08, 
      puntos: 0,
      description: 'Intento de gol con la Quaffle'
    },
    { 
      tipo: 'QUAFFLE_SAVE', 
      probAtaque: 0.08, 
      probDefensa: 0.12, 
      puntos: 0,
      description: '¡Parada del Guardián!'
    },
    { 
      tipo: 'SNITCH_SPOTTED', 
      probAtaque: 0.02, 
      probDefensa: 0.02, 
      puntos: 0,
      description: '¡La Snitch Dorada ha sido avistada!'
    },
    { 
      tipo: 'SNITCH_CAUGHT', 
      probAtaque: 0.005, 
      probDefensa: 0.002, 
      puntos: 150,
      description: '¡La Snitch Dorada ha sido atrapada!',
      endsMatch: true,
      minTime: 10 // Minimum 10 minutes before snitch can be caught
    },
    { 
      tipo: 'BLUDGER_HIT', 
      probAtaque: 0.08, 
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
  private matchIntervals: Map<string, number> = new Map();

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
      weather: match.weather || 'sunny'
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
    this.EVENTOS.forEach(evento => {
      // Check minimum time restrictions
      if (evento.minTime && estado.minuto < evento.minTime) {
        return;
      }

      // Calculate probabilities for both teams
      const probLocal = this.ajustarProb(evento, local, visitante, 'home');
      const probVisitante = this.ajustarProb(evento, visitante, local, 'away');

      // Check if local team event occurs
      if (Math.random() < probLocal) {
        this.registrarEvento(estado, evento, local.id, local.name);
      }

      // Check if visiting team event occurs (unless match has ended)
      if (estado.isActive && Math.random() < probVisitante) {
        this.registrarEvento(estado, evento, visitante.id, visitante.name);
      }
    });
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
    const fuerzaAtaque = equipoAtacante.fuerzaAtaque || equipoAtacante.attackStrength;
    const fuerzaDefensa = equipoDefensor.fuerzaDefensa || equipoDefensor.defenseStrength;

    // Base probability
    let prob = evento.probAtaque;

    // Adjust for team strengths
    const strengthRatio = fuerzaAtaque / fuerzaDefensa;
    prob *= strengthRatio;

    // Home advantage (5% boost for home team)
    if (venue === 'home') {
      prob *= 1.05;
    }    // Special adjustments for specific events
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
    teamName: string
  ): void {
    const gameEvent: GameEvent = {
      id: `${estado.matchId}-${estado.eventos.length + 1}`,
      type: evento.tipo,
      minute: estado.minuto,
      second: Math.floor(Math.random() * 60),
      teamId,
      description: `${teamName}: ${evento.description}`,
      points: evento.puntos,
      success: true
    };

    estado.eventos.push(gameEvent);

    // Update scores
    if (evento.puntos > 0) {
      if (teamId === estado.matchId.split('-')[0]) { // Assuming match ID format includes team info
        estado.golesLocal += evento.puntos;
      } else {
        estado.golesVisitante += evento.puntos;
      }
    }

    // Handle special events
    if (evento.tipo === 'SNITCH_CAUGHT') {
      estado.snitchCaught = true;
      estado.snitchCaughtBy = teamId;
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
   * Ends a live match
   */
  private endMatch(matchId: string): void {
    const estado = this.liveMatches.get(matchId);
    if (estado) {
      estado.isActive = false;
      estado.duration = estado.minuto;
      console.log(`[PARTIDO TERMINADO] ${estado.golesLocal} - ${estado.golesVisitante} (${estado.minuto} minutos)`);
    }
    this.stopMatch(matchId);
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
}

// Export singleton instance
export const liveMatchSimulator = new LiveMatchSimulator();
