#!/bin/bash

# Script de verificación rápida del sistema de predicciones
echo "🧪 Verificación del Sistema de Predicciones Mejorado"
echo "=================================================="

# Verificar que el backend esté corriendo
echo ""
echo "🔍 Verificando estado del backend..."
curl -s http://localhost:3001/api/matches >/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend está corriendo"
else
    echo "❌ Backend no está disponible en puerto 3001"
    echo "   Ejecuta: cd backend && npm run dev"
    exit 1
fi

# Verificar estructura de la base de datos
echo ""
echo "🗄️ Verificando estructura de predicciones..."
node -e "
const { Database } = require('./backend/src/database/Database');
(async () => {
  try {
    await Database.initialize();
    const db = Database.getInstance();
    
    // Verificar tabla predictions
    const predictions = await db.all('SELECT name FROM sqlite_master WHERE type=\"table\" AND name=\"predictions\"');
    if (predictions.length > 0) {
      console.log('✅ Tabla predictions existe');
      
      // Verificar columnas
      const columns = await db.all('PRAGMA table_info(predictions)');
      const requiredColumns = ['id', 'user_id', 'match_id', 'prediction', 'confidence', 'points', 'status', 'resolved_at'];
      const existingColumns = columns.map(col => col.name);
      
      let allColumnsExist = true;
      for (const col of requiredColumns) {
        if (existingColumns.includes(col)) {
          console.log(\`   ✅ Columna \${col} existe\`);
        } else {
          console.log(\`   ❌ Columna \${col} falta\`);
          allColumnsExist = false;
        }
      }
      
      if (allColumnsExist) {
        console.log('🎉 Estructura de base de datos correcta');
      }
      
    } else {
      console.log('❌ Tabla predictions no existe');
    }
    
    await Database.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
"

# Verificar endpoints de predicciones
echo ""
echo "🌐 Verificando endpoints de predicciones..."

# Test endpoint básico de matches
MATCHES_RESPONSE=$(curl -s http://localhost:3001/api/matches)
if echo "$MATCHES_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Endpoint /api/matches funciona"
else
    echo "❌ Endpoint /api/matches no responde correctamente"
fi

# Mostrar estadísticas actuales
echo ""
echo "📊 Estadísticas actuales del sistema:"
node -e "
const { Database } = require('./backend/src/database/Database');
(async () => {
  try {
    await Database.initialize();
    const db = Database.getInstance();
    
    // Contar partidos por estado
    const matches = await db.all('SELECT status, COUNT(*) as count FROM matches GROUP BY status');
    console.log('📈 Partidos por estado:');
    matches.forEach(match => {
      console.log(\`   \${match.status}: \${match.count}\`);
    });
    
    // Contar predicciones por estado
    const predictions = await db.all('SELECT status, COUNT(*) as count FROM predictions GROUP BY status');
    console.log('🔮 Predicciones por estado:');
    predictions.forEach(pred => {
      console.log(\`   \${pred.status}: \${pred.count}\`);
    });
    
    // Mostrar predicciones recientes
    const recentPredictions = await db.all('SELECT * FROM predictions ORDER BY created_at DESC LIMIT 5');
    if (recentPredictions.length > 0) {
      console.log('🕐 Últimas 5 predicciones:');
      recentPredictions.forEach((pred, i) => {
        console.log(\`   \${i+1}. \${pred.prediction} (\${pred.status}) - \${pred.points} puntos\`);
      });
    } else {
      console.log('📝 No hay predicciones aún');
    }
    
    await Database.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
"

echo ""
echo "🎯 Verificación completada!"
echo ""
echo "💡 Para probar el sistema:"
echo "   1. Ejecuta: node test-prediction-resolution.js"
echo "   2. O usa: node test-prediction-resolution.js status"
echo ""
