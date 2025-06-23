import { Team, Match, Standing } from '@/types/league';

export class LeagueStandingsCalculator {
  /**
   * Calculates current league standings based on played matches
   */  calculateStandings(teams: Team[], matches: Match[]): Standing[] {
    const standings: Map<string, Standing> = new Map();

    console.log(`🏆 Calculating standings for ${teams.length} teams and ${matches.length} matches`);

    // Initialize standings for all teams
    teams.forEach(team => {      standings.set(team.id, {
        teamId: team.id,
        team,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        position: 0,
        form: [],
        snitchesCaught: 0,
        averageMatchDuration: 0
      });
    });

    // Process finished matches
    const finishedMatches = matches.filter(match => match.status === 'finished');
    console.log(`📈 Processing ${finishedMatches.length} finished matches...`);

    finishedMatches.forEach(match => {
      // Handle both Spanish and English schemas
      const homeTeamId = match.homeTeamId || match.localId;
      const awayTeamId = match.awayTeamId || match.visitanteId;

      const homeStanding = standings.get(homeTeamId);
      const awayStanding = standings.get(awayTeamId);

      if (!homeStanding || !awayStanding) {
        console.warn(`Teams not found for match ${match.id}: home=${homeTeamId}, away=${awayTeamId}`);
        return;
      }

      // Validate scores - ensure they are valid numbers
      const homeScore = typeof match.homeScore === 'number' && !isNaN(match.homeScore) ? match.homeScore : 0;
      const awayScore = typeof match.awayScore === 'number' && !isNaN(match.awayScore) ? match.awayScore : 0;

      if (homeScore < 0 || awayScore < 0) {
        console.warn(`Invalid scores for match ${match.id}: home=${homeScore}, away=${awayScore}`);
        return;
      }

      // Update matches played
      homeStanding.matchesPlayed++;
      awayStanding.matchesPlayed++;

      // Update goals
      homeStanding.goalsFor += homeScore;
      homeStanding.goalsAgainst += awayScore;
      awayStanding.goalsFor += awayScore;
      awayStanding.goalsAgainst += homeScore;

      // Update goal difference
      homeStanding.goalDifference = homeStanding.goalsFor - homeStanding.goalsAgainst;
      awayStanding.goalDifference = awayStanding.goalsFor - awayStanding.goalsAgainst;      // Determine match result and update points
      if (homeScore > awayScore) {
        // Home team wins
        homeStanding.wins++;
        homeStanding.points += 3;
        awayStanding.losses++;
      } else if (awayScore > homeScore) {
        // Away team wins
        awayStanding.wins++;
        awayStanding.points += 3;
        homeStanding.losses++;
      } else {
        // Draw
        homeStanding.draws++;
        homeStanding.points += 1;
        awayStanding.draws++;
        awayStanding.points += 1;
      }

      // Track snitch catches
      if (match.snitchCaught) {
        // Determine who caught the snitch based on the score difference and events
        const scoreDifference = Math.abs(homeScore - awayScore);
        if (scoreDifference >= 150) {
          // If one team has 150+ more points, they likely caught the snitch
          if (homeScore > awayScore) {
            homeStanding.snitchesCaught++;
          } else {
            awayStanding.snitchesCaught++;
          }
        } else {
          // Check events for snitch caught
          const snitchEvent = match.events?.find(event => event.type === 'SNITCH_CAUGHT');
          if (snitchEvent) {
            const snitchCatcher = standings.get(snitchEvent.teamId);
            if (snitchCatcher) {
              snitchCatcher.snitchesCaught++;
            }
          }
        }
      }

      // Update average match duration
      const matchDuration = match.duration || 90; // Default to 90 minutes if not specified
      homeStanding.averageMatchDuration = 
        (homeStanding.averageMatchDuration * (homeStanding.matchesPlayed - 1) + matchDuration) / homeStanding.matchesPlayed;
      awayStanding.averageMatchDuration = 
        (awayStanding.averageMatchDuration * (awayStanding.matchesPlayed - 1) + matchDuration) / awayStanding.matchesPlayed;

      // Debug logging for match processing
      console.log(`Processed match ${match.id}: ${homeStanding.team.name} ${homeScore} - ${awayScore} ${awayStanding.team.name}`);
    });    // Convert to array and sort
    const standingsArray = Array.from(standings.values());
    
    // Calculate form for each team
    this.calculateFormForStandings(standingsArray, matches);
    
    const sortedStandings = this.sortStandings(standingsArray);
    
    // Validate the calculations
    this.validateStandings(sortedStandings, matches);
    
    return sortedStandings;
  }

  /**
   * Sorts standings by league rules:
   * 1. Points (descending)
   * 2. Goal difference (descending)
   * 3. Goals for (descending)
   * 4. Head-to-head record (if applicable)
   * 5. Team name (ascending)
   */
  private sortStandings(standings: Standing[]): Standing[] {
    const sorted = standings.sort((a, b) => {
      // Points (descending)
      if (a.points !== b.points) {
        return b.points - a.points;
      }

      // Goal difference (descending)
      if (a.goalDifference !== b.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }      // Goals for (descending)
      if (a.goalsFor !== b.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }

      // Team name (ascending)
      return a.team.name.localeCompare(b.team.name);
    });

    // Assign positions
    sorted.forEach((standing, index) => {
      standing.position = index + 1;
    });

    return sorted;
  }

  /**
   * Gets the top N teams from standings
   */
  getTopTeams(standings: Standing[], count: number): Standing[] {
    return standings.slice(0, count);
  }

  /**
   * Gets a specific team's standing
   */
  getTeamStanding(standings: Standing[], teamId: string): Standing | undefined {
    return standings.find(standing => standing.teamId === teamId);
  }

  /**
   * Calculates form (last N matches) for each team
   */
  calculateForm(teams: Team[], matches: Match[], lastNMatches: number = 5): Map<string, string[]> {
    const form: Map<string, string[]> = new Map();

    teams.forEach(team => {
      const teamMatches = matches
        .filter(match => 
          (match.homeTeamId === team.id || match.awayTeamId === team.id) && 
          match.status === 'finished'
        )
        .sort((a, b) => {
          const dateA = a.date || a.fecha;
          const dateB = b.date || b.fecha;
          
          // Convert to Date objects if they're strings
          const dateObjA = dateA instanceof Date ? dateA : new Date(dateA);
          const dateObjB = dateB instanceof Date ? dateB : new Date(dateB);
          
          return dateObjB.getTime() - dateObjA.getTime();
        })
        .slice(0, lastNMatches);

      const formResults = teamMatches.map(match => {
        const isHome = match.homeTeamId === team.id;
        const teamScore = isHome ? match.homeScore : match.awayScore;
        const opponentScore = isHome ? match.awayScore : match.homeScore;

        if (teamScore > opponentScore) return 'W';
        if (teamScore < opponentScore) return 'L';
        return 'D';
      });

      form.set(team.id, formResults);
    });

    return form;
  }

  /**
   * Gets league statistics
   */
  getLeagueStats(matches: Match[]): {
    totalMatches: number;
    totalGoals: number;
    averageGoalsPerMatch: number;
    highestScoringMatch: Match | null;
    mostGoalsInMatch: number;
  } {
    const finishedMatches = matches.filter(match => match.status === 'finished');
    const totalMatches = finishedMatches.length;
    const totalGoals = finishedMatches.reduce((sum, match) => sum + match.homeScore + match.awayScore, 0);
    const averageGoalsPerMatch = totalMatches > 0 ? totalGoals / totalMatches : 0;

    let highestScoringMatch: Match | null = null;
    let mostGoalsInMatch = 0;

    finishedMatches.forEach(match => {
      const totalMatchGoals = match.homeScore + match.awayScore;
      if (totalMatchGoals > mostGoalsInMatch) {
        mostGoalsInMatch = totalMatchGoals;
        highestScoringMatch = match;
      }
    });

    return {
      totalMatches,
      totalGoals,
      averageGoalsPerMatch,
      highestScoringMatch,
      mostGoalsInMatch
    };
  }

  /**
   * Validates standings calculations and logs any inconsistencies
   */
  validateStandings(standings: Standing[], matches: Match[]): boolean {
    let isValid = true;
    const finishedMatches = matches.filter(match => match.status === 'finished');

    console.log('🔍 Validating standings calculations...');
    console.log(`📊 Total finished matches: ${finishedMatches.length}`);

    standings.forEach(standing => {
      // Validate that wins + draws + losses = matches played
      const totalResults = standing.wins + standing.draws + standing.losses;
      if (totalResults !== standing.matchesPlayed) {
        console.error(`❌ Invalid results sum for ${standing.team.name}: ${totalResults} != ${standing.matchesPlayed}`);
        isValid = false;
      }

      // Validate goal difference calculation
      const calculatedGD = standing.goalsFor - standing.goalsAgainst;
      if (calculatedGD !== standing.goalDifference) {
        console.error(`❌ Invalid goal difference for ${standing.team.name}: ${calculatedGD} != ${standing.goalDifference}`);
        isValid = false;
      }

      // Validate points calculation (3 for win, 1 for draw)
      const expectedPoints = (standing.wins * 3) + standing.draws;
      if (expectedPoints !== standing.points) {
        console.error(`❌ Invalid points for ${standing.team.name}: ${expectedPoints} != ${standing.points}`);
        isValid = false;
      }

      console.log(`✅ ${standing.team.name}: ${standing.matchesPlayed}P ${standing.wins}W ${standing.draws}D ${standing.losses}L ${standing.points}pts (GD: ${standing.goalDifference})`);
    });

    // Validate total matches consistency
    const totalMatchesFromStandings = standings.reduce((sum, s) => sum + s.matchesPlayed, 0) / 2;
    if (totalMatchesFromStandings !== finishedMatches.length) {
      console.warn(`⚠️ Match count mismatch: ${totalMatchesFromStandings} calculated vs ${finishedMatches.length} actual`);
    }

    console.log(isValid ? '✅ All standings validations passed!' : '❌ Standings validation failed!');
    return isValid;
  }

  /**
   * Calculates form (last N matches) for standings
   */
  private calculateFormForStandings(standings: Standing[], matches: Match[], lastNMatches: number = 5): void {
    standings.forEach(standing => {
      const teamMatches = matches
        .filter(match => 
          match.status === 'finished' && 
          ((match.homeTeamId === standing.teamId || match.localId === standing.teamId) ||
           (match.awayTeamId === standing.teamId || match.visitanteId === standing.teamId))
        )        .sort((a, b) => {
          const dateA = a.date || a.fecha;
          const dateB = b.date || b.fecha;
          
          // Convert to Date objects if they're strings
          const dateObjA = dateA instanceof Date ? dateA : new Date(dateA);
          const dateObjB = dateB instanceof Date ? dateB : new Date(dateB);
          
          return dateObjB.getTime() - dateObjA.getTime();
        })
        .slice(0, lastNMatches);      const formResults = teamMatches.map(match => {
        const homeTeamId = match.homeTeamId || match.localId;
        const isHome = homeTeamId === standing.teamId;
        const teamScore = isHome ? match.homeScore : match.awayScore;
        const opponentScore = isHome ? match.awayScore : match.homeScore;

        if (teamScore > opponentScore) return 'W';
        if (teamScore < opponentScore) return 'L';
        return 'D';
      });

      standing.form = formResults as ('W' | 'D' | 'L')[];
    });
  }
  /**
   * Safely converts a date value to a Date object
   */
  private safeGetDate(dateValue: Date | string | number | undefined): Date {
    if (!dateValue) {
      return new Date();
    }
    
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    // Try to parse as string or number
    const parsed = new Date(dateValue);
    if (isNaN(parsed.getTime())) {
      console.warn('Invalid date value:', dateValue, 'using current date');
      return new Date();
    }
    
    return parsed;
  }
}

export const standingsCalculator = new LeagueStandingsCalculator();
