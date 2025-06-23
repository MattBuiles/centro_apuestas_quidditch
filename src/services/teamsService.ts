// my-quidditch-betting-app/src/services/teamsService.ts

interface Team {
  id: string;
  name: string;
  // Add other team properties here as expected from the API
}

interface TeamDetails extends Team {
  players: string[]; // Example detail
  // Add more detailed team properties here
}

export const getTeams = async (): Promise<Team[]> => {
  try {
    const response = await fetch('/api/teams'); // Replace with your actual API endpoint
    if (!response.ok) {
      throw new Error(`Error fetching teams: ${response.statusText}`);
    }
    const data = await response.json();
    // Basic validation if needed, e.g., check if data is an array
    return data as Team[];
  } catch (error) {
    console.error('Error in getTeams:', error);
    throw error; // Re-throw to allow components to catch
  }
};

export const getTeamDetails = async (teamId: string): Promise<TeamDetails> => {
  try {
    const response = await fetch(`/api/teams/${teamId}`); // Replace with your actual API endpoint
    if (!response.ok) {
      throw new Error(`Error fetching team details for ID ${teamId}: ${response.statusText}`);
    }
    const data = await response.json();
    // Basic validation if needed
    return data as TeamDetails;
  } catch (error) {
    console.error(`Error in getTeamDetails for ID ${teamId}:`, error);
    throw error; // Re-throw to allow components to catch
  }
};