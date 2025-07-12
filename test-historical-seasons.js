// Prueba del sistema de archivado de temporadas históricas

console.log('🧪 Testing Historical Seasons System...');

// Test 1: Verificar endpoints de temporadas históricas
async function testHistoricalSeasonsEndpoints() {
  try {
    console.log('\n📡 Testing Historical Seasons Endpoints...');
    
    // Probar obtener todas las temporadas históricas
    const historicalResponse = await fetch('http://localhost:3001/api/seasons/historical');
    const historicalData = await historicalResponse.json();
    
    console.log('✅ GET /api/seasons/historical:', historicalData.success);
    console.log(`   - Historical seasons found: ${historicalData.data?.length || 0}`);
    
    if (historicalData.data?.length > 0) {
      const firstHistorical = historicalData.data[0];
      console.log(`   - First historical season: ${firstHistorical.name}`);
      console.log(`   - Champion: ${firstHistorical.championTeamName || 'N/A'}`);
      console.log(`   - Matches: ${firstHistorical.totalMatches}`);
      console.log(`   - Teams: ${firstHistorical.totalTeams}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing historical seasons endpoints:', error.message);
  }
}

// Test 2: Verificar estado actual de temporadas
async function testCurrentSeasonStatus() {
  try {
    console.log('\n📊 Testing Current Season Status...');
    
    const currentResponse = await fetch('http://localhost:3001/api/seasons/current');
    const currentData = await currentResponse.json();
    
    if (currentData.success && currentData.data) {
      console.log(`✅ Current season: ${currentData.data.activeSeason?.name || 'None'}`);
      console.log(`   - Status: ${currentData.data.activeSeason?.status || 'N/A'}`);
      
      const matchesFinished = currentData.data.activeSeason?.matches?.filter(m => m.status === 'finished').length || 0;
      const totalMatches = currentData.data.activeSeason?.matches?.length || 0;
      
      console.log(`   - Progress: ${matchesFinished}/${totalMatches} matches finished`);
      
      if (matchesFinished === totalMatches && totalMatches > 0) {
        console.log('🏆 All matches completed! Season should be finished automatically.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing current season status:', error.message);
  }
}

// Test 3: Verificar tabla standings
async function testStandingsTable() {
  try {
    console.log('\n📈 Testing Standings Table...');
    
    const standingsResponse = await fetch('http://localhost:3001/api/standings/current');
    const standingsData = await standingsResponse.json();
    
    if (standingsData.success && standingsData.data?.standings) {
      console.log(`✅ Current standings found: ${standingsData.data.standings.length} teams`);
      
      const topTeam = standingsData.data.standings[0];
      if (topTeam) {
        console.log(`   - Leader: ${topTeam.team?.name || 'Unknown'}`);
        console.log(`   - Points: ${topTeam.points}`);
        console.log(`   - Matches: ${topTeam.matchesPlayed}`);
      }
    } else {
      console.log('ℹ️ No current standings found (normal if no season is active)');
    }
    
  } catch (error) {
    console.error('❌ Error testing standings table:', error.message);
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  await testHistoricalSeasonsEndpoints();
  await testCurrentSeasonStatus();
  await testStandingsTable();
  
  console.log('\n✨ Historical Seasons System Tests Completed!');
  console.log('\n📝 Next steps to test:');
  console.log('1. Simulate matches until a season is completed');
  console.log('2. Check that the season is automatically archived');
  console.log('3. Verify the historical season appears in /api/seasons/historical');
}

// Ejecutar si se llama directamente
if (typeof window === 'undefined') {
  runAllTests().catch(console.error);
}
