/**
 * Script de prueba para verificar que el RequestQueue funciona correctamente
 * y previene errores HTTP 429
 */

const { apiClient } = require('./src/utils/apiClient.ts');

async function testApiThrottling() {
  console.log('🧪 Iniciando prueba de throttling del API...\n');

  try {
    // Simular múltiples peticiones simultáneas como las que causan el problema
    const promises = [];
    
    console.log('📡 Enviando 10 peticiones simultáneas de matches...');
    for (let i = 0; i < 10; i++) {
      promises.push(
        apiClient.get('/matches').catch(err => ({
          error: true,
          message: err.message,
          index: i
        }))
      );
    }

    console.log('📡 Enviando 5 peticiones simultáneas de predictions...');
    for (let i = 0; i < 5; i++) {
      promises.push(
        apiClient.get('/predictions').catch(err => ({
          error: true,
          message: err.message,
          index: i + 10
        }))
      );
    }

    console.log('📡 Enviando 5 peticiones simultáneas de teams...');
    for (let i = 0; i < 5; i++) {
      promises.push(
        apiClient.get('/teams').catch(err => ({
          error: true,
          message: err.message,
          index: i + 15
        }))
      );
    }

    console.log('\n⏳ Esperando respuestas...\n');
    
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();

    console.log(`⏱️ Tiempo total: ${(endTime - startTime) / 1000}s\n`);

    // Analizar resultados
    const errors = results.filter(r => r.error);
    const successes = results.filter(r => !r.error);
    const rateLimitErrors = errors.filter(e => e.message.includes('429'));

    console.log('📊 RESULTADOS:');
    console.log(`✅ Exitosos: ${successes.length}`);
    console.log(`❌ Errores: ${errors.length}`);
    console.log(`🚫 Errores 429 (Rate Limit): ${rateLimitErrors.length}`);

    if (rateLimitErrors.length === 0) {
      console.log('\n🎉 ¡ÉXITO! No se produjeron errores de rate limit (HTTP 429)');
      console.log('✨ El sistema de throttling está funcionando correctamente');
    } else {
      console.log('\n⚠️ ADVERTENCIA: Aún se producen algunos errores 429');
      console.log('🔧 Puede ser necesario ajustar la configuración del RequestQueue');
    }

    // Mostrar errores específicos si los hay
    if (errors.length > 0) {
      console.log('\n🔍 ERRORES DETALLADOS:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
      });
    }

  } catch (error) {
    console.error('💥 Error durante la prueba:', error);
  }
}

async function testApiHealth() {
  console.log('\n🏥 Verificando salud del API...');
  
  try {
    const isHealthy = await apiClient.healthCheck();
    console.log(`Estado del API: ${isHealthy ? '✅ Saludable' : '❌ No disponible'}`);
    return isHealthy;
  } catch (error) {
    console.log('❌ Error al verificar salud del API:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 PRUEBA DE SISTEMA DE RATE LIMITING\n');
  console.log('🎯 Objetivo: Verificar que no se produzcan errores HTTP 429');
  console.log('📋 Simulando el comportamiento de MatchDetailPage\n');

  // Verificar que el backend esté funcionando
  const isApiHealthy = await testApiHealth();
  
  if (!isApiHealthy) {
    console.log('\n⚠️ El backend no está disponible. Iniciando backend...');
    console.log('💡 Ejecuta: npm run backend:start');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(50));
  await testApiThrottling();
  console.log('='.repeat(50));
  
  console.log('\n✨ Prueba completada');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testApiThrottling, testApiHealth };
