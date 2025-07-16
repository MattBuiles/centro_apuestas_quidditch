// Test script for team loading issue
const API_BASE = 'http://localhost:3001/api';

async function testTeamGryffindor() {
  console.log('🔍 Testing Gryffindor team loading...');
  
  try {
    // Test 1: Direct API call
    console.log('1️⃣ Testing direct API call...');
    const response = await fetch(`${API_BASE}/teams/gryffindor`);
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.get('content-type'));
    console.log('Response data structure:', {
      success: data.success,
      hasData: !!data.data,
      dataType: typeof data.data,
      dataKeys: data.data ? Object.keys(data.data) : []
    });
    
    if (data.success && data.data) {
      console.log('✅ API call successful');
      console.log('Team data:', {
        id: data.data.id,
        name: data.data.name,
        hasRoster: Array.isArray(data.data.roster),
        rosterLength: data.data.roster?.length || 0
      });
    } else {
      console.error('❌ API call failed:', data);
    }
    
    // Test 2: Check if team data structure is correct
    console.log('\n2️⃣ Checking team data structure...');
    if (data.success && data.data) {
      const team = data.data;
      console.log('Team properties:', Object.keys(team));
      console.log('Has required properties:', {
        id: !!team.id,
        name: !!team.name,
        roster: Array.isArray(team.roster),
        upcomingMatches: Array.isArray(team.upcomingMatches),
        recentMatches: Array.isArray(team.recentMatches),
        historicalIdols: Array.isArray(team.historicalIdols),
        rivalries: Array.isArray(team.rivalries)
      });
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// For Node.js execution
if (typeof module !== 'undefined' && module.exports) {
  // Import fetch for Node.js
  const { default: fetch } = await import('node-fetch');
  global.fetch = fetch;
  
  testTeamGryffindor().catch(console.error);
}

// For browser execution
if (typeof window !== 'undefined') {
  window.testTeamGryffindor = testTeamGryffindor;
}
