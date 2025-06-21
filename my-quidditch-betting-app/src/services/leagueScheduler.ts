import { Team, Match, Season, ScheduleConfig } from '@/types/league';

export class LeagueScheduler {  private readonly DEFAULT_CONFIG: ScheduleConfig = {
    seasonStart: new Date('2025-07-01'),
    seasonEnd: new Date('2026-05-31'),
    matchesPerWeek: 2,
    daysBetweenRounds: 14,
    preferredMatchDays: [5, 6], // Friday and Saturday
    matchTimes: ['14:00', '16:30', '19:00'],
    venues: ['Quidditch Stadium', 'Hogwarts Pitch', 'Ministry Field']
  };
  /**
   * Generates a complete season with double round-robin calendar
   * Using the circle method for optimal fixture distribution
   */
  generateSeason(
    teams: Team[], 
    seasonName: string = 'Hogwarts League',
    year: number = new Date().getFullYear(),
    config: Partial<ScheduleConfig> = {}
  ): Season {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    if (teams.length < 2) {
      throw new Error('Need at least 2 teams to generate a season');
    }

    // Ensure teams have required fields for compatibility
    const processedTeams = teams.map(team => ({
      ...team,
      fuerzaAtaque: team.fuerzaAtaque || team.attackStrength,
      fuerzaDefensa: team.fuerzaDefensa || team.defenseStrength
    }));

    const matches = this.generateCalendar(processedTeams, finalConfig);
    const totalMatchdays = (teams.length % 2 === 0 ? teams.length - 1 : teams.length) * 2;

    return {
      id: `season-${year}`,
      name: `${seasonName} ${year}`,
      year,
      equipos: processedTeams, // New field
      partidos: matches, // New field  
      teams: processedTeams, // Backward compatibility
      matches,
      startDate: finalConfig.seasonStart,
      endDate: finalConfig.seasonEnd,
      currentMatchday: 1,
      currentRound: 1,
      totalMatchdays,
      status: 'not_started',
      config: finalConfig
    };
  }
  /**
   * Generates a double round-robin calendar using the circle method
   * Algorithm: Fix one team, rotate others to generate all pairings
   */
  generateCalendar(
    teams: Team[], 
    fechaInicio: Date, 
    diasEntreJornadas?: number
  ): Match[];
  generateCalendar(teams: Team[], config: ScheduleConfig): Match[];
  generateCalendar(
    teams: Team[], 
    configOrFecha: ScheduleConfig | Date, 
    diasEntreJornadas: number = 7
  ): Match[] {
    // Handle both old and new API
    const config: ScheduleConfig = configOrFecha instanceof Date 
      ? {
          seasonStart: configOrFecha,
          seasonEnd: new Date(configOrFecha.getTime() + (365 * 24 * 60 * 60 * 1000)),
          matchesPerWeek: 2,
          daysBetweenRounds: diasEntreJornadas,
          preferredMatchDays: [5, 6],
          matchTimes: ['19:00'],
          venues: ['Quidditch Stadium']
        }
      : configOrFecha;

    if (teams.length < 2) {
      throw new Error('Need at least 2 teams to generate calendar');
    }

    const matches: Match[] = [];
    const numTeams = teams.length;
    const isOdd = numTeams % 2 === 1;
    
    // Create working array - add dummy team if odd number
    const workingTeams = isOdd ? [...teams, this.createDummyTeam()] : [...teams];
    const numRounds = workingTeams.length - 1;
    
    let matchId = 1;
    let currentDate = new Date(config.seasonStart);

    // Generate both rounds (double round-robin)
    for (let round = 1; round <= 2; round++) {
      for (let jornada = 1; jornada <= numRounds; jornada++) {
        const jornadaMatches = this.generateJornada(
          workingTeams,
          jornada,
          round,
          currentDate,
          matchId,
          config
        );

        // Filter out dummy team matches
        const validMatches = jornadaMatches.filter(match => 
          match.homeTeamId !== 'dummy' && match.awayTeamId !== 'dummy'
        );

        matches.push(...validMatches);
        matchId += validMatches.length;

        // Move to next jornada date
        currentDate = this.getNextMatchDate(currentDate, config, diasEntreJornadas);
      }
    }

    return matches;
  }

  /**
   * Generates matches for a specific jornada using circle method
   * This is the core of the round-robin algorithm
   */
  private generateJornada(
    teams: Team[],
    jornada: number,
    round: number,
    fecha: Date,
    startingMatchId: number,
    config: ScheduleConfig
  ): Match[] {
    const matches: Match[] = [];
    const numTeams = teams.length;
    
    // Create array with teams for this jornada
    // Team 0 stays fixed, others rotate
    const jornadaTeams = [...teams];
    
    // Rotate teams (except first one which is fixed)
    // Number of rotations = (jornada - 1) mod (numTeams - 1)
    const rotations = (jornada - 1) % (numTeams - 1);
    for (let i = 0; i < rotations; i++) {
      const lastTeam = jornadaTeams.pop()!;
      jornadaTeams.splice(1, 0, lastTeam);
    }

    // Create matches for this jornada
    const numMatches = Math.floor(numTeams / 2);
    for (let i = 0; i < numMatches; i++) {
      const team1Index = i;
      const team2Index = numTeams - 1 - i;
      
      const team1 = jornadaTeams[team1Index];
      const team2 = jornadaTeams[team2Index];

      if (team1 && team2) {
        let localTeam = team1;
        let visitanteTeam = team2;

        // In second round, swap home/away to complete double round-robin
        if (round === 2) {
          localTeam = team2;
          visitanteTeam = team1;
        }

        // Assign specific time for this match
        const matchTime = config.matchTimes[i % config.matchTimes.length];
        const matchDate = this.createMatchDateTime(fecha, matchTime);        matches.push({
          id: `match-${startingMatchId + i}`,
          // New schema fields
          localId: localTeam.id,
          visitanteId: visitanteTeam.id,
          fecha: matchDate,
          eventos: [],
          // Backward compatibility
          homeTeamId: localTeam.id,
          awayTeamId: visitanteTeam.id,
          date: matchDate,
          events: [],
          // Match metadata
          status: 'scheduled',
          homeScore: 0,
          awayScore: 0,
          duration: 0,
          round,
          matchday: ((round - 1) * (teams.length - 1)) + jornada,
          venue: config.venues?.[i % config.venues.length] || 'Quidditch Stadium',
          weather: 'sunny',
          snitchCaught: false
        });
      }
    }

    return matches;
  }

  /**
   * Creates a match date and time
   */
  private createMatchDateTime(baseDate: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const matchDate = new Date(baseDate);
    matchDate.setHours(hours, minutes, 0, 0);
    return matchDate;
  }

  /**
   * Gets the next match date based on configuration
   */
  private getNextMatchDate(
    currentDate: Date, 
    config: ScheduleConfig, 
    diasEntreJornadas: number
  ): Date {
    // For backward compatibility
    if (diasEntreJornadas && !config.preferredMatchDays.length) {
      return new Date(currentDate.getTime() + diasEntreJornadas * 24 * 60 * 60 * 1000);
    }    // Use preferred match days
    const nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // Start from next day
    
    while (!config.preferredMatchDays.includes(nextDate.getDay())) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    
    return nextDate;
  }
  /**
   * Creates a dummy team for odd number of teams
   */
  private createDummyTeam(): Team {
    return {
      id: 'dummy',
      name: 'Dummy Team',
      fuerzaAtaque: 0,
      fuerzaDefensa: 0,
      attackStrength: 0,
      defenseStrength: 0,
      seekerSkill: 0,
      chaserSkill: 0,
      keeperSkill: 0,
      beaterSkill: 0
    };
  }

  /**
   * Gets upcoming matches (próximos partidos)
   * Filters matches with fecha > hoy, orders by date ascending
   */
  getUpcomingMatches(season: Season, limit: number = 5): Match[] {
    const now = new Date();
    
    return season.matches
      .filter(match => 
        match.status === 'scheduled' && 
        match.date > now
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, limit);
  }

  /**
   * Gets upcoming matches for a specific team
   */
  getTeamUpcomingMatches(season: Season, teamId: string, limit: number = 5): Match[] {
    const now = new Date();
    
    return season.matches
      .filter(match => 
        (match.homeTeamId === teamId || match.awayTeamId === teamId) &&
        match.status === 'scheduled' &&
        match.date > now
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, limit);
  }

  /**
   * Gets matches for current matchday
   */
  getCurrentMatchday(season: Season): Match[] {
    return season.matches
      .filter(match => match.matchday === season.currentMatchday)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Advances to next matchday
   */
  advanceMatchday(season: Season): void {
    const currentMatchdayMatches = this.getCurrentMatchday(season);
    
    // Check if all matches in current matchday are finished
    const allFinished = currentMatchdayMatches.every(
      match => match.status === 'finished'
    );

    if (allFinished && season.currentMatchday < season.totalMatchdays) {
      season.currentMatchday++;
      
      // Update current round
      const teamsCount = season.teams.length;
      const matchdaysPerRound = teamsCount % 2 === 0 ? teamsCount - 1 : teamsCount;
      season.currentRound = Math.ceil(season.currentMatchday / matchdaysPerRound);
    }

    // Check if season is finished
    if (season.currentMatchday > season.totalMatchdays) {
      season.status = 'finished';
    }
  }

  /**
   * Validates that the calendar follows round-robin rules
   */
  validateCalendar(season: Season): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const teams = season.teams;
    const matches = season.matches;

    // Each team should play every other team exactly twice
    for (const team1 of teams) {
      for (const team2 of teams) {
        if (team1.id === team2.id) continue;

        const matchesBetween = matches.filter(match =>
          (match.homeTeamId === team1.id && match.awayTeamId === team2.id) ||
          (match.homeTeamId === team2.id && match.awayTeamId === team1.id)
        );

        if (matchesBetween.length !== 2) {
          errors.push(
            `Teams ${team1.name} and ${team2.name} should play exactly twice, but play ${matchesBetween.length} times`
          );
        }

        // Each team should play home and away once against each opponent
        const homeMatches = matchesBetween.filter(match => match.homeTeamId === team1.id);
        const awayMatches = matchesBetween.filter(match => match.awayTeamId === team1.id);

        if (homeMatches.length !== 1 || awayMatches.length !== 1) {
          errors.push(
            `Home/away imbalance between ${team1.name} and ${team2.name}: ${homeMatches.length} home, ${awayMatches.length} away`
          );
        }
      }
    }

    // Check total number of matches
    const expectedMatches = teams.length * (teams.length - 1); // Each team plays n-1 opponents twice
    if (matches.length !== expectedMatches) {
      errors.push(
        `Expected ${expectedMatches} matches for ${teams.length} teams, but got ${matches.length}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Gets season statistics
   */
  getSeasonStats(season: Season) {
    const matches = season.matches;
    const finishedMatches = matches.filter(m => m.status === 'finished');
    const scheduledMatches = matches.filter(m => m.status === 'scheduled');
    
    return {
      totalMatches: matches.length,
      finishedMatches: finishedMatches.length,
      scheduledMatches: scheduledMatches.length,
      currentMatchday: season.currentMatchday,
      currentRound: season.currentRound,
      totalMatchdays: season.totalMatchdays,
      progress: finishedMatches.length / matches.length,
      seasonStatus: season.status
    };
  }
}

// Export singleton instance
export const leagueScheduler = new LeagueScheduler();
