import { Team, Season, Match, MatchResult, ScheduleConfig } from '@/types/league';
import { LeagueScheduler } from './leagueScheduler';
import { QuidditchSimulator } from './quidditchSimulator';
import { LeagueStandingsCalculator } from './standingsCalculator';

/**
 * Main service that orchestrates the entire Quidditch League simulation system
 * Handles season creation, match simulation, and league management
 */
export class QuidditchLeagueManager {
  private scheduler: LeagueScheduler;
  private simulator: QuidditchSimulator;
  private standingsCalculator: LeagueStandingsCalculator;

  constructor() {
    this.scheduler = new LeagueScheduler();
    this.simulator = new QuidditchSimulator();
    this.standingsCalculator = new LeagueStandingsCalculator();
  }
  /**
   * Creates a complete season with all fixtures
   */
  createSeason(
    teams: Team[],
    seasonName: string = 'Liga Profesional Quidditch',
    year: number = new Date().getFullYear(),
    config?: Partial<ScheduleConfig>
  ): Season {
    if (teams.length < 4) {
      throw new Error('A league needs at least 4 teams');
    }

    return this.scheduler.generateSeason(teams, seasonName, year, config);
  }

  /**
   * Simulates a single match and updates the season
   */
  simulateMatch(season: Season, matchId: string): MatchResult {
    const match = season.matches.find(m => m.id === matchId);
    if (!match) {
      throw new Error(`Match with ID ${matchId} not found`);
    }

    if (match.status !== 'scheduled') {
      throw new Error(`Match ${matchId} is not scheduled (status: ${match.status})`);
    }

    // Get teams
    const homeTeam = season.teams.find(t => t.id === match.homeTeamId);
    const awayTeam = season.teams.find(t => t.id === match.awayTeamId);

    if (!homeTeam || !awayTeam) {
      throw new Error('Teams not found for match');
    }

    // Simulate the match
    const result = this.simulator.simulateMatch(homeTeam, awayTeam);

    // Update match with results
    match.status = 'finished';
    match.homeScore = result.homeScore;
    match.awayScore = result.awayScore;
    match.events = result.events;
    match.duration = result.duration;
    match.snitchCaught = result.snitchCaught;
    match.weather = result.weather as 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' | 'windy' | undefined;
    match.attendance = result.attendance;

    return result;
  }

  /**
   * Simulates all matches in the current matchday
   */
  simulateCurrentMatchday(season: Season): MatchResult[] {
    const currentMatches = this.scheduler.getCurrentMatchday(season);
    const results: MatchResult[] = [];

    for (const match of currentMatches) {
      if (match.status === 'scheduled') {
        const result = this.simulateMatch(season, match.id);
        results.push(result);
      }
    }

    // Advance to next matchday if all matches are finished
    this.scheduler.advanceMatchday(season);

    return results;
  }

  /**
   * Simulates the entire season
   */
  simulateEntireSeason(season: Season): void {
    while (season.status !== 'finished') {
      this.simulateCurrentMatchday(season);
    }
  }

  /**
   * Gets current league standings
   */
  getCurrentStandings(season: Season) {
    return this.standingsCalculator.calculateStandings(season.teams, season.matches);
  }

  /**
   * Gets upcoming matches (próximos partidos)
   */
  getUpcomingMatches(season: Season, limit: number = 5): Match[] {
    return this.scheduler.getUpcomingMatches(season, limit);
  }

  /**
   * Gets upcoming matches for a specific team
   */
  getTeamUpcomingMatches(season: Season, teamId: string, limit: number = 3): Match[] {
    return this.scheduler.getTeamUpcomingMatches(season, teamId, limit);
  }

  /**
   * Gets matches for a specific matchday
   */
  getMatchdayMatches(season: Season, matchday?: number): Match[] {
    const targetMatchday = matchday || season.currentMatchday;
    return season.matches.filter(m => m.matchday === targetMatchday);
  }

  /**
   * Gets season progress and statistics
   */
  getSeasonProgress(season: Season) {
    const stats = this.scheduler.getSeasonStats(season);
    const standings = this.getCurrentStandings(season);
    
    return {
      ...stats,
      standings: standings.slice(0, 5), // Top 5 teams
      upcomingMatches: this.getUpcomingMatches(season, 3),
      lastResults: this.getRecentResults(season, 5)
    };
  }

  /**
   * Gets recent match results
   */
  getRecentResults(season: Season, limit: number = 5): Match[] {
    return season.matches
      .filter(m => m.status === 'finished')
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  /**
   * Validates season integrity
   */
  validateSeason(season: Season) {
    return this.scheduler.validateCalendar(season);
  }
  /**
   * Creates sample teams for testing
   */
  createSampleTeams(): Team[] {
    return [
      {
        id: 'gryffindor',
        name: 'Gryffindor',
        house: 'Gryffindor',
        fuerzaAtaque: 85,
        fuerzaDefensa: 80,
        attackStrength: 85,
        defenseStrength: 80,
        seekerSkill: 90,
        chaserSkill: 85,
        keeperSkill: 75,
        beaterSkill: 80,
        colors: { primary: '#740001', secondary: '#D3A625' }
      },
      {
        id: 'slytherin',
        name: 'Slytherin',
        house: 'Slytherin',
        fuerzaAtaque: 90,
        fuerzaDefensa: 85,
        attackStrength: 90,
        defenseStrength: 85,
        seekerSkill: 85,
        chaserSkill: 90,
        keeperSkill: 85,
        beaterSkill: 85,
        colors: { primary: '#1A472A', secondary: '#AAAAAA' }
      },
      {
        id: 'ravenclaw',
        name: 'Ravenclaw',
        house: 'Ravenclaw',
        fuerzaAtaque: 80,
        fuerzaDefensa: 85,
        attackStrength: 80,
        defenseStrength: 85,
        seekerSkill: 95,
        chaserSkill: 80,
        keeperSkill: 80,
        beaterSkill: 75,
        colors: { primary: '#0E1A40', secondary: '#946B2D' }
      },
      {
        id: 'hufflepuff',
        name: 'Hufflepuff',
        house: 'Hufflepuff',
        fuerzaAtaque: 75,
        fuerzaDefensa: 90,
        attackStrength: 75,
        defenseStrength: 90,
        seekerSkill: 75,
        chaserSkill: 75,
        keeperSkill: 95,
        beaterSkill: 85,
        colors: { primary: '#ECB939', secondary: '#372E29' }
      },
      {
        id: 'cannons',
        name: 'Chudley Cannons',
        fuerzaAtaque: 70,
        fuerzaDefensa: 65,
        attackStrength: 70,
        defenseStrength: 65,
        seekerSkill: 70,
        chaserSkill: 75,
        keeperSkill: 60,
        beaterSkill: 70,
        colors: { primary: '#FF6600', secondary: '#000000' }
      },
      {
        id: 'harpies',
        name: 'Holyhead Harpies',
        fuerzaAtaque: 95,
        fuerzaDefensa: 75,
        attackStrength: 95,
        defenseStrength: 75,
        seekerSkill: 80,
        chaserSkill: 95,
        keeperSkill: 70,
        beaterSkill: 75,
        colors: { primary: '#228B22', secondary: '#FFD700' }
      }
    ];
  }
  /**
   * Creates a demo season with sample teams
   */
  createDemoSeason(): Season {
    const teams = this.createSampleTeams();
    const config: Partial<ScheduleConfig> = {
      seasonStart: new Date('2025-07-01'),
      seasonEnd: new Date('2026-05-31'),
      preferredMatchDays: [5, 6], // Friday and Saturday
      matchTimes: ['14:00', '16:30', '19:00']
    };

    return this.createSeason(teams, 'Liga Profesional Quidditch', 2025, config);
  }

  /**
   * Simulates a few matchdays for demo purposes
   */
  simulateDemoMatchdays(season: Season, numMatchdays: number = 3): void {
    for (let i = 0; i < numMatchdays && season.status !== 'finished'; i++) {
      this.simulateCurrentMatchday(season);
    }
  }
}

// Export singleton instance
export const quidditchLeagueManager = new QuidditchLeagueManager();
