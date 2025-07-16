// Simple test script to verify the frontend API integration
const API_BASE = 'http://localhost:3001/api';

async function testTeamAPI() {
    try {
        console.log('Testing team API integration...');
        
        const response = await fetch(`${API_BASE}/teams/gryffindor`);
        const data = await response.json();
        
        console.log('Response status:', response.status);
        console.log('Response data:', data);
        
        if (data.success && data.data) {
            console.log('✅ API Response Structure:', {
                success: data.success,
                teamName: data.data.name,
                rosterCount: data.data.roster ? data.data.roster.length : 0,
                hasUpcomingMatches: data.data.upcomingMatches ? data.data.upcomingMatches.length : 0,
                hasRecentMatches: data.data.recentMatches ? data.data.recentMatches.length : 0,
                hasRivalries: data.data.rivalries ? data.data.rivalries.length : 0,
                hasHistoricalIdols: data.data.historicalIdols ? data.data.historicalIdols.length : 0
            });
            
            console.log('✅ API Integration Test PASSED');
        } else {
            console.log('❌ API Integration Test FAILED - No success field or data');
        }
        
    } catch (error) {
        console.error('❌ API Integration Test FAILED:', error);
    }
}

testTeamAPI();
