import { Season, Match, UpcomingMatch, Team } from '@/types/league';
import { virtualTimeManager } from './virtualTimeManager';

/**
 * Service for managing upcoming matches view
 * Following the schema: "Vista 'Próximos partidos'"
 * Updated to work with virtual time management
 */
export class UpcomingMatchesService {
  /**
   * Gets upcoming matches (próximos partidos)
   * Uses virtual time instead of real time
   */
  getUpcomingMatches(season: Season, limit: number = 5): UpcomingMatch[] {
    const fechaVirtual = virtualTimeManager.getFechaVirtualActual();
    
    // Use partidos (Spanish) if available, fallback to matches (English)
    const partidos = season.partidos || season.matches || [];
    
    return partidos
      .filter(match => {
        const matchDate = new Date(match.fecha || match.date);
        return matchDate > fechaVirtual && match.status === 'scheduled';
      })
      .sort((a, b) => {
        const dateA = new Date(a.fecha || a.date);
        const dateB = new Date(b.fecha || b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, limit)
      .map(match => this.mapToUpcomingMatch(match, season));
  }

  /**
   * Gets matches happening today (virtual today)
   */
  getTodayMatches(season: Season): UpcomingMatch[] {
    const fechaVirtual = virtualTimeManager.getFechaVirtualActual();
    const startOfDay = new Date(fechaVirtual);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fechaVirtual);
    endOfDay.setHours(23, 59, 59, 999);
    
    const partidos = season.partidos || season.matches || [];
    
    return partidos
      .filter(match => {
        const matchDate = new Date(match.fecha || match.date);
        return matchDate >= startOfDay && matchDate <= endOfDay;
      })
      .sort((a, b) => {
        const dateA = new Date(a.fecha || a.date);
        const dateB = new Date(b.fecha || b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .map(match => this.mapToUpcomingMatch(match, season));
  }

  /**
   * Gets upcoming matches for a specific team (using virtual time)
   */
  getTeamUpcomingMatches(season: Season, teamId: string, limit: number = 5): UpcomingMatch[] {
    const fechaVirtual = virtualTimeManager.getFechaVirtualActual();
    const partidos = season.partidos || season.matches || [];
    
    return partidos
      .filter(match => {
        const matchDate = new Date(match.fecha || match.date);
        const isTeamMatch = (match.localId === teamId || match.visitanteId === teamId) ||
                           (match.homeTeamId === teamId || match.awayTeamId === teamId);
        return isTeamMatch && matchDate > fechaVirtual && match.status === 'scheduled';
      })
      .sort((a, b) => {
        const dateA = new Date(a.fecha || a.date);
        const dateB = new Date(b.fecha || b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, limit)
      .map(match => this.mapToUpcomingMatch(match, season));
  }

  /**
   * Gets matches happening this week (virtual week)
   */
  getThisWeekMatches(season: Season): UpcomingMatch[] {
    const fechaVirtual = virtualTimeManager.getFechaVirtualActual();
    const weekFromNow = new Date(fechaVirtual.getTime() + (7 * 24 * 60 * 60 * 1000));
    const partidos = season.partidos || season.matches || [];

    return partidos
      .filter(match => {
        const matchDate = new Date(match.fecha || match.date);
        return match.status === 'scheduled' &&
               matchDate >= fechaVirtual && 
               matchDate <= weekFromNow;
      })
      .sort((a, b) => {
        const dateA = new Date(a.fecha || a.date);
        const dateB = new Date(b.fecha || b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .map(match => this.mapToUpcomingMatch(match, season));
  }

  /**
   * Gets live matches (currently in progress)
   */
  getLiveMatches(season: Season): UpcomingMatch[] {
    const partidos = season.partidos || season.matches || [];
    
    return partidos
      .filter(match => match.status === 'live')
      .sort((a, b) => {
        const dateA = new Date(a.fecha || a.date);
        const dateB = new Date(b.fecha || b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .map(match => this.mapToUpcomingMatch(match, season));
  }

  /**
   * Checks if a match can accept bets (using virtual time)
   */
  canBetOnMatch(match: Match): boolean {
    const fechaVirtual = virtualTimeManager.getFechaVirtualActual();
    const matchTime = new Date(match.fecha || match.date);
    const timeUntilMatch = matchTime.getTime() - fechaVirtual.getTime();
    const minimumBettingTime = 15 * 60 * 1000; // 15 minutes in milliseconds

    return (
      match.status === 'scheduled' &&
      timeUntilMatch > minimumBettingTime
    );
  }

  /**
   * Generates simple odds based on team strengths
   */
  generateBasicOdds(homeTeam: Team, awayTeam: Team): { home: number; away: number; draw?: number } {
    const homeStrength = (homeTeam.fuerzaAtaque + homeTeam.fuerzaDefensa) / 2;
    const awayStrength = (awayTeam.fuerzaAtaque + awayTeam.fuerzaDefensa) / 2;
    
    // Simple odds calculation (in real app, this would be more sophisticated)
    const homeAdvantage = 5; // Home team gets 5 point advantage
    
    const adjustedHomePower = homeStrength + homeAdvantage;
    const totalPower = adjustedHomePower + awayStrength;
    
    const homeWinProb = adjustedHomePower / totalPower;
    const awayWinProb = awayStrength / totalPower;

    return {
      home: parseFloat((1 / homeWinProb).toFixed(2)),
      away: parseFloat((1 / awayWinProb).toFixed(2))
    };
  }

  /**
   * Maps a Match to UpcomingMatch interface
   */
  private mapToUpcomingMatch(match: Match, season: Season): UpcomingMatch {
    // Support both Spanish and English field names
    const homeTeamId = match.localId || match.homeTeamId;
    const awayTeamId = match.visitanteId || match.awayTeamId;
    const matchDate = match.fecha || match.date;
    
    const homeTeam = season.equipos?.find(t => t.id === homeTeamId) || 
                     season.teams?.find(t => t.id === homeTeamId);
    const awayTeam = season.equipos?.find(t => t.id === awayTeamId) || 
                     season.teams?.find(t => t.id === awayTeamId);

    if (!homeTeam || !awayTeam) {
      throw new Error(`Teams not found for match ${match.id}`);
    }

    const matchDateObj = new Date(matchDate);
    const timeString = matchDateObj.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });    return {
      id: match.id,
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
      date: matchDateObj,
      time: timeString,
      venue: match.venue || 'Stadium',
      canBet: this.canBetOnMatch(match),
      odds: this.generateBasicOdds(homeTeam, awayTeam)
    };
  }

  /**
   * Formats time until match for display (using virtual time)
   */
  getTimeUntilMatch(matchDate: Date): string {
    const fechaVirtual = virtualTimeManager.getFechaVirtualActual();
    const diff = matchDate.getTime() - fechaVirtual.getTime();

    if (diff < 0) return 'En curso';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `En ${days}d ${hours}h`;
    if (hours > 0) return `En ${hours}h ${minutes}m`;
    return `En ${minutes}m`;
  }
}

// Export singleton instance
export const upcomingMatchesService = new UpcomingMatchesService();
