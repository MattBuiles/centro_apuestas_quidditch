import { Match } from '../types/match'; // Assuming a Match type is defined

const API_BASE_URL = '/api'; // Adjust this base URL as needed

export const getMatches = async (): Promise<Match[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/matches`);

    if (!response.ok) {
      throw new Error(`Failed to fetch matches: ${response.statusText}`);
    }

    const data: Match[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching matches:', error);
    throw error; // Re-throw to be handled by the component
  }
};

export const getMatchDetails = async (matchId: string): Promise<Match> => {
  try {
    const response = await fetch(`${API_BASE_URL}/matches/${matchId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch match details for ID ${matchId}: ${response.statusText}`);
    }

    const data: Match = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching match details for ID ${matchId}:`, error);
    throw error; // Re-throw to be handled by the component
  }
};
