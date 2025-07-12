import { apiClient } from '../utils/apiClient';
import { Season, Standing } from '../types/league';
import { FEATURES } from '../config/features';

export interface SeasonSummary {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  currentMatchday: number;
  currentRound: number;
  totalMatchdays: number;
  status: 'not_started' | 'active' | 'finished';
  teamsCount: number;
  matchesCount: number;
  finishedMatches: number;
  scheduledMatches: number;
}

/**
 * Service for managing seasons and standings
 * Handles both backend and local fallback data
 */
export class SeasonsService {
  
  /**
   * Get all seasons (summaries)
   */
  async getAllSeasons(): Promise<SeasonSummary[]> {
    if (!FEATURES.USE_BACKEND_SEASONS) {
      return this.getLocalSeasons();
    }

    try {
      const response = await apiClient.get<SeasonSummary[]>('/seasons');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching seasons from backend:', error);
      console.warn('Falling back to local seasons data');
      return this.getLocalSeasons();
    }
  }

  /**
   * Get a specific season by ID with full details
   */
  async getSeasonById(id: string): Promise<Season | null> {
    if (!FEATURES.USE_BACKEND_SEASONS) {
      return this.getLocalSeasonById(id);
    }

    try {
      const response = await apiClient.get<Season>(`/seasons/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching season from backend:', error);
      console.warn('Falling back to local season data');
      return this.getLocalSeasonById(id);
    }
  }

  /**
   * Get the current active season
   */
  async getCurrentSeason(): Promise<Season | null> {
    if (!FEATURES.USE_BACKEND_SEASONS) {
      return this.getLocalCurrentSeason();
    }

    try {
      const response = await apiClient.get<Season>('/seasons/current');
      return response.data || null;
    } catch (error) {
      console.error('Error fetching current season from backend:', error);
      console.warn('Falling back to local current season data');
      return this.getLocalCurrentSeason();
    }
  }

  /**
   * Get standings for a specific season
   */
  async getSeasonStandings(seasonId: string): Promise<Standing[]> {
    if (!FEATURES.USE_BACKEND_SEASONS) {
      return this.getLocalSeasonStandings(seasonId);
    }

    try {
      const response = await apiClient.get<Standing[]>(`/seasons/${seasonId}/standings`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching season standings from backend:', error);
      console.warn('Falling back to local standings data');
      return this.getLocalSeasonStandings(seasonId);
    }
  }

  /**
   * Create a new season with default settings
   */
  async createDefaultSeason(): Promise<Season | null> {
    try {
      const response = await apiClient.post<Season>('/seasons/create-default', {});
      return response.data || null;
    } catch (error) {
      console.error('Error creating default season:', error);
      throw error;
    }
  }

  // ===== LOCAL FALLBACK METHODS =====

  /**
   * Get local seasons (fallback)
   */
  private getLocalSeasons(): SeasonSummary[] {
    return [
      {
        id: 'season-2025',
        name: 'Liga Profesional Quidditch 2025',
        year: 2025,
        startDate: '2025-07-01T00:00:00.000Z',
        endDate: '2026-05-31T23:59:59.999Z',
        currentMatchday: 1,
        currentRound: 1,
        totalMatchdays: 10,
        status: 'active',
        teamsCount: 6,
        matchesCount: 30,
        finishedMatches: 0,
        scheduledMatches: 30
      },
      {
        id: 'season-2024',
        name: 'Liga Profesional Quidditch 2024',
        year: 2024,
        startDate: '2024-07-01T00:00:00.000Z',
        endDate: '2025-05-31T23:59:59.999Z',
        currentMatchday: 10,
        currentRound: 2,
        totalMatchdays: 10,
        status: 'finished',
        teamsCount: 6,
        matchesCount: 30,
        finishedMatches: 30,
        scheduledMatches: 0
      }
    ];
  }

  /**
   * Get local season by ID (fallback)
   */
  private getLocalSeasonById(id: string): Season | null {
    // This would normally integrate with the virtual time manager
    // For now, return null to delegate to existing local systems
    console.warn(`Local season fallback for ID ${id} - delegating to existing systems`);
    return null;
  }

  /**
   * Get local current season (fallback)
   */
  private getLocalCurrentSeason(): Season | null {
    // This would normally integrate with the virtual time manager
    // For now, return null to delegate to existing local systems
    console.warn('Local current season fallback - delegating to existing systems');
    return null;
  }

  /**
   * Get local season standings (fallback)
   */
  private getLocalSeasonStandings(seasonId: string): Standing[] {
    console.warn(`Local standings fallback for season ${seasonId} - delegating to existing systems`);
    return [];
  }
}

// Export singleton instance
export const seasonsService = new SeasonsService();
