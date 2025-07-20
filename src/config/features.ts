// Feature flags para migración gradual
export const FEATURES = {
  // Backend features - habilitaremos gradualmente
  USE_BACKEND_TEAMS: import.meta.env.VITE_USE_BACKEND === 'true',
  USE_BACKEND_AUTH: import.meta.env.VITE_USE_BACKEND === 'true',
  USE_BACKEND_MATCHES: import.meta.env.VITE_USE_BACKEND === 'true',
  USE_BACKEND_SEASONS: import.meta.env.VITE_USE_BACKEND === 'true',
  USE_BACKEND_LEAGUE_TIME: import.meta.env.VITE_USE_BACKEND === 'true', // Nuevo - tiempo de liga
  USE_BACKEND_BETS: import.meta.env.VITE_USE_BACKEND === 'true', // Habilitado para integración completa  
  USE_BACKEND_PREDICTIONS: true, // Habilitado para testing
  USE_WEBSOCKETS: true, // Habilitado para simulación de partidos
  
  // API URLs
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3002',
  
  // Development flags
  DEBUG_API: import.meta.env.DEV,
  SHOW_FALLBACK_MESSAGES: import.meta.env.DEV,
};

// Helper to check if backend is available
export const isBackendEnabled = () => {
  return Object.values(FEATURES).some(feature => 
    typeof feature === 'boolean' && feature
  );
};

// Development helper
if (import.meta.env.DEV) {
  console.log('🔧 Feature Flags:', FEATURES);
}
