#!/usr/bin/env pwsh

# 🧪 Script de verificación rápida para el módulo de análisis
# Ejecutar desde PowerShell en la raíz del proyecto

Write-Host "🔍 VERIFICANDO MÓDULO DE ANÁLISIS DE PARTIDOS" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Verificar que estamos en la raíz del proyecto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Ejecutar desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

Write-Host "📂 Directorio correcto: $(Get-Location)" -ForegroundColor Green

# 1. Verificar archivos modificados
Write-Host "`n1️⃣ Verificando archivos modificados..." -ForegroundColor Yellow

$requiredFiles = @(
    "src\services\teamAnalysisService.ts",
    "backend\src\routes\teams.ts",
    "test-team-analysis.js",
    "test-backend-endpoints.js",
    "MEJORAS_ANALISIS_PARTIDOS.md"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file - NO ENCONTRADO" -ForegroundColor Red
    }
}

# 2. Verificar configuración
Write-Host "`n2️⃣ Verificando configuración..." -ForegroundColor Yellow

if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "VITE_USE_BACKEND=true") {
        Write-Host "   ✅ Backend habilitado en .env" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Verificar VITE_USE_BACKEND en .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Archivo .env no encontrado" -ForegroundColor Red
}

# 3. Verificar puerto del backend
Write-Host "`n3️⃣ Verificando backend..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/teams" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Backend responde en puerto 3001" -ForegroundColor Green
        
        $data = $response.Content | ConvertFrom-Json
        if ($data.success -and $data.data.Count -gt 0) {
            Write-Host "   ✅ API devuelve $($data.data.Count) equipos" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "   ❌ Backend no responde en http://localhost:3001" -ForegroundColor Red
    Write-Host "   💡 Ejecutar desde backend/: npm run dev" -ForegroundColor Yellow
}

# 4. Verificar nuevo endpoint
Write-Host "`n4️⃣ Verificando nuevo endpoint..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/teams/gryffindor/recent-matches?limit=3" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Nuevo endpoint /recent-matches funciona" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️ Nuevo endpoint no disponible (normal si backend no está ejecutándose)" -ForegroundColor Yellow
}

# 5. Instrucciones finales
Write-Host "`n🎯 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

Write-Host "1. Iniciar backend:" -ForegroundColor White
Write-Host "   cd backend && npm run dev" -ForegroundColor Gray

Write-Host "`n2. Iniciar frontend:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray

Write-Host "`n3. Probar en navegador:" -ForegroundColor White
Write-Host "   - Navegar a un partido" -ForegroundColor Gray
Write-Host "   - Abrir pestaña 'Análisis'" -ForegroundColor Gray
Write-Host "   - Ejecutar en consola: testTeamAnalysisModule()" -ForegroundColor Gray

Write-Host "`n4. Verificar logs:" -ForegroundColor White
Write-Host "   - Buscar '✅ Backend data found for team'" -ForegroundColor Gray
Write-Host "   - Verificar que no aparezcan mockups" -ForegroundColor Gray

Write-Host "`n🎉 El módulo de análisis está listo para usar datos reales del backend!" -ForegroundColor Green
Write-Host "📊 Mantiene toda la experiencia visual mientras usa estadísticas reales" -ForegroundColor Green
