/**
 * Match Results Service
 * Handles saving and retrieving detailed match results with complete chronology
 * Ensures all match data is preserved for historical viewing
 */

import { Match, MatchState, GameEvent, Team } from '@/types/league';

export interface DetailedMatchResult {
  id: string;
  matchId: string;
  homeTeam: {
    id: string;
    name: string;
    score: number;
  };
  awayTeam: {
    id: string;
    name: string;
    score: number;
  };
  finalScore: {
    home: number;
    away: number;
  };
  matchDuration: number; // in minutes
  status: 'finished';
  completedAt: string; // ISO date string
  
  // Detailed chronology
  chronology: {
    events: GameEvent[];
    minuteByMinute: MinuteEvent[];
    keyMoments: KeyMoment[];
  };

  // Match statistics
  statistics: MatchStatistics;

  // Additional match information
  venue?: string;
  attendance?: number;
  referee?: string;
  league: string;
  season: string;
  snitchCaught: boolean;
  snitchCaughtBy?: string;
  snitchCaughtAtMinute?: number;
}

export interface MinuteEvent {
  minute: number;
  homeScore: number;
  awayScore: number;
  events: GameEvent[];
  keyEvent?: boolean;
}

export interface KeyMoment {
  minute: number;
  type: 'GOAL' | 'SNITCH_CAUGHT' | 'MAJOR_FOUL' | 'INJURY' | 'TIMEOUT';
  description: string;
  team: string;
  impact: 'high' | 'medium' | 'low';
}

export interface MatchStatistics {
  totalEvents: number;
  goalsByTeam: {
    home: number;
    away: number;
  };
  quaffleGoals: {
    home: number;
    away: number;
  };
  snitchPoints: {
    home: number;
    away: number;
  };
  fouls: {
    home: number;
    away: number;
  };
  bludgerHits: {
    home: number;
    away: number;
  };
  dominanceByPeriod: {
    first15: 'home' | 'away' | 'even';
    middle: 'home' | 'away' | 'even';
    final: 'home' | 'away' | 'even';
  };
}

export class MatchResultsService {
  private readonly STORAGE_KEY = 'quidditch_match_results';
  private readonly RESULTS_CACHE_KEY = 'quidditch_results_cache';

  /**
   * Saves a complete match result with full chronology
   */
  saveMatchResult(
    match: Match, 
    matchState: MatchState, 
    homeTeam: Team, 
    awayTeam: Team
  ): DetailedMatchResult {
    try {
      const detailedResult = this.createDetailedResult(match, matchState, homeTeam, awayTeam);
      
      // Save to localStorage
      this.persistResult(detailedResult);
      
      // Update cache
      this.updateResultsCache(detailedResult);
      
      // Log the save operation
      console.log(`📊 Match result saved: ${homeTeam.name} ${detailedResult.finalScore.home} - ${detailedResult.finalScore.away} ${awayTeam.name}`);
      console.log(`🕐 Duration: ${detailedResult.matchDuration} minutes`);
      console.log(`📈 Total events: ${detailedResult.statistics.totalEvents}`);
      
      return detailedResult;
    } catch (error) {
      console.error('Error saving match result:', error);
      throw new Error('Failed to save match result');
    }
  }

  /**
   * Creates a detailed result object from match data
   */
  private createDetailedResult(
    match: Match, 
    matchState: MatchState, 
    homeTeam: Team, 
    awayTeam: Team
  ): DetailedMatchResult {
    const events = matchState.eventos || [];
    const minuteByMinute = this.createMinuteByMinuteChronology(events, matchState);
    const keyMoments = this.identifyKeyMoments(events, homeTeam, awayTeam);
    const statistics = this.calculateMatchStatistics(events, homeTeam, awayTeam, matchState);

    return {
      id: `result-${match.id}-${Date.now()}`,
      matchId: match.id,
      homeTeam: {
        id: homeTeam.id,
        name: homeTeam.name,
        score: matchState.golesLocal || match.homeScore || 0
      },
      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.name,
        score: matchState.golesVisitante || match.awayScore || 0
      },
      finalScore: {
        home: matchState.golesLocal || match.homeScore || 0,
        away: matchState.golesVisitante || match.awayScore || 0
      },
      matchDuration: matchState.minuto || match.currentMinute || 0,
      status: 'finished',
      completedAt: new Date().toISOString(),
      chronology: {
        events,
        minuteByMinute,
        keyMoments
      },
      statistics,      venue: (match as Match & { location?: string }).location || 'Quidditch Stadium',
      league: 'Liga Profesional Quidditch',
      season: '2025-2026',
      snitchCaught: matchState.snitchCaught || false,
      snitchCaughtBy: matchState.snitchCaughtBy,
      snitchCaughtAtMinute: matchState.snitchCaught ? 
        events.find(e => e.type === 'SNITCH_CAUGHT')?.minute : undefined
    };
  }

  /**
   * Creates minute-by-minute chronology
   */
  private createMinuteByMinuteChronology(events: GameEvent[], matchState: MatchState): MinuteEvent[] {
    const minuteEvents: Map<number, MinuteEvent> = new Map();
    
    let currentHomeScore = 0;
    let currentAwayScore = 0;

    // Initialize all minutes
    for (let minute = 1; minute <= (matchState.minuto || 30); minute++) {
      minuteEvents.set(minute, {
        minute,
        homeScore: currentHomeScore,
        awayScore: currentAwayScore,
        events: [],
        keyEvent: false
      });
    }

    // Populate with events
    events.forEach(event => {
      const minute = event.minute;
      const minuteEvent = minuteEvents.get(minute);
      
      if (minuteEvent) {
        minuteEvent.events.push(event);
        
        // Update scores
        if (event.points && event.points > 0) {
          if (event.teamId === matchState.matchId.split('-')[0]) {
            currentHomeScore += event.points;
          } else {
            currentAwayScore += event.points;
          }
          
          // Update score for this minute and all subsequent minutes
          for (let m = minute; m <= (matchState.minuto || 30); m++) {
            const laterMinute = minuteEvents.get(m);
            if (laterMinute) {
              laterMinute.homeScore = currentHomeScore;
              laterMinute.awayScore = currentAwayScore;
            }
          }
        }

        // Mark as key event if significant
        if (['QUAFFLE_GOAL', 'SNITCH_CAUGHT', 'SNITCH_SPOTTED'].includes(event.type)) {
          minuteEvent.keyEvent = true;
        }
      }
    });

    return Array.from(minuteEvents.values()).sort((a, b) => a.minute - b.minute);
  }

  /**
   * Identifies key moments in the match
   */
  private identifyKeyMoments(events: GameEvent[], homeTeam: Team, awayTeam: Team): KeyMoment[] {
    const keyMoments: KeyMoment[] = [];

    events.forEach(event => {
      const teamName = event.teamId === homeTeam.id ? homeTeam.name : awayTeam.name;
      
      switch (event.type) {
        case 'QUAFFLE_GOAL':
          keyMoments.push({
            minute: event.minute,
            type: 'GOAL',
            description: `${teamName} scores with the Quaffle! (+${event.points} points)`,
            team: teamName,
            impact: 'medium'
          });
          break;
          
        case 'SNITCH_CAUGHT':
          keyMoments.push({
            minute: event.minute,
            type: 'SNITCH_CAUGHT',
            description: `${teamName} catches the Golden Snitch! (+${event.points} points) - MATCH ENDS!`,
            team: teamName,
            impact: 'high'
          });
          break;
          
        case 'FOUL_COBBING':
        case 'FOUL_BLAGGING':
        case 'FOUL_BLATCHING':
          keyMoments.push({
            minute: event.minute,
            type: 'MAJOR_FOUL',
            description: `${teamName} commits a major foul: ${event.type.replace('FOUL_', '')}`,
            team: teamName,
            impact: 'medium'
          });
          break;
          
        case 'INJURY':
          keyMoments.push({
            minute: event.minute,
            type: 'INJURY',
            description: `Player injured on ${teamName} side`,
            team: teamName,
            impact: 'low'
          });
          break;
      }
    });

    return keyMoments.sort((a, b) => a.minute - b.minute);
  }

  /**
   * Calculates comprehensive match statistics
   */
  private calculateMatchStatistics(
    events: GameEvent[], 
    homeTeam: Team, 
    awayTeam: Team, 
    matchState: MatchState
  ): MatchStatistics {
    const homeEvents = events.filter(e => e.teamId === homeTeam.id);
    const awayEvents = events.filter(e => e.teamId === awayTeam.id);

    const homeQuaffleGoals = homeEvents.filter(e => e.type === 'QUAFFLE_GOAL').length;
    const awayQuaffleGoals = awayEvents.filter(e => e.type === 'QUAFFLE_GOAL').length;

    const homeSnitchPoints = homeEvents.filter(e => e.type === 'SNITCH_CAUGHT').reduce((sum, e) => sum + (e.points || 0), 0);
    const awaySnitchPoints = awayEvents.filter(e => e.type === 'SNITCH_CAUGHT').reduce((sum, e) => sum + (e.points || 0), 0);

    const homeFouls = homeEvents.filter(e => e.type.startsWith('FOUL_')).length;
    const awayFouls = awayEvents.filter(e => e.type.startsWith('FOUL_')).length;

    const homeBludgerHits = homeEvents.filter(e => e.type === 'BLUDGER_HIT').length;
    const awayBludgerHits = awayEvents.filter(e => e.type === 'BLUDGER_HIT').length;

    // Calculate dominance by period
    const totalMinutes = matchState.minuto || 30;
    const firstPeriod = Math.floor(totalMinutes / 3);
    const middlePeriod = Math.floor(totalMinutes * 2 / 3);

    const dominanceByPeriod = {
      first15: this.calculateDominance(events, homeTeam.id, 0, firstPeriod),
      middle: this.calculateDominance(events, homeTeam.id, firstPeriod, middlePeriod),
      final: this.calculateDominance(events, homeTeam.id, middlePeriod, totalMinutes)
    };

    return {
      totalEvents: events.length,
      goalsByTeam: {
        home: homeQuaffleGoals,
        away: awayQuaffleGoals
      },
      quaffleGoals: {
        home: homeQuaffleGoals,
        away: awayQuaffleGoals
      },
      snitchPoints: {
        home: homeSnitchPoints,
        away: awaySnitchPoints
      },
      fouls: {
        home: homeFouls,
        away: awayFouls
      },
      bludgerHits: {
        home: homeBludgerHits,
        away: awayBludgerHits
      },
      dominanceByPeriod
    };
  }

  /**
   * Calculates dominance in a specific time period
   */
  private calculateDominance(
    events: GameEvent[], 
    homeTeamId: string, 
    startMinute: number, 
    endMinute: number
  ): 'home' | 'away' | 'even' {
    const periodEvents = events.filter(e => e.minute >= startMinute && e.minute < endMinute);
    const homeScore = periodEvents.filter(e => e.teamId === homeTeamId).reduce((sum, e) => sum + (e.points || 0), 0);
    const awayScore = periodEvents.filter(e => e.teamId !== homeTeamId).reduce((sum, e) => sum + (e.points || 0), 0);

    if (homeScore > awayScore) return 'home';
    if (awayScore > homeScore) return 'away';
    return 'even';
  }

  /**
   * Persists result to localStorage
   */
  private persistResult(result: DetailedMatchResult): void {
    try {
      const existingResults = this.getAllResults();
      existingResults.push(result);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingResults));
    } catch (error) {
      console.error('Error persisting match result:', error);
    }
  }

  /**
   * Updates results cache for quick access
   */
  private updateResultsCache(result: DetailedMatchResult): void {
    try {
      const cache = {
        lastUpdated: new Date().toISOString(),
        totalMatches: this.getAllResults().length,
        latestResult: {
          id: result.id,
          matchId: result.matchId,
          homeTeam: result.homeTeam.name,
          awayTeam: result.awayTeam.name,
          finalScore: result.finalScore,
          completedAt: result.completedAt
        }
      };

      localStorage.setItem(this.RESULTS_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error updating results cache:', error);
    }
  }

  /**
   * Retrieves all match results
   */
  getAllResults(): DetailedMatchResult[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error retrieving match results:', error);
      return [];
    }
  }

  /**
   * Retrieves a specific match result by match ID
   */
  getMatchResult(matchId: string): DetailedMatchResult | undefined {
    const results = this.getAllResults();
    return results.find(result => result.matchId === matchId);
  }

  /**
   * Retrieves match results by team
   */
  getResultsByTeam(teamId: string): DetailedMatchResult[] {
    const results = this.getAllResults();
    return results.filter(result => 
      result.homeTeam.id === teamId || result.awayTeam.id === teamId
    );
  }

  /**
   * Retrieves recent match results
   */
  getRecentResults(limit: number = 10): DetailedMatchResult[] {
    const results = this.getAllResults();
    return results
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, limit);
  }

  /**
   * Gets match results statistics
   */
  getResultsStatistics(): {
    totalMatches: number;
    averageDuration: number;
    snitchCaughtPercentage: number;
    averageGoalsPerMatch: number;
  } {
    const results = this.getAllResults();
    
    if (results.length === 0) {
      return {
        totalMatches: 0,
        averageDuration: 0,
        snitchCaughtPercentage: 0,
        averageGoalsPerMatch: 0
      };
    }

    const totalDuration = results.reduce((sum, r) => sum + r.matchDuration, 0);
    const snitchMatches = results.filter(r => r.snitchCaught).length;
    const totalGoals = results.reduce((sum, r) => sum + r.statistics.goalsByTeam.home + r.statistics.goalsByTeam.away, 0);

    return {
      totalMatches: results.length,
      averageDuration: Math.round(totalDuration / results.length),
      snitchCaughtPercentage: Math.round((snitchMatches / results.length) * 100),
      averageGoalsPerMatch: Math.round((totalGoals / results.length) * 10) / 10
    };
  }

  /**
   * Clears all stored results (for testing/reset purposes)
   */
  clearAllResults(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.RESULTS_CACHE_KEY);
    console.log('All match results cleared');
  }
}

// Export singleton instance
export const matchResultsService = new MatchResultsService();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as Window & { matchResultsService?: MatchResultsService }).matchResultsService = matchResultsService;
}
