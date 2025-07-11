# Sistema de Tiempo Virtual Centralizado

## 📋 Resumen

Este documento describe la implementación del sistema de tiempo virtual completamente centralizado para el Centro de Apuestas de Quidditch. El sistema garantiza que:

1. **El tiempo virtual se persiste automáticamente** en la base de datos después de cualquier cambio
2. **El frontend se actualiza automáticamente** sin necesidad de botones "Actualizar" manuales
3. **Hay un único lugar de verdad** para el tiempo virtual en el backend

## ✅ Parte 1: Backend — Persistencia del Tiempo Virtual

### 🗄️ Base de Datos

**Nueva tabla `virtual_time_state`:**
```sql
CREATE TABLE IF NOT EXISTS virtual_time_state (
  id TEXT PRIMARY KEY,
  current_date DATETIME NOT NULL,
  active_season_id TEXT,
  time_speed TEXT CHECK(time_speed IN ('slow', 'medium', 'fast')) DEFAULT 'medium',
  auto_mode BOOLEAN DEFAULT FALSE,
  last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (active_season_id) REFERENCES seasons(id)
);
```

### 🔧 VirtualTimeService Mejorado

**Características principales:**
- **Inicialización automática**: Crea estado por defecto si no existe
- **Persistencia garantizada**: Todos los métodos que modifican el tiempo llaman a `saveState()`
- **Logs detallados**: Tracking completo de cambios de estado
- **Único punto de verdad**: Estado global con ID 'global'

**Métodos clave:**
```typescript
// Siempre persiste después del cambio
async advanceTime(options: TimeAdvanceOptions): Promise<AdvanceTimeResult>
async updateSettings(settings: VirtualTimeSettings): Promise<VirtualTimeState>
async setVirtualTime(date: Date): Promise<void>
async resetToRealTime(): Promise<void>

// Persistencia explícita
private async saveState(): Promise<void>
```

### 🔐 Garantías de Persistencia

- ✅ **advanceTime()** → `saveState()` automático
- ✅ **updateSettings()** → `saveState()` automático  
- ✅ **setVirtualTime()** → `saveState()` automático
- ✅ **resetToRealTime()** → `saveState()` automático
- ✅ **initialize()** → Crea estado por defecto si no existe

## 🔁 Parte 2: Frontend — Actualización Automática

### 🚀 LeagueTimeServiceWithRefresh

**Servicio wrapper que añade auto-refresh:**
```typescript
class LeagueTimeServiceWithRefresh {
  // Sistema de callbacks para auto-refresh
  private refreshCallbacks: Array<() => Promise<void>> = [];
  
  // Métodos que automáticamente refrescan la UI
  async advanceTime(options: AdvanceTimeOptions): Promise<AdvanceTimeResult>
  async generateNewSeason(): Promise<GenerateSeasonResult>
  async setTimeSpeed(speed: number): Promise<{ success: boolean; message: string }>
  async setAutoMode(enabled: boolean): Promise<{ success: boolean; message: string }>
}
```

### 🪝 useLeagueTime Hook Mejorado

**Integración con sistema de callbacks:**
```typescript
export const useLeagueTime = () => {
  // Callback auto-registrado que actualiza estado local
  const refreshAfterAction = useCallback(async (): Promise<void> => {
    await refreshLeagueTime();
    setLastUpdateTime(Date.now()); // Fuerza re-render
  }, [refreshLeagueTime]);

  // Auto-registro/desregistro en mount/unmount
  useEffect(() => {
    leagueTimeServiceWithRefresh.registerRefreshCallback(refreshAfterAction);
    return () => {
      leagueTimeServiceWithRefresh.unregisterRefreshCallback(refreshAfterAction);
    };
  }, [refreshAfterAction]);
}
```

### 🎮 LeagueTimeControl Sin Actualizaciones Manuales

**Antes (Manual):**
```typescript
const result = await leagueTimeService.advanceTime(options);
if (result.success) {
  await loadLeagueTimeInfo(); // ❌ Manual refresh
}
```

**Después (Automático):**
```typescript
const result = await leagueTimeServiceWithRefresh.advanceTime(options);
if (result.success) {
  // ✅ Auto-refresh via callbacks - sin código adicional
}
```

## 🎯 Flujo de Actualización Automática

1. **Usuario hace clic** en "Avanzar 1 día"
2. **LeagueTimeControl** llama a `leagueTimeServiceWithRefresh.advanceTime()`
3. **LeagueTimeServiceWithRefresh** llama al servicio original
4. **VirtualTimeService** modifica el tiempo y llama a `saveState()`
5. **Base de datos** se actualiza con el nuevo tiempo
6. **LeagueTimeServiceWithRefresh** activa todos los callbacks registrados
7. **useLeagueTime** recibe el callback y actualiza su estado
8. **Toda la UI** se re-renderiza automáticamente con el nuevo tiempo

## 🔍 Validación del Sistema

### Backend - Verificar Persistencia
```bash
# 1. Iniciar backend
cd backend && npm run dev

# 2. Hacer request de avance de tiempo
curl -X POST http://localhost:3001/api/league-time/advance \
  -H "Content-Type: application/json" \
  -d '{"days": 1}'

# 3. Verificar que se guardó en la base de datos
sqlite3 backend/database/quidditch.db "SELECT * FROM virtual_time_state WHERE id='global';"
```

### Frontend - Verificar Auto-refresh
```bash
# 1. Iniciar frontend
npm run dev

# 2. Abrir DevTools y ir a Console
# 3. Ir a /matches
# 4. Hacer clic en "Avanzar 1 día"
# 5. Verificar logs:
#    "⏰ Advancing time with automatic refresh..."
#    "💾 Saving virtual time state to database:"
#    "✅ Virtual time state saved successfully"
#    "🔄 Triggering automatic refresh after time action..."
#    "⚡ Auto-refreshing after action..."
```

## 📁 Archivos Modificados

### Backend
- `backend/src/database/Database.ts` - Nueva tabla virtual_time_state
- `backend/src/services/VirtualTimeService.ts` - Persistencia mejorada

### Frontend  
- `src/services/leagueTimeServiceWithRefresh.ts` - Nuevo servicio con auto-refresh
- `src/hooks/useLeagueTime.ts` - Integración con callbacks
- `src/components/matches/LeagueTimeControl/LeagueTimeControl.tsx` - Sin refresh manual

## 🚨 Restricciones Cumplidas

- ✅ **No variables temporales**: Todo el tiempo viene de la base de datos
- ✅ **Único lugar de verdad**: Tabla `virtual_time_state` con ID 'global'  
- ✅ **Persistencia automática**: Cada cambio se guarda inmediatamente
- ✅ **Sin botones "Actualizar"**: Auto-refresh transparente
- ✅ **Propagación automática**: Todos los componentes reciben el nuevo tiempo

## 🎉 Resultado Final

**✅ El tiempo virtual real siempre está actualizado en la base de datos**
**✅ El frontend lo consulta automáticamente tras cada acción**  
**✅ Toda la aplicación refleja el nuevo tiempo sin requerir interacción adicional**

El sistema de tiempo virtual está ahora completamente centralizado y automatizado.
