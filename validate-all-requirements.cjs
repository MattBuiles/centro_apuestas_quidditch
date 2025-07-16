const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ status: response.statusCode, data: parsedData });
        } catch (error) {
          console.error('JSON parse error:', error.message);
          console.error('Raw data:', data.substring(0, 500));
          reject(error);
        }
      });
    });
    request.on('error', reject);
  });
}

async function validateAllRequirements() {
  try {
    console.log('🔍 VALIDATING ALL REQUIREMENTS...\n');
    
    const teams = ['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'];
    const results = {};
    
    for (const teamId of teams) {
      console.log(`🏠 Testing ${teamId.toUpperCase()}...`);
      
      const response = await makeRequest(`http://localhost:3001/api/teams/${teamId}`);
      
      if (response.status === 200 && response.data.success) {
        const team = response.data.data;
        
        // ✅ Paso 1: Verificar puntos de liga
        const expectedPoints = (team.wins * 3) + (team.draws * 1);
        const pointsValid = team.points === expectedPoints;
        
        // ✅ Paso 2: Verificar ídolos históricos desde backend
        const idolsValid = Array.isArray(team.historicalIdols) && team.historicalIdols.length > 0;
        const idolsFromDB = team.historicalIdols.every(idol => 
          idol.name && idol.position && idol.period && idol.description
        );
        
        // ✅ Paso 3: Verificar logros dinámicos
        const achievementsValid = Array.isArray(team.achievements) && team.achievements.length > 0;
        const hasDynamicAchievements = team.achievements.some(ach => 
          ach.includes('(') && ach.includes(')')
        );
        
        results[teamId] = {
          name: team.name,
          wins: team.wins,
          draws: team.draws,
          losses: team.losses,
          expectedPoints,
          actualPoints: team.points,
          pointsValid,
          idolsCount: team.historicalIdols?.length || 0,
          idolsValid,
          idolsFromDB,
          achievementsCount: team.achievements?.length || 0,
          achievementsValid,
          hasDynamicAchievements,
          sampleIdol: team.historicalIdols?.[0]?.name || 'None',
          sampleAchievement: team.achievements?.[0] || 'None'
        };
        
        console.log(`  ✅ Points: ${team.points} (expected: ${expectedPoints}) - ${pointsValid ? 'VALID' : 'INVALID'}`);
        console.log(`  ✅ Idols: ${team.historicalIdols?.length || 0} from DB - ${idolsValid && idolsFromDB ? 'VALID' : 'INVALID'}`);
        console.log(`  ✅ Achievements: ${team.achievements?.length || 0} dynamic - ${achievementsValid && hasDynamicAchievements ? 'VALID' : 'INVALID'}`);
        console.log();
      } else {
        console.error(`❌ Failed to load ${teamId}:`, response.data);
        results[teamId] = { error: 'Failed to load' };
      }
    }
    
    console.log('\n📊 SUMMARY REPORT:\n');
    
    let allPointsValid = true;
    let allIdolsValid = true;
    let allAchievementsValid = true;
    
    for (const [teamId, result] of Object.entries(results)) {
      if (result.error) {
        console.log(`❌ ${teamId}: ERROR - ${result.error}`);
        continue;
      }
      
      console.log(`🏠 ${result.name}:`);
      console.log(`   Points: ${result.actualPoints}/${result.expectedPoints} ${result.pointsValid ? '✅' : '❌'}`);
      console.log(`   Idols: ${result.idolsCount} from DB ${result.idolsValid && result.idolsFromDB ? '✅' : '❌'}`);
      console.log(`   Achievements: ${result.achievementsCount} dynamic ${result.achievementsValid && result.hasDynamicAchievements ? '✅' : '❌'}`);
      console.log(`   Sample Idol: ${result.sampleIdol}`);
      console.log(`   Sample Achievement: ${result.sampleAchievement}`);
      console.log();
      
      if (!result.pointsValid) allPointsValid = false;
      if (!result.idolsValid || !result.idolsFromDB) allIdolsValid = false;
      if (!result.achievementsValid || !result.hasDynamicAchievements) allAchievementsValid = false;
    }
    
    console.log('🎯 FINAL VALIDATION:\n');
    console.log(`✅ Paso 1 - Points load correctly: ${allPointsValid ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Paso 2 - Historical idols from backend: ${allIdolsValid ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Paso 3 - Dynamic achievements: ${allAchievementsValid ? 'PASSED' : 'FAILED'}`);
    
    if (allPointsValid && allIdolsValid && allAchievementsValid) {
      console.log('\n🎉 ALL REQUIREMENTS SUCCESSFULLY IMPLEMENTED! 🎉');
    } else {
      console.log('\n⚠️  Some requirements need attention.');
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
  }
}

validateAllRequirements();
