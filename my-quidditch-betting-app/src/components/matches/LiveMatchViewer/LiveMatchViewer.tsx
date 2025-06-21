import React, { useState, useEffect, useCallback } from 'react';
import { MatchState, GameEvent, Match, Team } from '@/types/league';
import { liveMatchSimulator } from '@/services/liveMatchSimulator';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import TeamLogo from '@/components/teams/TeamLogo';
import styles from './LiveMatchViewer.module.css';

interface LiveMatchViewerProps {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
  onMatchEnd?: (matchState: MatchState) => void;
}

/**
 * Component for live match simulation
 * Following schema: "Simulación en vivo: feed de eventos minuto a minuto"
 */
const LiveMatchViewer: React.FC<LiveMatchViewerProps> = ({
  match,
  homeTeam,
  awayTeam,
  autoRefresh = true,
  refreshInterval = 3, // 3 second updates for better UX during live matches
  onMatchEnd
}) => {
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [eventFeed, setEventFeed] = useState<GameEvent[]>([]);
  const [lastEventCount, setLastEventCount] = useState(0);

  const updateMatchState = useCallback(() => {
    const currentState = liveMatchSimulator.getMatchState(match.id);
    if (currentState) {
      setMatchState(currentState);
      
      // Check for new events
      if (currentState.eventos.length > lastEventCount) {
        setEventFeed([...currentState.eventos].reverse()); // Show newest first
        setLastEventCount(currentState.eventos.length);
      }

      // Check if match ended
      if (!currentState.isActive && isSimulating) {
        setIsSimulating(false);
        if (onMatchEnd) {
          onMatchEnd(currentState);
        }
      }
    }
  }, [match.id, lastEventCount, isSimulating, onMatchEnd]);

  useEffect(() => {
    if (isSimulating && autoRefresh) {
      const interval = setInterval(updateMatchState, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [isSimulating, autoRefresh, refreshInterval, updateMatchState]);

  const startSimulation = () => {
    const initialState = liveMatchSimulator.startLiveMatch(
      match,
      homeTeam,
      awayTeam,
      90 // 90 minutes duration
    );
    
    setMatchState(initialState);
    setIsSimulating(true);
    setEventFeed([]);
    setLastEventCount(0);
  };

  const stopSimulation = () => {
    liveMatchSimulator.stopMatch(match.id);
    setIsSimulating(false);
  };

  const getEventIcon = (eventType: string): string => {
    switch (eventType) {
      case 'QUAFFLE_GOAL':
        return '⚽';
      case 'SNITCH_CAUGHT':
        return '✨';
      case 'BLUDGER_HIT':
        return '💥';
      case 'FOUL_BLAGGING':
      case 'FOUL_COBBING':
        return '⚠️';
      case 'QUAFFLE_SAVE':
        return '🛡️';
      case 'SNITCH_SPOTTED':
        return '👁️';
      default:
        return '📝';
    }
  };

  const getEventClass = (eventType: string): string => {
    switch (eventType) {
      case 'QUAFFLE_GOAL':
        return styles.goalEvent;
      case 'SNITCH_CAUGHT':
        return styles.snitchEvent;
      case 'FOUL_BLAGGING':
      case 'FOUL_COBBING':
        return styles.foulEvent;
      case 'BLUDGER_HIT':
        return styles.bludgerEvent;
      default:
        return styles.normalEvent;
    }
  };

  const formatMatchTime = (minute: number): string => {
    return `${minute}'`;
  };

  const getTeamName = (teamId: string): string => {
    if (teamId === homeTeam.id) return homeTeam.name;
    if (teamId === awayTeam.id) return awayTeam.name;
    return 'Unknown Team';
  };

  if (!matchState && !isSimulating) {
    return (
      <Card className={styles.liveMatchCard}>
        <div className={styles.matchHeader}>
          <h2 className={styles.matchTitle}>Simulación de Partido en Vivo</h2>
          
          <div className={styles.teamsPreview}>
            <div className={styles.teamPreview}>
              <TeamLogo teamName={homeTeam.name} size="lg" />
              <span className={styles.teamName}>{homeTeam.name}</span>
            </div>
            
            <div className={styles.vsIndicator}>VS</div>
            
            <div className={styles.teamPreview}>
              <TeamLogo teamName={awayTeam.name} size="lg" />
              <span className={styles.teamName}>{awayTeam.name}</span>
            </div>
          </div>
          
          <div className={styles.startControls}>
            <Button onClick={startSimulation} variant="primary" size="lg">
              Comenzar Simulación
            </Button>
            <p className={styles.simulationNote}>
              La simulación seguirá el progreso minuto a minuto con eventos en tiempo real
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={styles.liveMatchCard}>
      {/* Match Header */}
      <div className={styles.matchHeader}>
        <div className={styles.liveIndicator}>
          <span className={styles.liveDot}></span>
          EN VIVO
        </div>
        
        <div className={styles.matchTime}>
          {matchState && formatMatchTime(matchState.minuto)}
        </div>
      </div>

      {/* Score Display */}
      <div className={styles.scoreBoard}>
        <div className={styles.teamScore}>
          <TeamLogo teamName={homeTeam.name} size="md" />
          <div className={styles.teamInfo}>
            <span className={styles.teamName}>{homeTeam.name}</span>
            <span className={styles.score}>{matchState?.golesLocal || 0}</span>
          </div>
        </div>

        <div className={styles.scoreVs}>
          <span className={styles.vsText}>-</span>
          {matchState?.snitchVisible && (
            <div className={styles.snitchIndicator}>
              ✨ Snitch Visible
            </div>
          )}
        </div>

        <div className={styles.teamScore}>
          <div className={styles.teamInfo}>
            <span className={styles.teamName}>{awayTeam.name}</span>
            <span className={styles.score}>{matchState?.golesVisitante || 0}</span>
          </div>
          <TeamLogo teamName={awayTeam.name} size="md" />
        </div>
      </div>

      {/* Match Stats */}
      <div className={styles.matchStats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Duración</span>
          <span className={styles.statValue}>
            {matchState ? `${matchState.minuto} min` : '0 min'}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Eventos</span>
          <span className={styles.statValue}>{eventFeed.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Espectadores</span>
          <span className={styles.statValue}>
            {matchState?.spectators?.toLocaleString() || '0'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {isSimulating ? (
          <Button onClick={stopSimulation} variant="secondary">
            Detener Simulación
          </Button>
        ) : (
          <Button onClick={startSimulation} variant="primary">
            Reanudar Simulación
          </Button>
        )}
      </div>

      {/* Live Event Feed */}
      <div className={styles.eventFeed}>
        <h3 className={styles.feedTitle}>Feed de Eventos en Vivo</h3>
        
        <div className={styles.eventsList}>
          {eventFeed.length === 0 ? (
            <div className={styles.noEvents}>
              <p>Esperando eventos del partido...</p>
            </div>
          ) : (
            eventFeed.map((event) => (
              <div 
                key={event.id} 
                className={`${styles.eventItem} ${getEventClass(event.type)}`}
              >
                <div className={styles.eventTime}>
                  {formatMatchTime(event.minute)}
                </div>
                
                <div className={styles.eventIcon}>
                  {getEventIcon(event.type)}
                </div>
                
                <div className={styles.eventDetails}>
                  <div className={styles.eventDescription}>
                    <strong>{getTeamName(event.teamId)}</strong>: {event.description}
                  </div>
                  
                  {event.points > 0 && (
                    <div className={styles.eventPoints}>
                      +{event.points} puntos
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Match End State */}
      {matchState && !matchState.isActive && (
        <div className={styles.matchEnd}>
          <h3 className={styles.matchEndTitle}>¡Partido Finalizado!</h3>
          <div className={styles.finalScore}>
            {homeTeam.name} {matchState.golesLocal} - {matchState.golesVisitante} {awayTeam.name}
          </div>
          
          {matchState.snitchCaught && (
            <div className={styles.snitchCaughtMessage}>
              ✨ La Snitch Dorada fue atrapada por {getTeamName(matchState.snitchCaughtBy || '')}
            </div>
          )}
          
          <div className={styles.matchSummary}>
            <p>Duración total: {matchState.duration} minutos</p>
            <p>Total de eventos: {matchState.eventos.length}</p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default LiveMatchViewer;
