import { Team, GameEvent, EventType, EventProbability, SimulationConfig, MatchResult } from '@/types/league';

// Configuración de eventos para Quidditch con probabilidades realistas
const EVENT_PROBABILITIES: EventProbability[] = [
  {
    type: 'QUAFFLE_GOAL',
    baseProb: 0.05, // 5% chance per minute
    attackModifier: 1.2,
    defenseModifier: 0.8,
    points: 10,
    description: '¡Quaffle lanzada a través de los aros de gol!'
  },
  {
    type: 'QUAFFLE_ATTEMPT',
    baseProb: 0.15, // 15% chance per minute
    attackModifier: 1.1,
    defenseModifier: 0.9,
    points: 0,
    description: 'Intento de tiro con la Quaffle'
  },
  {
    type: 'QUAFFLE_SAVE',
    baseProb: 0.12, // 12% chance per minute
    attackModifier: 0.8,
    defenseModifier: 1.3,
    points: 0,
    description: '¡El guardián hace una parada espectacular!'
  },
  {
    type: 'SNITCH_SPOTTED',
    baseProb: 0.02, // 2% chance per minute
    attackModifier: 1.0,
    defenseModifier: 1.0,
    points: 0,
    description: '¡La Snitch Dorada ha sido avistada!'
  },
  {
    type: 'SNITCH_CAUGHT',
    baseProb: 0.003, // 0.3% chance per minute
    attackModifier: 1.0,
    defenseModifier: 1.0,
    points: 150,
    endsMatch: true,
    description: '¡La Snitch Dorada ha sido capturada!'
  },  {
    type: 'BLUDGER_HIT',
    baseProb: 0.08, // 8% chance per minute
    attackModifier: 0.9,
    defenseModifier: 1.1,
    points: 0,
    description: '¡Jugador golpeado por una Bludger!'
  },
  {
    type: 'BLUDGER_BLOCKED',
    baseProb: 0.06, // 6% chance per minute
    attackModifier: 1.1,
    defenseModifier: 0.9,
    points: 0,
    description: '¡Golpeador desvía la Bludger!'
  },
  {
    type: 'FOUL_BLAGGING',
    baseProb: 0.04, // 4% chance per minute
    attackModifier: 1.0,
    defenseModifier: 1.0,
    points: 0,
    description: 'Falta: Blagging - Agarrar la cola de la escoba del oponente'
  },
  {
    type: 'FOUL_COBBING',
    baseProb: 0.03, // 3% chance per minute
    attackModifier: 1.0,
    defenseModifier: 1.0,
    points: 0,
    description: 'Falta: Cobbing - Uso excesivo de codos'
  },
  {
    type: 'TIMEOUT',
    baseProb: 0.01, // 1% chance per minute
    attackModifier: 1.0,
    defenseModifier: 1.0,
    points: 0,
    description: 'Tiempo muerto solicitado por el equipo'
  }
];

// Define match state interface
interface MatchState {
  matchId: string;
  currentMinute: number;
  homeScore: number;
  awayScore: number;
  events: GameEvent[];
  snitchCaught: boolean;
  snitchCaughtBy: string | null;
  weather: string;
  attendance: number;
}

export class QuidditchSimulator {
  private config: SimulationConfig;
  private eventProbabilities: EventProbability[];

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = {
      minDuration: 30, // 30 minutes minimum
      maxDuration: 120, // 2 hours maximum if Snitch not caught
      snitchEndGame: true,
      snitchMinTime: 15, // Snitch can't be caught before 15 minutes
      eventCheckInterval: 60, // Check events every 60 seconds (1 minute)
      weatherEnabled: true,
      injuriesEnabled: true,
      foulsEnabled: true,
      ...config
    };
    
    this.eventProbabilities = EVENT_PROBABILITIES;
  }  /**
   * Simulates a complete Quidditch match minute by minute
   */  
  public simulateMatch(homeTeam: Team, awayTeam: Team, matchId?: string): MatchResult {
    const matchState = this.initializeMatchState(matchId);
    
    // Simulate minute by minute
    while (!this.isMatchFinished(matchState)) {
      this.simulateMinute(matchState, homeTeam, awayTeam);
      matchState.currentMinute++;
      
      // Safety check to prevent infinite loops
      if (matchState.currentMinute > this.config.maxDuration) {
        break;
      }
    }

    const result = this.createMatchResult(matchState);
    
    // Resolve bets and predictions for finished match
    console.log(`💰 Match simulation completed, resolving bets and predictions for match ${result.matchId}...`);
    this.resolveBetsAndPredictionsForMatch(result).catch((error: unknown) => {
      console.error('❌ Error resolving bets and predictions after simulation:', error);
    });
    
    return result;
  }/**
   * Initializes the match state
   */
  private initializeMatchState(matchId?: string): MatchState {
    return {
      matchId: matchId || `match-${Date.now()}`,
      currentMinute: 0,
      homeScore: 0,
      awayScore: 0,
      events: [] as GameEvent[],
      snitchCaught: false,
      snitchCaughtBy: null,
      weather: this.generateWeather(),
      attendance: this.generateAttendance()
    };
  }

  /**
   * Simulates events for a single minute
   */
  private simulateMinute(matchState: MatchState, homeTeam: Team, awayTeam: Team): void {
    // Check each possible event
    for (const eventProb of this.eventProbabilities) {
      // Skip snitch events if too early
      if (eventProb.type === 'SNITCH_CAUGHT' && matchState.currentMinute < this.config.snitchMinTime) {
        continue;
      }

      // Calculate probability for home team
      const homeProb = this.calculateEventProbability(eventProb, homeTeam, awayTeam, true);
      if (Math.random() < homeProb) {
        const event = this.createEvent(eventProb, matchState.currentMinute, homeTeam.id, matchState.events.length);
        this.processEvent(event, matchState, true);
      }

      // Calculate probability for away team
      const awayProb = this.calculateEventProbability(eventProb, awayTeam, homeTeam, false);
      if (Math.random() < awayProb) {
        const event = this.createEvent(eventProb, matchState.currentMinute, awayTeam.id, matchState.events.length);
        this.processEvent(event, matchState, false);
      }
    }
  }

  /**
   * Calculates the probability of an event occurring for a team
   */
  private calculateEventProbability(
    eventProb: EventProbability,
    attackingTeam: Team,
    defendingTeam: Team,
    isHome: boolean
  ): number {
    let probability = eventProb.baseProb;

    // Apply team strength modifiers
    const attackStrength = this.getRelevantSkill(attackingTeam, eventProb.type);
    const defenseStrength = this.getRelevantSkill(defendingTeam, eventProb.type);

    // Normalize strengths (0-100 to 0.5-1.5 multiplier)
    const attackModifier = 0.5 + (attackStrength / 100);
    const defenseModifier = 0.5 + (defenseStrength / 100);

    probability *= attackModifier * eventProb.attackModifier;
    probability /= defenseModifier * eventProb.defenseModifier;

    // Apply home advantage (slight boost)
    if (isHome) {
      probability *= 1.05;
    }

    return Math.min(probability, 1.0); // Cap at 100%
  }

  /**
   * Gets the relevant skill for a team based on event type
   */
  private getRelevantSkill(team: Team, eventType: EventType): number {
    switch (eventType) {
      case 'QUAFFLE_GOAL':
      case 'QUAFFLE_ATTEMPT':
        return team.chaserSkill;
      case 'QUAFFLE_SAVE':
        return team.keeperSkill;
      case 'SNITCH_CAUGHT':
      case 'SNITCH_SPOTTED':
        return team.seekerSkill;
      case 'BLUDGER_HIT':
      case 'BLUDGER_BLOCKED':
        return team.beaterSkill;
      default:
        return team.attackStrength;
    }
  }

  /**
   * Creates a game event
   */
  private createEvent(
    eventProb: EventProbability,
    minute: number,
    teamId: string,
    eventIndex: number
  ): GameEvent {
    return {
      id: `event-${eventIndex}`,
      type: eventProb.type,
      minute,
      second: Math.floor(Math.random() * 60),
      teamId,
      description: eventProb.description,
      points: eventProb.points,
      success: this.determineEventSuccess(eventProb.type)
    };
  }

  /**
   * Determines if an event is successful
   */
  private determineEventSuccess(eventType: EventType): boolean {
    switch (eventType) {
      case 'QUAFFLE_ATTEMPT':
        return Math.random() < 0.3; // 30% success rate for attempts
      case 'QUAFFLE_SAVE':
        return Math.random() < 0.7; // 70% success rate for saves
      default:
        return true;
    }
  }
  /**
   * Processes an event and updates match state
   */
  private processEvent(event: GameEvent, matchState: MatchState, isHomeTeam: boolean): void {
    matchState.events.push(event);

    // Handle scoring events
    if (event.points > 0 && event.success) {
      if (isHomeTeam) {
        matchState.homeScore += event.points;
      } else {
        matchState.awayScore += event.points;
      }
    }

    // Handle special events
    if (event.type === 'SNITCH_CAUGHT' && event.success) {
      matchState.snitchCaught = true;
      matchState.snitchCaughtBy = event.teamId;
    }
  }

  /**
   * Checks if the match should end
   */
  private isMatchFinished(matchState: MatchState): boolean {
    // End if Snitch is caught and config allows it
    if (this.config.snitchEndGame && matchState.snitchCaught) {
      return true;
    }

    // End if minimum duration reached and there's a significant score difference
    if (matchState.currentMinute >= this.config.minDuration) {
      const scoreDiff = Math.abs(matchState.homeScore - matchState.awayScore);
      // End if one team is ahead by 50+ points after minimum time
      return scoreDiff >= 50;
    }

    return false;
  }

  /**
   * Creates the final match result
   */
  private createMatchResult(matchState: MatchState): MatchResult {
    let winner: string | undefined;
    
    if (matchState.homeScore > matchState.awayScore) {
      winner = 'home';
    } else if (matchState.awayScore > matchState.homeScore) {
      winner = 'away';
    }

    return {
      matchId: matchState.matchId,
      homeScore: matchState.homeScore,
      awayScore: matchState.awayScore,
      events: matchState.events,
      duration: matchState.currentMinute,
      winner,
      snitchCaught: matchState.snitchCaught,
      snitchCaughtBy: matchState.snitchCaughtBy || undefined,
      attendance: matchState.attendance,
      weather: matchState.weather
    };
  }

  /**
   * Generates random weather conditions
   */
  private generateWeather(): string {
    if (!this.config.weatherEnabled) return 'sunny';
    
    const weather = ['sunny', 'cloudy', 'rainy', 'windy', 'foggy'];
    const weights = [0.4, 0.3, 0.15, 0.1, 0.05]; // Probability weights
    
    const random = Math.random();
    let sum = 0;
    
    for (let i = 0; i < weather.length; i++) {
      sum += weights[i];
      if (random < sum) {
        return weather[i];
      }
    }
    
    return 'sunny';
  }

  /**
   * Generates random attendance
   */
  private generateAttendance(): number {
    return Math.floor(Math.random() * 50000) + 10000; // 10,000 to 60,000 spectators
  }

  /**
   * Simulates multiple matches for testing
   */
  public simulateMultipleMatches(homeTeam: Team, awayTeam: Team, count: number): MatchResult[] {
    const results: MatchResult[] = [];
    
    for (let i = 0; i < count; i++) {
      results.push(this.simulateMatch(homeTeam, awayTeam));
    }
    
    return results;
  }

  /**
   * Gets statistics from multiple simulation results
   */
  public getSimulationStats(results: MatchResult[]) {
    const totalMatches = results.length;
    const homeWins = results.filter(r => r.winner === 'home').length;
    const awayWins = results.filter(r => r.winner === 'away').length;
    const draws = results.filter(r => !r.winner).length;
    const snitchCatchRate = results.filter(r => r.snitchCaught).length / totalMatches;
    
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / totalMatches;
    const avgHomeScore = results.reduce((sum, r) => sum + r.homeScore, 0) / totalMatches;
    const avgAwayScore = results.reduce((sum, r) => sum + r.awayScore, 0) / totalMatches;
    
    return {
      totalMatches,
      homeWins,
      awayWins,
      draws,
      homeWinRate: homeWins / totalMatches,
      awayWinRate: awayWins / totalMatches,
      drawRate: draws / totalMatches,
      snitchCatchRate,
      avgDuration,
      avgHomeScore,
      avgAwayScore,
      avgTotalScore: avgHomeScore + avgAwayScore
    };  }  /**
   * Resolves bets and predictions for a finished match
   */
  private async resolveBetsAndPredictionsForMatch(matchResult: MatchResult): Promise<void> {
    try {
      // Import services dynamically to avoid circular dependencies
      const [{ betResolutionService }, { predictionsService }] = await Promise.all([
        import('./betResolutionService'),
        import('./predictionsService')
      ]);
      
      // Resolve bets
      const results = await betResolutionService.resolveMatchBets(matchResult.matchId);
      console.log(`✅ Resolved ${results.length} bets for match ${matchResult.matchId}`);      // Determine match result for predictions
      const actualResult: 'home' | 'away' | 'draw' = 
        matchResult.homeScore > matchResult.awayScore ? 'home' :
        matchResult.awayScore > matchResult.homeScore ? 'away' : 'draw';
      
      console.log(`🏆 DETAILED SIMULATOR RESULT DETERMINATION for ${matchResult.matchId}:`);
      console.log(`   🏠 Home score: ${matchResult.homeScore}`);
      console.log(`   🚗 Away score: ${matchResult.awayScore}`);
      console.log(`   🎯 Score comparison: ${matchResult.homeScore} vs ${matchResult.awayScore}`);
      console.log(`   🏆 Determined result: "${actualResult}"`);
      console.log(`   📊 MatchResult object:`, matchResult);
      
      // Update prediction results
      predictionsService.updatePredictionResult(matchResult.matchId, actualResult);
      console.log(`🔮 Updated prediction result for match ${matchResult.matchId}: ${actualResult}`);
      
      // Emit custom events for UI components to listen to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('betsResolved', {
          detail: { matchId: matchResult.matchId, results }
        }));
        
        window.dispatchEvent(new CustomEvent('predictionsUpdated', {
          detail: { matchId: matchResult.matchId, result: actualResult }
        }));
      }
    } catch (error) {
      console.error('❌ Error resolving bets and predictions:', error);
    }
  }
}

// Export singleton instance
export const quidditchSimulator = new QuidditchSimulator();
