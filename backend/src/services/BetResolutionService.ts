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

      // Get all pending bets for this match (single-match bets)
      const pendingBets = await this.db.all(
        'SELECT * FROM bets WHERE match_id = ? AND status = "pending"',
        [matchId]
      ) as any[];

      console.log(`📋 Found ${pendingBets.length} pending single-match bets to resolve for match ${matchId}`);

      const matchResult: MatchResult = {
        homeScore: match.home_score || 0,
        awayScore: match.away_score || 0,
        duration: match.duration || 0,
        snitchCaught: match.snitch_caught || false,
        snitchCaughtBy: match.snitch_caught_by || ''
      };

      let resolvedCount = 0;
      const errors: string[] = [];

      // Resolve single-match bets
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

      // Check for resolvable combined bets
      const combinedBetsResult = await this.resolveCombinedBetsAfterMatch(matchId);
      resolvedCount += combinedBetsResult.resolved;
      errors.push(...combinedBetsResult.errors);

      console.log(`🏆 Bet resolution complete for match ${matchId}: ${resolvedCount} resolved, ${errors.length} errors`);
      return { resolved: resolvedCount, errors };

    } catch (error) {
      const errorMsg = `Failed to resolve bets for match ${matchId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ ${errorMsg}`);
      return { resolved: 0, errors: [errorMsg] };
    }
  }

  /**
   * Resolve combined bets that may now be resolvable after a match finishes
   */
  private async resolveCombinedBetsAfterMatch(finishedMatchId: string): Promise<{
    resolved: number;
    errors: string[];
  }> {
    console.log(`🔍 Checking for resolvable combined bets after match ${finishedMatchId} finished`);
    
    try {
      // Get all pending combined bets
      const pendingCombinedBets = await this.db.all(
        'SELECT * FROM bets WHERE type = "combined" AND status = "pending"'
      ) as any[];

      console.log(`📋 Found ${pendingCombinedBets.length} pending combined bets to check`);

      if (pendingCombinedBets.length === 0) {
        return { resolved: 0, errors: [] };
      }

      let resolvedCount = 0;
      const errors: string[] = [];

      for (const combinedBet of pendingCombinedBets) {
        try {
          const canResolve = await this.canResolveCombinedBet(combinedBet);
          if (canResolve.canResolve && canResolve.matchesData) {
            const resolution = await this.resolveMultiMatchCombinedBet(combinedBet, canResolve.matchesData);
            if (resolution.success) {
              resolvedCount++;
              console.log(`✅ Resolved combined bet ${combinedBet.id}: ${resolution.status} (${resolution.reason})`);
            } else {
              errors.push(`Failed to resolve combined bet ${combinedBet.id}: ${resolution.error}`);
            }
          } else {
            console.log(`⏳ Combined bet ${combinedBet.id} not yet resolvable: ${canResolve.reason}`);
          }
        } catch (error) {
          const errorMsg = `Error checking combined bet ${combinedBet.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      if (resolvedCount > 0) {
        console.log(`🎊 Resolved ${resolvedCount} combined bets after match ${finishedMatchId} finished`);
      }

      return { resolved: resolvedCount, errors };

    } catch (error) {
      const errorMsg = `Error resolving combined bets after match ${finishedMatchId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ ${errorMsg}`);
      return { resolved: 0, errors: [errorMsg] };
    }
  }

  /**
   * Resolve all pending combined bets that are now resolvable
   * This method should be called periodically or after any match finishes
   */
  public async resolveAllPendingCombinedBets(): Promise<{
    resolved: number;
    errors: string[];
  }> {
    console.log(`🔍 Resolving all pending combined bets`);
    
    try {
      // Get all pending combined bets
      const pendingCombinedBets = await this.db.all(
        'SELECT * FROM bets WHERE type = "combined" AND status = "pending"'
      ) as any[];

      console.log(`📋 Found ${pendingCombinedBets.length} pending combined bets to check`);

      if (pendingCombinedBets.length === 0) {
        return { resolved: 0, errors: [] };
      }

      let resolvedCount = 0;
      const errors: string[] = [];

      for (const combinedBet of pendingCombinedBets) {
        try {
          const canResolve = await this.canResolveCombinedBet(combinedBet);
          if (canResolve.canResolve && canResolve.matchesData) {
            const resolution = await this.resolveMultiMatchCombinedBet(combinedBet, canResolve.matchesData);
            if (resolution.success) {
              resolvedCount++;
              console.log(`✅ Resolved combined bet ${combinedBet.id}: ${resolution.status} (${resolution.reason})`);
            } else {
              errors.push(`Failed to resolve combined bet ${combinedBet.id}: ${resolution.error}`);
            }
          } else {
            console.log(`⏳ Combined bet ${combinedBet.id} not yet resolvable: ${canResolve.reason}`);
          }
        } catch (error) {
          const errorMsg = `Error checking combined bet ${combinedBet.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      if (resolvedCount > 0) {
        console.log(`🎊 Resolved ${resolvedCount} combined bets total`);
      }

      return { resolved: resolvedCount, errors };

    } catch (error) {
      const errorMsg = `Error resolving all pending combined bets: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ ${errorMsg}`);
      return { resolved: 0, errors: [errorMsg] };
    }
  }

  /**
   * Check if a combined bet can be resolved (all matches finished)
   */
  private async canResolveCombinedBet(combinedBet: any): Promise<{
    canResolve: boolean;
    reason?: string;
    matchesData?: Map<string, any>;
  }> {
    try {
      // Parse the combined prediction to extract match information
      const predictions = this.parseCombinedPrediction(combinedBet.prediction);
      const matchIds = new Set<string>();
      
      // Extract match IDs from predictions
      matchIds.add(combinedBet.match_id); // Primary match ID
      
      // For truly combined bets across multiple matches, we need to parse the prediction format
      // The current format is "type:selection,type:selection" for single match
      // For multi-match, we'd need a format like "match1:type:selection,match2:type:selection"
      
      // For now, handle the current single-match combined format
      // If the bet has multiple predictions but only one match_id, it's a single-match combined bet
      
      const matchesData = new Map<string, any>();
      
      // Get all match data
      for (const matchId of matchIds) {
        const match = await this.db.getMatchById(matchId) as any;
        if (!match) {
          return {
            canResolve: false,
            reason: `Match ${matchId} not found`
          };
        }
        
        if (match.status !== 'finished') {
          return {
            canResolve: false,
            reason: `Match ${matchId} (${match.homeTeamName} vs ${match.awayTeamName}) not yet finished`
          };
        }
        
        matchesData.set(matchId, match);
      }

      return {
        canResolve: true,
        matchesData
      };

    } catch (error) {
      return {
        canResolve: false,
        reason: `Error parsing combined bet: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Parse combined prediction string to extract individual predictions
   */
  private parseCombinedPrediction(predictionString: string): Array<{
    matchId?: string;
    type: string;
    value: string;
  }> {
    try {
      // Try to parse as JSON first (if it's stored as JSON object)
      if (predictionString.startsWith('[') || predictionString.startsWith('{')) {
        return JSON.parse(predictionString);
      }
      
      // Otherwise, parse the comma-separated format: "type:selection,type:selection"
      const predictions = predictionString.split(',').map(pred => {
        const parts = pred.trim().split(':');
        if (parts.length === 2) {
          return {
            type: parts[0],
            value: parts[1]
          };
        } else if (parts.length === 3) {
          // Format: "matchId:type:selection"
          return {
            matchId: parts[0],
            type: parts[1],
            value: parts[2]
          };
        }
        throw new Error(`Invalid prediction format: ${pred}`);
      });
      
      return predictions;
    } catch (error) {
      console.error('Error parsing combined prediction:', predictionString, error);
      throw error;
    }
  }

  /**
   * Resolve a multi-match combined bet
   */
  private async resolveMultiMatchCombinedBet(combinedBet: any, matchesData: Map<string, any>): Promise<{
    success: boolean;
    status?: string;
    reason?: string;
    error?: string;
  }> {
    try {
      const predictions = this.parseCombinedPrediction(combinedBet.prediction);
      const results = [];
      
      // For single-match combined bets, all predictions are for the same match
      const primaryMatch = matchesData.get(combinedBet.match_id);
      const primaryMatchResult: MatchResult = {
        homeScore: primaryMatch.home_score || 0,
        awayScore: primaryMatch.away_score || 0,
        duration: primaryMatch.duration || 0,
        snitchCaught: primaryMatch.snitch_caught || false,
        snitchCaughtBy: primaryMatch.snitch_caught_by || ''
      };

      // Evaluate each prediction
      for (const prediction of predictions) {
        const targetMatchId = prediction.matchId || combinedBet.match_id;
        const targetMatch = matchesData.get(targetMatchId);
        
        if (!targetMatch) {
          return {
            success: false,
            error: `Match data not found for match ${targetMatchId}`
          };
        }

        const matchResult: MatchResult = {
          homeScore: targetMatch.home_score || 0,
          awayScore: targetMatch.away_score || 0,
          duration: targetMatch.duration || 0,
          snitchCaught: targetMatch.snitch_caught || false,
          snitchCaughtBy: targetMatch.snitch_caught_by || ''
        };

        const predictionResult = this.evaluateSinglePrediction(
          prediction.type, 
          prediction.value, 
          matchResult, 
          targetMatch
        );
        
        results.push({
          matchId: targetMatchId,
          type: prediction.type,
          prediction: prediction.value,
          correct: predictionResult.isWon,
          reason: predictionResult.reason
        });
      }
      
      // For combined bets, ALL predictions must be correct
      const allCorrect = results.every(r => r.correct);
      const correctCount = results.filter(r => r.correct).length;
      
      const status = allCorrect ? 'won' : 'lost';
      const reason = allCorrect 
        ? `All ${results.length} predictions correct: ${results.map(r => `${r.type}(${r.reason})`).join(', ')}`
        : `Only ${correctCount}/${results.length} predictions correct. Failed: ${results.filter(r => !r.correct).map(r => `${r.type}(${r.reason})`).join(', ')}`;

      // Update bet status in database
      await this.db.updateBetStatus(combinedBet.id, status);

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

      // Note: Balance update and transaction creation is handled in updateBetStatus method

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
      console.log(`🔍 Resolving combined bet: ${bet.prediction}`);
      
      // Parse the combined prediction from the format "type:value,type:value"
      const predictions = this.parseCombinedPredictionString(bet.prediction);
      console.log(`📋 Parsed predictions:`, predictions);
      
      // For combined bets, all predictions must be correct
      const results = [];
      
      for (const pred of predictions) {
        // Evaluate each prediction
        const predictionResult = this.evaluateSinglePrediction(pred.type, pred.value, matchResult, match);
        
        results.push({
          type: pred.type,
          prediction: pred.value,
          correct: predictionResult.isWon,
          reason: predictionResult.reason
        });
        
        console.log(`  ${pred.type}:${pred.value} -> ${predictionResult.isWon ? '✅' : '❌'} (${predictionResult.reason})`);
      }
      
      const allCorrect = results.every(r => r.correct);
      const correctCount = results.filter(r => r.correct).length;
      
      const result = {
        isWon: allCorrect,
        reason: allCorrect 
          ? `All ${results.length} predictions correct: ${results.map(r => `${r.type}(${r.reason})`).join(', ')}`
          : `Only ${correctCount}/${results.length} predictions correct. Failed: ${results.filter(r => !r.correct).map(r => `${r.type}(${r.reason})`).join(', ')}`
      };
      
      console.log(`🎯 Combined bet result: ${result.isWon ? 'WON' : 'LOST'} - ${result.reason}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Error processing combined bet ${bet.id}:`, error);
      return {
        isWon: false,
        reason: `Error processing combined bet: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Parse combined prediction string in format "type:value,type:value"
   */
  private parseCombinedPredictionString(predictionString: string): Array<{ type: string; value: string }> {
    return predictionString.split(',').map(pred => {
      const [type, value] = pred.trim().split(':');
      return { type, value };
    });
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
      case 'snitch':
        // Snitch catcher bet - predict which team catches the snitch
        if (matchResult.snitchCaught) {
          // Get the home and away team IDs to compare with snitch_caught_by
          const homeTeamId = match.home_team_id;
          const awayTeamId = match.away_team_id;
          
          let predictedCorrectly = false;
          
          if (prediction === 'home' && matchResult.snitchCaughtBy === homeTeamId) {
            predictedCorrectly = true;
          } else if (prediction === 'away' && matchResult.snitchCaughtBy === awayTeamId) {
            predictedCorrectly = true;
          } else if (matchResult.snitchCaughtBy === prediction) {
            // Direct team ID/name match
            predictedCorrectly = true;
          }
          
          if (predictedCorrectly) {
            isWon = true;
            reason = `Snitch caught by predicted team (${prediction})`;
          } else {
            reason = `Snitch caught by ${matchResult.snitchCaughtBy}, predicted ${prediction}`;
          }
        } else {
          // Snitch not caught
          if (prediction === 'none' || prediction === 'no-catch') {
            isWon = true;
            reason = `Snitch not caught as predicted`;
          } else {
            reason = `Snitch not caught, predicted ${prediction}`;
          }
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
   * Pay out a winning bet - DEPRECATED: Logic moved to BetsRepository.updateBetStatus()
   * This method is no longer used to prevent duplicate balance updates
   */
  private async payoutWinningBet(bet: any): Promise<void> {
    // This method is deprecated to prevent duplicate balance updates
    // The payout logic is now handled in BetsRepository.updateBetStatus()
    console.log(`⚠️ WARNING: payoutWinningBet called for bet ${bet.id} - this should not happen anymore`);
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
