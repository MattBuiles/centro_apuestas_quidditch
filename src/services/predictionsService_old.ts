import { Match } from '@/types/league';

export interface Prediction {
  id: string;
  matchId: string;
  userId: string;
  predictedWinner: 'home' | 'away' | 'draw';
  predictedScore?: {
    home: number;
    away: number;
  };
  confidence: number; // 1-5 scale
  timestamp: Date;
  isCorrect?: boolean; // Set after match ends
}

export interface MatchPredictionStats {
  totalPredictions: number;
  homeWinPredictions: number;
  awayWinPredictions: number;
  drawPredictions: number;
  homeWinPercentage: number;
  awayWinPercentage: number;
  drawPercentage: number;
  userPrediction?: Prediction;
}

export interface FinishedMatchData {
  matchId: string;
  finalScore: {
    home: number;
    away: number;
  };
  winner: 'home' | 'away' | 'draw';
  timeline: Array<{
    minute: number;
    event: string;
    team?: 'home' | 'away';
    score?: { home: number; away: number };
  }>;
  predictions: MatchPredictionStats;
  finishedAt: Date;
}

export class PredictionsService {
  private readonly STORAGE_KEY = 'quidditch_predictions';
  private readonly MOCK_PREDICTIONS_KEY = 'quidditch_mock_predictions';
  private readonly FINISHED_MATCHES_KEY = 'quidditch_finished_matches';
  
  constructor() {
    this.initializeMockPredictions();
  }
  /**
   * Create a prediction for a match
   */
  createPrediction(matchId: string, predictedWinner: 'home' | 'away' | 'draw', confidence: number = 3, predictedScore?: { home: number; away: number }): Prediction {
    console.log(`🔮 CREATING PREDICTION for match ${matchId}:`);
    console.log(`   📝 Predicted winner: "${predictedWinner}"`);
    console.log(`   🎯 Confidence: ${confidence}`);
    
    const prediction: Prediction = {
      id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      matchId,
      userId: 'current_user', // In real app, get from auth context
      predictedWinner,
      predictedScore,
      confidence,
      timestamp: new Date()
    };

    console.log(`   💾 Final prediction object:`, prediction);
    this.savePrediction(prediction);
    console.log(`   ✅ Prediction saved successfully`);
    
    return prediction;
  }

  /**
   * Get user's prediction for a specific match
   */
  getUserPrediction(matchId: string): Prediction | null {
    const predictions = this.getAllUserPredictions();
    return predictions.find(p => p.matchId === matchId) || null;
  }

  /**
   * Get all predictions for a match with statistics
   */
  getMatchPredictionStats(matchId: string): MatchPredictionStats {
    const mockPredictions = this.getMockPredictions(matchId);
    const userPrediction = this.getUserPrediction(matchId);
    
    // Include user prediction in totals if it exists
    const allPredictions = userPrediction 
      ? [...mockPredictions, userPrediction]
      : mockPredictions;

    const totalPredictions = allPredictions.length;
    const homeWinPredictions = allPredictions.filter(p => p.predictedWinner === 'home').length;
    const awayWinPredictions = allPredictions.filter(p => p.predictedWinner === 'away').length;
    const drawPredictions = allPredictions.filter(p => p.predictedWinner === 'draw').length;

    return {
      totalPredictions,
      homeWinPredictions,
      awayWinPredictions,
      drawPredictions,
      homeWinPercentage: totalPredictions > 0 ? (homeWinPredictions / totalPredictions) * 100 : 0,
      awayWinPercentage: totalPredictions > 0 ? (awayWinPredictions / totalPredictions) * 100 : 0,
      drawPercentage: totalPredictions > 0 ? (drawPredictions / totalPredictions) * 100 : 0,
      userPrediction: userPrediction || undefined
    };
  }  /**
   * Update prediction correctness after match ends
   */
  updatePredictionResult(matchId: string, actualResult: 'home' | 'away' | 'draw'): void {
    console.log(`🔮 UPDATING PREDICTION RESULT for match ${matchId}:`);
    console.log(`   🏆 Actual result: "${actualResult}"`);
    
    const prediction = this.getUserPrediction(matchId);
    if (!prediction) {
      console.log(`⚠️ No prediction found for match ${matchId} - user did not make a prediction`);
      return;
    }
    
    console.log(`   � User predicted: "${prediction.predictedWinner}"`);
    console.log(`   🔍 Comparison: "${prediction.predictedWinner}" === "${actualResult}"`);
    console.log(`   📊 Prediction object before update:`, prediction);
    
    const wasCorrect = prediction.predictedWinner === actualResult;
    prediction.isCorrect = wasCorrect;
    
    // Force save the updated prediction
    this.savePrediction(prediction);
    
    console.log(`   🎯 Final result: ${wasCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
    console.log(`   💾 Saved isCorrect: ${prediction.isCorrect}`);
    
    // Verify the save worked by retrieving it again
    const verifyPrediction = this.getUserPrediction(matchId);
    if (verifyPrediction && verifyPrediction.isCorrect === wasCorrect) {
      console.log(`   ✅ Verification successful: prediction correctly saved`);
    } else {
      console.error(`   ❌ Verification failed: prediction may not have been saved correctly`);
      console.log(`   🔧 Retry saving prediction...`);
      // Retry save once more
      this.savePrediction(prediction);
    }
  }

  /**
   * Save finished match data with timeline and predictions
   */
  saveFinishedMatchData(matchData: FinishedMatchData): void {
    try {
      const finishedMatches = this.getAllFinishedMatches();
      
      // Remove existing entry if it exists
      const filteredMatches = finishedMatches.filter(m => m.matchId !== matchData.matchId);
      
      // Add new entry
      filteredMatches.push(matchData);
      
      localStorage.setItem(this.FINISHED_MATCHES_KEY, JSON.stringify(filteredMatches));
    } catch (error) {
      console.error('Error saving finished match data:', error);
    }
  }

  /**
   * Get finished match data
   */
  getFinishedMatchData(matchId: string): FinishedMatchData | null {
    const finishedMatches = this.getAllFinishedMatches();
    return finishedMatches.find(m => m.matchId === matchId) || null;
  }

  /**
   * Get all finished matches
   */
  private getAllFinishedMatches(): FinishedMatchData[] {
    try {
      const stored = localStorage.getItem(this.FINISHED_MATCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Check if match data is saved
   */
  hasFinishedMatchData(matchId: string): boolean {
    return this.getFinishedMatchData(matchId) !== null;
  }

  /**
   * Get all user predictions
   */
  getAllUserPredictions(): Prediction[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get user's prediction statistics
   */
  getUserPredictionStats(): {
    total: number;
    correct: number;
    accuracy: number;
    pending: number;
  } {
    const predictions = this.getAllUserPredictions();
    const finished = predictions.filter(p => p.isCorrect !== undefined);
    const correct = finished.filter(p => p.isCorrect === true).length;
    const pending = predictions.filter(p => p.isCorrect === undefined).length;

    return {
      total: predictions.length,
      correct,
      accuracy: finished.length > 0 ? (correct / finished.length) * 100 : 0,
      pending
    };
  }

  /**
   * Check if predictions are allowed for a match
   */
  canMakePrediction(match: Match): boolean {
    // Can predict if match is scheduled or live but not started simulation
    return match.status === 'scheduled' || 
           (match.status === 'live' && (match.currentMinute === undefined || match.currentMinute === 0));
  }

  /**
   * Save prediction to localStorage
   */
  private savePrediction(prediction: Prediction): void {
    try {
      const predictions = this.getAllUserPredictions();
      const existingIndex = predictions.findIndex(p => p.matchId === prediction.matchId);
      
      if (existingIndex >= 0) {
        predictions[existingIndex] = prediction;
      } else {
        predictions.push(prediction);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(predictions));
    } catch (error) {
      console.error('Error saving prediction:', error);
    }
  }

  /**
   * Generate mock predictions for other users
   */
  private getMockPredictions(matchId: string): Prediction[] {
    const mockPredictionsData = this.getAllMockPredictions();
    return mockPredictionsData[matchId] || [];
  }

  /**
   * Initialize mock predictions for demonstration
   */
  private initializeMockPredictions(): void {
    const existing = localStorage.getItem(this.MOCK_PREDICTIONS_KEY);
    if (existing) return; // Already initialized

    // Generate some mock predictions for common match IDs
    const mockData: Record<string, Prediction[]> = {};
    
    // This would be populated with actual match IDs from the simulation
    const sampleMatchIds = ['1', '2', '3', '4', '5'];
    
    sampleMatchIds.forEach(matchId => {
      mockData[matchId] = this.generateMockPredictionsForMatch(matchId);
    });

    localStorage.setItem(this.MOCK_PREDICTIONS_KEY, JSON.stringify(mockData));
  }  /**
   * Generate mock predictions for a specific match
   */
  private generateMockPredictionsForMatch(matchId: string): Prediction[] {
    const predictions: Prediction[] = [];
    const numPredictions = Math.floor(Math.random() * 50) + 148; // 148-198 predictions (as requested: 148 additional)

    // List of magical wizard names for more immersive experience
    const wizardNames = [
      'Albus_Dumbledore', 'Minerva_McGonagall', 'Severus_Snape', 'Rubeus_Hagrid', 'Hermione_Granger',
      'Luna_Lovegood', 'Neville_Longbottom', 'Cedric_Diggory', 'Cho_Chang', 'Dean_Thomas',
      'Seamus_Finnigan', 'Lavender_Brown', 'Parvati_Patil', 'Padma_Patil', 'Lee_Jordan',
      'Oliver_Wood', 'Marcus_Flint', 'Viktor_Krum', 'Fleur_Delacour', 'Gabrielle_Delacour',
      'Bill_Weasley', 'Charlie_Weasley', 'Percy_Weasley', 'Fred_Weasley', 'George_Weasley',
      'Ginny_Weasley', 'Ron_Weasley', 'Arthur_Weasley', 'Molly_Weasley', 'Sirius_Black',
      'Remus_Lupin', 'Tonks_Lupin', 'Mad_Eye_Moody', 'Kingsley_Shacklebolt', 'Auror_Smith',
      'Professor_Sprout', 'Professor_Flitwick', 'Professor_Trelawney', 'Professor_Binns', 'Madam_Hooch',
      'Madam_Pomfrey', 'Madam_Pince', 'Nearly_Headless_Nick', 'Fat_Lady', 'Bloody_Baron',
      'Grey_Lady', 'Fat_Friar', 'Peeves_Poltergeist', 'Dobby_Elf', 'Winky_Elf',
      'Kreacher_Elf', 'Griphook_Goblin', 'Firenze_Centaur', 'Bane_Centaur', 'Ronan_Centaur',
      'Grawp_Giant', 'Aragog_Spider', 'Buckbeak_Hippogriff', 'Norbert_Dragon', 'Fluffy_Dog',
      'Phoenix_Fawkes', 'Hedwig_Owl', 'Errol_Owl', 'Pigwidgeon_Owl', 'Crookshanks_Cat',
      'Mrs_Norris_Cat', 'Scabbers_Rat', 'Trevor_Toad', 'Wizard_Alex', 'Sorceress_Maya',
      'Enchanter_Kai', 'Mystic_Zara', 'Spellcaster_Leo', 'Witch_Iris', 'Warlock_Rex',
      'Sage_Nova', 'Oracle_Vera', 'Mage_Finn', 'Conjurer_Lux', 'Druid_Sage', 'Rune_Master',
      'Crystal_Gazer', 'Star_Reader', 'Moon_Whisperer', 'Sun_Caller', 'Storm_Weaver', 
      'Shadow_Walker', 'Light_Bringer', 'Time_Keeper', 'Dream_Weaver', 'Spirit_Guide',
      'Ancient_Wizard', 'Young_Apprentice', 'Elder_Sage', 'Wise_Oracle', 'Brave_Auror',
      'Clever_Ravenclaw', 'Loyal_Hufflepuff', 'Cunning_Slytherin', 'Bold_Gryffindor', 'House_Elf_Helper',
      'Quidditch_Fan_01', 'Quidditch_Fan_02', 'Quidditch_Fan_03', 'Quidditch_Fan_04', 'Quidditch_Fan_05',
      'Magical_Analyst', 'Sports_Prophet', 'Game_Seer', 'Match_Oracle', 'Victory_Predictor',
      'Score_Whisperer', 'Snitch_Tracker', 'Seeker_Expert', 'Chaser_Specialist', 'Keeper_Judge',
      'Beater_Critic', 'Team_Strategist', 'Magic_Statistician', 'Quidditch_Historian', 'Legendary_Fan'
    ];

    for (let i = 0; i < numPredictions; i++) {
      // More realistic distribution: slight home advantage but closer odds
      const weights = [0.42, 0.38, 0.20]; // Home slight favorite, away close second, draw less likely
      const randomValue = Math.random();
      
      let predictedWinner: 'home' | 'away' | 'draw';
      if (randomValue < weights[0]) {
        predictedWinner = 'home';
      } else if (randomValue < weights[0] + weights[1]) {
        predictedWinner = 'away';
      } else {
        predictedWinner = 'draw';
      }

      // Pick a random wizard name
      const wizardName = wizardNames[Math.floor(Math.random() * wizardNames.length)];
      
      predictions.push({
        id: `mock_pred_${matchId}_${i}`,
        matchId,
        userId: `${wizardName}_${i}`,
        predictedWinner,
        confidence: Math.floor(Math.random() * 5) + 1,
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 14) // Last 14 days for variety
      });
    }

    return predictions;
  }

  /**
   * Get all mock predictions
   */
  private getAllMockPredictions(): Record<string, Prediction[]> {
    try {
      const stored = localStorage.getItem(this.MOCK_PREDICTIONS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
  /**
   * Add mock predictions for a new match
   */
  addMockPredictionsForMatch(matchId: string): void {
    const mockData = this.getAllMockPredictions();
    if (!mockData[matchId]) {
      mockData[matchId] = this.generateMockPredictionsForMatch(matchId);
      localStorage.setItem(this.MOCK_PREDICTIONS_KEY, JSON.stringify(mockData));
    }
  }
  /**
   * DEBUG: Manually check and fix prediction for a match
   */
  debugPredictionForMatch(matchId: string): void {
    console.log(`🔧 DEBUG: Manually checking prediction for match ${matchId}`);
    
    const prediction = this.getUserPrediction(matchId);
    if (!prediction) {
      console.log(`❌ No prediction found for match ${matchId}`);
      return;
    }
    
    console.log(`📊 Current prediction:`, prediction);
    console.log(`🔍 Current isCorrect status: ${prediction.isCorrect}`);
      // Try to find the match and determine result manually
    if (typeof window !== 'undefined' && (window as unknown as { debugQuidditch?: { virtualTimeManager?: { getState(): { temporadaActiva?: { partidos: { id: string; status: string; homeScore: number; awayScore: number }[] } } } } }).debugQuidditch?.virtualTimeManager) {
      const timeManager = (window as unknown as { debugQuidditch: { virtualTimeManager: { getState(): { temporadaActiva?: { partidos: { id: string; status: string; homeScore: number; awayScore: number }[] } } } } }).debugQuidditch.virtualTimeManager;
      const state = timeManager.getState();
      
      if (state.temporadaActiva) {
        const match = state.temporadaActiva.partidos.find((p: { id: string; status: string; homeScore: number; awayScore: number }) => p.id === matchId);
        if (match && match.status === 'finished') {
          console.log(`🏆 Found finished match:`, match);
          
          const actualResult = 
            match.homeScore > match.awayScore ? 'home' :
            match.awayScore > match.homeScore ? 'away' : 'draw';
          
          console.log(`🎯 Manual calculation: ${match.homeScore} vs ${match.awayScore} = ${actualResult}`);
          console.log(`🔍 Prediction vs Result: "${prediction.predictedWinner}" vs "${actualResult}"`);
          console.log(`⚡ Should be correct: ${prediction.predictedWinner === actualResult}`);
          
          // Force update the prediction
          this.updatePredictionResult(matchId, actualResult);
        } else {
          console.log(`❌ Match not found or not finished:`, match);
        }
      }
    }
  }
}

// Export singleton instance
export const predictionsService = new PredictionsService();

// Make debug function and service available globally
if (typeof window !== 'undefined') {
  (window as unknown as { debugPrediction: (matchId: string) => void }).debugPrediction = (matchId: string) => {
    predictionsService.debugPredictionForMatch(matchId);
  };
  
  // Expose predictionsService globally for debugging
  (window as unknown as { predictionsService: PredictionsService }).predictionsService = predictionsService;
  
  // Add comprehensive debug helper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).testPredictionFlow = (matchId: string) => {
    console.log(`🔧 TESTING FULL PREDICTION FLOW for match ${matchId}`);
    
    // Step 1: Check if prediction exists
    const prediction = predictionsService.getUserPrediction(matchId);
    if (!prediction) {
      console.log('❌ No prediction found. Creating one for testing...');
      predictionsService.createPrediction(matchId, 'home', 4);
    } else {
      console.log('✅ Existing prediction found:', prediction);
    }
    
    // Step 2: Check match status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).virtualTimeManager) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const timeManager = (window as any).virtualTimeManager;
      const state = timeManager.getState();
      
      if (state.temporadaActiva) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const match = state.temporadaActiva.partidos.find((p: any) => p.id === matchId);
        if (match) {
          console.log('🏆 Match found:', {
            id: match.id,
            status: match.status,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            finished: !!match.resultado
          });
        } else {
          console.log('❌ Match not found in current season');
        }
      }
    }
    
    // Step 3: Test manual evaluation
    console.log('🧪 Testing manual evaluation with "away" result...');
    predictionsService.updatePredictionResult(matchId, 'away');
    
    // Step 4: Check final state
    const finalPrediction = predictionsService.getUserPrediction(matchId);
    console.log('🎯 Final prediction state:', finalPrediction);
    
    return finalPrediction;
  };
}
