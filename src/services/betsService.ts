import { apiClient } from '../utils/apiClient';

export interface DailyBetsResponse {
  dailyCount: number;
  maxDaily: number;
  remaining: number;
  canBet: boolean;
  virtualDate: string;
}

export interface BetPlaceData {
  matchId: string;
  type: string;
  prediction: string;
  odds: number;
  amount: number;
}

export class BetsService {
  /**
   * Get user's daily bets count based on virtual time
   */
  static async getDailyBetsCount(): Promise<DailyBetsResponse> {
    try {
      console.log('🌐 Calling API for daily bets count...');
      const response = await apiClient.get<DailyBetsResponse>('/bets/daily-count');
      
      console.log('📨 API Response:', response);
      
      if (!response.success) {
        throw new Error(response.error || 'Error al obtener el conteo de apuestas diarias');
      }
      
      console.log('✅ Daily bets count data:', response.data);
      return response.data!;
    } catch (error) {
      console.error('❌ Error fetching daily bets count:', error);
      throw error;
    }
  }

  /**
   * Place a new bet
   */
  static async placeBet(betData: BetPlaceData): Promise<any> {
    try {
      const response = await apiClient.post('/bets', betData);
      
      if (!response.success) {
        throw new Error(response.error || 'Error al realizar la apuesta');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    }
  }

  /**
   * Get user's bet history
   */
  static async getUserBets(): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>('/bets');
      
      if (!response.success) {
        throw new Error(response.error || 'Error al obtener historial de apuestas');
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user bets:', error);
      throw error;
    }
  }
}
