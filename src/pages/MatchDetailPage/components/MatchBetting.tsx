import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import styles from '../MatchDetailPage.module.css';

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

const MatchBetting: React.FC<MatchBettingProps> = ({ match, canBet }) => {
  if (!canBet) {
    return null;
  }

  return (
    <div className={styles.bettingTab}>
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>💰</span>
          Mercados de Apuestas Mágicas
        </h2>
        <div className={styles.bettingContainer}>
          <div className={styles.comingSoon}>
            <div className={styles.comingSoonIcon}>💎</div>
            <h3>Apuestas Disponibles</h3>
            <p>Los mercados de apuestas están siendo preparados por nuestros goblins financieros de Gringotts.</p>
            <div className={styles.featuresPreview}>
              <ul>
                <li>🏆 Ganador del partido</li>
                <li>🎯 Total de puntos anotados</li>
                <li>⚡ Primer equipo en anotar</li>
                <li>🟡 Tiempo de captura de la Snitch</li>
                <li>📊 Apuestas especiales y combinadas</li>
              </ul>
            </div>
            <Link to={`/betting/${match.id}`}>
              <Button className={styles.bettingCta}>
                <span className={styles.actionIcon}>🎲</span>
                Ir a Apuestas Detalladas
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchBetting;
