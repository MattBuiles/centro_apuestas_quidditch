import { leagueTimeService, AdvanceTimeOptions, AdvanceTimeResult, GenerateSeasonResult, ResetDatabaseResult } from './leagueTimeService';

/**
 * Enhanced LeagueTimeService that automatically triggers UI refresh after actions
 * This ensures the frontend always reflects the latest virtual time state
 */
export class LeagueTimeServiceWithRefresh {
  private refreshCallbacks: Array<() => Promise<void>> = [];

  /**
   * Register a callback to be called after any time-changing action
   */
  public registerRefreshCallback(callback: () => Promise<void>): void {
    this.refreshCallbacks.push(callback);
  }

  /**
   * Unregister a refresh callback
   */
  public unregisterRefreshCallback(callback: () => Promise<void>): void {
    const index = this.refreshCallbacks.indexOf(callback);
    if (index > -1) {
      this.refreshCallbacks.splice(index, 1);
    }
  }

  /**
   * Trigger all registered refresh callbacks
   */
  private async triggerRefresh(): Promise<void> {
    console.log('🔄 Triggering automatic refresh after time action...');
    await Promise.all(this.refreshCallbacks.map(callback => 
      callback().catch(error => console.error('Refresh callback error:', error))
    ));
  }

  /**
   * Get league time info (passthrough)
   */
  async getLeagueTimeInfo() {
    return leagueTimeService.getLeagueTimeInfo();
  }

  /**
   * Advance time with automatic refresh
   */
  async advanceTime(options: AdvanceTimeOptions = {}): Promise<AdvanceTimeResult> {
    console.log('⏰ Advancing time with automatic refresh...', options);
    
    try {
      const result = await leagueTimeService.advanceTime(options);
      
      // Trigger refresh after successful advance
      await this.triggerRefresh();
      
      console.log('✅ Time advanced and UI refreshed');
      return result;
    } catch (error) {
      console.error('❌ Error advancing time:', error);
      throw error;
    }
  }

  /**
   * Generate new season with automatic refresh
   */
  async generateNewSeason(): Promise<GenerateSeasonResult> {
    console.log('🏆 Generating new season with automatic refresh...');
    
    try {
      const result = await leagueTimeService.generateNewSeason();
      
      // Trigger refresh after successful generation
      await this.triggerRefresh();
      
      console.log('✅ Season generated and UI refreshed');
      return result;
    } catch (error) {
      console.error('❌ Error generating season:', error);
      throw error;
    }
  }

  /**
   * Reset time with automatic refresh
   */
  async resetTime(): Promise<{ success: boolean; message: string }> {
    console.log('🔄 Resetting time with automatic refresh...');
    
    try {
      const result = await leagueTimeService.resetTime();
      
      // Trigger refresh after successful reset
      await this.triggerRefresh();
      
      console.log('✅ Time reset and UI refreshed');
      return result;
    } catch (error) {
      console.error('❌ Error resetting time:', error);
      throw error;
    }
  }

  /**
   * Set time speed with automatic refresh
   */
  async setTimeSpeed(speed: number): Promise<{ success: boolean; message: string }> {
    console.log('⚡ Setting time speed with automatic refresh...', speed);
    
    try {
      const result = await leagueTimeService.setTimeSpeed(speed);
      
      // Trigger refresh after successful speed change
      await this.triggerRefresh();
      
      console.log('✅ Time speed set and UI refreshed');
      return result;
    } catch (error) {
      console.error('❌ Error setting time speed:', error);
      throw error;
    }
  }

  /**
   * Set auto mode with automatic refresh
   */
  async setAutoMode(enabled: boolean): Promise<{ success: boolean; message: string }> {
    console.log('🤖 Setting auto mode with automatic refresh...', enabled);
    
    try {
      const result = await leagueTimeService.setAutoMode(enabled);
      
      // Trigger refresh after successful auto mode change
      await this.triggerRefresh();
      
      console.log('✅ Auto mode set and UI refreshed');
      return result;
    } catch (error) {
      console.error('❌ Error setting auto mode:', error);
      throw error;
    }
  }

  /**
   * Advance time to next unplayed match with automatic refresh
   */
  async advanceToNextUnplayedMatch(): Promise<AdvanceTimeResult> {
    console.log('⚽ Advancing to next unplayed match with automatic refresh...');
    
    try {
      const result = await leagueTimeService.advanceToNextUnplayedMatch();
      
      // Trigger refresh after successful advance
      await this.triggerRefresh();
      
      console.log('✅ Advanced to next match and UI refreshed');
      return result;
    } catch (error) {
      console.error('❌ Error advancing to next match:', error);
      throw error;
    }
  }

  /**
   * Simulate complete matches with automatic refresh
   */
  async simulateCompleteMatches(targetTime?: string): Promise<AdvanceTimeResult> {
    console.log('🎮 Simulating complete matches with automatic refresh...');
    
    try {
      const result = await leagueTimeService.simulateCompleteMatches(targetTime);
      
      // Trigger refresh after successful simulation
      await this.triggerRefresh();
      
      console.log('✅ Matches simulated and UI refreshed');
      return result;
    } catch (error) {
      console.error('❌ Error simulating matches:', error);
      throw error;
    }
  }

  /**
   * Simulate complete season with automatic refresh
   */
  async simulateCompleteSeason(): Promise<AdvanceTimeResult> {
    console.log('🏆 Simulating complete season with automatic refresh...');
    
    try {
      const result = await leagueTimeService.simulateCompleteSeason();
      
      // Trigger refresh after successful simulation
      await this.triggerRefresh();
      
      console.log('✅ Season simulated and UI refreshed');
      return result;
    } catch (error) {
      console.error('❌ Error simulating season:', error);
      throw error;
    }
  }

  /**
   * Reset database for new season with automatic refresh
   */
  async resetDatabaseForNewSeason(complete: boolean = false): Promise<ResetDatabaseResult> {
    console.log('🔄 Resetting database for new season with automatic refresh...');
    
    try {
      const result = await leagueTimeService.resetDatabaseForNewSeason(complete);
      
      // Trigger refresh after successful reset
      await this.triggerRefresh();
      
      console.log('✅ Database reset and UI refreshed');
      return result;
    } catch (error) {
      console.error('❌ Error resetting database:', error);
      throw error;
    }
  }

  /**
   * Mark a match as live with automatic refresh
   */
  async markMatchAsLive(matchId: string): Promise<{ success: boolean; message: string; match?: unknown }> {
    console.log('⚽ Marking match as live with automatic refresh...', matchId);
    
    try {
      const result = await leagueTimeService.markMatchAsLive(matchId);
      
      // Trigger refresh after successful action
      await this.triggerRefresh();
      
      console.log('✅ Match marked as live and UI refreshed');
      return result;
    } catch (error) {
      console.error('❌ Error marking match as live:', error);
      throw error;
    }
  }
}

// Singleton instance
export const leagueTimeServiceWithRefresh = new LeagueTimeServiceWithRefresh();
