import { apiClient } from '../utils/apiClient';
import { Season } from '../types/league';

export interface LeagueTimeInfo {
  currentDate: string;
  activeSeason: Season | null;
  timeSpeed: number;
  autoMode: boolean;
  nextSeasonDate?: string;
  daysUntilNextSeason?: number;
}

export interface AdvanceTimeOptions {
  days?: number;
  hours?: number;
  toNextMatch?: boolean;
  simulateMatches?: boolean;
}

export interface AdvanceTimeResult {
  success: boolean;
  newDate: string;
  simulatedMatches: string[];
  message: string;
  seasonChanged?: boolean;
  newSeason?: Season;
}

export interface GenerateSeasonResult {
  success: boolean;
  season: Season;
  message: string;
}

/**
 * Service for league time management using backend API
 * Replaces all local time management logic
 */
export class LeagueTimeService {
  
  /**
   * Get comprehensive league time information
   */
  async getLeagueTimeInfo(): Promise<LeagueTimeInfo> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: LeagueTimeInfo;
        message: string;
      }>('/league-time');
      
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to get league time info');
      }
    } catch (error) {
      console.error('Error fetching league time info:', error);
      throw error;
    }
  }

  /**
   * Advance league time with automatic management
   */
  async advanceTime(options: AdvanceTimeOptions = {}): Promise<AdvanceTimeResult> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: AdvanceTimeResult;
        message: string;
      }>('/league-time/advance', options);
      
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to advance time');
      }
    } catch (error) {
      console.error('Error advancing league time:', error);
      throw error;
    }
  }

  /**
   * Generate a new season automatically
   */
  async generateNewSeason(): Promise<GenerateSeasonResult> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: GenerateSeasonResult;
        message: string;
      }>('/league-time/generate-season', {});
      
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to generate season');
      }
    } catch (error) {
      console.error('Error generating new season:', error);
      throw error;
    }
  }

  /**
   * Reset league time (for testing/development)
   */
  async resetTime(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
      }>('/league-time/reset', {});
      
      return response.data || { success: false, message: 'No response data' };
    } catch (error) {
      console.error('Error resetting league time:', error);
      throw error;
    }
  }

  /**
   * Set time speed multiplier
   */
  async setTimeSpeed(speed: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.put<{
        success: boolean;
        message: string;
      }>('/league-time/speed', { speed });
      
      return response.data || { success: false, message: 'No response data' };
    } catch (error) {
      console.error('Error setting time speed:', error);
      throw error;
    }
  }

  /**
   * Enable/disable auto mode
   */
  async setAutoMode(enabled: boolean): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.put<{
        success: boolean;
        message: string;
      }>('/league-time/auto-mode', { enabled });
      
      return response.data || { success: false, message: 'No response data' };
    } catch (error) {
      console.error('Error setting auto mode:', error);
      throw error;
    }
  }
}

// Singleton instance
export const leagueTimeService = new LeagueTimeService();
