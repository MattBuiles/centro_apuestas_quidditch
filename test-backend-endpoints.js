/**
 * 🧪 Script de prueba para nuevos endpoints del backend
 * 
 * Ejecutar desde la raíz del proyecto con Node.js para probar
 * los endpoints del backend relacionados con análisis de equipos.
 */

const API_BASE = 'http://localhost:3001/api';

async function testBackendEndpoints() {
  console.log('🔍 TESTING BACKEND ENDPOINTS FOR TEAM ANALYSIS');
  console.log('==============================================');
  
  try {
    // 1. Test equipos básicos
    console.log('1️⃣ Testing basic teams endpoint...');
    const teamsResponse = await fetch(`${API_BASE}/teams`);
    const teamsData = await teamsResponse.json();
    
    if (teamsData.success && teamsData.data.length > 0) {
      console.log(`   ✅ Teams endpoint working - ${teamsData.data.length} teams found`);
      console.log(`   📋 Available teams:`, teamsData.data.map(t => t.name).slice(0, 5).join(', '));
      
      // Usar el primer equipo para las pruebas
      const firstTeam = teamsData.data[0];
      const secondTeam = teamsData.data[1] || teamsData.data[0];
      
      // 2. Test estadísticas de equipo específico
      console.log(`2️⃣ Testing team statistics for: ${firstTeam.name}...`);
      const teamStatsResponse = await fetch(`${API_BASE}/teams/${firstTeam.id}`);
      const teamStatsData = await teamStatsResponse.json();
      
      if (teamStatsData.success && teamStatsData.data) {
        console.log('   ✅ Team statistics endpoint working');
        console.log('   📊 Sample data:', {
          name: teamStatsData.data.name,
          matches_played: teamStatsData.data.matches_played,
          wins: teamStatsData.data.wins,
          win_percentage: teamStatsData.data.win_percentage,
          attack_strength: teamStatsData.data.attack_strength,
          defense_strength: teamStatsData.data.defense_strength
        });
      } else {
        console.error('   ❌ Team statistics endpoint failed:', teamStatsData);
      }
      
      // 3. Test head-to-head
      console.log(`3️⃣ Testing head-to-head: ${firstTeam.name} vs ${secondTeam.name}...`);
      const h2hResponse = await fetch(`${API_BASE}/teams/${firstTeam.id}/vs/${secondTeam.id}`);
      const h2hData = await h2hResponse.json();
      
      if (h2hResponse.ok && h2hData.success) {
        console.log('   ✅ Head-to-head endpoint working');
        console.log('   🆚 H2H data:', {
          totalMatches: h2hData.data.totalMatches,
          teamWins: h2hData.data.teamWins,
          opponentWins: h2hData.data.opponentWins,
          recentMatches: h2hData.data.recentMatches?.length || 0
        });
      } else {
        console.warn('   ⚠️ Head-to-head endpoint returned:', h2hResponse.status, h2hData);
      }
      
      // 4. Test nuevo endpoint de partidos recientes
      console.log(`4️⃣ Testing recent matches for: ${firstTeam.name}...`);
      const recentMatchesResponse = await fetch(`${API_BASE}/teams/${firstTeam.id}/recent-matches?limit=5`);
      const recentMatchesData = await recentMatchesResponse.json();
      
      if (recentMatchesResponse.ok && recentMatchesData.success) {
        console.log('   ✅ Recent matches endpoint working');
        console.log('   📅 Recent matches data:', {
          matchesFound: recentMatchesData.data?.length || 0,
          sampleMatch: recentMatchesData.data?.[0] ? {
            result: recentMatchesData.data[0].result,
            opponent: recentMatchesData.data[0].opponent,
            venue: recentMatchesData.data[0].venue,
            confidence: recentMatchesData.data[0].confidence
          } : 'No matches found'
        });
      } else {
        console.warn('   ⚠️ Recent matches endpoint returned:', recentMatchesResponse.status, recentMatchesData);
      }
      
      // 5. Resumen final
      console.log('5️⃣ ENDPOINTS SUMMARY');
      console.log('===================');
      console.log(`✅ Teams list: ${teamsResponse.ok ? 'Working' : 'Failed'}`);
      console.log(`✅ Team statistics: ${teamStatsResponse.ok ? 'Working' : 'Failed'}`);
      console.log(`✅ Head-to-head: ${h2hResponse.ok ? 'Working' : 'Failed'}`);
      console.log(`✅ Recent matches: ${recentMatchesResponse.ok ? 'Working' : 'Failed'}`);
      
      const allWorking = teamsResponse.ok && teamStatsResponse.ok && h2hResponse.ok && recentMatchesResponse.ok;
      
      if (allWorking) {
        console.log('🎉 ALL ENDPOINTS WORKING CORRECTLY!');
        console.log('🚀 Team analysis module ready for production');
      } else {
        console.warn('⚠️ Some endpoints need attention');
      }
      
    } else {
      console.error('   ❌ Teams endpoint failed or returned no data');
    }
    
  } catch (error) {
    console.error('❌ ERROR DURING BACKEND TESTING:', error.message);
    console.log('💡 Make sure the backend is running on http://localhost:3001');
  }
}

// Para Node.js
if (typeof module !== 'undefined' && module.exports) {
  // Simular fetch para Node.js si es necesario
  if (typeof fetch === 'undefined') {
    console.log('🔧 Installing node-fetch for testing...');
    const { default: fetch } = require('node-fetch');
    global.fetch = fetch;
  }
  
  module.exports = { testBackendEndpoints };
  
  // Ejecutar automáticamente si se llama directamente
  if (require.main === module) {
    testBackendEndpoints();
  }
}

// Para navegador
if (typeof window !== 'undefined') {
  window.testBackendEndpoints = testBackendEndpoints;
  console.log('🧪 Backend testing functions loaded');
  console.log('🚀 Run: testBackendEndpoints()');
}
