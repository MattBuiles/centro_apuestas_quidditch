/**
 * Script de prueba simplificado para verificar el backend con múltiples peticiones
 * Simula el comportamiento que causaba HTTP 429 en el frontend
 */

const { default: fetch } = await import('node-fetch');

const BASE_URL = 'http://localhost:3001/api';

/**
 * Simula las peticiones simultáneas de MatchDetailPage
 */
async function simulateMatchDetailPageRequests() {
  console.log('🎯 Simulando peticiones simultáneas de MatchDetailPage...\n');
  
  // Primero obtener un ID de match válido
  console.log('🔍 Obteniendo lista de matches...');
  const matchesResponse = await fetch(`${BASE_URL}/matches`);
  const matchesData = await matchesResponse.json();
  
  if (!matchesData.success || !matchesData.data.length) {
    throw new Error('No se pudieron obtener matches del backend');
  }
  
  const match = matchesData.data[0];
  const matchId = match.id;
  const homeTeamId = match.home_team_id;
  const awayTeamId = match.away_team_id;
  
  console.log(`✅ Usando match ID: ${matchId}`);
  console.log(`🏠 Home team: ${homeTeamId}`);
  console.log(`🏃 Away team: ${awayTeamId}\n`);
  
  // Estas son las peticiones que se hacen simultáneamente en MatchDetailPage
  const requests = [
    // Datos del partido específico
    fetch(`${BASE_URL}/matches/${matchId}`, { method: 'GET' }),
    
    // Predicciones del partido
    fetch(`${BASE_URL}/predictions/match/${matchId}`, { method: 'GET' }),
    
    // Lista de todos los matches
    fetch(`${BASE_URL}/matches`, { method: 'GET' }),
    
    // Datos de equipos
    fetch(`${BASE_URL}/teams/${homeTeamId}`, { method: 'GET' }),
    fetch(`${BASE_URL}/teams/${awayTeamId}`, { method: 'GET' }),
    
    // Estadísticas adicionales
    fetch(`${BASE_URL}/teams`, { method: 'GET' }),
    fetch(`${BASE_URL}/standings`, { method: 'GET' }),
    
    // Más peticiones para simular un escenario realista
    fetch(`${BASE_URL}/matches?status=scheduled`, { method: 'GET' }),
    fetch(`${BASE_URL}/matches?status=live`, { method: 'GET' }),
    fetch(`${BASE_URL}/predictions`, { method: 'GET' }),
  ];
  
  console.log(`📊 Iniciando ${requests.length} peticiones simultáneas...`);
  
  const startTime = Date.now();
  
  try {
    // Ejecutar todas las peticiones al mismo tiempo (como hace el frontend SIN RequestQueue)
    const responses = await Promise.all(requests);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n📋 Resultados de las peticiones:');
    
    let successCount = 0;
    let rateLimitCount = 0;
    
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      const status = response.status;
      
      if (response.ok) {
        successCount++;
        console.log(`✅ Petición ${i + 1}: ${status} ${response.statusText}`);
      } else if (status === 429) {
        rateLimitCount++;
        console.log(`🚫 Petición ${i + 1}: ${status} ${response.statusText} (Rate Limited)`);
      } else {
        console.log(`❌ Petición ${i + 1}: ${status} ${response.statusText}`);
      }
    }
    
    console.log(`\n📊 Resumen:`);
    console.log(`⏱️  Tiempo total: ${duration}ms`);
    console.log(`✅ Exitosas: ${successCount}/${requests.length}`);
    console.log(`🚫 Rate limited (429): ${rateLimitCount}/${requests.length}`);
    console.log(`❌ Otros errores: ${requests.length - successCount - rateLimitCount}/${requests.length}`);
    
    // Si hay muchos 429, significa que necesitamos RequestQueue
    if (rateLimitCount > 0) {
      console.log(`\n⚠️  Se detectaron ${rateLimitCount} errores HTTP 429!`);
      console.log('🛠️  Esto confirma que necesitamos el sistema RequestQueue en el frontend.');
    } else {
      console.log('\n✅ No se detectaron errores 429. El backend maneja bien la carga.');
    }
    
    return { successCount, rateLimitCount, totalRequests: requests.length };
    
  } catch (error) {
    console.error('❌ Error durante las peticiones:', error.message);
    return { successCount: 0, rateLimitCount: 0, totalRequests: requests.length };
  }
}

/**
 * Prueba de estrés: muchas peticiones para forzar rate limiting
 */
async function stressTest() {
  console.log('\n🔥 Iniciando prueba de estrés (forzar rate limiting)...\n');
  
  const batchSize = 15; // Más que el límite del backend
  const requests = [];
  
  // Crear múltiples peticiones simultáneas
  for (let i = 0; i < batchSize; i++) {
    requests.push(fetch(`${BASE_URL}/matches`, { method: 'GET' }));
  }
  
  const startTime = Date.now();
  
  try {
    const responses = await Promise.all(requests);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successCount = responses.filter(r => r.ok).length;
    const rateLimitCount = responses.filter(r => r.status === 429).length;
    
    console.log(`🔥 Prueba de estrés completada:`);
    console.log(`⏱️  Tiempo total: ${duration}ms`);
    console.log(`✅ Peticiones exitosas: ${successCount}/${batchSize}`);
    console.log(`🚫 Rate limited (429): ${rateLimitCount}/${batchSize}`);
    
    if (rateLimitCount > 0) {
      console.log(`\n⚠️  ¡Excelente! El rate limiting está funcionando en el backend.`);
      console.log('🛠️  Esto confirma que el RequestQueue evitará estos errores en el frontend.');
    }
    
    return { successCount, rateLimitCount, totalRequests: batchSize };
    
  } catch (error) {
    console.error('❌ Error en prueba de estrés:', error.message);
    return { successCount: 0, rateLimitCount: 0, totalRequests: batchSize };
  }
}

/**
 * Ejecutar todas las pruebas
 */
async function runTests() {
  console.log('🚀 Iniciando diagnóstico de peticiones HTTP\n');
  console.log('='.repeat(60));
  
  try {
    // Verificar que el backend esté funcionando
    console.log('🔍 Verificando conectividad con backend...');
    const testResponse = await fetch(`${BASE_URL}/matches`);
    if (!testResponse.ok) {
      throw new Error(`Backend no disponible: ${testResponse.status}`);
    }
    console.log('✅ Backend conectado correctamente\n');
    
    // Prueba 1: Simular MatchDetailPage (el escenario real)
    const test1 = await simulateMatchDetailPageRequests();
    console.log('='.repeat(60));
    
    // Pequeña pausa entre pruebas
    console.log('⏳ Esperando 3 segundos antes de la prueba de estrés...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Prueba 2: Prueba de estrés (forzar rate limiting)
    const test2 = await stressTest();
    console.log('='.repeat(60));
    
    // Resumen final
    console.log('\n📋 DIAGNÓSTICO COMPLETO:');
    console.log(`\n🎯 Simulación MatchDetailPage:`);
    console.log(`   ✅ Exitosas: ${test1.successCount}/${test1.totalRequests}`);
    console.log(`   🚫 Rate limited: ${test1.rateLimitCount}/${test1.totalRequests}`);
    
    console.log(`\n🔥 Prueba de estrés:`);
    console.log(`   ✅ Exitosas: ${test2.successCount}/${test2.totalRequests}`);
    console.log(`   🚫 Rate limited: ${test2.rateLimitCount}/${test2.totalRequests}`);
    
    const totalRateLimited = test1.rateLimitCount + test2.rateLimitCount;
    
    if (totalRateLimited > 0) {
      console.log(`\n🎯 CONCLUSIÓN:`);
      console.log(`✅ Se confirmó el problema: ${totalRateLimited} errores HTTP 429 detectados`);
      console.log(`🛠️  SOLUCIÓN: El RequestQueue en el frontend evitará estos errores`);
      console.log(`📱 PRÓXIMO PASO: Probar el frontend con el RequestQueue integrado`);
    } else {
      console.log(`\n🤔 RESULTADO INESPERADO:`);
      console.log(`❓ No se detectaron errores 429. Posibles causas:`);
      console.log(`   • El rate limiting del backend está desactivado`);
      console.log(`   • Los límites son muy altos para esta prueba`);
      console.log(`   • El backend se reinició recientemente`);
    }
    
  } catch (error) {
    console.error('\n💥 Error crítico durante las pruebas:', error.message);
  }
}

// Ejecutar el diagnóstico
runTests();
