import { useState, useEffect, useCallback } from 'react';
import { leagueTimeService, LeagueTimeInfo } from '@/services/leagueTimeService';
import { leagueTimeServiceWithRefresh } from '@/services/leagueTimeServiceWithRefresh';
import { FEATURES } from '@/config/features';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook personalizado para manejar el tiempo de liga de manera automática
 * Centraliza la lógica de actualización y sincronización del tiempo
 */
export const useLeagueTime = () => {
  const { isBackendAuthenticated } = useAuth();
  const [leagueTimeInfo, setLeagueTimeInfo] = useState<LeagueTimeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

  // Función para actualizar la información del tiempo de liga
  const refreshLeagueTime = useCallback(async () => {
    console.log('🔄 refreshLeagueTime called');
    console.log('FEATURES.USE_BACKEND_LEAGUE_TIME:', FEATURES.USE_BACKEND_LEAGUE_TIME);
    console.log('isBackendAuthenticated:', isBackendAuthenticated);
    
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME) {
      setError('Backend de tiempo de liga no disponible.');
      console.log('❌ Backend not available');
      return null;
    }

    // En desarrollo, permitir el acceso sin autenticación 
    if (!isBackendAuthenticated && !import.meta.env.DEV) {
      setError('Autenticación requerida.');
      console.log('❌ Authentication required');
      return null;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📡 Calling leagueTimeService.getLeagueTimeInfo()...');
      const info = await leagueTimeService.getLeagueTimeInfo();
      console.log('✅ League time info received:', info);
      setLeagueTimeInfo(info);
      setLastUpdateTime(Date.now());
      return info;
    } catch (error) {
      console.error('❌ Error loading league time info:', error);
      setError('Error cargando información del tiempo de liga');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isBackendAuthenticated]);

  // Auto-refresh cuando hay cambios significativos en el tiempo
  const refreshAfterAction = useCallback(async (): Promise<void> => {
    console.log('⚡ Auto-refreshing after action...');
    await refreshLeagueTime();
    // Triggerar un re-render forzado actualizando el timestamp
    setLastUpdateTime(Date.now());
  }, [refreshLeagueTime]);

  // Función para forzar una actualización
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refreshing league time...');
    return await refreshLeagueTime();
  }, [refreshLeagueTime]);

  // Cargar datos inicial
  useEffect(() => {
    refreshLeagueTime();
    
    // Register auto-refresh callback with the enhanced service
    leagueTimeServiceWithRefresh.registerRefreshCallback(refreshAfterAction);
    
    // Cleanup on unmount
    return () => {
      leagueTimeServiceWithRefresh.unregisterRefreshCallback(refreshAfterAction);
    };
  }, [refreshLeagueTime, refreshAfterAction]);

  // Obtener la fecha actual de liga como objeto Date
  const getCurrentLeagueDate = useCallback(() => {
    if (!leagueTimeInfo?.currentDate) {
      return new Date();
    }
    return new Date(leagueTimeInfo.currentDate);
  }, [leagueTimeInfo]);

  // Verificar si hay temporada activa
  const hasActiveSeason = useCallback(() => {
    return !!leagueTimeInfo?.activeSeason;
  }, [leagueTimeInfo]);

  return {
    leagueTimeInfo,
    isLoading,
    error,
    refreshLeagueTime,
    refreshAfterAction,
    forceRefresh,
    getCurrentLeagueDate,
    hasActiveSeason,
    lastUpdateTime,
    isBackendAvailable: FEATURES.USE_BACKEND_LEAGUE_TIME && (isBackendAuthenticated || import.meta.env.DEV)
  };
};
