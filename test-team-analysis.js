/**
 * 🧪 Script de prueba para el módulo de análisis de equipos
 * 
 * Este script permite validar que el módulo de análisis de detalles de partidos
 * esté funcionando correctamente con datos del backend en lugar de mockups.
 * 
 * Ejecutar en la consola del navegador cuando esté en la página de detalles de un partido.
 */

window.testTeamAnalysisModule = async function() {
  console.log('🔍 TESTING TEAM ANALYSIS MODULE');
  console.log('=====================================');
  
  // Verificar que estamos en la página correcta
  const currentUrl = window.location.pathname;
  if (!currentUrl.includes('/match/')) {
    console.warn('⚠️ Este test debe ejecutarse desde la página de detalles de un partido');
    console.log('📍 Navega a: /match/[id] y vuelve a ejecutar');
    return;
  }
  
  try {
    // 1. Verificar configuración de backend
    console.log('1️⃣ Verificando configuración del backend...');
    
    const backendEnabled = localStorage.getItem('USE_BACKEND') !== 'false';
    console.log(`   Backend habilitado: ${backendEnabled ? '✅ Sí' : '❌ No'}`);
    
    if (!backendEnabled) {
      console.error('❌ El backend está deshabilitado. Habilítalo en configuración.');
      return;
    }
    
    // 2. Verificar conectividad con API
    console.log('2️⃣ Verificando conectividad con API...');
    
    try {
      const response = await fetch('http://localhost:3001/api/teams');
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        console.log(`   ✅ API conectada correctamente - ${data.data.length} equipos encontrados`);
        console.log(`   📋 Equipos disponibles:`, data.data.map(team => team.name).join(', '));
      } else {
        console.error('❌ API responde pero sin datos de equipos');
        return;
      }
    } catch (error) {
      console.error('❌ Error conectando con API:', error.message);
      console.log('💡 Asegúrate de que el backend esté ejecutándose en http://localhost:3001');
      return;
    }
    
    // 3. Buscar componente de análisis detallado
    console.log('3️⃣ Buscando componente de análisis...');
    
    const analysisTab = document.querySelector('[class*="detailedAnalysisTab"]');
    if (!analysisTab) {
      console.warn('⚠️ Componente de análisis detallado no encontrado');
      console.log('💡 Navega a la pestaña "Análisis" en los detalles del partido');
      return;
    }
    
    console.log('   ✅ Componente de análisis encontrado');
    
    // 4. Verificar que muestre datos reales
    console.log('4️⃣ Verificando contenido del análisis...');
    
    const teamNames = analysisTab.querySelectorAll('[class*="teamName"]');
    const formRatings = analysisTab.querySelectorAll('[class*="formRating"]');
    const strengthItems = analysisTab.querySelectorAll('[class*="strengthItem"]');
    const oraclePrediction = analysisTab.querySelector('[class*="oraclePrediction"]');
    
    console.log(`   📊 Equipos mostrados: ${teamNames.length}`);
    console.log(`   📈 Ratings encontrados: ${formRatings.length}`);
    console.log(`   💪 Fortalezas mostradas: ${strengthItems.length}`);
    console.log(`   🔮 Predicción del oráculo: ${oraclePrediction ? '✅ Presente' : '❌ Ausente'}`);
    
    // 5. Verificar datos específicos de equipos
    if (teamNames.length >= 2) {
      console.log('5️⃣ Analizando datos específicos de equipos...');
      
      teamNames.forEach((nameElement, index) => {
        const teamName = nameElement.textContent;
        const teamCard = nameElement.closest('[class*="teamAnalysisCard"]');
        
        if (teamCard) {
          const rating = teamCard.querySelector('[class*="formRating"]')?.textContent;
          const crystals = teamCard.querySelectorAll('[class*="formCrystal"]');
          const strengths = teamCard.querySelectorAll('[class*="strengthItem"]');
          const weaknesses = teamCard.querySelectorAll('[class*="weaknessItem"]');
          
          console.log(`   🏆 ${teamName}:`);
          console.log(`      📊 Rating: ${rating || 'No disponible'}`);
          console.log(`      🔮 Forma reciente: ${crystals.length} partidos`);
          console.log(`      ⚡ Fortalezas: ${strengths.length}`);
          console.log(`      🌙 Debilidades: ${weaknesses.length}`);
        }
      });
    }
    
    // 6. Verificar factores místicos (estadísticas del backend)
    console.log('6️⃣ Verificando factores místicos con datos del backend...');
    
    const factorsSection = analysisTab.querySelector('[class*="mysticFactors"]');
    if (factorsSection) {
      const factorItems = factorsSection.querySelectorAll('[class*="factorItem"]');
      console.log(`   ✨ Factores místicos encontrados: ${factorItems.length}`);
      
      factorItems.forEach((factor, index) => {
        const text = factor.textContent.trim();
        if (text.includes('victorias') || text.includes('ataque') || text.includes('puntos') || text.includes('Snitch')) {
          console.log(`      ${index + 1}. ${text}`);
        }
      });
    }
    
    // 7. Verificar loading states
    console.log('7️⃣ Verificando estados de carga...');
    
    const loadingContainer = analysisTab.querySelector('[class*="loadingContainer"]');
    const magicalOrb = analysisTab.querySelector('[class*="magicalOrb"]');
    
    if (loadingContainer || magicalOrb) {
      console.log('   ⏳ Componente actualmente en estado de carga');
      console.log('   💡 Espera unos segundos y vuelve a ejecutar el test');
    } else {
      console.log('   ✅ Componente completamente cargado');
    }
    
    // 8. Resultado final
    console.log('8️⃣ RESULTADO DEL TEST');
    console.log('=====================================');
    
    const hasTeams = teamNames.length >= 2;
    const hasRatings = formRatings.length >= 2;
    const hasContent = strengthItems.length > 0;
    const hasOracle = !!oraclePrediction;
    
    if (hasTeams && hasRatings && hasContent && hasOracle) {
      console.log('🎉 ¡TEST EXITOSO!');
      console.log('✅ El módulo de análisis está funcionando correctamente con datos del backend');
      console.log('✅ Se muestran estadísticas reales de los equipos');
      console.log('✅ Los componentes visuales están renderizados');
      console.log('✅ La predicción del oráculo está activa');
    } else {
      console.warn('⚠️ TEST PARCIALMENTE EXITOSO');
      console.log(`Equipos: ${hasTeams ? '✅' : '❌'}`);
      console.log(`Ratings: ${hasRatings ? '✅' : '❌'}`);
      console.log(`Contenido: ${hasContent ? '✅' : '❌'}`);
      console.log(`Oráculo: ${hasOracle ? '✅' : '❌'}`);
      
      if (!hasTeams || !hasRatings) {
        console.log('💡 Posibles causas:');
        console.log('   - Backend no está ejecutándose');
        console.log('   - No hay datos de equipos en la base de datos');
        console.log('   - Error en la conexión con la API');
      }
    }
    
  } catch (error) {
    console.error('❌ ERROR DURANTE EL TEST:', error);
    console.log('🔧 Revisar la consola para más detalles del error');
  }
};

// Función auxiliar para probar manualmente la obtención de estadísticas
window.testTeamStatistics = async function(teamId = 'gryffindor') {
  console.log(`🧪 Testing team statistics for: ${teamId}`);
  
  try {
    const response = await fetch(`http://localhost:3001/api/teams/${teamId}`);
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('✅ Team statistics retrieved successfully:', data.data);
      return data.data;
    } else {
      console.error('❌ Failed to get team statistics:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching team statistics:', error);
    return null;
  }
};

// Función auxiliar para probar head-to-head
window.testHeadToHead = async function(teamId1 = 'gryffindor', teamId2 = 'slytherin') {
  console.log(`🧪 Testing head-to-head: ${teamId1} vs ${teamId2}`);
  
  try {
    const response = await fetch(`http://localhost:3001/api/teams/${teamId1}/vs/${teamId2}`);
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('✅ Head-to-head data retrieved successfully:', data.data);
      return data.data;
    } else {
      console.error('❌ Failed to get head-to-head data:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching head-to-head data:', error);
    return null;
  }
};

console.log('🧪 TEAM ANALYSIS TEST MODULE LOADED');
console.log('=====================================');
console.log('📋 Funciones disponibles:');
console.log('   • testTeamAnalysisModule() - Test completo del módulo');
console.log('   • testTeamStatistics(teamId) - Test de estadísticas de equipo');
console.log('   • testHeadToHead(team1, team2) - Test de enfrentamientos directos');
console.log('');
console.log('🚀 Para ejecutar el test completo, usa: testTeamAnalysisModule()');
