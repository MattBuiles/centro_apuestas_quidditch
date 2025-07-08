import { apiClient } from '../utils/apiClient';

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
    // Initialize service
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
      const response = await apiClient.post('/predictions', {
        matchId,
        prediction,
        confidence
      }) as { data?: { success?: boolean } };

      if (response.data?.success) {
        // Also store locally as backup
        this.storeUserPredictionLocally(matchId, prediction, confidence);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to submit prediction to backend, storing locally:', error);
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
      const response = await apiClient.get(`/predictions/match/${matchId}`) as {
        data?: { success?: boolean; data?: Record<string, unknown> | null }
      };

      if (response.data?.success && response.data?.data) {
        const predictionData = response.data.data;
        return this.transformBackendPrediction(predictionData);
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to get prediction from backend, checking local storage:', error);
      // Fallback to local storage
      return this.getUserPredictionLocally(matchId);
    }
  }

  /**
   * Get all predictions for a match with statistics
   */
  async getMatchPredictionStats(matchId: string): Promise<MatchPredictionStats> {
    try {
      // Get user's own prediction
      const userPrediction = await this.getUserPrediction(matchId);
      
      // For now, since we don't have a public endpoint for all match predictions,
      // we'll generate some basic stats based on the user prediction
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
    const dateValue = data.created_at || data.createdAt;
    const parsedDate = typeof dateValue === 'string' || typeof dateValue === 'number' 
      ? new Date(dateValue) 
      : new Date();
      
    return {
      id: String(data.id || ''),
      userId: String(data.user_id || data.userId || ''),
      userName: String(data.username || data.userName || 'Unknown'),
      matchId: String(data.match_id || data.matchId || ''),
      prediction: (data.prediction as 'home' | 'away' | 'draw') || 'home',
      confidence: Number(data.confidence) || 3,
      points: Number(data.points) || 0,
      createdAt: parsedDate,
      status: (data.status as 'pending' | 'correct' | 'incorrect') || 'pending'
    };
  }

  /**
   * Store prediction locally as backup
   */
  private storeUserPredictionLocally(
    matchId: string, 
    prediction: 'home' | 'away' | 'draw', 
    confidence: number
  ): void {
    const predictions = this.getAllUserPredictionsLocally();
    
    // Remove existing prediction for this match
    const filteredPredictions = predictions.filter(p => p.matchId !== matchId);
    
    // Add new prediction
    const newPrediction: Prediction = {
      id: `local_${Date.now()}`,
      userId: 'local_user',
      userName: 'Local User',
      matchId,
      prediction,
      confidence,
      createdAt: new Date(),
      status: 'pending'
    };
    
    filteredPredictions.push(newPrediction);
    localStorage.setItem(this.USER_PREDICTIONS_KEY, JSON.stringify(filteredPredictions));
  }

  /**
   * Get user prediction from local storage
   */
  private getUserPredictionLocally(matchId: string): Prediction | null {
    const predictions = this.getAllUserPredictionsLocally();
    return predictions.find(p => p.matchId === matchId) || null;
  }

  /**
   * Get all user predictions from local storage
   */
  private getAllUserPredictionsLocally(): Prediction[] {
    try {
      const stored = localStorage.getItem(this.USER_PREDICTIONS_KEY);
      if (stored) {
        const predictions = JSON.parse(stored);
        return Array.isArray(predictions) ? predictions.map((p: unknown) => {
          const predObj = p as Record<string, unknown>;
          const dateValue = predObj.createdAt;
          const parsedDate = typeof dateValue === 'string' || typeof dateValue === 'number' 
            ? new Date(dateValue) 
            : new Date();
            
          return {
            ...predObj,
            createdAt: parsedDate
          } as Prediction;
        }) : [];
      }
      return [];
    } catch (error) {
      console.error('Error parsing local predictions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const predictionsService = new PredictionsService();
