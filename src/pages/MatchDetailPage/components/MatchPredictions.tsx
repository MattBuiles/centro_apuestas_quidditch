import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import TeamLogo from '@/components/teams/TeamLogo';
import { MatchPredictionStats, Prediction } from '@/services/predictionsService';
import styles from './MatchPredictions.module.css';

interface MatchPredictionsProps {
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
  userPrediction: Prediction | null;
  predictionStats: MatchPredictionStats | null;
  isAuthenticated: boolean;
  isPredicting: boolean;
  canPredict: boolean;
  onPrediction: (winner: 'home' | 'away' | 'draw') => void;
}

const MatchPredictions: React.FC<MatchPredictionsProps> = ({
  match,
  userPrediction,
  predictionStats,
  isAuthenticated,
  isPredicting,
  canPredict,
  onPrediction
}) => {
  return (
    <div className={styles.predictionsTab}>
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🔮</span>
          Predicciones Mágicas
        </h2>
        
        {userPrediction ? (
          <div className={styles.userPredictionCard}>
            <h3>Tu Visión del Futuro</h3>
            <div className={styles.predictionDisplay}>
              <span className={styles.predictionTeam}>
                {userPrediction.prediction === 'home' ? match.homeTeam :
                 userPrediction.prediction === 'away' ? match.awayTeam :
                 'Empate'}
              </span>
              <span className={styles.confidenceLevel}>
                Confianza: {userPrediction.confidence}/5 ⭐
              </span>
            </div>
            
            {/* Show prediction result if match is finished */}
            {match.status === 'finished' && userPrediction.status && (
              <div className={styles.predictionResultSection}>
                <h4>🔮 Resultado de tu Predicción</h4>
                <div className={styles.predictionComparison}>
                  <div className={styles.predictionMade}>
                    <span className={styles.predictionLabel}>Tu predicción:</span>
                    <span className={styles.predictionValue}>
                      {userPrediction.prediction === 'home' ? match.homeTeam :
                       userPrediction.prediction === 'away' ? match.awayTeam :
                       'Empate'}
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
                <div className={userPrediction.status === 'correct' ? styles.correctPrediction : styles.incorrectPrediction}>
                  <span className={styles.predictionIcon}>
                    {userPrediction.status === 'correct' ? '✨' : '🔮💫'}
                  </span>
                  <span className={styles.predictionResultText}>
                    {userPrediction.status === 'correct' ? 
                      '¡Extraordinario! Tu visión fue precisa. Las estrellas se alinearon perfectamente con tu sabiduría mágica. Eres un verdadero oráculo del Quidditch.' : 
                      'Esta vez las brumas del futuro te confundieron. Incluso los mejores videntes a veces interpretan mal las señales cósmicas. ¡La próxima vez las estrellas serán más claras!'
                    }
                  </span>
                  {userPrediction.points !== undefined && (
                    <div className={styles.pointsEarned}>
                      <span className={styles.pointsIcon}>🏆</span>
                      <span className={styles.pointsText}>
                        {userPrediction.status === 'correct' ? 
                          `¡Has ganado ${userPrediction.points} puntos mágicos!` : 
                          'Sin puntos esta vez, pero la experiencia es invaluable.'
                        }
                      </span>
                    </div>
                  )}
                </div>
                <div className={styles.predictionTimestamp}>
                  <small>📅 Predicción realizada: {userPrediction.createdAt.toLocaleString('es-ES')}</small>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Show closed predictions message if can't predict and no existing prediction
          !canPredict && !userPrediction ? (
            <div className={styles.closedPredictions}>
              <p>Las predicciones para este partido ya están cerradas.</p>
            </div>
          ) : (
            canPredict && isAuthenticated && (
              <div className={styles.predictionInterface}>
                <h3>¿Qué dice tu bola de cristal?</h3>
                <p>Consulta las estrellas y haz tu predicción sobre este duelo épico.</p>
                <div className={styles.predictionButtons}>
                  <Button 
                    variant="outline"
                    onClick={() => onPrediction('home')}
                    disabled={isPredicting}
                    className={styles.predictionButton}
                  >
                    <TeamLogo teamName={match.homeTeam} size="sm" />
                    {match.homeTeam}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => onPrediction('draw')}
                    disabled={isPredicting}
                    className={styles.predictionButton}
                  >
                    <span className={styles.drawIcon}>⚖️</span>
                    Empate
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => onPrediction('away')}
                    disabled={isPredicting}
                    className={styles.predictionButton}
                  >
                    <TeamLogo teamName={match.awayTeam} size="sm" />
                    {match.awayTeam}
                  </Button>
                </div>
              </div>
            )
          )
        )}

        {!isAuthenticated && (
          <div className={styles.authPrompt}>
            <p>
              <Link to="/login" className={styles.authLink}>
                Inicia sesión
              </Link> 
              para desbloquear el poder de las predicciones mágicas.
            </p>
          </div>
        )}

        {predictionStats && predictionStats.totalPredictions > 0 && (
          <div className={styles.communityPredictions}>
            <h3>Sabiduría de la Comunidad</h3>
            <div className={styles.predictionStats}>
              <div className={styles.predictionBars}>
                <div 
                  className={styles.predictionBar}
                  style={{width: `${predictionStats.homeWinPercentage}%`}}
                >
                  <span>{match.homeTeam}</span>
                  <span>{predictionStats.homeWinPercentage.toFixed(1)}%</span>
                </div>
                <div 
                  className={styles.predictionBar}
                  style={{width: `${predictionStats.drawPercentage}%`}}
                >
                  <span>Empate</span>
                  <span>{predictionStats.drawPercentage.toFixed(1)}%</span>
                </div>
                <div 
                  className={styles.predictionBar}
                  style={{width: `${predictionStats.awayWinPercentage}%`}}
                >
                  <span>{match.awayTeam}</span>
                  <span>{predictionStats.awayWinPercentage.toFixed(1)}%</span>
                </div>
              </div>
              <p className={styles.totalPredictions}>
                {predictionStats.totalPredictions} magos han consultado sus cristales
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchPredictions;
