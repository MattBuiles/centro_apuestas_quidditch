import { Database } from '../database/Database';

interface MatchResult {
  homeScore: number;
  awayScore: number;
  duration: number;
  snitchCaught: boolean;
  snitchCaughtBy: string;
}

interface BetType {
  id: string;
  name: string;
  description: string;
  base_odds: number;
  options: string;
  is_active: boolean;
}

interface BetEvaluationResult {
  isWon: boolean;
  reason: string;
  betType?: BetType;
}

export class BetResolutionService {
  private static instance: BetResolutionService;
  private db: Database;
  private betTypesCache: Map<string, BetType> = new Map();

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
   * Cargar tipos de apuestas de la base de datos
   */
  private async loadBetTypes(): Promise<void> {
    try {
      const betTypes = await this.db.all('SELECT * FROM bet_types WHERE is_active = 1') as BetType[];
      this.betTypesCache.clear();
      
      for (const betType of betTypes) {
        this.betTypesCache.set(betType.id, betType);
      }
      
      console.log(`📋 Loaded ${betTypes.length} active bet types from database`);
    } catch (error) {
      console.error('❌ Error loading bet types:', error);
    }
  }

  /**
   * Obtener tipo de apuesta por ID
   */
  private async getBetType(betTypeId: string): Promise<BetType | null> {
    if (this.betTypesCache.size === 0) {
      await this.loadBetTypes();
    }
    
    return this.betTypesCache.get(betTypeId) || null;
  }

  /**
   * Evaluar apuesta usando información del tipo de apuesta
   */
  private async evaluateBetUsingType(bet: any, matchResult: MatchResult, match: any): Promise<BetEvaluationResult> {
    const betType = await this.getBetType(bet.bet_type_id);
    
    if (!betType) {
      return {
        isWon: false,
        reason: `Tipo de apuesta ${bet.bet_type_id} no encontrado o inactivo`
      };
    }

    // Evaluar según el tipo de apuesta
    switch (betType.id) {
      case 'winner-home':
        return this.evaluateWinnerBet(bet, matchResult, match, 'home', betType);
      
      case 'winner-away':
        return this.evaluateWinnerBet(bet, matchResult, match, 'away', betType);
      
      case 'winner-draw':
        return this.evaluateWinnerBet(bet, matchResult, match, 'draw', betType);
      
      case 'snitch-home':
        return this.evaluateSnitchBet(bet, matchResult, match, 'home', betType);
      
      case 'snitch-away':
        return this.evaluateSnitchBet(bet, matchResult, match, 'away', betType);
      
      case 'snitch-none':
        return this.evaluateSnitchBet(bet, matchResult, match, 'none', betType);
      
      case 'total-over':
        return this.evaluateTotalBet(bet, matchResult, match, 'over', betType);
      
      case 'total-under':
        return this.evaluateTotalBet(bet, matchResult, match, 'under', betType);
      
      case 'duration-over':
        return this.evaluateDurationBet(bet, matchResult, match, 'over', betType);
      
      case 'duration-under':
        return this.evaluateDurationBet(bet, matchResult, match, 'under', betType);
      
      default:
        return {
          isWon: false,
          reason: `Tipo de apuesta ${betType.id} no soportado`,
          betType
        };
    }
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
      console.log(`🔍 Resolviendo apuesta combinada ${combinedBet.id} con predicción: ${combinedBet.prediction}`);
      
      const predictions = this.parseCombinedPrediction(combinedBet.prediction);
      const results = [];
      
      // Para apuestas combinadas de un solo partido, todas las predicciones son para el mismo partido
      const primaryMatch = matchesData.get(combinedBet.match_id);
      const primaryMatchResult: MatchResult = {
        homeScore: primaryMatch.home_score || 0,
        awayScore: primaryMatch.away_score || 0,
        duration: primaryMatch.duration || 0,
        snitchCaught: primaryMatch.snitch_caught || false,
        snitchCaughtBy: primaryMatch.snitch_caught_by || ''
      };

      // Evaluar cada predicción
      for (const prediction of predictions) {
        const targetMatchId = prediction.matchId || combinedBet.match_id;
        const targetMatch = matchesData.get(targetMatchId);
        
        if (!targetMatch) {
          return {
            success: false,
            error: `Datos del partido ${targetMatchId} no encontrados`
          };
        }

        const matchResult: MatchResult = {
          homeScore: targetMatch.home_score || 0,
          awayScore: targetMatch.away_score || 0,
          duration: targetMatch.duration || 0,
          snitchCaught: targetMatch.snitch_caught || false,
          snitchCaughtBy: targetMatch.snitch_caught_by || ''
        };

        // Evaluar la predicción individual
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

        console.log(`  📊 ${prediction.type}:${prediction.value} -> ${predictionResult.isWon ? '✅' : '❌'} (${predictionResult.reason})`);
      }
      
      // Para apuestas combinadas, TODAS las predicciones deben ser correctas
      const allCorrect = results.every(r => r.correct);
      const correctCount = results.filter(r => r.correct).length;
      
      const status = allCorrect ? 'won' : 'lost';
      
      let reason: string;
      if (allCorrect) {
        reason = `Todas las ${results.length} predicciones correctas: ${results.map(r => `${r.type}(${r.reason})`).join(', ')}`;
      } else {
        const failedPredictions = results.filter(r => !r.correct);
        reason = `Solo ${correctCount}/${results.length} predicciones correctas. Fallaron: ${failedPredictions.map(r => `${r.type}(${r.reason})`).join(', ')}`;
      }

      // Actualizar estado de la apuesta en base de datos
      await this.db.updateBetStatus(combinedBet.id, status);

      console.log(`🎯 Apuesta combinada ${combinedBet.id} resultado: ${status.toUpperCase()} - ${reason}`);

      return {
        success: true,
        status,
        reason
      };

    } catch (error) {
      console.error(`❌ Error resolviendo apuesta combinada ${combinedBet.id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
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
    try {
      let evaluationResult: BetEvaluationResult;

      // Primero intentar evaluar usando bet_types si existe bet_type_id
      if (bet.bet_type_id) {
        console.log(`🎯 Evaluando apuesta ${bet.id} usando bet_type_id: ${bet.bet_type_id}`);
        evaluationResult = await this.evaluateBetUsingType(bet, matchResult, match);
      } else {
        // Fallback al sistema anterior para compatibilidad
        console.log(`⚠️ Apuesta ${bet.id} sin bet_type_id, usando sistema legacy`);
        evaluationResult = await this.evaluateBetLegacy(bet, matchResult, match);
      }

      const status = evaluationResult.isWon ? 'won' : 'lost';
      
      // Actualizar estado de la apuesta en base de datos
      await this.db.updateBetStatus(bet.id, status);

      return {
        success: true,
        status,
        reason: evaluationResult.reason
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Evaluar apuesta usando el sistema legacy para compatibilidad
   */
  private async evaluateBetLegacy(bet: any, matchResult: MatchResult, match: any): Promise<BetEvaluationResult> {
    const { type, prediction } = bet;
    let isWon = false;
    let reason = '';

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
        } else if (!matchResult.snitchCaught && prediction === 'none') {
          isWon = true;
          reason = `Snitch not caught as predicted`;
        } else {
          reason = `Snitch ${matchResult.snitchCaught ? 'caught by ' + matchResult.snitchCaughtBy : 'not caught'}, predicted ${prediction}`;
        }
        break;

      case 'match_duration':
      case 'time':
        // Match duration bet - predict over/under duration or time range
        if (prediction.includes('_')) {
          // Format: "over_90" or "under_120"
          const [durationOverUnder, durationThreshold] = prediction.split('_');
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
        } else if (prediction.includes('+')) {
          // Format: "120+" (more than X minutes)
          const thresholdMatch = prediction.match(/^(\d+)\+$/);
          if (thresholdMatch) {
            const threshold = parseInt(thresholdMatch[1]);
            if (matchResult.duration > threshold) {
              isWon = true;
              reason = `Match duration ${matchResult.duration} min was over ${threshold} min as predicted`;
            } else {
              reason = `Match duration ${matchResult.duration} min was not over ${threshold} min as predicted`;
            }
          } else {
            reason = `Invalid time prediction format: ${prediction}`;
          }
        } else {
          // Format: "30-60" or "0-30" (time range)
          const timeRangeMatch = prediction.match(/^(\d+)-(\d+)$/);
          if (timeRangeMatch) {
            const minTime = parseInt(timeRangeMatch[1]);
            const maxTime = parseInt(timeRangeMatch[2]);
            
            if (matchResult.duration >= minTime && matchResult.duration <= maxTime) {
              isWon = true;
              reason = `Match duration ${matchResult.duration} min was within predicted range ${minTime}-${maxTime} min`;
            } else {
              reason = `Match duration ${matchResult.duration} min was outside predicted range ${minTime}-${maxTime} min`;
            }
          } else {
            reason = `Invalid time prediction format: ${prediction}`;
          }
        }
        break;

      case 'score':
        // Score bet - predict exact match score
        if (prediction === 'exact') {
          // Para apuestas legacy que solo tienen 'exact' sin el marcador específico
          isWon = false;
          reason = `Score bet with 'exact' prediction not supported - need specific score (e.g., '150-90')`;
        } else {
          // Format: "150-90" (home_score-away_score)
          const scoreMatch = prediction.match(/^(\d+)-(\d+)$/);
          if (scoreMatch) {
            const predictedHomeScore = parseInt(scoreMatch[1]);
            const predictedAwayScore = parseInt(scoreMatch[2]);
            
            if (matchResult.homeScore === predictedHomeScore && matchResult.awayScore === predictedAwayScore) {
              isWon = true;
              reason = `Exact score match: ${predictedHomeScore}-${predictedAwayScore}`;
            } else {
              reason = `Predicted score ${predictedHomeScore}-${predictedAwayScore}, actual score ${matchResult.homeScore}-${matchResult.awayScore}`;
            }
          } else {
            reason = `Invalid score prediction format: ${prediction}. Use format like '150-90'`;
          }
        }
        break;

      case 'combined':
        // Combined bet - multiple predictions (advanced logic)
        const combinedResult = await this.resolveCombinedBet(bet, matchResult, match);
        return { isWon: combinedResult.isWon, reason: combinedResult.reason };

      default:
        throw new Error(`Unknown bet type: ${type}`);
    }

    return { isWon, reason };
  }

  /**
   * Resolve combined bet (multiple predictions)
   */
  private async resolveCombinedBet(bet: any, matchResult: MatchResult, match: any): Promise<{
    isWon: boolean;
    reason: string;
  }> {
    try {
      console.log(`🔍 Resolviendo apuesta combinada: ${bet.prediction}`);
      
      // Parsear la predicción combinada del formato "type:value,type:value"
      const predictions = this.parseCombinedPredictionString(bet.prediction);
      console.log(`📋 Predicciones parseadas:`, predictions);
      
      // Para apuestas combinadas, todas las predicciones deben ser correctas
      const results = [];
      
      for (const pred of predictions) {
        // Evaluar cada predicción usando la nueva lógica mejorada
        const predictionResult = this.evaluateSinglePrediction(pred.type, pred.value, matchResult, match);
        
        results.push({
          type: pred.type,
          prediction: pred.value,
          correct: predictionResult.isWon,
          reason: predictionResult.reason
        });
        
        console.log(`  📊 ${pred.type}:${pred.value} -> ${predictionResult.isWon ? '✅' : '❌'} (${predictionResult.reason})`);
      }
      
      const allCorrect = results.every(r => r.correct);
      const correctCount = results.filter(r => r.correct).length;
      
      let reason: string;
      if (allCorrect) {
        reason = `Todas las ${results.length} predicciones correctas: ${results.map(r => `${r.type}(${r.reason})`).join(', ')}`;
      } else {
        const failedPredictions = results.filter(r => !r.correct);
        reason = `Solo ${correctCount}/${results.length} predicciones correctas. Fallaron: ${failedPredictions.map(r => `${r.type}(${r.reason})`).join(', ')}`;
      }
      
      const result = {
        isWon: allCorrect,
        reason
      };
      
      console.log(`🎯 Resultado apuesta combinada: ${result.isWon ? 'GANADA' : 'PERDIDA'} - ${result.reason}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Error procesando apuesta combinada ${bet.id}:`, error);
      return {
        isWon: false,
        reason: `Error procesando apuesta combinada: ${error instanceof Error ? error.message : 'Error desconocido'}`
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
    // Mapear tipos legacy a bet_types
    const betTypeMapping: { [key: string]: string } = {
      'winner': prediction === 'home' ? 'winner-home' : prediction === 'away' ? 'winner-away' : 'winner-draw',
      'snitch_catcher': prediction === 'home' ? 'snitch-home' : prediction === 'away' ? 'snitch-away' : 'snitch-none',
      'snitch': prediction === 'home' ? 'snitch-home' : prediction === 'away' ? 'snitch-away' : 'snitch-none',
      'total_score': prediction.includes('over') ? 'total-over' : 'total-under',
      'match_duration': prediction.includes('over') ? 'duration-over' : 'duration-under',
      'time': this.getTimeRangeBetType(prediction), // Nuevo mapeo para rangos de tiempo
      'score': 'score-exact' // Nuevo mapeo para apuestas de marcador exacto
    };

    const betTypeId = betTypeMapping[type];
    
    if (betTypeId) {
      // Usar la nueva lógica basada en bet_types
      const mockBet = { bet_type_id: betTypeId, prediction: prediction };
      
      // Evaluar usando los métodos específicos
      switch (betTypeId) {
        case 'winner-home':
          return this.evaluateWinnerBet(mockBet, matchResult, match, 'home', { id: betTypeId } as BetType);
        case 'winner-away':
          return this.evaluateWinnerBet(mockBet, matchResult, match, 'away', { id: betTypeId } as BetType);
        case 'winner-draw':
          return this.evaluateWinnerBet(mockBet, matchResult, match, 'draw', { id: betTypeId } as BetType);
        case 'snitch-home':
          return this.evaluateSnitchBet(mockBet, matchResult, match, 'home', { id: betTypeId } as BetType);
        case 'snitch-away':
          return this.evaluateSnitchBet(mockBet, matchResult, match, 'away', { id: betTypeId } as BetType);
        case 'snitch-none':
          return this.evaluateSnitchBet(mockBet, matchResult, match, 'none', { id: betTypeId } as BetType);
        case 'total-over':
          return this.evaluateTotalBet(mockBet, matchResult, match, 'over', { id: betTypeId } as BetType);
        case 'total-under':
          return this.evaluateTotalBet(mockBet, matchResult, match, 'under', { id: betTypeId } as BetType);
        case 'duration-over':
          return this.evaluateDurationBet(mockBet, matchResult, match, 'over', { id: betTypeId } as BetType);
        case 'duration-under':
          return this.evaluateDurationBet(mockBet, matchResult, match, 'under', { id: betTypeId } as BetType);
        case 'time-range':
          return this.evaluateTimeRangeBet(mockBet, matchResult, match, prediction);
        case 'score-exact':
          return this.evaluateScoreBet(mockBet, matchResult, match, prediction);
      }
    }

    // Fallback al sistema legacy para compatibilidad
    return this.evaluateSinglePredictionLegacy(type, prediction, matchResult, match);
  }

  /**
   * Evaluate a single prediction using legacy system for compatibility
   */
  private evaluateSinglePredictionLegacy(type: string, prediction: string, matchResult: MatchResult, match: any): {
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

      case 'time':
        // Time range bet - predict if duration falls within a range or exceeds a threshold
        if (prediction.includes('+')) {
          // Format: "120+" (more than X minutes)
          const thresholdMatch = prediction.match(/^(\d+)\+$/);
          if (thresholdMatch) {
            const threshold = parseInt(thresholdMatch[1]);
            if (matchResult.duration > threshold) {
              isWon = true;
              reason = `Match duration ${matchResult.duration} min was over ${threshold} min as predicted`;
            } else {
              reason = `Match duration ${matchResult.duration} min was not over ${threshold} min as predicted`;
            }
          } else {
            reason = `Invalid time prediction format: ${prediction}`;
          }
        } else {
          // Format: "30-60" or "0-30" (time range)
          const timeRangeMatch = prediction.match(/^(\d+)-(\d+)$/);
          if (timeRangeMatch) {
            const minTime = parseInt(timeRangeMatch[1]);
            const maxTime = parseInt(timeRangeMatch[2]);
            
            if (matchResult.duration >= minTime && matchResult.duration <= maxTime) {
              isWon = true;
              reason = `Match duration ${matchResult.duration} min was within range ${minTime}-${maxTime} min`;
            } else {
              reason = `Match duration ${matchResult.duration} min was outside range ${minTime}-${maxTime} min`;
            }
          } else {
            reason = `Invalid time range format: ${prediction}`;
          }
        }
        break;

      case 'score':
        // Score bet - predict exact match score
        if (prediction === 'exact') {
          // Para apuestas legacy que solo tienen 'exact' sin el marcador específico
          isWon = false;
          reason = `Score bet with 'exact' prediction not supported - need specific score (e.g., '150-90')`;
        } else {
          // Format: "150-90" (home_score-away_score)
          const scoreMatch = prediction.match(/^(\d+)-(\d+)$/);
          if (scoreMatch) {
            const predictedHomeScore = parseInt(scoreMatch[1]);
            const predictedAwayScore = parseInt(scoreMatch[2]);
            
            if (matchResult.homeScore === predictedHomeScore && matchResult.awayScore === predictedAwayScore) {
              isWon = true;
              reason = `Exact score match: ${predictedHomeScore}-${predictedAwayScore}`;
            } else {
              reason = `Predicted score ${predictedHomeScore}-${predictedAwayScore}, actual score ${matchResult.homeScore}-${matchResult.awayScore}`;
            }
          } else {
            reason = `Invalid score prediction format: ${prediction}. Use format like '150-90'`;
          }
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

  /**
   * Métodos de evaluación específicos usando bet_types
   */

  /**
   * Evaluar apuesta de ganador
   */
  private evaluateWinnerBet(bet: any, matchResult: MatchResult, match: any, expectedWinner: string, betType: BetType): BetEvaluationResult {
    const { homeScore, awayScore } = matchResult;
    let isWon = false;
    let reason = '';

    if (expectedWinner === 'home' && homeScore > awayScore) {
      isWon = true;
      reason = `${match.homeTeamName} ganó ${homeScore}-${awayScore}`;
    } else if (expectedWinner === 'away' && awayScore > homeScore) {
      isWon = true;
      reason = `${match.awayTeamName} ganó ${awayScore}-${homeScore}`;
    } else if (expectedWinner === 'draw' && homeScore === awayScore) {
      isWon = true;
      reason = `Empate ${homeScore}-${awayScore}`;
    } else {
      // Apuesta perdida
      if (homeScore > awayScore) {
        reason = `Se predijo ${this.getTeamNameByWinner(expectedWinner, match)}, pero ganó ${match.homeTeamName} ${homeScore}-${awayScore}`;
      } else if (awayScore > homeScore) {
        reason = `Se predijo ${this.getTeamNameByWinner(expectedWinner, match)}, pero ganó ${match.awayTeamName} ${awayScore}-${homeScore}`;
      } else {
        reason = `Se predijo ${this.getTeamNameByWinner(expectedWinner, match)}, pero fue empate ${homeScore}-${awayScore}`;
      }
    }

    return { isWon, reason, betType };
  }

  /**
   * Evaluar apuesta de snitch
   */
  private evaluateSnitchBet(bet: any, matchResult: MatchResult, match: any, expectedCatcher: string, betType: BetType): BetEvaluationResult {
    const { snitchCaught, snitchCaughtBy } = matchResult;
    let isWon = false;
    let reason = '';

    if (expectedCatcher === 'none') {
      if (!snitchCaught) {
        isWon = true;
        reason = 'La snitch no fue capturada como se predijo';
      } else {
        reason = `Se predijo que la snitch no sería capturada, pero fue capturada por ${this.getTeamNameById(snitchCaughtBy, match)}`;
      }
    } else {
      if (snitchCaught) {
        const homeTeamId = match.home_team_id;
        const awayTeamId = match.away_team_id;
        
        if ((expectedCatcher === 'home' && snitchCaughtBy === homeTeamId) || 
            (expectedCatcher === 'away' && snitchCaughtBy === awayTeamId)) {
          isWon = true;
          reason = `La snitch fue capturada por ${this.getTeamNameById(snitchCaughtBy, match)} como se predijo`;
        } else {
          reason = `Se predijo que la snitch sería capturada por ${this.getTeamNameByWinner(expectedCatcher, match)}, pero fue capturada por ${this.getTeamNameById(snitchCaughtBy, match)}`;
        }
      } else {
        reason = `Se predijo que la snitch sería capturada por ${this.getTeamNameByWinner(expectedCatcher, match)}, pero no fue capturada`;
      }
    }

    return { isWon, reason, betType };
  }

  /**
   * Evaluar apuesta de total de puntos
   */
  private evaluateTotalBet(bet: any, matchResult: MatchResult, match: any, overUnder: string, betType: BetType): BetEvaluationResult {
    const totalScore = matchResult.homeScore + matchResult.awayScore;
    let isWon = false;
    let reason = '';

    // Extraer el umbral de la predicción del usuario
    const threshold = this.extractThresholdFromPrediction(bet.prediction);
    
    if (overUnder === 'over' && totalScore > threshold) {
      isWon = true;
      reason = `Total de puntos ${totalScore} fue mayor que ${threshold}`;
    } else if (overUnder === 'under' && totalScore < threshold) {
      isWon = true;
      reason = `Total de puntos ${totalScore} fue menor que ${threshold}`;
    } else {
      reason = `Total de puntos ${totalScore} no cumplió con la predicción ${overUnder} ${threshold}`;
    }

    return { isWon, reason, betType };
  }

  /**
   * Evaluar apuesta de duración
   */
  private evaluateDurationBet(bet: any, matchResult: MatchResult, match: any, overUnder: string, betType: BetType): BetEvaluationResult {
    const duration = matchResult.duration;
    let isWon = false;
    let reason = '';

    // Extraer el umbral de la predicción del usuario
    const threshold = this.extractThresholdFromPrediction(bet.prediction);
    
    if (overUnder === 'over' && duration > threshold) {
      isWon = true;
      reason = `Duración ${duration} minutos fue mayor que ${threshold} minutos`;
    } else if (overUnder === 'under' && duration < threshold) {
      isWon = true;
      reason = `Duración ${duration} minutos fue menor que ${threshold} minutos`;
    } else {
      reason = `Duración ${duration} minutos no cumplió con la predicción ${overUnder} ${threshold} minutos`;
    }

    return { isWon, reason, betType };
  }

  /**
   * Evaluar apuesta de marcador exacto
   */
  private evaluateScoreBet(bet: any, matchResult: MatchResult, match: any, prediction: string): {
    isWon: boolean;
    reason: string;
  } {
    if (prediction === 'exact') {
      // Para apuestas legacy que solo tienen 'exact' sin el marcador específico
      return {
        isWon: false,
        reason: `Apuesta de marcador con predicción 'exact' no soportada - necesita marcador específico (ej: '150-90')`
      };
    }

    // Format: "150-90" (home_score-away_score)
    const scoreMatch = prediction.match(/^(\d+)-(\d+)$/);
    if (!scoreMatch) {
      return {
        isWon: false,
        reason: `Formato de marcador inválido: ${prediction}. Use formato como '150-90'`
      };
    }

    const predictedHomeScore = parseInt(scoreMatch[1]);
    const predictedAwayScore = parseInt(scoreMatch[2]);

    if (matchResult.homeScore === predictedHomeScore && matchResult.awayScore === predictedAwayScore) {
      return {
        isWon: true,
        reason: `Marcador exacto acertado: ${predictedHomeScore}-${predictedAwayScore}`
      };
    } else {
      return {
        isWon: false,
        reason: `Marcador predicho ${predictedHomeScore}-${predictedAwayScore}, marcador real ${matchResult.homeScore}-${matchResult.awayScore}`
      };
    }
  }

  /**
   * Métodos auxiliares
   */
  private getTeamNameByWinner(winner: string, match: any): string {
    if (winner === 'home') return match.homeTeamName;
    if (winner === 'away') return match.awayTeamName;
    if (winner === 'draw') return 'empate';
    return winner;
  }

  private getTeamNameById(teamId: string, match: any): string {
    if (teamId === match.home_team_id) return match.homeTeamName;
    if (teamId === match.away_team_id) return match.awayTeamName;
    return teamId;
  }

  private extractThresholdFromPrediction(prediction: string): number {
    // Extraer número de predicciones como "over_300", "under_250", etc.
    const match = prediction.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Determina el tipo de apuesta para rangos de tiempo
   */
  private getTimeRangeBetType(prediction: string): string {
    // Para rangos de tiempo como "30-60", usamos un tipo genérico
    if (prediction.match(/^\d+-\d+$/)) {
      return 'time-range';
    }
    // Para formatos como "120+", usamos un tipo over
    if (prediction.match(/^\d+\+$/)) {
      return 'duration-over';
    }
    return 'duration-over'; // fallback
  }

  /**
   * Evalúa apuestas de rango de tiempo
   */
  private evaluateTimeRangeBet(bet: any, matchResult: MatchResult, match: any, prediction: string): {
    isWon: boolean;
    reason: string;
  } {
    const duration = matchResult.duration;

    if (prediction.includes('+')) {
      // Format: "120+" (more than X minutes)
      const thresholdMatch = prediction.match(/^(\d+)\+$/);
      if (!thresholdMatch) {
        return {
          isWon: false,
          reason: `Formato de tiempo inválido: ${prediction}`
        };
      }
      
      const threshold = parseInt(thresholdMatch[1]);
      if (duration > threshold) {
        return {
          isWon: true,
          reason: `Duración ${duration} minutos fue mayor a ${threshold} minutos como se predijo`
        };
      } else {
        return {
          isWon: false,
          reason: `Duración ${duration} minutos no fue mayor a ${threshold} minutos como se predijo`
        };
      }
    } else {
      // Format: "30-60" or "0-30" (time range)
      const timeRangeMatch = prediction.match(/^(\d+)-(\d+)$/);
      if (!timeRangeMatch) {
        return {
          isWon: false,
          reason: `Formato de rango de tiempo inválido: ${prediction}`
        };
      }

      const minTime = parseInt(timeRangeMatch[1]);
      const maxTime = parseInt(timeRangeMatch[2]);

      if (duration >= minTime && duration <= maxTime) {
        return {
          isWon: true,
          reason: `Duración ${duration} minutos estuvo dentro del rango ${minTime}-${maxTime} minutos`
        };
      } else {
        return {
          isWon: false,
          reason: `Duración ${duration} minutos estuvo fuera del rango ${minTime}-${maxTime} minutos`
        };
      }
    }
  }
}
