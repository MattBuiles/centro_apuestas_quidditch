@echo off
echo 🚀 Testing Quidditch Backend - Teams ^& Players
echo ==============================================
echo.

echo 📡 Checking if backend is running on port 3001...
curl -s http://localhost:3001/api/teams >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running!
) else (
    echo ❌ Backend is not running. Please start it with:
    echo    cd backend ^&^& npm run dev
    exit /b 1
)

echo.
echo 🧪 Running API Tests...
echo ----------------------

echo.
echo 📋 Test 1: Getting all teams...
curl -s http://localhost:3001/api/teams

echo.
echo 🏠 Test 2: Getting Gryffindor details...
curl -s http://localhost:3001/api/teams/gryffindor

echo.
echo 👥 Test 3: Gryffindor players...
curl -s http://localhost:3001/api/teams/gryffindor/players

echo.
echo ⚡ Test 4: Gryffindor starting lineup...
curl -s http://localhost:3001/api/teams/gryffindor/lineup

echo.
echo 🎯 Test 5: Gryffindor seekers...
curl -s http://localhost:3001/api/teams/gryffindor/players/seeker

echo.
echo 🎉 Tests completed! Check the JSON responses above.
echo.
echo 📊 What to verify:
echo - Teams: Should show 6 teams with statistics
echo - Players: Gryffindor should have 11 players including Harry Potter
echo - Lineup: Should show 7 starters with positions
echo - Seekers: Should show Harry Potter as starter
echo.
echo 🎮 Ready for frontend integration!
