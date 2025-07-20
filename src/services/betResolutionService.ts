/**
 * Bet Resolution Service
 * Handles automatic resolution of bets when matches finish
 */

import { leagueTimeService } from './leagueTimeService';
import { matchResultsService } from './matchResultsService';
import { FEATURES } from '@/config/features';

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
  resolutionDetails?: {
    matchResult: MatchResult;
    optionResults: Array<{
      option: BetOption;
      won: boolean;
      reason: string;
    }>;
    reason: string;
    resolvedAt: string;
  };
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
  matchResult?: MatchResult;
  optionResults?: Array<{
    option: BetOption;
    won: boolean;
    reason: string;
  }>;
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

      // After resolving single-match bets, check for combined bets that can now be resolved
      try {
        const combinedResults = await this.resolveAllPendingCombinedBets();
        resolutionResults.push(...combinedResults);
      } catch (error) {
        console.error('❌ Error resolving combined bets:', error);
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

    // Note: VirtualTimeManager has been deprecated in favor of backend league time service
    // Since backend league time is enabled, match results should come from backend
    console.log(`⚠️ Could not find match ${matchId} in backend. This might indicate a sync issue.`);
    
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
        results.push(resolution);        // Update bet status and user balance
        this.updateBetStatus(userId, bet.id, resolution.won ? 'won' : 'lost', resolution);
        
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
  }  /**
   * Resolves a single bet based on match result
   */
  private resolveSingleBet(bet: UserBet, matchResult: MatchResult): BetResolutionResult {
    const baseResult: BetResolutionResult = {
      betId: bet.id,
      userId: bet.userId,
      won: false,
      winAmount: 0,
      reason: '',
      matchResult,
      optionResults: []
    };

    const optionResults: Array<{
      option: BetOption;
      won: boolean;
      reason: string;
    }> = [];

    // Check each bet option
    for (const option of bet.options) {
      const optionResult = this.checkBetOption(option, matchResult);
      
      optionResults.push({
        option,
        won: optionResult.won,
        reason: optionResult.reason
      });
      
      if (!optionResult.won) {
        // If any option in a combined bet fails, entire bet is lost
        return {
          ...baseResult,
          won: false,
          reason: `Lost: ${optionResult.reason}`,
          optionResults
        };
      }
    }

    // All options won - calculate total winnings
    const totalWinnings = bet.potentialWin;
    
    return {
      ...baseResult,
      won: true,
      winAmount: totalWinnings,
      reason: `Won: All predictions correct (${bet.options.length} option${bet.options.length > 1 ? 's' : ''})`,
      optionResults
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
        reason: won ? 'El partido terminó en empate como predijiste' : `Ganó ${matchResult.winner === 'home' ? matchResult.homeTeamName : matchResult.awayTeamName}, no fue empate`
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
        `¡Correcto! ${matchResult.winner === 'home' ? matchResult.homeTeamName : matchResult.awayTeamName} ganó como predijiste` :
        `Incorrecto: Ganó ${matchResult.winner === 'home' ? matchResult.homeTeamName : matchResult.awayTeamName}, no ${selection}`
    };
  }
  /**
   * Check snitch bet
   */
  private checkSnitchBet(selection: string, matchResult: MatchResult): {won: boolean, reason: string} {
    if (!matchResult.snitchCaught) {
      return { won: false, reason: 'La Snitch Dorada no fue capturada durante el partido' };
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

    const snitchTeam = matchResult.snitchCaughtBy === matchResult.homeTeamId ? matchResult.homeTeamName : matchResult.awayTeamName;
    
    return {
      won,
      reason: won ? 
        `¡Correcto! La Snitch fue capturada por ${snitchTeam} como predijiste` :
        `Incorrecto: La Snitch fue capturada por ${snitchTeam}, no como predijiste`
    };
  }
  /**
   * Check exact score bet
   */
  private checkScoreBet(selection: string, matchResult: MatchResult): {won: boolean, reason: string} {
    const scoreRegex = /(\d+)[^\d]+(\d+)/;
    const match = selection.match(scoreRegex);
    
    if (!match) {
      return { won: false, reason: 'Formato de puntuación inválido' };
    }

    const predictedHome = parseInt(match[1]);
    const predictedAway = parseInt(match[2]);
    const won = predictedHome === matchResult.homeScore && predictedAway === matchResult.awayScore;

    return {
      won,
      reason: won ? 
        '¡Perfecto! Acertaste la puntuación exacta' :
        `Puntuación real: ${matchResult.homeScore}-${matchResult.awayScore}, predijiste: ${predictedHome}-${predictedAway}`
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
  }  /**
   * Updates bet status in localStorage
   */
  private updateBetStatus(userId: string, betId: string, status: 'won' | 'lost', resolutionResult?: BetResolutionResult): void {
    try {
      const storedBets = localStorage.getItem(`userBets_${userId}`);
      if (storedBets) {
        const userBets: UserBet[] = JSON.parse(storedBets);
        const betIndex = userBets.findIndex((bet: UserBet) => bet.id === betId);
        
        if (betIndex !== -1) {
          userBets[betIndex].status = status;
          
          // Add resolution details if provided
          if (resolutionResult && resolutionResult.matchResult && resolutionResult.optionResults) {
            userBets[betIndex].resolutionDetails = {
              matchResult: resolutionResult.matchResult,
              optionResults: resolutionResult.optionResults,
              reason: resolutionResult.reason,
              resolvedAt: new Date().toISOString()
            };
          }
          
          localStorage.setItem(`userBets_${userId}`, JSON.stringify(userBets));
          console.log(`✅ Updated bet ${betId} status to ${status} for user ${userId}`);
        } else {
          console.warn(`⚠️ Bet ${betId} not found for user ${userId}`);
        }
      } else {
        console.warn(`⚠️ No stored bets found for user ${userId}`);
      }
    } catch (error) {
      console.error(`❌ Error updating bet status for user ${userId}, bet ${betId}:`, error);
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

  /**
   * Debug function to check all pending bets for a match
   */
  public debugMatchBets(matchId: string): void {
    console.log(`🔧 DEBUG: Checking all bets for match ${matchId}`);
    
    const allUserBets = this.getAllActiveBetsForMatch(matchId);
    console.log(`📊 Found ${allUserBets.length} users with active bets for this match`);
    
    allUserBets.forEach(userBets => {
      console.log(`👤 User ${userBets.userId}: ${userBets.bets.length} bets`);
      userBets.bets.forEach(bet => {
        console.log(`   💰 Bet ${bet.id}: ${bet.amount}G on ${bet.options.length} options`);
        bet.options.forEach(option => {
          console.log(`     - ${option.type}: ${option.selection} (odds: ${option.odds})`);
        });
      });
    });
    
    // Also check match result
    const matchResult = this.getMatchResult(matchId);
    if (matchResult) {
      console.log(`🏆 Match result found:`, matchResult);
    } else {
      console.log(`❌ No match result found for ${matchId}`);
    }
  }

  /**
   * Debug function to force bet resolution for a specific match
   */
  public async debugResolveMatch(matchId: string): Promise<void> {
    console.log(`🔧 DEBUG: Force resolving bets for match ${matchId}`);
    
    try {
      const results = await this.resolveMatchBets(matchId);
      console.log(`✅ DEBUG: Resolved ${results.length} bets`);
      results.forEach(result => {
        console.log(`   ${result.won ? '🎉' : '💔'} User ${result.userId}: ${result.reason} (${result.won ? `+${result.winAmount}G` : 'lost'})`);
      });
    } catch (error) {
      console.error('❌ DEBUG: Error during forced resolution:', error);
    }
  }

  /**
   * Resolve all pending combined bets that may now be resolvable
   */
  public async resolveAllPendingCombinedBets(): Promise<BetResolutionResult[]> {
    console.log(`🔍 Checking all pending combined bets for resolution`);
    
    const allUserIds = this.getAllUserIds();
    const allResults: BetResolutionResult[] = [];

    for (const userId of allUserIds) {
      try {
        const storedBets = localStorage.getItem(`userBets_${userId}`);
        if (!storedBets) continue;

        const userBets: UserBet[] = JSON.parse(storedBets);
        const activeCombinedBets = userBets.filter(bet => 
          bet.status === 'active' && bet.options.length > 1
        );

        for (const combinedBet of activeCombinedBets) {
          const canResolve = this.canResolveCombinedBet(combinedBet);
          if (canResolve.canResolve && canResolve.matchResults) {
            const result = this.resolveCombinedBet(combinedBet, canResolve.matchResults);
            allResults.push(result);

            // Update bet status and user balance
            this.updateBetStatus(userId, combinedBet.id, result.won ? 'won' : 'lost', result);
            
            if (result.won && result.winAmount > 0) {
              this.updateUserBalance(userId, result.winAmount);
              this.addWinTransaction(userId, combinedBet, result.winAmount);
            }

            console.log(`${result.won ? '🎉' : '💔'} Resolved combined bet ${combinedBet.id}: ${result.reason} (${result.won ? `+${result.winAmount}G` : 'lost'})`);
          }
        }
      } catch (error) {
        console.error(`Error resolving combined bets for user ${userId}:`, error);
      }
    }

    if (allResults.length > 0) {
      console.log(`✅ Resolved ${allResults.length} combined bets`);
    }

    return allResults;
  }

  /**
   * Check if a combined bet can be resolved (all matches finished)
   */
  private canResolveCombinedBet(combinedBet: UserBet): {
    canResolve: boolean;
    reason?: string;
    matchResults?: Map<string, MatchResult>;
  } {
    const matchIds = new Set<string>();
    
    // Collect all unique match IDs from the bet options
    for (const option of combinedBet.options) {
      matchIds.add(option.matchId);
    }

    const matchResults = new Map<string, MatchResult>();

    // Check if all matches are finished and get their results
    for (const matchId of matchIds) {
      const matchResult = this.getMatchResult(matchId);
      if (!matchResult) {
        return {
          canResolve: false,
          reason: `Match ${matchId} result not available`
        };
      }
      matchResults.set(matchId, matchResult);
    }

    return {
      canResolve: true,
      matchResults
    };
  }

  /**
   * Resolve a combined bet using match results
   */
  private resolveCombinedBet(combinedBet: UserBet, matchResults: Map<string, MatchResult>): BetResolutionResult {
    const baseResult: BetResolutionResult = {
      betId: combinedBet.id,
      userId: combinedBet.userId,
      won: false,
      winAmount: 0,
      reason: '',
      optionResults: []
    };

    const optionResults: Array<{
      option: BetOption;
      won: boolean;
      reason: string;
    }> = [];

    // Check each bet option
    for (const option of combinedBet.options) {
      const matchResult = matchResults.get(option.matchId);
      if (!matchResult) {
        optionResults.push({
          option,
          won: false,
          reason: `No result available for match ${option.matchId}`
        });
        continue;
      }

      const optionResult = this.checkBetOption(option, matchResult);
      
      optionResults.push({
        option,
        won: optionResult.won,
        reason: optionResult.reason
      });
    }

    // For combined bets, ALL options must win
    const allWon = optionResults.every(result => result.won);
    const wonCount = optionResults.filter(result => result.won).length;

    baseResult.won = allWon;
    baseResult.optionResults = optionResults;
    
    if (allWon) {
      baseResult.winAmount = combinedBet.potentialWin;
      baseResult.reason = `All ${optionResults.length} predictions correct`;
    } else {
      baseResult.reason = `Only ${wonCount}/${optionResults.length} predictions correct`;
    }

    return baseResult;
  }
}

// Export singleton instance
export const betResolutionService = BetResolutionService.getInstance();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as unknown as { 
    betResolutionService: BetResolutionService;
    debugMatchBets: (matchId: string) => void;
    debugResolveMatch: (matchId: string) => Promise<void>;
    debugResolveCombinedBets: () => Promise<void>;
  }).betResolutionService = betResolutionService;
  
  // Add global debug functions
  (window as unknown as { 
    debugMatchBets: (matchId: string) => void;
    debugResolveMatch: (matchId: string) => Promise<void>;
    debugResolveCombinedBets: () => Promise<void>;
  }).debugMatchBets = (matchId: string) => betResolutionService.debugMatchBets(matchId);
  
  (window as unknown as { 
    debugResolveMatch: (matchId: string) => Promise<void>;
  }).debugResolveMatch = (matchId: string) => betResolutionService.debugResolveMatch(matchId);

  (window as unknown as { 
    debugResolveCombinedBets: () => Promise<void>;
  }).debugResolveCombinedBets = async () => {
    const results = await betResolutionService.resolveAllPendingCombinedBets();
    console.log(`🎊 Debug: Resolved ${results.length} combined bets`);
  };
}
