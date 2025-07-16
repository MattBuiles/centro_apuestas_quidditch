/**
 * Script para probar el sistema de títulos dinámicos
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuración del servidor
const BASE_URL = 'http://localhost:3001';
const TEAMS_TO_TEST = ['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff', 'chudley', 'harpies'];

// Función para hacer peticiones HTTP
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', chunk => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Función para probar un endpoint específico
async function testEndpoint(endpoint, description, method = 'GET', data = null) {
  console.log(`\n🔍 Testing ${description}...`);
  try {
    const response = await makeRequest(`${BASE_URL}${endpoint}`, method, data);
    console.log(`✅ Status: ${response.status}`);
    
    if (response.status === 200) {
      if (response.data.success) {
        console.log(`📊 Success: ${response.data.success}`);
        if (response.data.data) {
          if (Array.isArray(response.data.data)) {
            console.log(`📋 Items count: ${response.data.data.length}`);
            if (response.data.data.length > 0) {
              console.log(`📌 Sample item:`, JSON.stringify(response.data.data[0], null, 2));
            }
          } else {
            console.log(`📌 Data:`, JSON.stringify(response.data.data, null, 2));
          }
        }
      } else {
        console.log(`❌ Response:`, response.data);
      }
    } else {
      console.log(`❌ Error response:`, response.data);
    }
    
    return response;
  } catch (error) {
    console.log(`❌ Request failed:`, error.message);
    return null;
  }
}

// Función para probar el sistema de títulos
async function testTitlesSystem() {
  console.log('🏆 Testing Dynamic Titles System');
  console.log('='.repeat(60));

  // 1. Limpiar títulos mock
  console.log('\n📋 STEP 1: Clearing mock titles');
  await testEndpoint('/api/teams/titles/clear-mock', 'Clear mock titles', 'POST');

  // 2. Probar cálculo de títulos por equipo
  console.log('\n📋 STEP 2: Testing individual team titles');
  for (const teamId of TEAMS_TO_TEST) {
    const response = await testEndpoint(`/api/teams/${teamId}`, `Team ${teamId} with dynamic titles`);
    
    if (response && response.status === 200 && response.data.success) {
      const team = response.data.data;
      console.log(`  🏆 ${team.name}: ${team.titles} títulos`);
    }
  }

  // 3. Probar detalles de títulos
  console.log('\n📋 STEP 3: Testing detailed title history');
  for (const teamId of TEAMS_TO_TEST) {
    const response = await testEndpoint(`/api/teams/${teamId}/titles/details`, `Title details for ${teamId}`);
    
    if (response && response.status === 200 && response.data.success) {
      const details = response.data.data;
      console.log(`  📊 ${details.teamName}: ${details.totalTitles} títulos, ${details.seasonTitles.length} temporadas ganadas`);
      
      if (details.seasonTitles.length > 0) {
        console.log(`    🏅 Última temporada ganada: ${details.seasonTitles[0].seasonName}`);
      }
    }
  }

  // 4. Probar ranking de títulos
  console.log('\n📋 STEP 4: Testing titles ranking');
  const rankingResponse = await testEndpoint('/api/teams/titles/ranking', 'Team titles ranking');
  
  if (rankingResponse && rankingResponse.status === 200 && rankingResponse.data.success) {
    const ranking = rankingResponse.data.data;
    console.log('\n🏆 RANKING DE TÍTULOS:');
    ranking.forEach((team, index) => {
      console.log(`  ${index + 1}. ${team.teamName}: ${team.titles} títulos`);
    });
  }

  // 5. Actualizar títulos en base de datos (opcional)
  console.log('\n📋 STEP 5: Testing database update');
  await testEndpoint('/api/teams/titles/update-database', 'Update titles in database', 'POST');

  // 6. Verificar que los títulos se mantienen consistentes
  console.log('\n📋 STEP 6: Verifying consistency after database update');
  for (const teamId of TEAMS_TO_TEST) {
    const response = await testEndpoint(`/api/teams/${teamId}`, `Team ${teamId} after database update`);
    
    if (response && response.status === 200 && response.data.success) {
      const team = response.data.data;
      console.log(`  ✅ ${team.name}: ${team.titles} títulos (después de actualización)`);
    }
  }
}

// Función para verificar la estructura de temporadas
async function checkSeasonsStructure() {
  console.log('\n🔍 Checking seasons structure...');
  
  // Verificar temporadas actuales
  const currentSeasonsResponse = await testEndpoint('/api/seasons', 'Current seasons');
  
  // Verificar temporadas históricas (si existe el endpoint)
  // const historicalSeasonsResponse = await testEndpoint('/api/historical-seasons', 'Historical seasons');
  
  // Verificar standings
  const standingsResponse = await testEndpoint('/api/standings', 'Current standings');
  
  console.log('\n📊 Database structure verification complete');
}

// Función para generar reporte de títulos
async function generateTitlesReport() {
  console.log('\n📊 Generating titles report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    teams: [],
    summary: {
      totalTeams: 0,
      totalTitles: 0,
      teamsWithTitles: 0,
      teamsWithoutTitles: 0
    }
  };

  for (const teamId of TEAMS_TO_TEST) {
    try {
      const response = await makeRequest(`${BASE_URL}/api/teams/${teamId}/titles/details`);
      
      if (response && response.status === 200 && response.data.success) {
        const teamData = response.data.data;
        report.teams.push(teamData);
        report.summary.totalTitles += teamData.totalTitles;
        
        if (teamData.totalTitles > 0) {
          report.summary.teamsWithTitles++;
        } else {
          report.summary.teamsWithoutTitles++;
        }
      }
    } catch (error) {
      console.error(`Error getting data for ${teamId}:`, error);
    }
  }

  report.summary.totalTeams = report.teams.length;
  
  // Guardar reporte
  const reportPath = path.join(__dirname, 'team-titles-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`✅ Titles report saved to: ${reportPath}`);
  
  // Mostrar resumen
  console.log('\n📋 TITLES SUMMARY:');
  console.log(`- Total teams: ${report.summary.totalTeams}`);
  console.log(`- Total titles: ${report.summary.totalTitles}`);
  console.log(`- Teams with titles: ${report.summary.teamsWithTitles}`);
  console.log(`- Teams without titles: ${report.summary.teamsWithoutTitles}`);
  
  return report;
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--structure')) {
    await checkSeasonsStructure();
  } else if (args.includes('--report')) {
    await generateTitlesReport();
  } else {
    await testTitlesSystem();
    
    if (args.includes('--with-report')) {
      await generateTitlesReport();
    }
  }
}

// Ejecutar
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testTitlesSystem, generateTitlesReport, checkSeasonsStructure };
