// Simple test script for team loading issue
const API_BASE = 'http://localhost:3001/api';

async function testTeamGryffindor() {
  console.log('🔍 Testing Gryffindor team loading...');
  
  try {
    // Import fetch for Node.js
    const { default: fetch } = await import('node-fetch');
    
    // Test 1: Direct API call
    console.log('1️⃣ Testing direct API call...');
    const response = await fetch(`${API_BASE}/teams/gryffindor`);
    const data = await response.json();
    
    console.log('Response status:', response.status);
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
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testTeamGryffindor().catch(console.error);
