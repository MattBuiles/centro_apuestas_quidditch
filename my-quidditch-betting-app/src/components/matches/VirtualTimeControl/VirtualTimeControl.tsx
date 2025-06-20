import React, { useState, useEffect } from 'react';
import { virtualTimeManager, VirtualTimeState } from '@/services/virtualTimeManager';
import { Match } from '@/types/league';
import Button from '@/components/common/Button';
import styles from './VirtualTimeControl.module.css';

interface VirtualTimeControlProps {
  onTimeAdvanced?: (newDate: Date, simulatedMatches: Match[]) => void;
  onSeasonReset?: () => void;
}

/**
 * Component for controlling virtual time in the league simulation
 * Following the interactive mode approach
 */
const VirtualTimeControl: React.FC<VirtualTimeControlProps> = ({
  onTimeAdvanced,
  onSeasonReset
}) => {
  const [timeState, setTimeState] = useState<VirtualTimeState | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [lastAdvanceResult, setLastAdvanceResult] = useState<{
    partidosSimulados: Match[];
    nuevaFecha: Date;
  } | null>(null);

  useEffect(() => {
    updateTimeState();
  }, []);

  const updateTimeState = () => {
    const state = virtualTimeManager.getState();
    setTimeState(state);
  };

  const handleAvanceUnDia = async () => {
    setIsAdvancing(true);
    try {
      const resultado = await virtualTimeManager.avanzarTiempo({
        dias: 1,
        simularPartidosPendientes: true
      });

      setLastAdvanceResult({
        partidosSimulados: resultado.partidosSimulados,
        nuevaFecha: resultado.nuevaFecha
      });

      updateTimeState();
      onTimeAdvanced?.(resultado.nuevaFecha, resultado.partidosSimulados);

    } catch (error) {
      console.error('Error avanzando tiempo:', error);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleAvanceUnaSemana = async () => {
    setIsAdvancing(true);
    try {
      const resultado = await virtualTimeManager.avanzarTiempo({
        dias: 7,
        simularPartidosPendientes: true
      });

      setLastAdvanceResult({
        partidosSimulados: resultado.partidosSimulados,
        nuevaFecha: resultado.nuevaFecha
      });

      updateTimeState();
      onTimeAdvanced?.(resultado.nuevaFecha, resultado.partidosSimulados);

    } catch (error) {
      console.error('Error avanzando tiempo:', error);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleAvanceHastaProximoPartido = async () => {
    setIsAdvancing(true);
    try {
      const resultado = await virtualTimeManager.avanzarTiempo({
        hastaProximoPartido: true,
        simularPartidosPendientes: true
      });

      setLastAdvanceResult({
        partidosSimulados: resultado.partidosSimulados,
        nuevaFecha: resultado.nuevaFecha
      });

      updateTimeState();
      onTimeAdvanced?.(resultado.nuevaFecha, resultado.partidosSimulados);

    } catch (error) {
      console.error('Error avanzando tiempo:', error);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleSimularTemporadaCompleta = async () => {
    setIsAdvancing(true);
    try {
      const resultado = await virtualTimeManager.simularTemporadaCompleta();

      setLastAdvanceResult({
        partidosSimulados: resultado.partidosSimulados,
        nuevaFecha: resultado.fechaFinal
      });

      updateTimeState();
      onTimeAdvanced?.(resultado.fechaFinal, resultado.partidosSimulados);

    } catch (error) {
      console.error('Error simulando temporada:', error);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleReiniciarTempo = () => {
    virtualTimeManager.reiniciarTiempo();
    setLastAdvanceResult(null);
    updateTimeState();
    onSeasonReset?.();
  };

  const formatFecha = (fecha: Date) => {
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProximosPartidos = () => {
    return virtualTimeManager.getPartidosProximos(3);
  };

  if (!timeState || !timeState.temporadaActiva) {
    return (
      <div className={styles.noSeason}>
        <h3>⏰ Control de Tiempo Virtual</h3>
        <p>No hay temporada activa. Inicia una temporada para controlar el tiempo.</p>
      </div>
    );
  }

  const proximosPartidos = getProximosPartidos();
  const partidosHoy = virtualTimeManager.getPartidosHoy();
  const totalPartidos = timeState.temporadaActiva.partidos.length;
  const partidosSimulados = timeState.partidosSimulados.size;
  const progreso = Math.round((partidosSimulados / totalPartidos) * 100);

  return (
    <div className={styles.timeControlContainer}>
      {/* Estado actual del tiempo */}
      <div className={styles.currentTimeSection}>
        <h3 className={styles.title}>⏰ Control de Tiempo Virtual</h3>
        
        <div className={styles.timeDisplay}>
          <div className={styles.currentDate}>
            <span className={styles.dateLabel}>Fecha Virtual Actual:</span>
            <span className={styles.dateValue}>
              {formatFecha(timeState.fechaVirtualActual)}
            </span>
          </div>
          
          <div className={styles.progressSection}>
            <div className={styles.progressLabel}>
              Progreso de la Temporada: {partidosSimulados}/{totalPartidos} partidos ({progreso}%)
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Controles de tiempo */}
      <div className={styles.controlsSection}>
        <h4 className={styles.controlsTitle}>Controles de Avance</h4>
        
        <div className={styles.controlButtons}>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAvanceUnDia}
            isLoading={isAdvancing}
            disabled={isAdvancing}
          >
            📅 Avanzar 1 Día
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleAvanceUnaSemana}
            isLoading={isAdvancing}
            disabled={isAdvancing}
          >
            📅 Avanzar 1 Semana
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleAvanceHastaProximoPartido}
            isLoading={isAdvancing}
            disabled={isAdvancing || proximosPartidos.length === 0}
          >
            ⚡ Hasta Próximo Partido
          </Button>

          <Button
            variant="magical"
            size="sm"
            onClick={handleSimularTemporadaCompleta}
            isLoading={isAdvancing}
            disabled={isAdvancing || proximosPartidos.length === 0}
          >
            🏆 Simular Temporada Completa
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReiniciarTempo}
            disabled={isAdvancing}
          >
            🔄 Reiniciar Temporada
          </Button>
        </div>
      </div>

      {/* Información de partidos */}
      <div className={styles.matchesInfo}>
        {/* Partidos de hoy */}
        {partidosHoy.length > 0 && (
          <div className={styles.todayMatches}>
            <h5>🏟️ Partidos de Hoy ({partidosHoy.length})</h5>
            <div className={styles.matchesList}>
              {partidosHoy.map(partido => (
                <div key={partido.id} className={styles.matchItem}>
                  <span className={styles.teams}>
                    {timeState.temporadaActiva?.equipos.find(t => t.id === partido.localId)?.name} vs{' '}
                    {timeState.temporadaActiva?.equipos.find(t => t.id === partido.visitanteId)?.name}
                  </span>
                  <span className={styles.time}>
                    {new Date(partido.fecha).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  <span className={`${styles.status} ${styles[partido.status]}`}>
                    {partido.status === 'finished' ? '✅' : 
                     partido.status === 'live' ? '🔴' : '⏳'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próximos partidos */}
        {proximosPartidos.length > 0 && (
          <div className={styles.upcomingMatches}>
            <h5>📅 Próximos Partidos</h5>
            <div className={styles.matchesList}>
              {proximosPartidos.map(partido => (
                <div key={partido.id} className={styles.matchItem}>
                  <span className={styles.teams}>
                    {timeState.temporadaActiva?.equipos.find(t => t.id === partido.localId)?.name} vs{' '}
                    {timeState.temporadaActiva?.equipos.find(t => t.id === partido.visitanteId)?.name}
                  </span>
                  <span className={styles.date}>
                    {new Date(partido.fecha).toLocaleDateString('es-ES', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resultado del último avance */}
      {lastAdvanceResult && lastAdvanceResult.partidosSimulados.length > 0 && (
        <div className={styles.lastResults}>
          <h5>📊 Últimos Resultados Simulados</h5>
          <div className={styles.resultsList}>
            {lastAdvanceResult.partidosSimulados.slice(0, 5).map(partido => (
              <div key={partido.id} className={styles.resultItem}>
                <span className={styles.teams}>
                  {timeState.temporadaActiva?.equipos.find(t => t.id === partido.localId)?.name} 
                  <span className={styles.score}>{partido.homeScore} - {partido.awayScore}</span>
                  {timeState.temporadaActiva?.equipos.find(t => t.id === partido.visitanteId)?.name}
                </span>
                {partido.snitchCaught && <span className={styles.snitch}>✨ Snitch</span>}
              </div>
            ))}
            {lastAdvanceResult.partidosSimulados.length > 5 && (
              <div className={styles.moreResults}>
                +{lastAdvanceResult.partidosSimulados.length - 5} partidos más...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sin partidos restantes */}
      {proximosPartidos.length === 0 && (
        <div className={styles.seasonComplete}>
          <h4>🏆 ¡Temporada Completada!</h4>
          <p>Todos los partidos han sido simulados.</p>
        </div>
      )}
    </div>
  );
};

export default VirtualTimeControl;
