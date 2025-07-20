import { apiClient } from '../utils/apiClient';
import { FEATURES } from '../config/features';
import { authService } from './authService';

export interface Prediction {
  id: string;
  userId: string;
  userName: string;
  matchId: string;
  prediction: 'home' | 'away' | 'draw';
  confidence: number;
  points?: number;
  createdAt: Date;
  status?: 'pending' | 'correct' | 'incorrect';
}

export interface MatchPredictionStats {
  totalPredictions: number;
  homeWinPredictions: number;
  awayWinPredictions: number;
  drawPredictions: number;
  homeWinPercentage: number;
  awayWinPercentage: number;
  drawPercentage: number;
  userPrediction: Prediction | null;
  predictions: Prediction[];
}

export class PredictionsService {
  private readonly USER_PREDICTIONS_KEY = 'quidditch_user_predictions';

  constructor() {
    // Listen to match finish events to auto-consolidate predictions
    if (typeof window !== 'undefined') {
      window.addEventListener('matchFinished', this.handleMatchFinished.bind(this) as EventListener);
    }
  }

  /**
   * Submit a prediction for a match
   */
  async submitPrediction(
    matchId: string, 
    prediction: 'home' | 'away' | 'draw', 
    confidence: number
  ): Promise<boolean> {
    try {
      console.log('🎯 Attempting to submit prediction:', { matchId, prediction, confidence });
      
      // Ensure we're authenticated before making the request
      const isAuthenticated = await authService.ensureAuthenticated();
      if (!isAuthenticated) {
        console.error('❌ Failed to authenticate for predictions');
        // Fallback to local storage
        this.storeUserPredictionLocally(matchId, prediction, confidence);
        return true;
      }

      console.log('✅ Authentication successful, submitting prediction to backend...');
      const response = await apiClient.post('/predictions', {
        matchId,
        prediction,
        confidence
      }) as { success?: boolean; data?: Record<string, unknown> };

      console.log('🎯 Backend prediction response:', response);

      // Check if the response indicates success
      // The backend returns success at the top level, not nested under data
      if (response.success) {
        console.log('✅ Prediction submitted successfully to backend');
        // Also store locally as backup
        this.storeUserPredictionLocally(matchId, prediction, confidence);
        return true;
      } else {
        console.error('❌ Backend returned failure:', response);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to submit prediction to backend, storing locally:', error);
      // Fallback to local storage
      this.storeUserPredictionLocally(matchId, prediction, confidence);
      return true;
    }
  }

  /**
   * Get user's prediction for a specific match
   */
  async getUserPrediction(matchId: string): Promise<Prediction | null> {
    try {
      // Ensure we're authenticated before making the request
      const isAuthenticated = await authService.ensureAuthenticated();
      if (!isAuthenticated) {
        console.warn('Not authenticated, no predictions available');
        return null; // Don't use local storage if not authenticated
      }

      const response = await apiClient.get(`/predictions/match/${matchId}`) as {
        success?: boolean; 
        data?: Record<string, unknown> | null;
      };

      if (response.success && response.data) {
        console.log('✅ Found user prediction for match:', matchId);
        console.log('📊 Raw backend data:', response.data);
        const predictionData = response.data;
        const transformedPrediction = this.transformBackendPrediction(predictionData);
        console.log('🔄 Transformed prediction:', transformedPrediction);
        return transformedPrediction;
      }
      
      console.log('ℹ️ No prediction found for match:', matchId);
      return null;
    } catch (error) {
      console.warn('Failed to get prediction from backend:', error);
      // Only use local storage as last resort and only if we have a real prediction
      const localPrediction = this.getUserPredictionLocally(matchId);
      if (localPrediction) {
        console.log('📱 Using local prediction for match:', matchId);
        return localPrediction;
      }
      return null;
    }
  }

  /**
   * Get all predictions for a match with statistics
   */
  async getMatchPredictionStats(matchId: string): Promise<MatchPredictionStats> {
    try {
      // Get user's own prediction
      const userPrediction = await this.getUserPrediction(matchId);
      
      console.log(`📊 Getting stats for match ${matchId}:`, {
        hasUserPrediction: !!userPrediction,
        userPrediction: userPrediction?.prediction || 'none'
      });
      
      // Get community prediction statistics from backend
      try {
        const response = await apiClient.get(`/predictions/match/${matchId}/stats`) as {
          success?: boolean;
          data?: {
            totalPredictions: number;
            homeWinPredictions: number;
            awayWinPredictions: number;
            drawPredictions: number;
            homeWinPercentage: number;
            awayWinPercentage: number;
            drawPercentage: number;
            averageConfidence: number;
          };
        };

        if (response.success && response.data) {
          console.log('📊 Community prediction stats from backend:', response.data);
          return {
            totalPredictions: response.data.totalPredictions,
            homeWinPredictions: response.data.homeWinPredictions,
            awayWinPredictions: response.data.awayWinPredictions,
            drawPredictions: response.data.drawPredictions,
            homeWinPercentage: response.data.homeWinPercentage,
            awayWinPercentage: response.data.awayWinPercentage,
            drawPercentage: response.data.drawPercentage,
            userPrediction,
            predictions: [] // We don't need individual predictions for stats display
          };
        }
      } catch (error) {
        console.warn('Failed to get community stats from backend:', error);
      }
      
      // Fallback: Return stats based only on user prediction if backend fails
      const stats: MatchPredictionStats = {
        totalPredictions: userPrediction ? 1 : 0,
        homeWinPredictions: userPrediction?.prediction === 'home' ? 1 : 0,
        awayWinPredictions: userPrediction?.prediction === 'away' ? 1 : 0,
        drawPredictions: userPrediction?.prediction === 'draw' ? 1 : 0,
        homeWinPercentage: userPrediction?.prediction === 'home' ? 100 : 0,
        awayWinPercentage: userPrediction?.prediction === 'away' ? 100 : 0,
        drawPercentage: userPrediction?.prediction === 'draw' ? 100 : 0,
        userPrediction,
        predictions: userPrediction ? [userPrediction] : []
      };

      return stats;
    } catch (error) {
      console.error('Failed to get match prediction stats:', error);
      // Return empty stats
      return {
        totalPredictions: 0,
        homeWinPredictions: 0,
        awayWinPredictions: 0,
        drawPredictions: 0,
        homeWinPercentage: 0,
        awayWinPercentage: 0,
        drawPercentage: 0,
        userPrediction: null,
        predictions: []
      };
    }
  }

  /**
   * Get all user predictions
   */
  async getAllUserPredictions(): Promise<Prediction[]> {
    try {
      const response = await apiClient.get('/predictions') as {
        data?: { success?: boolean; data?: unknown[] }
      };

      if (response.data?.success && response.data?.data) {
        return response.data.data.map((pred: unknown) => 
          this.transformBackendPrediction(pred as Record<string, unknown>)
        );
      }
      
      return [];
    } catch (error) {
      console.warn('Failed to get predictions from backend, checking local storage:', error);
      // Fallback to local storage
      return this.getAllUserPredictionsLocally();
    }
  }

  /**
   * Transform backend prediction data to frontend format
   */
  private transformBackendPrediction(data: Record<string, unknown>): Prediction {
    console.log('🔄 Transforming backend prediction data:', data);
    
    const dateValue = data.created_at || data.createdAt;
    const parsedDate = typeof dateValue === 'string' || typeof dateValue === 'number' 
      ? new Date(dateValue) 
      : new Date();
    
    const prediction = (data.prediction as 'home' | 'away' | 'draw') || 'home';
    console.log('📊 Prediction value from backend:', {
      original: data.prediction,
      transformed: prediction
    });
      
    const result = {
      id: String(data.id || ''),
      userId: String(data.user_id || data.userId || ''),
      userName: String(data.username || data.userName || 'Unknown'),
      matchId: String(data.match_id || data.matchId || ''),
      prediction: prediction,
      confidence: Number(data.confidence) || 3,
      points: Number(data.points) || 0,
      createdAt: parsedDate,
      status: (data.status as 'pending' | 'correct' | 'incorrect') || 'pending'
    };
    
    console.log('✅ Transformed prediction:', result);
    return result;
  }

  /**
   * Store prediction locally as backup
   */
  private storeUserPredictionLocally(
    matchId: string, 
    prediction: 'home' | 'away' | 'draw', 
    confidence: number
  ): void {
    try {
      console.log('💾 Storing prediction locally:', { matchId, prediction, confidence });
      
      const newPrediction: Prediction = {
        id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'current_user',
        userName: 'Current User',
        matchId,
        prediction,
        confidence,
        createdAt: new Date(),
        status: 'pending'
      };

      console.log('📝 Created prediction object:', newPrediction);

      const predictions = this.getAllUserPredictionsLocally();
      // Remove existing prediction for this match
      const filteredPredictions = predictions.filter(p => p.matchId !== matchId);
      filteredPredictions.push(newPrediction);
      
      localStorage.setItem(this.USER_PREDICTIONS_KEY, JSON.stringify(filteredPredictions));
      console.log('✅ Prediction stored in localStorage');
    } catch (error) {
      console.error('Error storing prediction locally:', error);
    }
  }

  /**
   * Get user prediction from local storage
   */
  private getUserPredictionLocally(matchId: string): Prediction | null {
    try {
      const predictions = this.getAllUserPredictionsLocally();
      return predictions.find(p => p.matchId === matchId) || null;
    } catch (error) {
      console.error('Error getting prediction locally:', error);
      return null;
    }
  }

  /**
   * Get all user predictions from local storage
   */
  private getAllUserPredictionsLocally(): Prediction[] {
    try {
      const stored = localStorage.getItem(this.USER_PREDICTIONS_KEY);
      if (!stored) return [];
      
      const predictions = JSON.parse(stored);
      // Convert date strings back to Date objects
      return predictions.map((p: Prediction) => ({
        ...p,
        createdAt: new Date(p.createdAt)
      }));
    } catch (error) {
      console.error('Error getting all predictions locally:', error);
      return [];
    }
  }

  /**
   * Handle automatic prediction consolidation when a match finishes
   */
  private async handleMatchFinished(event: Event): Promise<void> {
    const customEvent = event as CustomEvent;
    const { matchId, homeScore, awayScore } = customEvent.detail;
    
    try {
      const actualResult = this.calculateMatchResult(homeScore, awayScore);
      await this.consolidatePrediction(matchId, actualResult);
      
      console.log(`🔮 Auto-consolidated prediction for match ${matchId}: ${actualResult}`);
    } catch (error) {
      console.error('Error auto-consolidating prediction:', error);
    }
  }

  /**
   * Calculate match result from scores
   */
  private calculateMatchResult(homeScore: number, awayScore: number): 'home' | 'away' | 'draw' {
    if (homeScore > awayScore) return 'home';
    if (awayScore > homeScore) return 'away';
    return 'draw';
  }

  /**
   * Consolidate a prediction after match completion
   */
  async consolidatePrediction(matchId: string, actualResult: 'home' | 'away' | 'draw'): Promise<void> {
    try {
      const userPrediction = await this.getUserPrediction(matchId);
      
      if (!userPrediction) {
        console.log(`No prediction found for match ${matchId} to consolidate`);
        return;
      }

      const isCorrect = userPrediction.prediction === actualResult;
      const points = this.calculatePredictionPoints(userPrediction.confidence, isCorrect);

      // Update prediction with result
      const updatedPrediction: Prediction = {
        ...userPrediction,
        status: isCorrect ? 'correct' : 'incorrect',
        points
      };

      // Save updated prediction
      await this.updatePredictionResult(updatedPrediction);
      
      // Emit consolidation event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('predictionConsolidated', {
          detail: { 
            matchId, 
            prediction: updatedPrediction, 
            actualResult,
            isCorrect,
            points
          }
        }));
      }

      console.log(`✅ Prediction consolidated for match ${matchId}: ${isCorrect ? 'CORRECT' : 'INCORRECT'} (+${points} points)`);
    } catch (error) {
      console.error('Error consolidating prediction:', error);
    }
  }

  /**
   * Calculate points earned from a prediction
   */
  private calculatePredictionPoints(confidence: number, isCorrect: boolean): number {
    if (!isCorrect) return 0;
    
    // Base points for correct prediction
    const basePoints = 10;
    // Bonus points based on confidence (1-5 scale)
    const confidenceBonus = confidence * 2;
    
    return basePoints + confidenceBonus;
  }

  /**
   * Update prediction result in storage
   */
  private async updatePredictionResult(updatedPrediction: Prediction): Promise<void> {
    try {
      // Try to update in backend first
      if (FEATURES.USE_BACKEND_PREDICTIONS) {
        await apiClient.put(`/predictions/${updatedPrediction.id}`, {
          status: updatedPrediction.status,
          points: updatedPrediction.points
        });
      }
    } catch (error) {
      console.warn('Failed to update prediction in backend, updating locally:', error);
    }
    
    // Always update locally as backup
    this.updatePredictionLocally(updatedPrediction);
  }

  /**
   * Update prediction in local storage
   */
  private updatePredictionLocally(updatedPrediction: Prediction): void {
    try {
      const predictions = this.getAllUserPredictionsLocally();
      const index = predictions.findIndex(p => p.id === updatedPrediction.id);
      
      if (index >= 0) {
        predictions[index] = updatedPrediction;
        localStorage.setItem(this.USER_PREDICTIONS_KEY, JSON.stringify(predictions));
      }
    } catch (error) {
      console.error('Error updating prediction locally:', error);
    }
  }

  /**
   * Get user prediction statistics
   */
  async getUserStats(): Promise<{
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    totalPoints: number;
    pendingPredictions: number;
  }> {
    try {
      const predictions = await this.getAllUserPredictions();
      const finishedPredictions = predictions.filter(p => p.status && p.status !== 'pending');
      const correctPredictions = finishedPredictions.filter(p => p.status === 'correct');
      const totalPoints = predictions.reduce((sum, p) => sum + (p.points || 0), 0);
      const pendingPredictions = predictions.filter(p => !p.status || p.status === 'pending');

      return {
        totalPredictions: predictions.length,
        correctPredictions: correctPredictions.length,
        accuracy: finishedPredictions.length > 0 ? (correctPredictions.length / finishedPredictions.length) * 100 : 0,
        totalPoints,
        pendingPredictions: pendingPredictions.length
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        totalPoints: 0,
        pendingPredictions: 0
      };
    }
  }

  /**
   * Clear all local predictions (for debugging)
   */
  clearAllLocalPredictions(): void {
    try {
      localStorage.removeItem(this.USER_PREDICTIONS_KEY);
      console.log('🧹 All local predictions cleared');
    } catch (error) {
      console.error('Error clearing local predictions:', error);
    }
  }
}

// Export singleton instance
export const predictionsService = new PredictionsService();
