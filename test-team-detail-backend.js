/**
 * Script para probar el endpoint de teams con las mejoras implementadas
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuración del servidor
const BASE_URL = 'http://localhost:3001';
const TEAMS_TO_TEST = ['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff', 'chudley', 'harpies'];

// Función para hacer peticiones HTTP
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
  });
}

// Función para probar un endpoint específico
async function testEndpoint(endpoint, description) {
  console.log(`\n🔍 Testing ${description}...`);
  try {
    const response = await makeRequest(`${BASE_URL}${endpoint}`);
    console.log(`✅ Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log(`📊 Response sample:`, JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
    } else {
      console.log(`❌ Error response:`, response.data);
    }
    
    return response;
  } catch (error) {
    console.log(`❌ Request failed:`, error.message);
    return null;
  }
}

// Función para probar todos los endpoints de teams
async function testAllTeamsEndpoints() {
  console.log('🚀 Testing Team Detail Page Backend Integration');
  console.log('='.repeat(60));
  
  // Probar endpoint general de teams
  await testEndpoint('/api/teams', 'Teams list endpoint');
  
  // Probar cada equipo específico
  for (const teamId of TEAMS_TO_TEST) {
    const response = await testEndpoint(`/api/teams/${teamId}`, `Team ${teamId} detail`);
    
    if (response && response.status === 200) {
      const team = response.data;
      console.log(`  📋 Team info for ${team.name}:`);
      console.log(`    - Titles: ${team.titles || 'N/A'}`);
      console.log(`    - Colors: ${team.colors || 'N/A'}`);
      console.log(`    - Achievements: ${team.achievements ? JSON.parse(team.achievements).length : 0} items`);
      console.log(`    - History: ${team.history ? 'Present' : 'Missing'}`);
      console.log(`    - Stadium: ${team.stadium || 'N/A'}`);
      console.log(`    - Founded: ${team.founded || 'N/A'}`);
    }
  }
  
  // Probar otros endpoints relacionados
  await testEndpoint('/api/matches', 'Matches endpoint');
  await testEndpoint('/api/matches/today', 'Today matches endpoint');
  await testEndpoint('/api/seasons/current', 'Current season endpoint');
}

// Función para verificar la conectividad del backend
async function checkBackendConnectivity() {
  console.log('🔗 Checking backend connectivity...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/health`);
    if (response && response.status === 200) {
      console.log('✅ Backend is running and responsive');
      return true;
    } else {
      console.log('⚠️ Backend responded but may have issues');
      return false;
    }
  } catch (error) {
    console.log('❌ Backend is not running or not accessible');
    console.log('💡 Please make sure to start the backend server first');
    return false;
  }
}

// Función para generar reporte de pruebas
async function generateTestReport() {
  const reportPath = path.join(__dirname, 'team-detail-test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    backendUrl: BASE_URL,
    teamsTest: [],
    summary: {
      totalTeams: TEAMS_TO_TEST.length,
      successfulRequests: 0,
      failedRequests: 0,
      missingData: []
    }
  };
  
  console.log('\n📊 Generating detailed test report...');
  
  for (const teamId of TEAMS_TO_TEST) {
    try {
      const response = await makeRequest(`${BASE_URL}/api/teams/${teamId}`);
      
      if (response && response.status === 200) {
        const team = response.data;
        const teamReport = {
          id: teamId,
          name: team.name,
          status: 'success',
          data: {
            titles: team.titles,
            achievements: team.achievements ? JSON.parse(team.achievements) : [],
            history: team.history,
            colors: team.colors,
            stadium: team.stadium,
            founded: team.founded
          },
          dataQuality: {
            hasTitles: !!team.titles,
            hasAchievements: !!(team.achievements && JSON.parse(team.achievements).length > 0),
            hasHistory: !!team.history,
            hasColors: !!team.colors,
            hasStadium: !!team.stadium,
            hasFounded: !!team.founded
          }
        };
        
        report.teamsTest.push(teamReport);
        report.summary.successfulRequests++;
        
        // Verificar datos faltantes
        if (!team.titles) report.summary.missingData.push(`${teamId}: titles`);
        if (!team.achievements) report.summary.missingData.push(`${teamId}: achievements`);
        if (!team.history) report.summary.missingData.push(`${teamId}: history`);
        if (!team.colors) report.summary.missingData.push(`${teamId}: colors`);
        
      } else {
        report.teamsTest.push({
          id: teamId,
          status: 'failed',
          error: `HTTP ${response?.status || 'N/A'}`
        });
        report.summary.failedRequests++;
      }
    } catch (error) {
      report.teamsTest.push({
        id: teamId,
        status: 'error',
        error: error.message
      });
      report.summary.failedRequests++;
    }
  }
  
  // Guardar reporte
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`✅ Test report saved to: ${reportPath}`);
  
  // Mostrar resumen
  console.log('\n📋 Test Summary:');
  console.log(`- Total teams tested: ${report.summary.totalTeams}`);
  console.log(`- Successful requests: ${report.summary.successfulRequests}`);
  console.log(`- Failed requests: ${report.summary.failedRequests}`);
  console.log(`- Missing data issues: ${report.summary.missingData.length}`);
  
  if (report.summary.missingData.length > 0) {
    console.log('\n⚠️ Missing data detected:');
    report.summary.missingData.forEach(item => console.log(`  - ${item}`));
  }
  
  return report;
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--connectivity')) {
    await checkBackendConnectivity();
  } else if (args.includes('--report')) {
    const isConnected = await checkBackendConnectivity();
    if (isConnected) {
      await generateTestReport();
    }
  } else {
    const isConnected = await checkBackendConnectivity();
    if (isConnected) {
      await testAllTeamsEndpoints();
    }
  }
}

// Ejecutar
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testAllTeamsEndpoints, checkBackendConnectivity, generateTestReport };
