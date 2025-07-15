import { Database } from '../database/Database';

interface MatchResult {
  homeScore: number;
  awayScore: number;
  duration: number;
  snitchCaught: boolean;
  snitchCaughtBy: string;
}

export class BetResolutionService {
  private static instance: BetResolutionService;
  private db: Database;

  private constructor() {
    this.db = Database.getInstance();
  }

  public static getInstance(): BetResolutionService {
    if (!BetResolutionService.instance) {
      BetResolutionService.instance = new BetResolutionService();
    }
    return BetResolutionService.instance;
  }

  /**
   * Resolve all pending bets for a finished match
   */
  public async resolveBetsForMatch(matchId: string): Promise<{
    resolved: number;
    errors: string[];
  }> {
    console.log(`🎯 Resolving bets for finished match: ${matchId}`);
    
    try {
      // Get the match details and result
      const match = await this.db.getMatchById(matchId) as any;
      if (!match) {
        throw new Error(`Match ${matchId} not found`);
      }

      if (match.status !== 'finished') {
        console.log(`⚠️ Match ${matchId} is not finished yet, skipping bet resolution`);
        return { resolved: 0, errors: [] };
      }

      // Get all pending bets for this match
      const pendingBets = await this.db.all(
        'SELECT * FROM bets WHERE match_id = ? AND status = "pending"',
        [matchId]
      ) as any[];

      console.log(`📋 Found ${pendingBets.length} pending bets to resolve for match ${matchId}`);

      if (pendingBets.length === 0) {
        return { resolved: 0, errors: [] };
      }

      const matchResult: MatchResult = {
        homeScore: match.home_score || 0,
        awayScore: match.away_score || 0,
        duration: match.duration || 0,
        snitchCaught: match.snitch_caught || false,
        snitchCaughtBy: match.snitch_caught_by || ''
      };

      let resolvedCount = 0;
      const errors: string[] = [];

      // Resolve each bet
      for (const bet of pendingBets) {
        try {
          const betResult = await this.resolveBet(bet, matchResult, match);
          if (betResult.success) {
            resolvedCount++;
            console.log(`✅ Resolved bet ${bet.id}: ${betResult.status} (${betResult.reason})`);
          } else {
            errors.push(`Failed to resolve bet ${bet.id}: ${betResult.error}`);
          }
        } catch (error) {
          const errorMsg = `Error resolving bet ${bet.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      console.log(`🏆 Bet resolution complete for match ${matchId}: ${resolvedCount} resolved, ${errors.length} errors`);
      return { resolved: resolvedCount, errors };

    } catch (error) {
      const errorMsg = `Failed to resolve bets for match ${matchId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ ${errorMsg}`);
      return { resolved: 0, errors: [errorMsg] };
    }
  }

  /**
   * Resolve a single bet based on match result
   */
  private async resolveBet(bet: any, matchResult: MatchResult, match: any): Promise<{
    success: boolean;
    status?: string;
    reason?: string;
    error?: string;
  }> {
    const { type, prediction } = bet;

    let isWon = false;
    let reason = '';

    try {
      // Determine if bet is won based on type and prediction
      switch (type) {
        case 'winner':
          // Winner bet - predict which team wins
          if (matchResult.homeScore > matchResult.awayScore && prediction === 'home') {
            isWon = true;
            reason = `Home team ${match.homeTeamName} won`;
          } else if (matchResult.awayScore > matchResult.homeScore && prediction === 'away') {
            isWon = true;
            reason = `Away team ${match.awayTeamName} won`;
          } else if (matchResult.homeScore === matchResult.awayScore && prediction === 'draw') {
            isWon = true;
            reason = 'Match ended in a draw';
          } else {
            reason = `Predicted ${this.getPredictionDescription(prediction, match)}, but ${this.getActualResultDescription(matchResult, match)}`;
          }
          break;

        case 'total_score':
          // Total score bet - predict over/under total points
          const totalScore = matchResult.homeScore + matchResult.awayScore;
          const [overUnder, threshold] = prediction.split('_'); // e.g., "over_300" or "under_250"
          const thresholdValue = parseInt(threshold);
          
          if (overUnder === 'over' && totalScore > thresholdValue) {
            isWon = true;
            reason = `Total score ${totalScore} was over ${thresholdValue}`;
          } else if (overUnder === 'under' && totalScore < thresholdValue) {
            isWon = true;
            reason = `Total score ${totalScore} was under ${thresholdValue}`;
          } else {
            reason = `Total score ${totalScore} didn't meet prediction ${prediction}`;
          }
          break;

        case 'snitch_catcher':
          // Snitch catcher bet - predict which team catches the snitch
          if (matchResult.snitchCaught && matchResult.snitchCaughtBy === prediction) {
            isWon = true;
            reason = `Snitch caught by predicted team`;
          } else if (!matchResult.snitchCaught && prediction === 'none') {
            isWon = true;
            reason = `Snitch not caught as predicted`;
          } else {
            reason = `Snitch ${matchResult.snitchCaught ? 'caught by ' + matchResult.snitchCaughtBy : 'not caught'}, predicted ${prediction}`;
          }
          break;

        case 'match_duration':
          // Match duration bet - predict over/under duration
          const [durationOverUnder, durationThreshold] = prediction.split('_'); // e.g., "over_90" or "under_120"
          const durationThresholdValue = parseInt(durationThreshold);
          
          if (durationOverUnder === 'over' && matchResult.duration > durationThresholdValue) {
            isWon = true;
            reason = `Match duration ${matchResult.duration} min was over ${durationThresholdValue} min`;
          } else if (durationOverUnder === 'under' && matchResult.duration < durationThresholdValue) {
            isWon = true;
            reason = `Match duration ${matchResult.duration} min was under ${durationThresholdValue} min`;
          } else {
            reason = `Match duration ${matchResult.duration} min didn't meet prediction ${prediction}`;
          }
          break;

        case 'combined':
          // Combined bet - multiple predictions (advanced logic)
          const combinedResult = await this.resolveCombinedBet(bet, matchResult, match);
          isWon = combinedResult.isWon;
          reason = combinedResult.reason;
          break;

        default:
          return {
            success: false,
            error: `Unknown bet type: ${type}`
          };
      }

      // Update bet status in database
      const status = isWon ? 'won' : 'lost';
      await this.db.updateBetStatus(bet.id, status);

      // If bet won, update user balance and create transaction
      if (isWon) {
        await this.payoutWinningBet(bet);
      }

      return {
        success: true,
        status,
        reason
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Resolve combined bet (multiple predictions)
   */
  private async resolveCombinedBet(bet: any, matchResult: MatchResult, match: any): Promise<{
    isWon: boolean;
    reason: string;
  }> {
    try {
      const predictions = typeof bet.prediction === 'string' ? JSON.parse(bet.prediction) : bet.prediction;
      
      // For combined bets, all predictions must be correct
      const results = [];
      
      for (const pred of predictions) {
        // Evaluate each prediction without calling resolveBet recursively
        const predictionResult = this.evaluateSinglePrediction(pred.type, pred.value, matchResult, match);
        
        results.push({
          type: pred.type,
          prediction: pred.value,
          correct: predictionResult.isWon,
          reason: predictionResult.reason
        });
      }
      
      const allCorrect = results.every(r => r.correct);
      const correctCount = results.filter(r => r.correct).length;
      
      return {
        isWon: allCorrect,
        reason: allCorrect 
          ? `All ${results.length} predictions correct: ${results.map(r => r.reason).join(', ')}`
          : `Only ${correctCount}/${results.length} predictions correct. Failed: ${results.filter(r => !r.correct).map(r => `${r.type}(${r.reason})`).join(', ')}`
      };
      
    } catch (error) {
      return {
        isWon: false,
        reason: `Error processing combined bet: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Evaluate a single prediction without database updates
   */
  private evaluateSinglePrediction(type: string, prediction: string, matchResult: MatchResult, match: any): {
    isWon: boolean;
    reason: string;
  } {
    let isWon = false;
    let reason = '';

    switch (type) {
      case 'winner':
        // Winner bet - predict which team wins
        if (matchResult.homeScore > matchResult.awayScore && prediction === 'home') {
          isWon = true;
          reason = `Home team ${match.homeTeamName || 'Home'} won`;
        } else if (matchResult.awayScore > matchResult.homeScore && prediction === 'away') {
          isWon = true;
          reason = `Away team ${match.awayTeamName || 'Away'} won`;
        } else if (matchResult.homeScore === matchResult.awayScore && prediction === 'draw') {
          isWon = true;
          reason = 'Match ended in a draw';
        } else {
          reason = `Predicted ${this.getPredictionDescription(prediction, match)}, but ${this.getActualResultDescription(matchResult, match)}`;
        }
        break;

      case 'total_score':
        // Total score bet - predict over/under total points
        const totalScore = matchResult.homeScore + matchResult.awayScore;
        const [overUnder, threshold] = prediction.split('_'); // e.g., "over_300" or "under_250"
        const thresholdValue = parseInt(threshold);
        
        if (overUnder === 'over' && totalScore > thresholdValue) {
          isWon = true;
          reason = `Total score ${totalScore} was over ${thresholdValue}`;
        } else if (overUnder === 'under' && totalScore < thresholdValue) {
          isWon = true;
          reason = `Total score ${totalScore} was under ${thresholdValue}`;
        } else {
          reason = `Total score ${totalScore} didn't meet prediction ${prediction}`;
        }
        break;

      case 'snitch_catcher':
        // Snitch catcher bet - predict which team catches the snitch
        if (matchResult.snitchCaught && matchResult.snitchCaughtBy === prediction) {
          isWon = true;
          reason = `Snitch caught by predicted team`;
        } else if (!matchResult.snitchCaught && prediction === 'none') {
          isWon = true;
          reason = `Snitch not caught as predicted`;
        } else {
          reason = `Snitch ${matchResult.snitchCaught ? 'caught by ' + matchResult.snitchCaughtBy : 'not caught'}, predicted ${prediction}`;
        }
        break;

      case 'match_duration':
        // Match duration bet - predict over/under duration
        const [durationOverUnder, durationThreshold] = prediction.split('_'); // e.g., "over_90" or "under_120"
        const durationThresholdValue = parseInt(durationThreshold);
        
        if (durationOverUnder === 'over' && matchResult.duration > durationThresholdValue) {
          isWon = true;
          reason = `Match duration ${matchResult.duration} min was over ${durationThresholdValue} min`;
        } else if (durationOverUnder === 'under' && matchResult.duration < durationThresholdValue) {
          isWon = true;
          reason = `Match duration ${matchResult.duration} min was under ${durationThresholdValue} min`;
        } else {
          reason = `Match duration ${matchResult.duration} min didn't meet prediction ${prediction}`;
        }
        break;

      default:
        isWon = false;
        reason = `Unknown bet type: ${type}`;
        break;
    }

    return { isWon, reason };
  }

  /**
   * Pay out a winning bet
   */
  private async payoutWinningBet(bet: any): Promise<void> {
    try {
      // Get current user balance
      const user = await this.db.getUserById(bet.user_id) as any;
      if (!user) {
        throw new Error(`User ${bet.user_id} not found`);
      }

      // Calculate payout (potential win amount)
      const payout = bet.potential_win;
      const newBalance = user.balance + payout;

      // Update user balance
      await this.db.updateUserBalance(bet.user_id, newBalance);

      // Create transaction record
      const transactionId = this.generateId();
      await this.db.createTransaction({
        id: transactionId,
        userId: bet.user_id,
        type: 'bet_win',
        amount: payout,
        balanceBefore: user.balance,
        balanceAfter: newBalance,
        description: `Bet win: ${bet.potential_win} coins`,
        referenceId: bet.id
      });

      console.log(`💰 Paid out ${payout} coins to user ${user.username} for winning bet ${bet.id}`);

    } catch (error) {
      console.error(`❌ Error paying out bet ${bet.id}:`, error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private getPredictionDescription(prediction: string, match: any): string {
    if (prediction === 'home') return match.homeTeamName;
    if (prediction === 'away') return match.awayTeamName;
    if (prediction === 'draw') return 'Draw';
    return prediction;
  }

  private getActualResultDescription(matchResult: MatchResult, match: any): string {
    if (matchResult.homeScore > matchResult.awayScore) {
      return `${match.homeTeamName} won ${matchResult.homeScore}-${matchResult.awayScore}`;
    } else if (matchResult.awayScore > matchResult.homeScore) {
      return `${match.awayTeamName} won ${matchResult.awayScore}-${matchResult.homeScore}`;
    } else {
      return `Draw ${matchResult.homeScore}-${matchResult.awayScore}`;
    }
  }

  private generateId(): string {
    return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}
