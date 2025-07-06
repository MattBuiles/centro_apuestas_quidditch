#!/bin/bash

echo "🚀 Configurando el backend de Quidditch Betting..."

# Navegar al directorio del backend
cd backend

echo "📦 Instalando dependencias..."
npm install

echo "📝 Copiando archivo de configuración..."
cp .env.example .env

echo "🗄️ Inicializando base de datos..."
mkdir -p database

echo "✅ Backend configurado exitosamente!"
echo "📋 Próximos pasos:"
echo "   1. cd backend"
echo "   2. Editar .env con tu configuración"
echo "   3. npm run dev (para desarrollo)"
echo "   4. npm run build && npm start (para producción)"
echo ""
echo "🌐 El servidor estará disponible en:"
echo "   - API: http://localhost:3001"
echo "   - WebSocket: ws://localhost:3002"
echo "   - Health Check: http://localhost:3001/health"
