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
                {userPrediction.predictedWinner === 'home' ? match.homeTeam :
                 userPrediction.predictedWinner === 'away' ? match.awayTeam :
                 'Empate'}
              </span>
              <span className={styles.confidenceLevel}>
                Confianza: {userPrediction.confidence}/5 ⭐
              </span>
            </div>
            
            {/* Show prediction result if match is finished */}
            {match.status === 'finished' && userPrediction.isCorrect !== undefined && (
              <div className={styles.predictionResultSection}>
                <h4>🔮 Resultado de tu Predicción</h4>
                <div className={styles.predictionComparison}>
                  <div className={styles.predictionMade}>
                    <span className={styles.predictionLabel}>Tu predicción:</span>
                    <span className={styles.predictionValue}>
                      {userPrediction.predictedWinner === 'home' ? match.homeTeam :
                       userPrediction.predictedWinner === 'away' ? match.awayTeam :
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
                <div className={userPrediction.isCorrect ? styles.correctPrediction : styles.incorrectPrediction}>
                  <span className={styles.predictionIcon}>
                    {userPrediction.isCorrect ? '🎯' : '❌'}
                  </span>
                  <span className={styles.predictionResultText}>
                    {userPrediction.isCorrect ? 
                      '¡Excelente! Tu predicción fue acertada. Eres un verdadero vidente del Quidditch.' : 
                      'Tu predicción fue incorrecta esta vez. Las estrellas pueden ser difíciles de interpretar.'
                    }
                  </span>
                </div>
                <div className={styles.predictionTimestamp}>
                  <small>📅 Predicción realizada: {new Date(userPrediction.timestamp).toLocaleString('es-ES')}</small>
                </div>
              </div>
            )}
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

        {predictionStats && (
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
