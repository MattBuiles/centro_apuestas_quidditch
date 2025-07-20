import React, { useState, useEffect } from 'react';
import { leagueTimeServiceWithRefresh } from '@/services/leagueTimeServiceWithRefresh';
import { LeagueTimeInfo } from '@/services/leagueTimeService';
import { FEATURES } from '@/config/features';
import { Match } from '@/types/league';
import { useAuth } from '@/context/AuthContext';
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
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  const loadLeagueTimeInfo = async () => {
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthenticated) {
      setError('Backend de tiempo de liga no disponible. Usando modo local.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const info = await leagueTimeServiceWithRefresh.getLeagueTimeInfo();
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
        const info = await leagueTimeServiceWithRefresh.getLeagueTimeInfo();
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
    setLastActionMessage(null);
    try {
      const result = await leagueTimeServiceWithRefresh.advanceTime({
        days: 1,
        simulateMatches: true
      });

      if (result.success) {
        setLastActionMessage(`✅ Tiempo avanzado 1 día. Partidos simulados: ${result.simulatedMatches.length}`);
        
        // Clear message after 3 seconds
        setTimeout(() => setLastActionMessage(null), 3000);
        
        const simulatedMatches: Match[] = [];
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
    setLastActionMessage(null);
    try {
      const result = await leagueTimeServiceWithRefresh.advanceTime({
        days: 7,
        simulateMatches: true
      });

      if (result.success) {
        setLastActionMessage(`✅ Tiempo avanzado 1 semana. Partidos simulados: ${result.simulatedMatches.length}`);
        
        // Clear message after 3 seconds
        setTimeout(() => setLastActionMessage(null), 3000);
        
        const simulatedMatches: Match[] = [];
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

  const isSeasonFinished = (): boolean => {
    if (!leagueTimeInfo?.activeSeason?.matches) return false;
    
    const allMatches = leagueTimeInfo.activeSeason.matches;
    return allMatches.length > 0 && allMatches.every(match => match.status === 'finished');
  };

  const handleStartNextSeason = async () => {
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthenticated) {
      setError('Backend de tiempo de liga no disponible. Funcionalidad deshabilitada.');
      return;
    }

    setIsAdvancing(true);
    setError(null);
    setLastActionMessage(null);
    try {
      const result = await leagueTimeServiceWithRefresh.generateNewSeason();

      if (result.success && result.season) {
        setLastActionMessage(`✅ Nueva temporada iniciada: ${result.season.name}`);
        
        // Clear message after 3 seconds
        setTimeout(() => setLastActionMessage(null), 3000);
        
        // Wait a moment for backend to fully process the new season
        console.log('⏳ Waiting for backend to process new season...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Trigger season reset callback
        console.log('🔄 Triggering onSeasonReset callback...');
        onSeasonReset?.();
      } else {
        setError(result.message || 'Error iniciando nueva temporada');
      }
    } catch (error) {
      console.error('Error starting next season:', error);
      setError('Error iniciando nueva temporada');
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
    setLastActionMessage(null);
    try {
      const result = await leagueTimeServiceWithRefresh.advanceToNextUnplayedMatch();

      if (result.success) {
        const simulatedCount = result.simulatedMatches ? result.simulatedMatches.length : 0;
        const baseMessage = `✅ Navegado al próximo partido: ${new Date(result.newDate).toLocaleDateString('es-ES')}`;
        const simulatedMessage = simulatedCount > 0 ? ` Se simularon automáticamente ${simulatedCount} partidos en vivo.` : '';
        
        setLastActionMessage(baseMessage + simulatedMessage);
        
        // Clear message after 5 seconds
        setTimeout(() => setLastActionMessage(null), 5000);
        
        // Create array of simulated matches for callback
        const simulatedMatches: Match[] = [];
        onTimeAdvanced?.(new Date(result.newDate), simulatedMatches);
      } else {
        setError(result.message || 'No se encontraron partidos pendientes');
      }
    } catch (error) {
      console.error('Error advancing to next match:', error);
      setError('Error navegando al próximo partido');
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleSimulateCompleteSeason = async () => {
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthenticated) {
      setError('Backend de tiempo de liga no disponible. Funcionalidad deshabilitada.');
      return;
    }

    setIsAdvancing(true);
    setError(null);
    setLastActionMessage(null);
    try {
      const result = await leagueTimeServiceWithRefresh.simulateCompleteSeason();

      if (result.success) {
        setLastActionMessage(`✅ Temporada completa simulada. Partidos simulados: ${result.simulatedMatches.length}`);
        
        // Clear message after 5 seconds
        setTimeout(() => setLastActionMessage(null), 5000);
        
        const simulatedMatches: Match[] = [];
        onTimeAdvanced?.(new Date(result.newDate), simulatedMatches);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error simulating complete season:', error);
      setError('Error simulando temporada completa');
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME || !isBackendAuthenticated) {
      setError('Backend de tiempo de liga no disponible. Funcionalidad deshabilitada.');
      return;
    }

    // Confirm action
    const confirmed = window.confirm(
      '⚠️ ¿Estás seguro de que quieres resetear la base de datos para una nueva temporada?\n\n' +
      'Esto eliminará:\n' +
      '• Todos los partidos y eventos\n' +
      '• Todas las apuestas y predicciones\n' +
      '• Estadísticas de temporadas anteriores\n' +
      '• Reiniciará los saldos de usuarios\n' +
      '• Regresará el tiempo virtual al 15 de julio (antes de iniciar la temporada)\n\n' +
      'Esta acción NO se puede deshacer.'
    );

    if (!confirmed) return;

    setIsAdvancing(true);
    setError(null);
    setLastActionMessage(null);
    try {
      const result = await leagueTimeServiceWithRefresh.resetDatabaseForNewSeason(false);

      // The result is now the data directly, not wrapped in success property
      setLastActionMessage(`✅ Base de datos reseteada completamente. Nueva temporada: ${result.newSeason?.name || 'Temporada creada'}. Partidos generados: ${result.stats?.matchesGenerated || 0}. Tiempo virtual reiniciado al 15 de julio.`);
      
      // Clear message after 10 seconds (longer message)
      setTimeout(() => setLastActionMessage(null), 10000);
      
      // Trigger season reset callback
      onSeasonReset?.();
    } catch (error) {
      console.error('Error resetting database:', error);
      setError('Error reseteando la base de datos');
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
        <button
          className={styles.btnOutline}
          onClick={loadLeagueTimeInfo}
          disabled={isLoading}
        >
          🔄 Actualizar
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          ❌ {error}
        </div>
      )}

      {lastActionMessage && (
        <div className={styles.success}>
          {lastActionMessage}
        </div>
      )}

      {leagueTimeInfo && (
        <div className={styles.content}>
          <div className={styles.currentInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>📅 Fecha actual del tiempo virtual:</span>
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
            <button
              className={styles.btnPrimary}
              onClick={handleAdvanceOneDay}
              disabled={isAdvancing}
            >
              {isAdvancing ? '⏳' : '📅'} Avanzar 1 Día
            </button>

            <button
              className={styles.btnPrimary}
              onClick={handleAdvanceOneWeek}
              disabled={isAdvancing}
            >
              {isAdvancing ? '⏳' : '📆'} Avanzar 1 Semana
            </button>

            <button
              className={styles.btnPrimary}
              onClick={handleAdvanceToNextMatch}
              disabled={isAdvancing}
            >
              {isAdvancing ? '⏳' : '⚽'} Ir al Próximo Partido
            </button>

            <button
              className={styles.btnDanger}
              onClick={handleSimulateCompleteSeason}
              disabled={isAdvancing}
            >
              {isAdvancing ? '⏳' : '🎯'} Simular Resto de Temporada
            </button>

            <button
              className={styles.btnOutline}
              onClick={handleResetDatabase}
              disabled={isAdvancing}
            >
              {isAdvancing ? '⏳' : '🔄'} Resetear Base de Datos
            </button>
          </div>

          {isSeasonFinished() && (
            <div className={styles.seasonFinished}>
              <p>¡La temporada ha finalizado!</p>
              <button
                className={styles.btnSecondary}
                onClick={handleStartNextSeason}
                disabled={isAdvancing}
              >
                {isAdvancing ? '⏳' : '🆕'} Iniciar Nueva Temporada
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeagueTimeControl;
