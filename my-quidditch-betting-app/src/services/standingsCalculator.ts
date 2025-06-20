import { Team, Match, Standing } from '@/types/league';

export class LeagueStandingsCalculator {
  /**
   * Calculates current league standings based on played matches
   */
  calculateStandings(teams: Team[], matches: Match[]): Standing[] {
    const standings: Map<string, Standing> = new Map();

    // Initialize standings for all teams
    teams.forEach(team => {
      standings.set(team.id, {
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
        position: 0
      });
    });

    // Process finished matches
    const finishedMatches = matches.filter(match => match.status === 'finished');

    finishedMatches.forEach(match => {
      const homeStanding = standings.get(match.homeTeamId);
      const awayStanding = standings.get(match.awayTeamId);

      if (!homeStanding || !awayStanding) return;

      // Update matches played
      homeStanding.matchesPlayed++;
      awayStanding.matchesPlayed++;

      // Update goals
      homeStanding.goalsFor += match.homeScore;
      homeStanding.goalsAgainst += match.awayScore;
      awayStanding.goalsFor += match.awayScore;
      awayStanding.goalsAgainst += match.homeScore;

      // Update goal difference
      homeStanding.goalDifference = homeStanding.goalsFor - homeStanding.goalsAgainst;
      awayStanding.goalDifference = awayStanding.goalsFor - awayStanding.goalsAgainst;

      // Determine match result and update points
      if (match.homeScore > match.awayScore) {
        // Home team wins
        homeStanding.wins++;
        homeStanding.points += 3;
        awayStanding.losses++;
      } else if (match.awayScore > match.homeScore) {
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
    });

    // Convert to array and sort
    const standingsArray = Array.from(standings.values());
    return this.sortStandings(standingsArray);
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
      }

      // Goals for (descending)
      if (a.goalsFor !== b.goalsAgainst) {
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
        .sort((a, b) => b.date.getTime() - a.date.getTime())
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
}

export const standingsCalculator = new LeagueStandingsCalculator();
