import React from 'react';
import Button from '@/components/common/Button';
import LiveMatchViewer from '@/components/matches/LiveMatchViewer';
import { Team, Match } from '@/types/league';
import { FinishedMatchData, Prediction } from '@/services/predictionsService';
import styles from '../MatchDetailPage.module.css';

interface MatchOverviewProps {
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    status: 'live' | 'upcoming' | 'finished';
    minute?: string;
    date: string;
    time: string;
    location: string;
  };
  realMatch: Match | null;
  homeTeam: Team | null;
  awayTeam: Team | null;
  showLiveSimulation: boolean;
  isStartingMatch: boolean;
  userPrediction: Prediction | null;
  finishedMatchData: FinishedMatchData | null;
  onStartMatch: () => void;
  onMatchEnd: (endedMatchState: unknown) => void;
}

const MatchOverview: React.FC<MatchOverviewProps> = ({
  match,
  realMatch,
  homeTeam,
  awayTeam,
  showLiveSimulation,
  isStartingMatch,
  userPrediction,
  finishedMatchData,
  onStartMatch,
  onMatchEnd
}) => {
  return (
    <div className={styles.overviewTab}>
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>⚡</span>
          Cronología en Vivo
        </h2>
        
        {match.status === 'upcoming' && (
          <div className={styles.timelineUnavailable}>
            <div className={styles.unavailableIcon}>⏰</div>
            <h3>Cronología No Disponible</h3>
            <p>
              La cronología en vivo estará disponible cuando el duelo mágico comience. 
              Mientras tanto, puedes revisar las predicciones y estadísticas de los equipos.
            </p>
            <div className={styles.upcomingMatchInfo}>
              <div className={styles.matchCountdown}>
                <span className={styles.countdownLabel}>Inicio programado:</span>
                <span className={styles.countdownTime}>{match.date} a las {match.time}</span>
              </div>
            </div>
          </div>
        )}

        {match.status === 'live' && (
          <div className={styles.liveTimeline}>
            {realMatch && homeTeam && awayTeam ? (
              <>
                {!showLiveSimulation && (
                  <div className={styles.liveReadyCard}>
                    <div className={styles.liveReadyIcon}>🔴</div>
                    <h3>Partido Listo para Comenzar</h3>
                    <p>La cronología en vivo comenzará cuando inicies la simulación del duelo.</p>
                    <Button 
                      onClick={onStartMatch} 
                      className={styles.startMatchButton}
                      isLoading={isStartingMatch}
                      disabled={isStartingMatch}
                    >
                      <span className={styles.actionIcon}>⚡</span>
                      {isStartingMatch ? 'Invocando la Magia...' : 'Iniciar Cronología'}
                    </Button>
                  </div>
                )}

                {showLiveSimulation && (
                  <div className={styles.liveTimelineContainer}>
                    <div className={styles.timelineHeader}>
                      <div className={styles.liveIndicator}>
                        <span className={styles.liveDot}></span>
                        EN VIVO
                      </div>
                      <div className={styles.currentMinute}>
                        Minuto: {realMatch.currentMinute || 0}'
                      </div>
                    </div>
                    
                    <LiveMatchViewer 
                      match={realMatch} 
                      homeTeam={homeTeam} 
                      awayTeam={awayTeam}
                      refreshInterval={3}
                      onMatchEnd={onMatchEnd}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className={styles.timelineError}>
                <div className={styles.errorIcon}>⚠️</div>
                <h3>Error al Cargar Cronología</h3>
                <p>No se pudieron cargar los datos del partido en vivo.</p>
              </div>
            )}
          </div>
        )}

        {match.status === 'finished' && (
          <div className={styles.finishedTimeline}>        
            <div className={styles.timelineHeader}>
              <div className={styles.finishedIndicator}>
                <span className={styles.finishedIcon}>🏁</span>
                FINALIZADO
              </div>
              <div className={styles.finalScore}>
                {match.homeTeam} {match.homeScore} - {match.awayTeam} {match.awayScore}
              </div>
            </div>
            
            <div className={styles.matchSummary}>
              <div className={styles.summaryCard}>
                <h3>Resumen del Duelo</h3>
                <div className={styles.matchResult}>
                  <div className={styles.winner}>
                    🏆 {match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam}
                  </div>
                  <div className={styles.resultDetails}>
                    <span>Victoria por {Math.abs(match.homeScore - match.awayScore)} puntos</span>
                  </div>
                </div>

                {userPrediction && (
                  <div className={styles.predictionResult}>
                    <h4>🔮 Tu Predicción</h4>
                    <div className={styles.predictionDetails}>
                      <div className={styles.predictionMade}>
                        <span className={styles.predictionLabel}>Predijiste:</span>
                        <span className={styles.predictionValue}>
                          {userPrediction.predictedWinner === 'home' ? match.homeTeam :
                           userPrediction.predictedWinner === 'away' ? match.awayTeam :
                           'Empate'}
                        </span>
                        <span className={styles.confidenceDisplay}>
                          (Confianza: {userPrediction.confidence}/5 ⭐)
                        </span>
                      </div>
                      <div className={styles.actualResult}>
                        <span className={styles.actualLabel}>Resultado real:</span>
                        <span className={styles.actualValue}>
                          {match.homeScore > match.awayScore ? match.homeTeam :
                           match.awayScore > match.homeScore ? match.awayTeam :
                           'Empate'}
                        </span>
                      </div>
                    </div>
                    <div className={userPrediction.isCorrect ? styles.correctPrediction : styles.incorrectPrediction}>
                      <span className={styles.predictionIcon}>
                        {userPrediction.isCorrect ? '🎯' : '❌'}
                      </span>
                      <span className={styles.predictionResultText}>
                        {userPrediction.isCorrect ? 
                          '¡Excelente! Tu predicción fue acertada' : 
                          `Tu predicción fue incorrecta. Predijiste ${
                            userPrediction.predictedWinner === 'home' ? match.homeTeam :
                            userPrediction.predictedWinner === 'away' ? match.awayTeam :
                            'Empate'
                          } pero ganó ${
                            match.homeScore > match.awayScore ? match.homeTeam :
                            match.awayScore > match.homeScore ? match.awayTeam :
                            'fue empate'
                          }`
                        }
                      </span>
                    </div>
                    <div className={styles.predictionTimestamp}>
                      <small>📅 Predicción realizada: {new Date(userPrediction.timestamp).toLocaleString('es-ES')}</small>
                    </div>
                  </div>
                )}

                {finishedMatchData && (
                  <div className={styles.communityPredictionsResult}>
                    <h4>Resultados de Predicciones</h4>
                    <div className={styles.predictionsStats}>
                      <p>📊 Total de predicciones: <strong>{finishedMatchData.predictions.totalPredictions}</strong></p>
                      <p>🎯 Predicciones correctas: <strong>
                        {finishedMatchData.winner === 'home' ? finishedMatchData.predictions.homeWinPredictions :
                         finishedMatchData.winner === 'away' ? finishedMatchData.predictions.awayWinPredictions :
                         finishedMatchData.predictions.drawPredictions}
                      </strong></p>
                      <p>✨ Finalizado el: <strong>{new Date(finishedMatchData.finishedAt).toLocaleString('es-ES')}</strong></p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Show detailed timeline only for non-finished matches */}
              {match.status !== 'finished' && (
                <div className={styles.timelineHistoryCard}>
                  <h4>Cronología del Partido</h4>
                  <div className={styles.timelineHistory}>
                    {finishedMatchData && finishedMatchData.timeline ? (
                      finishedMatchData.timeline.map((event, index) => (
                        <div key={index} className={styles.timelineEvent}>
                          <span className={styles.eventTime}>{event.minute}'</span>
                          <span className={styles.eventDescription}>{event.event}</span>
                          {event.score && (
                            <span className={styles.eventScore}>
                              {event.score.home} - {event.score.away}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <>
                        <div className={styles.timelineEvent}>
                          <span className={styles.eventTime}>0'</span>
                          <span className={styles.eventDescription}>🏃‍♂️ Inicio del duelo mágico</span>
                        </div>
                        <div className={styles.timelineEvent}>
                          <span className={styles.eventTime}>Final</span>
                          <span className={styles.eventDescription}>
                            🟡 Snitch capturada - {match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam} obtiene la victoria
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className={styles.timelineNote}>
                    <small>
                      {finishedMatchData ? 
                        '✨ Cronología completa guardada del partido simulado' : 
                        '💡 La cronología detallada estará disponible en futuras simulaciones'}
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchOverview;
