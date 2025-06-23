/**
 * Match Result Detail Component
 * Displays comprehensive match result information including chronology
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DetailedMatchResult, matchResultsService } from '@/services/matchResultsService';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import TeamLogo from '@/components/teams/TeamLogo';
import styles from './MatchResultDetail.module.css';

interface MatchResultDetailProps {
  matchId?: string;
}

const MatchResultDetail: React.FC<MatchResultDetailProps> = ({ matchId: propMatchId }) => {
  const { matchId: paramMatchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<DetailedMatchResult | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'chronology' | 'statistics'>('summary');
  const [isLoading, setIsLoading] = useState(true);
  // Use prop matchId if provided, otherwise use param
  const effectiveMatchId = propMatchId || paramMatchId;

  useEffect(() => {
    if (effectiveMatchId) {
      loadMatchResult(effectiveMatchId);
    }
  }, [effectiveMatchId]);
  const loadMatchResult = async (id: string) => {
    try {
      setIsLoading(true);
      console.log('Loading match result for ID:', id);
      const matchResult = matchResultsService.getMatchResult(id);
      console.log('Match result retrieved:', matchResult ? 'Found' : 'Not found');
      
      if (matchResult) {
        setResult(matchResult);
      } else {
        console.warn(`No detailed result found for match ${id}`);
      }
    } catch (error) {
      console.error('Error loading match result:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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
      case 'FOUL_BLATCHING':
        return '⚠️';
      case 'QUAFFLE_SAVE':
        return '🛡️';
      case 'SNITCH_SPOTTED':        return '👁️';
      default:
        return '📝';
    }
  };
  const translateDescription = (description: string): string => {
    // Traduce descripciones que puedan venir en inglés desde datos guardados
    const translations: { [key: string]: string } = {
      'scores with the Quaffle!': 'anota con la Quaffle!',
      ' points\\)': ' puntos)',
      'commits a major foul:': 'comete una falta grave:',
      'catches the Golden Snitch!': 'captura la Snitch Dorada!',
      'MATCH ENDS!': '¡EL PARTIDO TERMINA!',
      'Player injured on': 'Jugador lesionado en el equipo',
      ' side': '',
      'COBBING': 'Cobbing (uso excesivo de codos)',
      'BLAGGING': 'Blagging (agarrar cola de escoba)',
      'BLATCHING': 'Blatching (volar con intención de colisionar)'
    };

    let translatedDescription = description;
      // Aplica todas las traducciones, escapando caracteres especiales
    Object.entries(translations).forEach(([english, spanish]) => {
      // Escapar caracteres especiales para regex
      const escapedEnglish = english.replace(/[.*+?^${}()|[\\\]]/g, '\\$&');
      translatedDescription = translatedDescription.replace(new RegExp(escapedEnglish, 'gi'), spanish);
    });

    return translatedDescription;
  };
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p>Cargando detalles del partido...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={styles.errorContainer}>
        <Card className={styles.errorCard}>
          <h2>Resultado del Partido No Encontrado</h2>
          <p>No se pudo encontrar el resultado detallado de este partido.</p>
          {!propMatchId && (
            <Button onClick={() => navigate('/results')} variant="primary">
              Volver a Resultados
            </Button>
          )}
        </Card>
      </div>
    );
  }
  return (
    <div className={styles.resultDetailContainer}>
      {/* Header */}
      <div className={styles.header}>        {!propMatchId && (
          <Button 
            onClick={() => navigate('/results')} 
            variant="outline" 
            className={styles.backButton}
          >
            ← Volver a Resultados
          </Button>
        )}
        
        <div className={styles.matchTitle}>
          <h1>Detalles del Partido</h1>
          <p className={styles.matchDate}>
            {new Date(result.completedAt).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Main Match Card */}
      <Card className={styles.mainMatchCard}>
        <div className={styles.matchHeader}>
          <div className={styles.teamSection}>
            <div className={styles.team}>
              <TeamLogo teamName={result.homeTeam.name} size="xl" />
              <h2 className={styles.teamName}>{result.homeTeam.name}</h2>
            </div>
            
            <div className={styles.scoreSection}>
              <div className={styles.finalScore}>
                <span className={styles.homeScore}>{result.finalScore.home}</span>
                <span className={styles.scoreSeparator}>-</span>
                <span className={styles.awayScore}>{result.finalScore.away}</span>
              </div>
              <div className={styles.matchInfo}>
                <span className={styles.duration}>                  Duración: {formatDuration(result.matchDuration)}
                </span>
                {result.snitchCaught && (
                  <span className={styles.snitchInfo}>
                    ✨ Snitch capturada en el minuto {result.snitchCaughtAtMinute}
                  </span>
                )}
              </div>
            </div>
            
            <div className={styles.team}>
              <TeamLogo teamName={result.awayTeam.name} size="xl" />
              <h2 className={styles.teamName}>{result.awayTeam.name}</h2>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsHeader}>
          <button
            className={`${styles.tab} ${activeTab === 'summary' ? styles.active : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Resumen
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'chronology' ? styles.active : ''}`}
            onClick={() => setActiveTab('chronology')}
          >            Cronología
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'statistics' ? styles.active : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            Estadísticas
          </button>
        </div>

        <div className={styles.tabContent}>
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <Card className={styles.summaryCard}>
              <h3>Resumen del Partido</h3>
              
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <h4>Momentos Clave</h4>
                  <div className={styles.keyMoments}>                    {result.chronology.keyMoments.slice(0, 5).map((moment, index) => (
                      <div key={index} className={styles.keyMoment}>
                        <span className={styles.minute}>Min {moment.minute}</span>
                        <span className={styles.description}>{translateDescription(moment.description)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                  <div className={styles.summaryItem}>
                  <h4>Estadísticas Rápidas</h4>
                  <div className={styles.quickStats}>
                    <div className={styles.stat}>
                      <span>Eventos Totales:</span>
                      <span>{result.statistics.totalEvents}</span>
                    </div>
                    <div className={styles.stat}>
                      <span>Goles de Quaffle:</span>
                      <span>{result.statistics.quaffleGoals.home + result.statistics.quaffleGoals.away}</span>
                    </div>
                    <div className={styles.stat}>
                      <span>Faltas:</span>
                      <span>{result.statistics.fouls.home + result.statistics.fouls.away}</span>
                    </div>
                    <div className={styles.stat}>
                      <span>Golpes de Bludger:</span>
                      <span>{result.statistics.bludgerHits.home + result.statistics.bludgerHits.away}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}          {/* Chronology Tab */}
          {activeTab === 'chronology' && (
            <Card className={styles.chronologyCard}>
              <h3>Cronología Completa del Partido</h3>
              
              <div className={styles.chronologyContainer}>
                <div className={styles.timeline}>
                  {result.chronology.minuteByMinute
                    .filter(minute => minute.events.length > 0)
                    .map((minute, index) => (
                    <div key={index} className={styles.timelineItem}>
                      <div className={styles.timelineDot}>
                        <span className={styles.minuteNumber}>{minute.minute}'</span>
                      </div>
                      
                      <div className={styles.timelineContent}>
                        <div className={styles.scoreAtTime}>
                          {minute.homeScore} - {minute.awayScore}
                        </div>
                        
                        <div className={styles.events}>
                          {minute.events.map((event, eventIndex) => (
                            <div key={eventIndex} className={styles.event}>
                              <span className={styles.eventIcon}>
                                {getEventIcon(event.type)}
                              </span>                              <span className={styles.eventDescription}>
                                {translateDescription(event.description)}
                              </span>
                              {event.points && event.points > 0 && (
                                <span className={styles.eventPoints}>
                                  +{event.points}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}          {/* Statistics Tab */}
          {activeTab === 'statistics' && (
            <Card className={styles.statisticsCard}>
              <h3>Estadísticas Detalladas</h3>
              
              <div className={styles.statsGrid}>
                <div className={styles.statCategory}>
                  <h4>Desglose de Puntuación</h4>
                  <div className={styles.statComparison}>
                    <div className={styles.teamStats}>
                      <h5>{result.homeTeam.name}</h5>                      <div className={styles.statLine}>
                        <span>Goles de Quaffle:</span>
                        <span>{result.statistics.quaffleGoals.home}</span>
                      </div>
                      <div className={styles.statLine}>
                        <span>Puntos de Snitch:</span>
                        <span>{result.statistics.snitchPoints.home}</span>
                      </div>
                      <div className={styles.statLine}>
                        <span>Puntuación Total:</span>
                        <span className={styles.totalScore}>{result.finalScore.home}</span>
                      </div>
                    </div>
                    
                    <div className={styles.teamStats}>
                      <h5>{result.awayTeam.name}</h5>
                      <div className={styles.statLine}>
                        <span>Goles de Quaffle:</span>
                        <span>{result.statistics.quaffleGoals.away}</span>
                      </div>
                      <div className={styles.statLine}>
                        <span>Puntos de Snitch:</span>
                        <span>{result.statistics.snitchPoints.away}</span>
                      </div>
                      <div className={styles.statLine}>
                        <span>Puntuación Total:</span>
                        <span className={styles.totalScore}>{result.finalScore.away}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.statCategory}>
                  <h4>Flujo del Juego</h4>
                  <div className={styles.statComparison}>                    <div className={styles.teamStats}>
                      <h5>{result.homeTeam.name}</h5>
                      <div className={styles.statLine}>
                        <span>Faltas:</span>
                        <span>{result.statistics.fouls.home}</span>
                      </div>
                      <div className={styles.statLine}>
                        <span>Golpes de Bludger:</span>
                        <span>{result.statistics.bludgerHits.home}</span>
                      </div>
                    </div>
                    
                    <div className={styles.teamStats}>
                      <h5>{result.awayTeam.name}</h5>
                      <div className={styles.statLine}>
                        <span>Faltas:</span>
                        <span>{result.statistics.fouls.away}</span>
                      </div>
                      <div className={styles.statLine}>
                        <span>Golpes de Bludger:</span>
                        <span>{result.statistics.bludgerHits.away}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.statCategory}>
                  <h4>Dominio por Período</h4>
                  <div className={styles.dominanceStats}>
                    <div className={styles.periodStat}>
                      <span>Primer Período:</span>                      <span className={styles.dominance}>
                        {result.statistics.dominanceByPeriod.first15 === 'home' ? result.homeTeam.name :
                         result.statistics.dominanceByPeriod.first15 === 'away' ? result.awayTeam.name : 'Empate'}
                      </span>
                    </div>
                    <div className={styles.periodStat}>
                      <span>Período Medio:</span>
                      <span className={styles.dominance}>
                        {result.statistics.dominanceByPeriod.middle === 'home' ? result.homeTeam.name :
                         result.statistics.dominanceByPeriod.middle === 'away' ? result.awayTeam.name : 'Empate'}
                      </span>
                    </div>
                    <div className={styles.periodStat}>
                      <span>Período Final:</span>
                      <span className={styles.dominance}>
                        {result.statistics.dominanceByPeriod.final === 'home' ? result.homeTeam.name :
                         result.statistics.dominanceByPeriod.final === 'away' ? result.awayTeam.name : 'Empate'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchResultDetail;
