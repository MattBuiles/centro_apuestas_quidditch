# Solución al Error de Duplicación de Llamadas al Endpoint /finish

## Problema Identificado

### Síntomas
Al finalizar una simulación en vivo de un partido, se producía un error HTTP 400 (Bad Request) en el endpoint `/api/matches/{matchId}/finish`. Los logs mostraban:

```
❌ Request failed: http://localhost:3001/api/matches/{id}/finish HTTP 400: Bad Request
```

### Causa Raíz
Se identificó una **condición de carrera (race condition)** donde el endpoint `/finish` era llamado **dos veces casi simultáneamente**:

1. **Primera llamada**: Desde `endMatch()` cuando el simulador determina que el partido ha terminado
2. **Segunda llamada**: Desde `saveDetailedMatchResult()` cuando el componente `LiveMatchViewer` detecta que el partido terminó

### Flujo del Problema
```
liveMatchSimulator.endMatch()
    ↓
saveMatchToBackend() → [PRIMERA LLAMADA] POST /finish ✅ SUCCESS
    ↓
LiveMatchViewer detecta partido terminado
    ↓  
saveDetailedMatchResult()
    ↓
saveMatchToBackend() → [SEGUNDA LLAMADA] POST /finish ❌ HTTP 400
```

El backend correctamente rechaza la segunda llamada con HTTP 400 porque ya marcó el partido como `finished`, pero esto causaba errores en el frontend.

## Solución Implementada

### 1. Protección Contra Duplicados con Promesas
Se agregó un Map para rastrear promesas de guardado pendientes:

```typescript
private backendSavePromises: Map<string, Promise<void>> = new Map();
```

### 2. Control de Estado de Guardado
Se agregó una bandera al estado del partido para rastrear si ya fue guardado:

```typescript
// En MatchState
backendSaved: boolean
```

### 3. Método saveMatchToBackend Mejorado
Se modificó para verificar promesas existentes antes de hacer nuevas llamadas:

```typescript
private async saveMatchToBackend(matchId: string, ...): Promise<void> {
  // Verificar si ya hay un guardado en progreso
  const existingPromise = this.backendSavePromises.get(matchId);
  if (existingPromise) {
    console.log('⏩ Backend save already in progress, waiting...');
    return existingPromise;
  }

  // Crear y almacenar la promesa
  const savePromise = this.performBackendSave(...);
  this.backendSavePromises.set(matchId, savePromise);

  try {
    await savePromise;
  } finally {
    this.backendSavePromises.delete(matchId);
  }
}
```

### 4. saveDetailedMatchResult Asíncrono
Se convirtió el método a async/await para mejor control del flujo:

```typescript
async saveDetailedMatchResult(...): Promise<void> {
  // Verificar si hay guardado en progreso
  const existingPromise = this.backendSavePromises.get(matchId);
  if (existingPromise) {
    console.log('⏳ Backend save already in progress, waiting...');
    await existingPromise;
    return;
  }
  
  // Solo guardar si no está guardado ya
  if (!estado.backendSaved) {
    await this.saveMatchToBackend(...);
  }
}
```

### 5. Manejo Inteligente de Errores HTTP 400
Se mejoró el manejo de errores para tratar el HTTP 400 como exitoso cuando es apropiado:

```typescript
catch (error) {
  if (error.message.includes('400') || error.message.includes('already finished')) {
    console.log('ℹ️ Match was already finished on backend (expected)');
    estado.backendSaved = true; // Marcar como guardado
  } else {
    throw error; // Re-lanzar otros errores
  }
}
```

### 6. Limpieza de Recursos
Se aseguró que las promesas se limpien correctamente:

```typescript
stopMatch(matchId: string): void {
  // ... código existente ...
  this.backendSavePromises.delete(matchId);
}
```

## Flujo Corregido

```
liveMatchSimulator.endMatch()
    ↓
saveMatchToBackend() → Crear promesa → POST /finish ✅ SUCCESS
    ↓                     ↓
LiveMatchViewer detecta   Marcar backendSaved = true
    ↓                     ↓
saveDetailedMatchResult() → Verificar promesa existente
    ↓
"⏳ Backend save already in progress, waiting..."
    ↓
await promesa existente → ✅ Completado sin duplicar llamada
```

## Beneficios de la Solución

1. **Eliminación de Race Conditions**: Solo una llamada al endpoint `/finish` por partido
2. **Mejor UX**: No hay errores visibles al usuario
3. **Consistencia de Datos**: Evita posibles corrupciones por llamadas duplicadas
4. **Robustez**: Maneja correctamente escenarios asíncronos complejos
5. **Backwards Compatibility**: No rompe funcionalidad existente

## Testing

Se creó un script de prueba (`test-duplicate-finish-fix.js`) que:

1. Simula múltiples llamadas simultáneas al endpoint `/finish`
2. Verifica que solo una sea exitosa
3. Confirma que las demás fallen con HTTP 400 como es esperado
4. Valida que el estado final del partido sea consistente

## Uso

La solución es transparente para el usuario. Los cambios están en:

- `src/services/liveMatchSimulator.ts` (lógica principal)
- `src/components/matches/LiveMatchViewer/LiveMatchViewer.tsx` (llamada asíncrona)

No se requieren cambios en otros componentes o en el backend.

## Monitoreo

Los logs ahora incluyen mensajes informativos como:

```
⏩ Backend save already in progress for match {id}, waiting...
✅ Backend save completed from previous call
ℹ️ Match already saved to backend, skipping duplicate save
```

Esto facilita el debugging y monitoreo del comportamiento del sistema.
