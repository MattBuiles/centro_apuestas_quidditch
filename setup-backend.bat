@echo off
echo 🚀 Configurando el backend de Quidditch Betting...

cd backend

echo 📦 Instalando dependencias...
call npm install

echo 📝 Copiando archivo de configuracion...
copy .env.example .env

echo 🗄️ Inicializando base de datos...
if not exist database mkdir database

echo ✅ Backend configurado exitosamente!
echo 📋 Proximos pasos:
echo    1. cd backend
echo    2. Editar .env con tu configuracion
echo    3. npm run dev (para desarrollo)
echo    4. npm run build ^&^& npm start (para produccion)
echo.
echo 🌐 El servidor estara disponible en:
echo    - API: http://localhost:3001
echo    - WebSocket: ws://localhost:3002
echo    - Health Check: http://localhost:3001/health

pause
