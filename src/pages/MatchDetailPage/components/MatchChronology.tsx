/**
 * Match Chronology Component
 * Displays detailed timeline of events for finished matches
 */

import React, { useState, useEffect } from 'react';
import { MatchChronology as MatchChronologyData, getMatchChronology } from '@/services/teamsService';
import TeamLogo from '@/components/teams/TeamLogo';
import styles from './MatchChronology.module.css';

interface MatchChronologyProps {
  matchId: string | number;
  homeTeamName: string;
  awayTeamName: string;
}

/**
 * Match Chronology Component
 * 
 * Provides a detailed chronological view of match events for completed matches.
 * Shows timeline, key moments, statistics and interactive event details.
 */
const MatchChronology: React.FC<MatchChronologyProps> = ({
  matchId,
  homeTeamName,
  awayTeamName
}) => {
  const [chronology, setChronology] = useState<MatchChronologyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const loadChronology = async () => {
      try {
        setIsLoading(true);
        console.log(`📊 Loading chronology for match ${matchId}...`);
        
        const data = await getMatchChronology(matchId.toString());
        console.log('🔍 Received chronology data:', data);
        
        if (data && data.events && Array.isArray(data.events)) {
          setChronology(data);
          console.log(`✅ Chronology loaded: ${data.events.length} events`);
        } else {
          console.log(`ℹ️ No valid chronology data available for match ${matchId}. Data:`, data);
          setChronology(null);
        }
      } catch (error) {
        console.error('Error loading match chronology:', error);
        setChronology(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadChronology();
  }, [matchId]);

  const toggleEventExpansion = (eventIndex: number) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventIndex)) {
      newExpanded.delete(eventIndex);
    } else {
      newExpanded.add(eventIndex);
    }
    setExpandedEvents(newExpanded);
    
    // Add a brief animation effect
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const getFilteredEvents = () => {
    if (!chronology) return [];
    if (selectedEventType === 'all') return chronology.events;
    return chronology.events.filter(event => event.type === selectedEventType);
  };

  const getAvailableEventTypes = () => {
    if (!chronology) return [];
    const types = [...new Set(chronology.events.map(event => event.type))];
    return ['all', ...types];
  };

  const formatTimestamp = (timestamp: number): string => {
    const minutes = Math.floor(timestamp / 60);
    const seconds = timestamp % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getEventTypeIcon = (eventType: string): string => {
    const iconMap: Record<string, string> = {
      'QUAFFLE_GOAL': '⚡',
      'SNITCH_CAUGHT': '🟡',
      'FOUL': '⚠️',
      'TIMEOUT': '⏸️',
      'INJURY': '🔴',
      'BLUDGER_HIT': '💥',
      'SAVE': '🛡️'
    };
    return iconMap[eventType] || '⚽';
  };

  const getEventTypeColor = (eventType: string): string => {
    const colorMap: Record<string, string> = {
      'QUAFFLE_GOAL': 'linear-gradient(135deg, #10b981, #059669)',
      'SNITCH_CAUGHT': 'linear-gradient(135deg, #fbbf24, #f59e0b)', 
      'FOUL': 'linear-gradient(135deg, #ef4444, #dc2626)',
      'TIMEOUT': 'linear-gradient(135deg, #6366f1, #4f46e5)',
      'INJURY': 'linear-gradient(135deg, #f97316, #ea580c)',
      'BLUDGER_HIT': 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      'SAVE': 'linear-gradient(135deg, #06b6d4, #0891b2)'
    };
    return colorMap[eventType] || 'linear-gradient(135deg, #64748b, #475569)';
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando cronología del partido...</p>
        </div>
      </div>
    );
  }

  if (!chronology) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h4>📊 Cronología no disponible</h4>
          <p>La cronología detallada de este partido aún no está disponible.</p>
          <p>Los datos cronológicos se generan automáticamente una vez que el partido ha finalizado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          <h3>📊 Cronología del Partido</h3>
          <p>Desarrollo completo del enfrentamiento</p>
        </div>
        
        <div className={styles.teamsInfo}>
          <div className={styles.team}>
            <TeamLogo teamName={homeTeamName} size="sm" />
            <span>{homeTeamName}</span>
          </div>
          <div className={styles.versus}>VS</div>
          <div className={styles.team}>
            <TeamLogo teamName={awayTeamName} size="sm" />
            <span>{awayTeamName}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryContainer}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Duración:</span>
            <span className={styles.summaryValue}>{chronology.matchDuration} min</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Eventos:</span>
            <span className={styles.summaryValue}>{chronology.events.length}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Resultado Final:</span>
            <span className={styles.summaryValue}>
              {chronology.finalScore.home} - {chronology.finalScore.away}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className={styles.timelineContainer}>
        <div className={styles.timelineHeader}>
          <h4>⏱️ Línea de Tiempo</h4>
          
          {/* Event Type Filters */}
          <div className={styles.eventFilters}>
            {getAvailableEventTypes().map(type => (
              <button
                key={type}
                className={`${styles.filterButton} ${selectedEventType === type ? styles.active : ''}`}
                onClick={() => setSelectedEventType(type)}
              >
                {type === 'all' ? '🔍 Todos' : `${getEventTypeIcon(type)} ${type}`}
              </button>
            ))}
          </div>
        </div>
        
        <div className={`${styles.timeline} ${isAnimating ? styles.animating : ''}`}>
          <div className={styles.timelineTrack}></div>
          
          {getFilteredEvents().map((event, index) => (
            <div 
              key={index}
              className={`${styles.timelineEvent} ${expandedEvents.has(index) ? styles.expanded : ''}`}
              onClick={() => toggleEventExpansion(index)}
            >
              <div className={styles.eventMarker}>
                <div 
                  className={styles.eventTime}
                  style={{ background: getEventTypeColor(event.type) }}
                >
                  <span className={styles.minute}>
                    {Math.floor(event.timestamp / 60)}'
                  </span>
                  {event.second && (
                    <span className={styles.second}>
                      {event.timestamp % 60}s
                    </span>
                  )}
                </div>
                <div 
                  className={styles.eventDot}
                  style={{ background: getEventTypeColor(event.type) }}
                />
              </div>
              
              <div className={styles.eventContent}>
                <div className={styles.eventHeader}>
                  <div className={styles.eventType}>
                    {getEventTypeIcon(event.type)} {event.type}
                  </div>
                  <div className={styles.eventScore}>
                    {event.homeScore} - {event.awayScore}
                  </div>
                </div>
                
                {event.teamName && (
                  <div className={styles.eventTeam}>
                    <span className={styles.teamName}>{event.teamName}</span>
                    {event.points > 0 && (
                      <span className={styles.eventPoints}>
                        +{event.points} pts
                      </span>
                    )}
                  </div>
                )}
                
                {event.playerName && (
                  <div className={styles.eventPlayer}>
                    <span className={styles.playerIcon}>👤</span>
                    <span>{event.playerName}</span>
                  </div>
                )}
                
                <div className={styles.eventDescription}>
                  {event.description}
                </div>
                
                {expandedEvents.has(index) && event.details && (
                  <div className={styles.eventDetails}>
                    <p><strong>Detalles:</strong> {typeof event.details === 'string' ? event.details : JSON.stringify(event.details)}</p>
                    {event.playerId && (
                      <p><strong>Jugador ID:</strong> {event.playerId}</p>
                    )}
                    {event.teamId && (
                      <p><strong>Equipo ID:</strong> {event.teamId}</p>
                    )}
                  </div>
                )}
                
                <div className={styles.expandIcon}>
                  {expandedEvents.has(index) ? '▼' : '▶'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Moments */}
      {chronology.keyEvents && chronology.keyEvents.length > 0 && (
        <div className={styles.keyMomentsContainer}>
          <div className={styles.keyMomentsHeader}>
            <h4>🌟 Momentos Clave</h4>
          </div>
          
          <div className={styles.keyMoments}>          {chronology.keyEvents.map((moment, index) => (
            <div key={moment.id || index} className={styles.keyMoment}>
              <div className={styles.keyMomentTime}>
                {formatTimestamp(moment.timestamp)}
              </div>
              <div className={styles.keyMomentContent}>
                <h5>
                  {getEventTypeIcon(moment.type)} {moment.type}
                </h5>
                <p className={styles.keyMomentDescription}>{moment.description}</p>
                {moment.impact && (
                  <div className={styles.keyMomentImpact}>
                    <strong>Impacto:</strong> {moment.impact}
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Statistics Summary */}
      <div className={styles.statsContainer}>
        <div className={styles.statsHeader}>
          <h4>📈 Resumen Estadístico</h4>
        </div>
        
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{chronology.events.length}</div>
            <div className={styles.statLabel}>Total de Eventos</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statValue}>{chronology.keyEvents?.length || 0}</div>
            <div className={styles.statLabel}>Momentos Clave</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statValue}>{chronology.matchDuration}</div>
            <div className={styles.statLabel}>Duración (min)</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {Math.round((chronology.events.length / chronology.matchDuration) * 10) / 10}
            </div>
            <div className={styles.statLabel}>Eventos/min</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchChronology;
