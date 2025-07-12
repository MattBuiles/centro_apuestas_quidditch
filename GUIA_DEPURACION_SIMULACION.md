# 🔍 Guía de Depuración - Simulación de Partidos

## 🎯 Problema Actual

La simulación de partidos no está funcionando correctamente. No se muestra ningún contenido en la sección de simulación.

## 🔧 Cambios Realizados para Depurar

### 1. 📊 Información de Debug Agregada

**En `MatchOverview.tsx`:**
- ✅ Cuadro de información de debug visible en la UI
- ✅ Muestra estado del backend, datos del partido, equipos
- ✅ Indicadores visuales de qué se está cargando

**En `MatchDetailPage/index.tsx`:**
- ✅ Console.log con información completa del partido
- ✅ Datos de equipos, estado, configuración

**En `LiveMatchViewer.tsx`:**
- ✅ Console.log con información del componente
- ✅ Estado de simulación, eventos, datos recibidos

### 2. 🎮 Cómo Probar

**Pasos para depurar:**

1. **Abrir DevTools** (F12)
2. **Navegar a un partido en estado `live`**
3. **Revisar la información de debug:**
   - En la UI: Cuadro gris con información
   - En Console: Logs detallados

### 3. 📋 Qué Verificar

**En la UI (Cuadro de Debug):**
```
🔍 Debug Info:
• Backend habilitado: [Sí/No]
• Estado del partido: [scheduled/live/finished]
• RealMatch existe: [Sí/No]
• HomeTeam existe: [Sí/No]
• AwayTeam existe: [Sí/No]
• Match ID: [ID del partido]
• Show Live Simulation: [Sí/No]
```

**En Console:**
```javascript
// De MatchDetailPage
🔍 MatchDetailPage Debug Info: {
  match: {...},
  homeTeam: {...},
  awayTeam: {...},
  transformedMatch: {...},
  showLiveSimulation: boolean,
  FEATURES_BACKEND: boolean
}

// De LiveMatchViewer
🔍 LiveMatchViewer Debug Info: {
  match: {...},
  homeTeam: {...},
  awayTeam: {...},
  matchState: {...},
  isSimulating: boolean,
  eventFeed: [...],
  autoRefresh: boolean,
  refreshInterval: number
}
```

### 4. 🔍 Posibles Problemas

**Problema 1: Backend no habilitado**
- Verificar: `Backend habilitado: No`
- Solución: Revisar `.env` → `VITE_USE_BACKEND=true`

**Problema 2: Partido no en estado `live`**
- Verificar: `Estado del partido: scheduled`
- Solución: Usar botón "Al Próximo Partido" para activar

**Problema 3: Datos del partido faltantes**
- Verificar: `RealMatch existe: No`
- Solución: Problema con `getMatchDetails()` - revisar API

**Problema 4: Equipos no encontrados**
- Verificar: `HomeTeam existe: No` / `AwayTeam existe: No`
- Solución: Problema con `getTeams()` - revisar API

**Problema 5: LiveMatchViewer no recibe datos**
- Verificar: Console log de LiveMatchViewer
- Solución: Datos no se pasan correctamente

### 5. 🛠️ Soluciones Rápidas

**Para probar inmediatamente:**

```bash
# 1. Verificar que el backend esté corriendo
cd backend
npm run dev

# 2. Verificar que el frontend esté corriendo
npm run dev

# 3. Verificar variables de entorno
cat .env
```

**Para probar con un partido específico:**

1. Ir a: `http://localhost:3000/matches/[ID_DEL_PARTIDO]`
2. Verificar que el partido esté en estado `live`
3. Revisar información de debug

### 6. 🎯 Próximos Pasos

**Después de revisar la información de debug:**

1. **Si backend está deshabilitado:**
   - Habilitar en `.env`
   - Reiniciar servidor

2. **Si partido no está en `live`:**
   - Usar función "Al Próximo Partido"
   - O cambiar estado manualmente en BD

3. **Si datos faltan:**
   - Verificar conexión con API
   - Revisar logs del backend

4. **Si LiveMatchViewer no aparece:**
   - Verificar que todos los datos estén presentes
   - Revisar errores en Console

### 7. 📱 Reporte de Problemas

**Cuando reportes un problema, incluye:**

1. **Información de la UI:**
   - Captura del cuadro de debug
   - Estado mostrado

2. **Información del Console:**
   - Logs completos de debug
   - Errores si los hay

3. **Configuración:**
   - Contenido del `.env`
   - Estado del backend

4. **Pasos realizados:**
   - Qué navegador usaste
   - Qué partido probaste
   - Qué botones presionaste

## 🎯 Objetivo

Con esta información de debug, podremos identificar exactamente:
- ✅ Qué datos llegan al componente
- ✅ Qué configuración está activa
- ✅ En qué punto falla el flujo
- ✅ Qué corregir para que funcione

**¡Prueba ahora y comparte la información de debug!**
