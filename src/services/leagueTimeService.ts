import { apiClient } from '../utils/apiClient';
import { Season, Match } from '../types/league';
import { FEATURES } from '../config/features';

// Helper function to check if backend authentication is available
const isBackendAuthAvailable = (): boolean => {
  // En desarrollo, permitir acceso sin autenticación
  if (import.meta.env.DEV) {
    return true;
  }
  
  return FEATURES.USE_BACKEND_AUTH && 
         !sessionStorage.getItem('auth_fallback') &&
         !!localStorage.getItem('auth_token') || !!sessionStorage.getItem('auth_token');
};

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
  season?: Season;
  message: string;
}

export interface ResetDatabaseResult {
  message: string;
  newSeason: Season;
  virtualTime: {
    currentDate: string;
    activeSeason: Season | null;
    timeSpeed: 'slow' | 'medium' | 'fast';
    autoMode: boolean;
    lastUpdate: string;
  };
  stats: {
    teamsCreated: number;
    matchesGenerated: number;
    seasonCreated: string;
  };
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
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthAvailable()) {
      throw new Error('Backend league time service not available or not authenticated');
    }

    try {
      const response = await apiClient.get<LeagueTimeInfo>('/league-time');
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || response.error || 'Failed to get league time info');
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
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthAvailable()) {
      throw new Error('Backend league time service not available or not authenticated');
    }

    try {
      const response = await apiClient.post<AdvanceTimeResult>('/league-time/advance', options);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || response.error || 'Failed to advance time');
      }
    } catch (error) {
      console.error('Error advancing league time:', error);
      throw error;
    }
  }

  /**
   * Simulate all matches up to a certain time with complete event simulation
   */
  async simulateCompleteMatches(targetTime?: string): Promise<AdvanceTimeResult> {
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthAvailable()) {
      throw new Error('Backend league time service not available or not authenticated');
    }

    try {
      const response = await apiClient.post<AdvanceTimeResult>('/league-time/advance', {
        days: 0, // Don't advance time unless specified
        simulateMatches: true,
        targetTime: targetTime
      });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || response.error || 'Failed to simulate matches');
      }
    } catch (error) {
      console.error('Error simulating matches:', error);
      throw error;
    }
  }

  /**
   * Simulate complete season (advance to end and simulate all matches)
   */
  async simulateCompleteSeason(): Promise<AdvanceTimeResult> {
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthAvailable()) {
      throw new Error('Backend league time service not available or not authenticated');
    }

    try {
      const response = await apiClient.post<AdvanceTimeResult>('/league-time/advance', {
        days: 365, // Advance a full year to ensure all matches are covered
        simulateMatches: true
      });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || response.error || 'Failed to simulate complete season');
      }
    } catch (error) {
      console.error('Error simulating complete season:', error);
      throw error;
    }
  }

  /**
   * Generate a new season automatically
   */
  async generateNewSeason(): Promise<GenerateSeasonResult> {
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthAvailable()) {
      throw new Error('Backend league time service not available or not authenticated');
    }

    try {
      const response = await apiClient.post<Season>('/league-time/generate-season', {});
      
      if (response.success) {
        // Return the response with proper structure
        return {
          success: response.data ? true : false,
          season: response.data,
          message: response.message || (response.data ? 'Season generated successfully' : 'No new season needed at this time')
        };
      } else {
        throw new Error(response.message || response.error || 'Failed to generate season');
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
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthAvailable()) {
      throw new Error('Backend league time service not available or not authenticated');
    }

    try {
      const response = await apiClient.post<{ success: boolean; message: string }>('/league-time/reset', {});
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return { success: false, message: response.message || response.error || 'Failed to reset time' };
      }
    } catch (error) {
      console.error('Error resetting league time:', error);
      throw error;
    }
  }

  /**
   * Set time speed multiplier
   */
  async setTimeSpeed(speed: number): Promise<{ success: boolean; message: string }> {
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthAvailable()) {
      throw new Error('Backend league time service not available or not authenticated');
    }

    try {
      const response = await apiClient.put<{ success: boolean; message: string }>('/league-time/speed', { speed });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return { success: false, message: response.message || response.error || 'Failed to set time speed' };
      }
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
      const response = await apiClient.put<{ success: boolean; message: string }>('/league-time/auto-mode', { enabled });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return { success: false, message: response.message || response.error || 'Failed to set auto mode' };
      }
    } catch (error) {
      console.error('Error setting auto mode:', error);
      throw error;
    }
  }

  /**
   * Advance time to next unplayed match
   */
  async advanceToNextUnplayedMatch(): Promise<AdvanceTimeResult> {
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthAvailable()) {
      throw new Error('Backend league time service not available or not authenticated');
    }

    try {
      const response = await apiClient.post<AdvanceTimeResult>('/league-time/advance-to-next-match', {});
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || response.error || 'Failed to advance to next match');
      }
    } catch (error) {
      console.error('Error advancing to next unplayed match:', error);
      throw error;
    }
  }

  /**
   * Reset database for a new season
   */
  async resetDatabaseForNewSeason(complete: boolean = false): Promise<ResetDatabaseResult> {
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthAvailable()) {
      throw new Error('Backend league time service not available or not authenticated');
    }

    try {
      const response = await apiClient.post<ResetDatabaseResult>('/admin/reset-database', { complete });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || response.error || 'Failed to reset database');
      }
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }

  /**
   * Mark a specific match as live
   */
  async markMatchAsLive(matchId: string): Promise<{ success: boolean; message: string; match?: Match }> {
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthAvailable()) {
      throw new Error('Backend league time service not available or not authenticated');
    }

    try {
      const response = await apiClient.put<Match>(`/matches/${matchId}/mark-live`, {});
      
      if (response.success && response.data) {
        return {
          success: true,
          message: 'Match marked as live successfully',
          match: response.data
        };
      } else {
        throw new Error(response.message || response.error || 'Failed to mark match as live');
      }
    } catch (error) {
      console.error('Error marking match as live:', error);
      throw error;
    }
  }
}

// Singleton instance
export const leagueTimeService = new LeagueTimeService();
