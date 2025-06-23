/**
 * Professional Quidditch League System Configuration
 * Complete implementation following the schema:
 * - Circle Method Calendar Generation
 * - Live Minute-by-Minute Simulation  
 * - Upcoming Matches Auto-Updating View
 * - FullCalendar Integration Ready
 * 
 * Usage Instructions:
 * 1. Import this in your console or main app
 * 2. Run: QuidditchSystem.runProfessionalDemo()
 * 3. Access services individually via QuidditchSystem.services
 */

// Core Services
import { leagueScheduler } from './leagueScheduler';
import { quidditchSimulator } from './quidditchSimulator';
import { standingsCalculator } from './standingsCalculator';
import { quidditchLeagueManager } from './quidditchLeagueManager';
import { upcomingMatchesService } from './upcomingMatchesService';
import { liveMatchSimulator } from './liveMatchSimulator';

// Demo and Testing
import { runProfessionalDemo, demoSimulation, demoCalendar } from './quidditchLeagueDemo';

// Types
import type { Team, Season, Match, MatchState, UpcomingMatch, ScheduleConfig } from '@/types/league';

/**
 * Main configuration and access point for the Professional Quidditch League System
 */
export class QuidditchSystem {
  // Core services access
  static services = {
    // Calendar generation with Circle Method
    scheduler: leagueScheduler,
    
    // Match simulation (both batch and live)
    simulator: quidditchSimulator,
    liveSimulator: liveMatchSimulator,
    
    // League management and orchestration
    manager: quidditchLeagueManager,
    
    // Standings calculation
    standings: standingsCalculator,
    
    // Upcoming matches view (auto-updating)
    upcomingMatches: upcomingMatchesService
  };

  // Demo functions
  static demos = {
    // Full professional workflow demo
    runComplete: runProfessionalDemo,
    
    // Live simulation demo
    liveMatch: demoSimulation,
    
    // Calendar generation demo
    calendar: demoCalendar
  };

  /**
   * Quick setup for professional league
   * Creates teams, generates calendar, and returns ready-to-use season
   */
  static createProfessionalLeague(): Season {
    const teams: Team[] = [
      {
        id: 'gryffindor',
        name: 'Gryffindor',
        house: 'Gryffindor',
        fuerzaAtaque: 85,
        fuerzaDefensa: 78,
        attackStrength: 85,
        defenseStrength: 78,
        seekerSkill: 90,
        chaserSkill: 85,
        keeperSkill: 80,
        beaterSkill: 75,
        venue: 'Gryffindor Tower Pitch'
      },
      {
        id: 'slytherin',
        name: 'Slytherin',
        house: 'Slytherin',
        fuerzaAtaque: 82,
        fuerzaDefensa: 88,
        attackStrength: 82,
        defenseStrength: 88,
        seekerSkill: 85,
        chaserSkill: 80,
        keeperSkill: 90,
        beaterSkill: 85,
        venue: 'Slytherin Dungeon Pitch'
      },
      {
        id: 'ravenclaw',
        name: 'Ravenclaw',
        house: 'Ravenclaw',
        fuerzaAtaque: 79,
        fuerzaDefensa: 82,
        attackStrength: 79,
        defenseStrength: 82,
        seekerSkill: 95,
        chaserSkill: 78,
        keeperSkill: 85,
        beaterSkill: 70,
        venue: 'Ravenclaw Tower Pitch'
      },
      {
        id: 'hufflepuff',
        name: 'Hufflepuff',
        house: 'Hufflepuff',
        fuerzaAtaque: 76,
        fuerzaDefensa: 85,
        attackStrength: 76,
        defenseStrength: 85,
        seekerSkill: 75,
        chaserSkill: 82,
        keeperSkill: 88,
        beaterSkill: 80,
        venue: 'Hufflepuff Basement Pitch'
      },
      {
        id: 'chudley',
        name: 'Chudley Cannons',
        fuerzaAtaque: 65,
        fuerzaDefensa: 70,
        attackStrength: 65,
        defenseStrength: 70,
        seekerSkill: 60,
        chaserSkill: 65,
        keeperSkill: 75,
        beaterSkill: 70,
        venue: 'Cannon Stadium'
      },
      {
        id: 'harpies',
        name: 'Holyhead Harpies',
        fuerzaAtaque: 92,
        fuerzaDefensa: 86,
        attackStrength: 92,
        defenseStrength: 86,
        seekerSkill: 88,
        chaserSkill: 95,
        keeperSkill: 80,
        beaterSkill: 85,
        venue: 'Harpies Ground'
      }
    ];

    const config: Partial<ScheduleConfig> = {
      seasonStart: new Date('2024-09-01'),
      seasonEnd: new Date('2025-05-31'),
      matchesPerWeek: 2,
      daysBetweenRounds: 7,
      preferredMatchDays: [5, 6], // Friday and Saturday
      matchTimes: ['14:00', '16:30', '19:00'],
      venues: ['Quidditch Stadium', 'Hogwarts Pitch', 'Ministry Field', 'Professional Arena']
    };

    return this.services.manager.createSeason(
      teams,
      'Liga Profesional de Quidditch 2024',
      2024,
      config
    );
  }

  /**
   * Get upcoming matches in FullCalendar format
   * Ready for direct integration with FullCalendar.js
   */
  static getCalendarEvents(season: Season, limit: number = 20): Array<{
    id: string;
    title: string;
    start: string;
    extendedProps: {
      homeTeam: string;
      awayTeam: string;
      venue?: string;
      canBet: boolean;
      status: string;
      league: string;
    };
  }> {
    const upcomingMatches = this.services.upcomingMatches.getUpcomingMatches(season, limit);
    
    return upcomingMatches.map(match => ({
      id: match.id,
      title: `${match.homeTeam} vs ${match.awayTeam}`,
      start: match.date.toISOString(),      extendedProps: {
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        venue: match.venue,
        canBet: match.canBet,
        status: 'scheduled',
        league: 'Liga Profesional Quidditch'
      }
    }));
  }

  /**
   * Start a live match simulation with UI-ready state updates
   */
  static startLiveMatch(matchId: string, season: Season): MatchState | null {
    const match = season.matches.find(m => m.id === matchId);
    if (!match) return null;

    const homeTeam = season.teams.find(t => t.id === match.homeTeamId);
    const awayTeam = season.teams.find(t => t.id === match.awayTeamId);
    
    if (!homeTeam || !awayTeam) return null;

    return this.services.liveSimulator.startLiveMatch(match, homeTeam, awayTeam, 90);
  }

  /**
   * Get live match status for UI components
   */  static getLiveMatchStatus(matchId: string): {
    minute: number;
    homeScore: number;
    awayScore: number;
    isActive: boolean;
    lastEvent?: object;
    events: object[];
  } | null {
    const state = this.services.liveSimulator.getMatchState(matchId);
    if (!state) return null;

    return {
      minute: state.minuto,
      homeScore: state.golesLocal,
      awayScore: state.golesVisitante,
      isActive: state.isActive,
      lastEvent: state.eventos[state.eventos.length - 1],
      events: state.eventos
    };
  }

  /**
   * Validate system integrity
   */
  static validateSystem(season: Season): { isValid: boolean; report: string[] } {
    const report: string[] = [];
    
    // Validate calendar
    const calendarValidation = this.services.scheduler.validateCalendar(season);
    if (calendarValidation.isValid) {
      report.push('✅ Calendar validation passed');
    } else {
      report.push('❌ Calendar validation failed');
      report.push(...calendarValidation.errors.map(e => `   - ${e}`));
    }

    // Validate team data
    const invalidTeams = season.teams.filter(team => 
      !team.fuerzaAtaque || !team.fuerzaDefensa || 
      team.fuerzaAtaque < 1 || team.fuerzaAtaque > 100 ||
      team.fuerzaDefensa < 1 || team.fuerzaDefensa > 100
    );

    if (invalidTeams.length === 0) {
      report.push('✅ All teams have valid strength values');
    } else {
      report.push('❌ Some teams have invalid strength values');
      report.push(...invalidTeams.map(t => `   - ${t.name}: Attack ${t.fuerzaAtaque}, Defense ${t.fuerzaDefensa}`));
    }

    // Validate matches structure
    const totalExpectedMatches = season.teams.length * (season.teams.length - 1);
    if (season.matches.length === totalExpectedMatches) {
      report.push('✅ Correct number of matches generated');
    } else {
      report.push(`❌ Expected ${totalExpectedMatches} matches, got ${season.matches.length}`);
    }

    return {
      isValid: calendarValidation.isValid && invalidTeams.length === 0 && season.matches.length === totalExpectedMatches,
      report
    };
  }

  /**
   * Quick performance test
   */
  static async runPerformanceTest(): Promise<void> {
    console.log('🚀 Performance Test Starting...\n');
    
    const startTime = Date.now();
    
    // Create league
    const season = this.createProfessionalLeague();
    const creationTime = Date.now();
    
    // Simulate 10 matches
    for (let i = 0; i < Math.min(10, season.matches.length); i++) {
      this.services.manager.simulateMatch(season, season.matches[i].id);
    }
    const simulationTime = Date.now();
    
    // Get upcoming matches
    const upcoming = this.services.upcomingMatches.getUpcomingMatches(season, 5);
    const upcomingTime = Date.now();
    
    console.log('📊 Performance Results:');
    console.log(`   League Creation: ${creationTime - startTime}ms`);
    console.log(`   10 Match Simulation: ${simulationTime - creationTime}ms`);
    console.log(`   Upcoming Matches Query: ${upcomingTime - simulationTime}ms`);
    console.log(`   Total Time: ${upcomingTime - startTime}ms`);
    console.log(`   Matches Generated: ${season.matches.length}`);
    console.log(`   Teams: ${season.teams.length}`);
    console.log(`   Upcoming Found: ${upcoming.length}`);
  }
}

// Export for console usage
// QuidditchSystem is already exported above

// Make available globally for console access
declare global {
  interface Window {
    QuidditchSystem: typeof QuidditchSystem;
  }
}

if (typeof window !== 'undefined') {
  window.QuidditchSystem = QuidditchSystem;
}

// Export individual components for specific usage
export {
  // Services
  leagueScheduler,
  quidditchSimulator,
  standingsCalculator,
  quidditchLeagueManager,
  upcomingMatchesService,
  liveMatchSimulator,
  
  // Demos
  runProfessionalDemo,
  demoSimulation,
  demoCalendar,
  
  // Types
  type Team,
  type Season,
  type Match,
  type MatchState,
  type UpcomingMatch,
  type ScheduleConfig
};
