import React, { useState, useEffect } from 'react';
import { leagueTimeService, LeagueTimeInfo } from '@/services/leagueTimeService';
import { FEATURES } from '@/config/features';
import { Match } from '@/types/league';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/common/Button';
import styles from './LeagueTimeControl.module.css';

interface VirtualTimeControlProps {
  onTimeAdvanced?: (newDate: Date, simulatedMatches: Match[]) => void;
  onSeasonReset?: () => void;
}

/**
 * Component for controlling league time using backend API
 * Replaces local virtual time management
 */
const LeagueTimeControl: React.FC<VirtualTimeControlProps> = ({
  onTimeAdvanced,
  onSeasonReset
}) => {
  const { isBackendAuthenticated } = useAuth();
  const [leagueTimeInfo, setLeagueTimeInfo] = useState<LeagueTimeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeagueTimeInfo = async () => {
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthenticated) {
      setError('Backend de tiempo de liga no disponible. Usando modo local.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const info = await leagueTimeService.getLeagueTimeInfo();
      setLeagueTimeInfo(info);
    } catch (error) {
      console.error('Error loading league time info:', error);
      setError('Error cargando información del tiempo de liga');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthenticated) {
        setError('Backend de tiempo de liga no disponible. Usando modo local.');
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const info = await leagueTimeService.getLeagueTimeInfo();
        setLeagueTimeInfo(info);
      } catch (error) {
        console.error('Error loading league time info:', error);
        setError('Error cargando información del tiempo de liga');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isBackendAuthenticated]);

  const handleAdvanceOneDay = async () => {
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthenticated) {
      setError('Backend de tiempo de liga no disponible. Funcionalidad deshabilitada.');
      return;
    }

    setIsAdvancing(true);
    setError(null);
    try {
      const result = await leagueTimeService.advanceTime({
        days: 1,
        simulateMatches: true
      });

      if (result.success) {
        await loadLeagueTimeInfo(); // Refresh info
        
        // Convert string IDs to Match objects if needed
        const simulatedMatches: Match[] = []; // For now, just an empty array
        onTimeAdvanced?.(new Date(result.newDate), simulatedMatches);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error advancing time:', error);
      setError('Error avanzando el tiempo');
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleAdvanceOneWeek = async () => {
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthenticated) {
      setError('Backend de tiempo de liga no disponible. Funcionalidad deshabilitada.');
      return;
    }

    setIsAdvancing(true);
    setError(null);
    try {
      const result = await leagueTimeService.advanceTime({
        days: 7,
        simulateMatches: true
      });

      if (result.success) {
        await loadLeagueTimeInfo(); // Refresh info
        
        // Convert string IDs to Match objects if needed
        const simulatedMatches: Match[] = []; // For now, just an empty array
        onTimeAdvanced?.(new Date(result.newDate), simulatedMatches);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error advancing time:', error);
      setError('Error avanzando el tiempo');
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleAdvanceToNextMatch = async () => {
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthenticated) {
      setError('Backend de tiempo de liga no disponible. Funcionalidad deshabilitada.');
      return;
    }

    setIsAdvancing(true);
    setError(null);
    try {
      const result = await leagueTimeService.advanceTime({
        toNextMatch: true,
        simulateMatches: false
      });

      if (result.success) {
        await loadLeagueTimeInfo(); // Refresh info
        
        const simulatedMatches: Match[] = []; // For now, just an empty array
        onTimeAdvanced?.(new Date(result.newDate), simulatedMatches);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error advancing time:', error);
      setError('Error avanzando al próximo partido');
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleGenerateNewSeason = async () => {
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthenticated) {
      setError('Backend de tiempo de liga no disponible. Funcionalidad deshabilitada.');
      return;
    }

    setIsAdvancing(true);
    setError(null);
    try {
      const result = await leagueTimeService.generateNewSeason();

      if (result.success) {
        await loadLeagueTimeInfo(); // Refresh info
        onSeasonReset?.();
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error generating new season:', error);
      setError('Error generando nueva temporada');
    } finally {
      setIsAdvancing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!FEATURES.USE_BACKEND_LEAGUE_TIME) {
    return (
      <div className={styles.container}>
        <div className={styles.notice}>
          ⚠️ Control de tiempo de liga no está habilitado
        </div>
      </div>
    );
  }

  if (!isBackendAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.notice}>
          ⚠️ Autenticación con backend requerida para el control de tiempo de liga
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando información del tiempo de liga...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>🕐 Control de Tiempo de Liga</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={loadLeagueTimeInfo}
          disabled={isLoading}
        >
          🔄 Actualizar
        </Button>
      </div>

      {error && (
        <div className={styles.error}>
          ❌ {error}
        </div>
      )}

      {leagueTimeInfo && (
        <div className={styles.content}>
          <div className={styles.currentInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>📅 Fecha actual:</span>
              <span className={styles.value}>
                {formatDate(leagueTimeInfo.currentDate)}
              </span>
            </div>
            
            <div className={styles.infoRow}>
              <span className={styles.label}>🏆 Temporada activa:</span>
              <span className={styles.value}>
                {leagueTimeInfo.activeSeason?.name || 'Ninguna'}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>⚡ Velocidad de tiempo:</span>
              <span className={styles.value}>
                {leagueTimeInfo.timeSpeed}x
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>🤖 Modo automático:</span>
              <span className={styles.value}>
                {leagueTimeInfo.autoMode ? '✅ Activado' : '❌ Desactivado'}
              </span>
            </div>

            {leagueTimeInfo.nextSeasonDate && (
              <div className={styles.infoRow}>
                <span className={styles.label}>📅 Próxima temporada:</span>
                <span className={styles.value}>
                  {formatDate(leagueTimeInfo.nextSeasonDate)}
                  {leagueTimeInfo.daysUntilNextSeason && 
                    ` (en ${leagueTimeInfo.daysUntilNextSeason} días)`
                  }
                </span>
              </div>
            )}
          </div>

          <div className={styles.controls}>
            <Button
              variant="primary"
              onClick={handleAdvanceOneDay}
              disabled={isAdvancing}
            >
              {isAdvancing ? '⏳' : '📅'} Avanzar 1 día
            </Button>

            <Button
              variant="primary"
              onClick={handleAdvanceOneWeek}
              disabled={isAdvancing}
            >
              {isAdvancing ? '⏳' : '📆'} Avanzar 1 semana
            </Button>

            <Button
              variant="secondary"
              onClick={handleAdvanceToNextMatch}
              disabled={isAdvancing}
            >
              {isAdvancing ? '⏳' : '⚽'} Al próximo partido
            </Button>

            <Button
              variant="outline"
              onClick={handleGenerateNewSeason}
              disabled={isAdvancing}
            >
              {isAdvancing ? '⏳' : '🆕'} Nueva temporada
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueTimeControl;
