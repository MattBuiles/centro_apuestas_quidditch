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

export class PredictionsService {
  private readonly STORAGE_KEY = 'quidditch_predictions';
  private readonly MOCK_PREDICTIONS_KEY = 'quidditch_mock_predictions';
  
  constructor() {
    this.initializeMockPredictions();
  }

  /**
   * Create a prediction for a match
   */
  createPrediction(matchId: string, predictedWinner: 'home' | 'away' | 'draw', confidence: number = 3, predictedScore?: { home: number; away: number }): Prediction {
    const prediction: Prediction = {
      id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      matchId,
      userId: 'current_user', // In real app, get from auth context
      predictedWinner,
      predictedScore,
      confidence,
      timestamp: new Date()
    };

    this.savePrediction(prediction);
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
  }

  /**
   * Update prediction correctness after match ends
   */
  updatePredictionResult(matchId: string, actualResult: 'home' | 'away' | 'draw'): void {
    const prediction = this.getUserPrediction(matchId);
    if (prediction) {
      prediction.isCorrect = prediction.predictedWinner === actualResult;
      this.savePrediction(prediction);
    }
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
  }
  /**
   * Generate mock predictions for a specific match
   */
  private generateMockPredictionsForMatch(matchId: string): Prediction[] {
    const predictions: Prediction[] = [];
    const numPredictions = Math.floor(Math.random() * 50) + 20; // 20-70 predictions

    for (let i = 0; i < numPredictions; i++) {
      const weights = [0.4, 0.4, 0.2]; // Home slight favorite, draw less likely
      const randomValue = Math.random();
      
      let predictedWinner: 'home' | 'away' | 'draw';
      if (randomValue < weights[0]) {
        predictedWinner = 'home';
      } else if (randomValue < weights[0] + weights[1]) {
        predictedWinner = 'away';
      } else {
        predictedWinner = 'draw';
      }

      predictions.push({
        id: `mock_pred_${matchId}_${i}`,
        matchId,
        userId: `mock_user_${i}`,
        predictedWinner,
        confidence: Math.floor(Math.random() * 5) + 1,
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 7) // Last 7 days
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
}

// Export singleton instance
export const predictionsService = new PredictionsService();
