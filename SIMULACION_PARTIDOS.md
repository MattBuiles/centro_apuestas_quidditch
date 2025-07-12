# 🎯 Sistema de Simulación Manual de Partidos

## 📋 Funcionalidad Implementada

Se ha implementado un sistema completo para simular manualmente partidos en vivo, reutilizando el componente existente en el subapartado **"Resumen"** del detalle del partido.

## 🏗️ Arquitectura del Sistema

### 🔧 Backend Implementation

#### 1. **MatchSimulationService** (`backend/src/services/MatchSimulationService.ts`)
- **Funcionalidad**: Maneja toda la lógica de simulación de partidos
- **Características**:
  - Simulación en tiempo real con eventos paso a paso
  - Generación aleatoria de eventos (goles, faltas, captura de snitch)
  - Integración con WebSocket para actualizaciones en tiempo real
  - Persistencia de eventos en base de datos

#### 2. **Nuevos Endpoints** (`backend/src/routes/matches.ts`)
- **POST `/api/matches/:id/iniciar-simulacion`**: Inicia la simulación manual
- **GET `/api/matches/:id/simulation-status`**: Obtiene el estado de la simulación

#### 3. **Database Extensions** (`backend/src/database/Database.ts`)
- **Nuevos métodos**:
  - `updateMatchStatus()`: Actualiza el estado del partido
  - `updateMatchScore()`: Actualiza marcador en tiempo real
  - `createMatchEvent()`: Crea eventos del partido
  - `getMatchEvents()`: Obtiene eventos del partido
  - `updateMatchSnitchCaught()`: Marca captura de snitch

#### 4. **WebSocket Integration** (`backend/src/index.ts`)
- Conexión automática entre `MatchSimulationService` y `WebSocketService`
- Transmisión en tiempo real de eventos del partido

### 🎨 Frontend Implementation

#### 1. **MatchOverview Component** (`src/pages/MatchDetailPage/components/MatchOverview.tsx`)
- **Botón "Iniciar Simulación"**: Aparece solo para partidos no jugados
- **Integración WebSocket**: Recibe actualizaciones en tiempo real
- **Estados visuales**: Diferentes vistas según el estado del partido

#### 2. **Estilos CSS** (`src/pages/MatchDetailPage/components/MatchOverview.module.css`)
- **Botón animado**: Con efectos visuales y hover
- **Diseño responsivo**: Optimizado para móviles y desktop
- **Tema mágico**: Consistente con el diseño del proyecto

## 🚀 Flujo de Funcionamiento

### 1. **Estado Inicial**
- El partido tiene status `scheduled` (programado)
- En el **subapartado "Resumen"** aparece el botón **"Iniciar Simulación"**

### 2. **Inicio de Simulación**
- Usuario hace clic en "Iniciar Simulación"
- Frontend envía POST a `/api/matches/:id/iniciar-simulacion`
- Backend cambia estado a `live` e inicia simulación

### 3. **Simulación en Tiempo Real**
- Se generan eventos aleatorios cada 2-8 segundos
- Cada evento se guarda en base de datos
- WebSocket transmite eventos al frontend
- Frontend actualiza la interfaz automáticamente

### 4. **Finalización**
- Al capturar la snitch, el partido termina
- Estado cambia a `finished`
- Se muestra el resumen final del partido

## 🎯 Características Técnicas

### ✅ Funcionalidades Implementadas

1. **✅ Verificación de Estados**
   - Solo partidos `scheduled` pueden ser simulados
   - Partidos `finished` muestran resumen estático
   - Partidos `live` continúan la simulación

2. **✅ Eventos Realistas**
   - Goles de Quaffle (10 puntos)
   - Faltas y infracciones (0 puntos)
   - Captura de Snitch (150 puntos + fin del partido)

3. **✅ Tiempo Real**
   - WebSocket para actualizaciones instantáneas
   - Delays realistas entre eventos (2-8 segundos)
   - Visualización en vivo del marcador

4. **✅ Persistencia**
   - Todos los eventos se guardan en base de datos
   - Cronología completa del partido
   - Marcadores y estadísticas persistentes

5. **✅ Reutilización de Componentes**
   - Usa el componente `MatchOverview` existente
   - Mantiene el diseño y UX consistentes
   - Fallback a comportamiento anterior si backend no disponible

## 🔧 Configuración y Uso

### Prerequisitos
- Backend ejecutándose en puerto 3001
- WebSocket server en puerto 3002
- Variable `VITE_USE_BACKEND=true` en frontend

### Uso
1. Navegar a detalle de partido programado
2. Ir al subapartado "Resumen"
3. Hacer clic en "Iniciar Simulación"
4. Observar la simulación en tiempo real
5. El partido se marca como terminado automáticamente

## 🛡️ Validaciones y Seguridad

### Backend
- ✅ Verificación de existencia del partido
- ✅ Validación de estado del partido
- ✅ Manejo de errores en simulación
- ✅ Transacciones de base de datos

### Frontend
- ✅ Validación de conectividad WebSocket
- ✅ Manejo de errores de API
- ✅ Estados de carga y feedback visual
- ✅ Fallback a comportamiento anterior

## 📱 Diseño Responsivo

- **Desktop**: Botón completo con animaciones
- **Tablet**: Botón adaptado con iconos más pequeños
- **Móvil**: Botón full-width optimizado

## 🎨 Tema Visual

- **Colores**: Verde esmeralda para botón de simulación
- **Animaciones**: Efectos mágicos consistentes con el proyecto
- **Iconos**: Rayos ⚡ y targets 🎯 para identificar simulación
- **Feedback**: Indicadores visuales de estado en tiempo real

## 🔮 Funcionalidades Futuras

- **Simulación pausable**: Poder pausar/reanudar
- **Velocidad configurable**: Ajustar velocidad de eventos
- **Eventos personalizados**: Definir tipos de eventos específicos
- **Multijugador**: Varios usuarios viendo la misma simulación
- **Análisis avanzado**: Estadísticas detalladas post-simulación

## 🐛 Troubleshooting

### Problemas Comunes

1. **WebSocket no conecta**
   - Verificar que el backend esté ejecutándose
   - Comprobar puerto 3002 disponible

2. **Botón no aparece**
   - Verificar `VITE_USE_BACKEND=true`
   - Confirmar que el partido tenga status `scheduled`

3. **Simulación no inicia**
   - Revisar logs del backend
   - Verificar conexión a base de datos

### Logs Útiles
```bash
# Backend
🔌 WebSocket server running on port 3002
✅ Match simulation started successfully

# Frontend
🔌 Connected to WebSocket for live updates
✅ Match simulation started successfully
```

---

**Estado**: ✅ **IMPLEMENTACIÓN COMPLETA**  
**Fecha**: Julio 2025  
**Versión**: Sistema de Simulación Manual v1.0
