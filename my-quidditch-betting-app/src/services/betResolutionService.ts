/**
 * Bet Resolution Service
 * Handles automatic resolution of bets when matches finish
 */

import { virtualTimeManager } from './virtualTimeManager';
import { matchResultsService } from './matchResultsService';

// Import types from AuthContext
interface UserBet {
  id: string;
  userId: string;
  matchId: string;
  matchName: string;
  options: BetOption[];
  amount: number;
  combinedOdds: number;
  potentialWin: number;
  date: string;
  status: 'active' | 'won' | 'lost';
}

interface BetOption {
  id: string;
  type: string;
  selection: string;
  odds: number;
  description: string;
  matchId: string;
}

interface UserTransaction {
  id: number;
  type: 'deposit' | 'withdraw' | 'bet' | 'win';
  amount: number;
  date: string;
  description: string;
  userId: string;
}

export interface BetResolutionResult {
  betId: string;
  userId: string;
  won: boolean;
  winAmount: number;
  reason: string;
}

export interface MatchResult {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  winner: 'home' | 'away' | 'draw';
  snitchCaught: boolean;
  snitchCaughtBy?: string;
  duration: number; // in minutes
  finalScore: {
    home: number;
    away: number;
  };
}

class BetResolutionService {
  private static instance: BetResolutionService;
  
  public static getInstance(): BetResolutionService {
    if (!BetResolutionService.instance) {
      BetResolutionService.instance = new BetResolutionService();
    }
    return BetResolutionService.instance;
  }

  /**
   * Resolves all active bets for a finished match
   */
  public async resolveMatchBets(matchId: string): Promise<BetResolutionResult[]> {
    console.log(`🎯 Starting bet resolution for match: ${matchId}`);
    
    try {
      // Get match result
      const matchResult = this.getMatchResult(matchId);
      if (!matchResult) {
        console.warn(`❌ No match result found for match: ${matchId}`);
        return [];
      }

      console.log(`📊 Match result:`, {
        homeTeam: matchResult.homeTeamName,
        awayTeam: matchResult.awayTeamName,
        score: `${matchResult.homeScore}-${matchResult.awayScore}`,
        winner: matchResult.winner,
        snitchCaught: matchResult.snitchCaught
      });

      // Get all user bets for this match
      const allUserBets = this.getAllActiveBetsForMatch(matchId);
      console.log(`🎲 Found ${allUserBets.length} active bets for this match`);

      const resolutionResults: BetResolutionResult[] = [];

      // Process each user's bets
      for (const userBets of allUserBets) {
        const userResults = this.resolveUserBets(userBets.userId, userBets.bets, matchResult);
        resolutionResults.push(...userResults);
      }

      console.log(`✅ Resolved ${resolutionResults.length} bets total`);
      return resolutionResults;
    } catch (error) {
      console.error('❌ Error resolving match bets:', error);
      return [];
    }
  }
  /**
   * Gets match result from various sources
   */
  private getMatchResult(matchId: string): MatchResult | null {
    console.log(`🔍 Looking for match result for matchId: ${matchId}`);
    
    // Try to get detailed result first
    const detailedResult = matchResultsService.getMatchResult(matchId);
    if (detailedResult) {
      console.log(`✅ Found detailed result in matchResultsService:`, detailedResult);
      return {
        matchId,
        homeTeamId: detailedResult.homeTeam.id,
        awayTeamId: detailedResult.awayTeam.id,
        homeTeamName: detailedResult.homeTeam.name,
        awayTeamName: detailedResult.awayTeam.name,
        homeScore: detailedResult.finalScore.home,
        awayScore: detailedResult.finalScore.away,
        winner: detailedResult.finalScore.home > detailedResult.finalScore.away ? 'home' :
                detailedResult.finalScore.away > detailedResult.finalScore.home ? 'away' : 'draw',
        snitchCaught: detailedResult.snitchCaught,
        snitchCaughtBy: detailedResult.snitchCaughtBy,
        duration: detailedResult.matchDuration,
        finalScore: detailedResult.finalScore
      };
    }

    // Fallback to virtual time manager
    const timeState = virtualTimeManager.getState();
    console.log(`🔍 Checking virtual time manager state for match ${matchId}...`);
    
    if (timeState.temporadaActiva) {
      const match = timeState.temporadaActiva.partidos.find(m => m.id === matchId);
      console.log(`🔍 Found match in virtual time manager:`, match);
      
      if (match && match.status === 'finished') {
        const homeTeam = timeState.temporadaActiva.equipos.find(t => t.id === match.localId);
        const awayTeam = timeState.temporadaActiva.equipos.find(t => t.id === match.visitanteId);
        
        if (homeTeam && awayTeam) {
          console.log(`✅ Found completed match in virtual time manager:`, {
            homeTeam: homeTeam.name,
            awayTeam: awayTeam.name,
            score: `${match.homeScore || 0}-${match.awayScore || 0}`
          });
          
          return {
            matchId,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            homeTeamName: homeTeam.name,
            awayTeamName: awayTeam.name,
            homeScore: match.homeScore || 0,
            awayScore: match.awayScore || 0,
            winner: (match.homeScore || 0) > (match.awayScore || 0) ? 'home' :
                    (match.awayScore || 0) > (match.homeScore || 0) ? 'away' : 'draw',
            snitchCaught: match.events?.some(e => e.type === 'SNITCH_CAUGHT') || false,
            snitchCaughtBy: match.events?.find(e => e.type === 'SNITCH_CAUGHT')?.teamId,
            duration: match.currentMinute || 90,
            finalScore: {
              home: match.homeScore || 0,
              away: match.awayScore || 0
            }
          };
        }
      }
    }

    console.warn(`❌ No match result found for matchId: ${matchId}`);
    return null;
  }
  /**
   * Gets all active bets for a specific match from all users
   */
  private getAllActiveBetsForMatch(matchId: string): Array<{userId: string, bets: UserBet[]}> {
    const userBetsList: Array<{userId: string, bets: UserBet[]}> = [];

    // Get all users who have bets stored
    const allUserIds = this.getAllUserIds();
    
    for (const userId of allUserIds) {
      try {
        const storedBets = localStorage.getItem(`userBets_${userId}`);
        if (storedBets) {
          const userBets: UserBet[] = JSON.parse(storedBets);
          const activeBetsForMatch = userBets.filter((bet: UserBet) => 
            bet.matchId === matchId && bet.status === 'active'
          );
          
          if (activeBetsForMatch.length > 0) {
            userBetsList.push({
              userId,
              bets: activeBetsForMatch
            });
          }
        }
      } catch (error) {
        console.error(`Error loading bets for user ${userId}:`, error);
      }
    }

    return userBetsList;
  }

  /**
   * Gets all user IDs that have stored bets
   */
  private getAllUserIds(): string[] {
    const userIds: string[] = [];
    
    // Check localStorage for all user bet keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('userBets_')) {
        const userId = key.replace('userBets_', '');
        userIds.push(userId);
      }
    }

    return userIds;
  }
  /**
   * Resolves bets for a specific user
   */
  private resolveUserBets(userId: string, userBets: UserBet[], matchResult: MatchResult): BetResolutionResult[] {
    const results: BetResolutionResult[] = [];

    for (const bet of userBets) {
      try {
        const resolution = this.resolveSingleBet(bet, matchResult);
        results.push(resolution);

        // Update bet status and user balance
        this.updateBetStatus(userId, bet.id, resolution.won ? 'won' : 'lost');
        
        if (resolution.won && resolution.winAmount > 0) {
          this.updateUserBalance(userId, resolution.winAmount);
          this.addWinTransaction(userId, bet, resolution.winAmount);
        }

        console.log(`${resolution.won ? '🎉' : '💔'} User ${userId} bet ${bet.id}: ${resolution.reason} (${resolution.won ? `+${resolution.winAmount}G` : 'lost'})`);
      } catch (error) {
        console.error(`Error resolving bet ${bet.id} for user ${userId}:`, error);
      }
    }

    return results;
  }
  /**
   * Resolves a single bet based on match result
   */
  private resolveSingleBet(bet: UserBet, matchResult: MatchResult): BetResolutionResult {
    const baseResult: BetResolutionResult = {
      betId: bet.id,
      userId: bet.userId,
      won: false,
      winAmount: 0,
      reason: ''
    };

    // Check each bet option
    for (const option of bet.options) {
      const optionResult = this.checkBetOption(option, matchResult);
      
      if (!optionResult.won) {
        // If any option in a combined bet fails, entire bet is lost
        return {
          ...baseResult,
          won: false,
          reason: `Lost: ${optionResult.reason}`
        };
      }
    }

    // All options won - calculate total winnings
    const totalWinnings = bet.potentialWin;
    
    return {
      ...baseResult,
      won: true,
      winAmount: totalWinnings,
      reason: `Won: All predictions correct (${bet.options.length} option${bet.options.length > 1 ? 's' : ''})`
    };
  }
  /**
   * Checks if a specific bet option won
   */
  private checkBetOption(option: BetOption, matchResult: MatchResult): {won: boolean, reason: string} {
    const { type, selection } = option;

    switch (type) {
      case 'winner':
        return this.checkWinnerBet(selection, matchResult);
      
      case 'snitch':
        return this.checkSnitchBet(selection, matchResult);
      
      case 'score':
        return this.checkScoreBet(selection, matchResult);
      
      case 'margin':
        return this.checkMarginBet(selection, matchResult);
      
      case 'total':
        return this.checkTotalBet(selection, matchResult);
      
      case 'time':
        return this.checkTimeBet(selection, matchResult);
      
      default:
        return { won: false, reason: `Unknown bet type: ${type}` };
    }
  }

  /**
   * Check winner bet
   */
  private checkWinnerBet(selection: string, matchResult: MatchResult): {won: boolean, reason: string} {
    const selectionLower = selection.toLowerCase();
    
    if (selectionLower.includes('empate') || selectionLower.includes('draw')) {
      const won = matchResult.winner === 'draw';
      return {
        won,
        reason: won ? 'Match ended in draw' : `${matchResult.winner === 'home' ? matchResult.homeTeamName : matchResult.awayTeamName} won`
      };
    }
    
    // Check if selection matches winning team
    const wonByHome = matchResult.winner === 'home' && 
      (selectionLower.includes(matchResult.homeTeamName.toLowerCase()) || selection === 'home');
    const wonByAway = matchResult.winner === 'away' && 
      (selectionLower.includes(matchResult.awayTeamName.toLowerCase()) || selection === 'away');
    
    const won = wonByHome || wonByAway;
    return {
      won,
      reason: won ? 
        `${matchResult.winner === 'home' ? matchResult.homeTeamName : matchResult.awayTeamName} won as predicted` :
        `${matchResult.winner === 'home' ? matchResult.homeTeamName : matchResult.awayTeamName} won, not ${selection}`
    };
  }

  /**
   * Check snitch bet
   */
  private checkSnitchBet(selection: string, matchResult: MatchResult): {won: boolean, reason: string} {
    if (!matchResult.snitchCaught) {
      return { won: false, reason: 'Snitch was not caught during the match' };
    }

    const selectionLower = selection.toLowerCase();
    let won = false;

    if (matchResult.snitchCaughtBy) {
      const caughtBy = matchResult.snitchCaughtBy.toLowerCase();
      won = selectionLower.includes(caughtBy) || 
            (caughtBy === matchResult.homeTeamId && selectionLower.includes(matchResult.homeTeamName.toLowerCase())) ||
            (caughtBy === matchResult.awayTeamId && selectionLower.includes(matchResult.awayTeamName.toLowerCase()));
    } else {
      // Fallback: assume winner caught the snitch
      won = (matchResult.winner === 'home' && selectionLower.includes(matchResult.homeTeamName.toLowerCase())) ||
            (matchResult.winner === 'away' && selectionLower.includes(matchResult.awayTeamName.toLowerCase()));
    }

    return {
      won,
      reason: won ? 
        `Snitch caught by predicted team` :
        `Snitch caught by ${matchResult.snitchCaughtBy || 'other team'}, not as predicted`
    };
  }

  /**
   * Check exact score bet
   */
  private checkScoreBet(selection: string, matchResult: MatchResult): {won: boolean, reason: string} {
    const scoreRegex = /(\d+)[^\d]+(\d+)/;
    const match = selection.match(scoreRegex);
    
    if (!match) {
      return { won: false, reason: 'Invalid score format' };
    }

    const predictedHome = parseInt(match[1]);
    const predictedAway = parseInt(match[2]);
    const won = predictedHome === matchResult.homeScore && predictedAway === matchResult.awayScore;

    return {
      won,
      reason: won ? 
        'Exact score predicted correctly' :
        `Actual score: ${matchResult.homeScore}-${matchResult.awayScore}, predicted: ${predictedHome}-${predictedAway}`
    };
  }

  /**
   * Check margin bet
   */
  private checkMarginBet(selection: string, matchResult: MatchResult): {won: boolean, reason: string} {
    const margin = Math.abs(matchResult.homeScore - matchResult.awayScore);
    const selectionLower = selection.toLowerCase();
    
    let won = false;
    if (selectionLower.includes('+') || selectionLower.includes('more') || selectionLower.includes('más')) {
      const marginValue = parseInt(selectionLower.match(/\d+/)?.[0] || '0');
      won = margin > marginValue;
    } else if (selectionLower.includes('-') || selectionLower.includes('less') || selectionLower.includes('menos')) {
      const marginValue = parseInt(selectionLower.match(/\d+/)?.[0] || '0');
      won = margin < marginValue;
    }

    return {
      won,
      reason: won ? 
        `Margin of ${margin} points matches prediction` :
        `Margin was ${margin} points, prediction was ${selection}`
    };
  }

  /**
   * Check total points bet
   */
  private checkTotalBet(selection: string, matchResult: MatchResult): {won: boolean, reason: string} {
    const totalPoints = matchResult.homeScore + matchResult.awayScore;
    const selectionLower = selection.toLowerCase();
    
    let won = false;
    if (selectionLower.includes('over') || selectionLower.includes('más')) {
      const threshold = parseInt(selectionLower.match(/\d+/)?.[0] || '0');
      won = totalPoints > threshold;
    } else if (selectionLower.includes('under') || selectionLower.includes('menos')) {
      const threshold = parseInt(selectionLower.match(/\d+/)?.[0] || '0');
      won = totalPoints < threshold;
    }

    return {
      won,
      reason: won ? 
        `Total points ${totalPoints} matches prediction` :
        `Total was ${totalPoints} points, prediction was ${selection}`
    };
  }

  /**
   * Check match duration bet
   */
  private checkTimeBet(selection: string, matchResult: MatchResult): {won: boolean, reason: string} {
    const durationMinutes = matchResult.duration;
    const selectionLower = selection.toLowerCase();
    
    let won = false;
    
    if (selectionLower.includes('menos') || selectionLower.includes('under')) {
      const threshold = parseInt(selectionLower.match(/\d+/)?.[0] || '0');
      won = durationMinutes < threshold;
    } else if (selectionLower.includes('más') || selectionLower.includes('over')) {
      const threshold = parseInt(selectionLower.match(/\d+/)?.[0] || '0');
      won = durationMinutes > threshold;
    } else if (selectionLower.includes('entre') || selectionLower.includes('between')) {
      const numbers = selectionLower.match(/\d+/g);
      if (numbers && numbers.length >= 2) {
        const min = parseInt(numbers[0]);
        const max = parseInt(numbers[1]);
        won = durationMinutes >= min && durationMinutes <= max;
      }
    }

    return {
      won,
      reason: won ? 
        `Match duration ${durationMinutes} minutes matches prediction` :
        `Duration was ${durationMinutes} minutes, prediction was ${selection}`
    };
  }
  /**
   * Updates bet status in localStorage
   */
  private updateBetStatus(userId: string, betId: string, status: 'won' | 'lost'): void {
    try {
      const storedBets = localStorage.getItem(`userBets_${userId}`);
      if (storedBets) {
        const userBets: UserBet[] = JSON.parse(storedBets);
        const betIndex = userBets.findIndex((bet: UserBet) => bet.id === betId);
        
        if (betIndex !== -1) {
          userBets[betIndex].status = status;
          localStorage.setItem(`userBets_${userId}`, JSON.stringify(userBets));
        }
      }
    } catch (error) {
      console.error(`Error updating bet status for user ${userId}:`, error);
    }
  }

  /**
   * Updates user balance
   */
  private updateUserBalance(userId: string, winAmount: number): void {
    try {
      // Try to get current user from session/localStorage
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.id === userId) {
          user.balance += winAmount;
          localStorage.setItem('user', JSON.stringify(user));
          if (sessionStorage.getItem('user')) {
            sessionStorage.setItem('user', JSON.stringify(user));
          }
        }
      }
    } catch (error) {
      console.error(`Error updating balance for user ${userId}:`, error);
    }
  }
  /**
   * Adds winning transaction to user's history
   */
  private addWinTransaction(userId: string, bet: UserBet, winAmount: number): void {
    try {
      const storedTransactions = localStorage.getItem(`userTransactions_${userId}`);
      const transactions: UserTransaction[] = storedTransactions ? JSON.parse(storedTransactions) : [];
      
      const newTransaction: UserTransaction = {
        id: Date.now(),
        type: 'win',
        amount: winAmount,
        date: new Date().toISOString().split('T')[0],
        description: `Ganancia: ${bet.matchName}`,
        userId
      };

      transactions.push(newTransaction);
      localStorage.setItem(`userTransactions_${userId}`, JSON.stringify(transactions));
    } catch (error) {
      console.error(`Error adding win transaction for user ${userId}:`, error);
    }
  }

  /**
   * Public method to manually trigger bet resolution for testing
   */
  public async resolveMatchBetsManually(matchId: string): Promise<void> {
    console.log(`🔧 Manual bet resolution triggered for match: ${matchId}`);
    const results = await this.resolveMatchBets(matchId);
    console.log(`✅ Manual resolution complete. Results:`, results);
  }
}

// Export singleton instance
export const betResolutionService = BetResolutionService.getInstance();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as unknown as { betResolutionService: BetResolutionService }).betResolutionService = betResolutionService;
}
