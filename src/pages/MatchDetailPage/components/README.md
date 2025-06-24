# MatchDetailPage Components

Este directorio contiene los subcomponentes extraídos de la página `MatchDetailPage` para mejorar la organización y mantenibilidad del código.

## Estructura de Componentes

### 🔄 MatchOverview
**Archivo**: `MatchOverview.tsx`
**Descripción**: Gestiona la cronología del partido
**Contenido**:
- Estados upcoming, live y finished del partido
- Cronología en tiempo real
- Simulación en vivo
- Resumen del duelo finalizado
- Resultados de predicciones del usuario

### 🔮 MatchPredictions
**Archivo**: `MatchPredictions.tsx`
**Descripción**: Sistema de predicciones mágicas
**Contenido**:
- Interfaz para crear predicciones
- Visualización de predicciones del usuario
- Estadísticas de la comunidad
- Resultados de predicciones para partidos finalizados

### 📊 MatchStats
**Archivo**: `MatchStats.tsx`
**Descripción**: Análisis estadístico de los equipos
**Contenido**:
- Comparación de estadísticas entre equipos
- Visualización de habilidades (ataque, defensa, etc.)
- Medidor de poder mágico total

### 👥 MatchLineups
**Archivo**: `MatchLineups.tsx`
**Descripción**: Formaciones y alineaciones de los equipos
**Contenido**:
- Listado de jugadores por posición
- Información detallada de cada jugador
- Logros y estadísticas individuales
- Visualización del campo de Quidditch

### ⚔️ MatchHeadToHead
**Archivo**: `MatchHeadToHead.tsx`
**Descripción**: Historial de enfrentamientos entre equipos
**Contenido**:
- Registro histórico de partidos
- Estadísticas de enfrentamientos directos
- Encuentros legendarios
- Últimos 5 partidos

### 💰 MatchBetting
**Archivo**: `MatchBetting.tsx`
**Descripción**: Mercados de apuestas (próximamente)
**Contenido**:
- Preview de características de apuestas
- Enlace a página de apuestas detallada
- Validación de permisos de usuario

### 🔍 MatchDetailedAnalysis
**Archivo**: `MatchDetailedAnalysis.tsx`
**Descripción**: Análisis detallado post-partido
**Contenido**:
- Integración con `MatchResultDetail`
- Estadísticas avanzadas de partidos simulados

### ⚡ MatchRelatedMatches
**Archivo**: `MatchRelatedMatches.tsx`
**Descripción**: Próximos duelos mágicos relacionados
**Contenido**:
- Lista de partidos próximos
- Enlaces a detalles de otros partidos

## Principios de Refactorización

✅ **Mantenimiento de la funcionalidad original**: La visualización y comportamiento son idénticos al archivo original.

✅ **Preservación de estilos**: Todos los nombres de clases CSS se mantienen sin cambios.

✅ **Separación de responsabilidades**: Cada componente tiene una responsabilidad específica y bien definida.

✅ **Interfaces claras**: Props tipadas con TypeScript para asegurar la integridad de datos.

✅ **Reutilización**: Los componentes pueden ser reutilizados en otras partes de la aplicación si es necesario.

## Uso

```tsx
import {
  MatchOverview,
  MatchPredictions,
  MatchStats,
  // ... otros componentes
} from './components';

// Los componentes se usan con props específicas
<MatchOverview 
  match={match}
  realMatch={realMatch}
  // ... otras props
/>
```

## Archivos de Respaldo

- `index_original.tsx` - Contiene el archivo original completo antes de la refactorización
- `index.tsx` - Archivo principal refactorizado que utiliza los subcomponentes
