/**
 * Script para probar la lógica exacta del componente TeamDetailPage
 * Simula el comportamiento del apiClient y la lógica de carga
 */

// Simulación del apiClient
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }
  
  async get(endpoint) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`🌐 Making request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if response already has ApiResponse structure
    if (data && typeof data === 'object' && 'success' in data) {
      return data;
    }
    
    // Otherwise, wrap in ApiResponse structure
    return {
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    };
  }
}

// Simulación de la lógica del componente TeamDetailPage
async function testTeamDetailPageLogic() {
  console.log('🔍 Testing TeamDetailPage logic...');
  
  const apiClient = new ApiClient('http://localhost:3001/api');
  const teamId = 'gryffindor';
  
  try {
    // Esta es la lógica exacta del componente
    const response = await apiClient.get(`/teams/${teamId}`);
    
    console.log('Response structure:', {
      success: response.success,
      hasData: !!response.data,
      dataType: typeof response.data
    });
    
    if (response.success && response.data) {
      const teamData = response.data;
      
      console.log('✅ Team data loaded successfully');
      console.log('Team data keys:', Object.keys(teamData));
      
      // Transform backend data to match frontend interface (como en el componente)
      const transformedTeam = {
        id: String(teamData.id || teamId),
        name: String(teamData.name || ''),
        slogan: String(teamData.slogan || 'A proud Quidditch team'),
        history: String(teamData.history || 'This team has a rich history in Quidditch.'),
        wins: Number(teamData.wins) || 0,
        losses: Number(teamData.losses) || 0,
        draws: Number(teamData.draws) || 0,
        titles: Number(teamData.titles) || 0,
        founded: Number(teamData.founded) || 1000,
        stadium: String(teamData.stadium || 'Unknown Stadium'),
        colors: Array.isArray(teamData.colors) ? teamData.colors.map(String) : ['Unknown'],
        achievements: Array.isArray(teamData.achievements) ? teamData.achievements.map(String) : [],
        
        // Transform roster data from backend
        roster: Array.isArray(teamData.roster) ? teamData.roster.map((player) => ({
          id: String(player.id || ''),
          name: String(player.name || ''),
          position: String(player.position || ''),
          number: Number(player.number) || 0,
          yearsActive: Number(player.yearsActive) || 0,
          achievements: Array.isArray(player.achievements) ? player.achievements.map(String) : []
        })) : []
      };
      
      console.log('✅ Team data transformed successfully');
      console.log('Transformed team:', {
        id: transformedTeam.id,
        name: transformedTeam.name,
        slogan: transformedTeam.slogan,
        rosterLength: transformedTeam.roster.length,
        wins: transformedTeam.wins,
        losses: transformedTeam.losses
      });
      
      return transformedTeam;
    } else {
      throw new Error('Team not found in backend');
    }
    
  } catch (error) {
    console.error('❌ Error in TeamDetailPage logic:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}

// Función para probar desde el navegador
if (typeof window !== 'undefined') {
  window.testTeamDetailPageLogic = testTeamDetailPageLogic;
}

// Función para probar desde Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testTeamDetailPageLogic };
}

// Auto-ejecutar si es llamado directamente
if (typeof window !== 'undefined') {
  console.log('🚀 Test script loaded. Call testTeamDetailPageLogic() to run the test.');
} else {
  // Node.js environment
  (async () => {
    try {
      const { default: fetch } = await import('node-fetch');
      global.fetch = fetch;
      
      await testTeamDetailPageLogic();
      console.log('🎉 Test completed successfully!');
    } catch (error) {
      console.error('💥 Test failed!', error);
      process.exit(1);
    }
  })();
}
