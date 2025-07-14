/**
 * Script de prueba para verificar que el RequestQueue previene errores HTTP 429
 * Simula múltiples peticiones simultáneas como las que causaban los crashes
 */

// Simular fetch global para Node.js
import fetch, { Headers, Request, Response } from 'node-fetch';
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
}

// Importar el sistema RequestQueue
import { SimpleRequestQueue } from './src/utils/simpleRequestQueue.ts';

const BASE_URL = 'http://localhost:3001/api';
const requestQueue = new SimpleRequestQueue();

/**
 * Simula las peticiones que hace MatchDetailPage
 */
async function simulateMatchDetailPageRequests() {
  console.log('🎯 Simulando peticiones de MatchDetailPage...\n');
  
  const matchId = 'fd7a18e5-af02-4189-b439-7f59081d5597'; // ID del primer match
  
  // Estas son las peticiones que se hacen simultáneamente en MatchDetailPage
  const requests = [
    // Datos del partido
    () => requestQueue.enqueue(`${BASE_URL}/matches/${matchId}`, { method: 'GET' }),
    
    // Predicciones del partido
    () => requestQueue.enqueue(`${BASE_URL}/predictions/match/${matchId}`, { method: 'GET' }),
    
    // Lista de todos los matches (para contexto)
    () => requestQueue.enqueue(`${BASE_URL}/matches`, { method: 'GET' }),
    
    // Datos de equipos
    () => requestQueue.enqueue(`${BASE_URL}/teams/chudley-cannons`, { method: 'GET' }),
    () => requestQueue.enqueue(`${BASE_URL}/teams/gryffindor`, { method: 'GET' }),
    
    // Estadísticas adicionales
    () => requestQueue.enqueue(`${BASE_URL}/teams`, { method: 'GET' }),
    () => requestQueue.enqueue(`${BASE_URL}/standings`, { method: 'GET' }),
  ];
  
  console.log(`📊 Iniciando ${requests.length} peticiones simultáneas...`);
  
  const startTime = Date.now();
  
  try {
    // Ejecutar todas las peticiones al mismo tiempo (como hace el frontend)
    const responses = await Promise.all(requests.map(req => req()));
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n✅ Todas las peticiones completadas exitosamente!');
    console.log(`⏱️  Tiempo total: ${duration}ms`);
    console.log(`📈 Promedio por petición: ${Math.round(duration / requests.length)}ms`);
    
    // Verificar que todas las respuestas sean válidas
    let successCount = 0;
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      if (response.ok) {
        successCount++;
        console.log(`✅ Petición ${i + 1}: ${response.status} ${response.statusText}`);
      } else {
        console.log(`❌ Petición ${i + 1}: ${response.status} ${response.statusText}`);
      }
    }
    
    console.log(`\n📊 Resumen: ${successCount}/${requests.length} peticiones exitosas`);
    
    return successCount === requests.length;
    
  } catch (error) {
    console.error('❌ Error durante las peticiones:', error);
    return false;
  }
}

/**
 * Prueba de estrés: muchas peticiones simultáneas
 */
async function stressTest() {
  console.log('\n🔥 Iniciando prueba de estrés...\n');
  
  const requests = [];
  
  // Crear 20 peticiones simultáneas (más de las que puede manejar el rate limit)
  for (let i = 0; i < 20; i++) {
    requests.push(() => requestQueue.enqueue(`${BASE_URL}/matches`, { method: 'GET' }));
  }
  
  const startTime = Date.now();
  
  try {
    const responses = await Promise.all(requests.map(req => req()));
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successCount = responses.filter(r => r.ok).length;
    
    console.log(`\n🔥 Prueba de estrés completada:`);
    console.log(`⏱️  Tiempo total: ${duration}ms`);
    console.log(`📊 Peticiones exitosas: ${successCount}/${requests.length}`);
    console.log(`🎯 Rate limiting funcionando: ${duration > 3000 ? '✅' : '⚠️'}`);
    
    return successCount >= requests.length * 0.8; // 80% de éxito es aceptable
    
  } catch (error) {
    console.error('❌ Error en prueba de estrés:', error);
    return false;
  }
}

/**
 * Ejecutar todas las pruebas
 */
async function runTests() {
  console.log('🚀 Iniciando pruebas del sistema RequestQueue\n');
  console.log('='.repeat(50));
  
  try {
    // Verificar que el backend esté funcionando
    console.log('🔍 Verificando conectividad con backend...');
    const testResponse = await fetch(`${BASE_URL}/matches`);
    if (!testResponse.ok) {
      throw new Error(`Backend no disponible: ${testResponse.status}`);
    }
    console.log('✅ Backend conectado correctamente\n');
    
    // Prueba 1: Simular MatchDetailPage
    const test1 = await simulateMatchDetailPageRequests();
    console.log('='.repeat(50));
    
    // Pequeña pausa entre pruebas
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Prueba 2: Prueba de estrés
    const test2 = await stressTest();
    console.log('='.repeat(50));
    
    // Resumen final
    console.log('\n📋 RESUMEN DE PRUEBAS:');
    console.log(`🎯 MatchDetailPage simulation: ${test1 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`🔥 Stress test: ${test2 ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (test1 && test2) {
      console.log('\n🎉 ¡Todas las pruebas pasaron! El sistema RequestQueue está funcionando correctamente.');
      console.log('✅ Los errores HTTP 429 deberían estar resueltos en el frontend.');
    } else {
      console.log('\n⚠️  Algunas pruebas fallaron. Revisa la configuración del RequestQueue.');
    }
    
  } catch (error) {
    console.error('💥 Error crítico durante las pruebas:', error);
  }
}

// Ejecutar las pruebas
runTests();
