import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import styles from './MatchBetting.module.css';

interface MatchBettingProps {
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
  canBet: boolean;
}

const MatchBetting: React.FC<MatchBettingProps> = ({ match }) => {
  // Solo mostrar mensaje si el partido ya terminó
  if (match.status === 'finished') {
    return (
      <div className={styles.bettingTab}>
        <Card className={styles.bettingDisabled}>
          <h2 className={styles.disabledTitle}>
            <span className={styles.disabledIcon}>🔒</span>
            Apuestas Cerradas
          </h2>
          <p className={styles.disabledMessage}>
            Las apuestas para este partido están cerradas. El partido ya ha terminado.
          </p>
          <Link to="/betting" className={styles.viewOtherBets}>
            <Button variant="outline">Ver Otras Apuestas</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Estado para partidos próximos o en vivo
  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';

  return (
    <div className={styles.bettingTab}>
      <div className={styles.bettingContainer}>
        <Card className={styles.bettingMainCard}>
          <div className={styles.bettingHeader}>
            <h2 className={styles.bettingTitle}>
              <span className={styles.titleIcon}>💰</span>
              Mercados de Apuestas Mágicas
            </h2>
            <p className={styles.bettingSubtitle}>
              {isLive && '¡El partido está en vivo! Las apuestas dinámicas están disponibles.'}
              {isUpcoming && 'Apuesta con galeones en el partido más esperado de la temporada.'}
            </p>
          </div>

          <div className={styles.bettingContent}>
            {isLive && (
              <div className={styles.liveIndicator}>
                <span className={styles.liveIcon}>🔴</span>
                <span className={styles.liveText}>EN VIVO</span>
                <span className={styles.liveMinute}>
                  {match.minute ? `${match.minute}'` : 'En curso'}
                </span>
              </div>
            )}

            <div className={styles.matchPreview}>
              <div className={styles.teamsPreview}>
                <div className={styles.teamPreview}>
                  <span className={styles.teamName}>{match.homeTeam}</span>
                  {isLive && <span className={styles.teamScore}>{match.homeScore}</span>}
                </div>
                <div className={styles.vsSection}>
                  <span className={styles.vs}>VS</span>
                </div>
                <div className={styles.teamPreview}>
                  <span className={styles.teamName}>{match.awayTeam}</span>
                  {isLive && <span className={styles.teamScore}>{match.awayScore}</span>}
                </div>
              </div>
              
              <div className={styles.matchInfo}>
                <span className={styles.matchDate}>
                  📅 {new Date(match.date).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
                <span className={styles.matchTime}>
                  🕐 {match.time}
                </span>
                <span className={styles.matchLocation}>
                  🏟️ {match.location}
                </span>
              </div>
            </div>

            <div className={styles.bettingFeatures}>
              <h3 className={styles.featuresTitle}>
                <span className={styles.featuresIcon}>🎯</span>
                Mercados Disponibles
              </h3>
              <div className={styles.featuresList}>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>🏆</span>
                  <span className={styles.featureText}>Ganador del partido</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>🎯</span>
                  <span className={styles.featureText}>Total de puntos anotados</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>🟡</span>
                  <span className={styles.featureText}>Captura de la Snitch Dorada</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>⏱️</span>
                  <span className={styles.featureText}>Duración del partido</span>
                </div>
                {isLive && (
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}>🔴</span>
                    <span className={styles.featureText}>Apuestas en vivo con cuotas dinámicas</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.bettingActions}>
              <Link to={`/betting/${match.id}`} className={styles.bettingLink}>
                <Button className={styles.bettingButton} size="lg">
                  <span className={styles.buttonIcon}>🎲</span>
                  {isLive ? 'Apostar En Vivo' : 'Ver Todas las Apuestas'}
                </Button>
              </Link>
              
              {isLive && (
                <div className={styles.liveWarning}>
                  <span className={styles.warningIcon}>⚠️</span>
                  <span className={styles.warningText}>
                    Las cuotas cambian en tiempo real durante el partido
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className={styles.bettingFooter}>
          <Card className={styles.bettingInfo}>
            <h3>
              <span className={styles.infoIcon}>ℹ️</span>
              Información de Apuestas
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>💰 Moneda:</span>
                <span className={styles.infoValue}>Galeones de Gringotts</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>🎯 Apuesta mínima:</span>
                <span className={styles.infoValue}>1 galeón</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>🏆 Apuesta máxima:</span>
                <span className={styles.infoValue}>1000 galeones</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>💫 Pagos:</span>
                <span className={styles.infoValue}>Instantáneos</span>
              </div>
            </div>
          </Card>
          
          <Card className={styles.responsibleGaming}>
            <h3>
              <span className={styles.responsibleIcon}>🛡️</span>
              Juego Responsable
            </h3>
            <p>Apuesta solo lo que puedas permitirte perder. El juego debe ser entretenido, no una fuente de ingresos.</p>
            <Link to="/help/responsible-gaming">
              <Button variant="outline" size="sm">
                Más Información
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MatchBetting;
