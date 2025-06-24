import React from 'react';
import MatchResultDetail from '@/components/matches/MatchResultDetail';
import styles from '../MatchDetailPage.module.css';

interface MatchDetailedAnalysisProps {
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
  hasDetailedResults: boolean;
}

const MatchDetailedAnalysis: React.FC<MatchDetailedAnalysisProps> = ({ match, hasDetailedResults }) => {
  return (
    <div className={styles.detailedAnalysisTab}>
      {hasDetailedResults ? (
        <MatchResultDetail matchId={match.id} />
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h3>No hay análisis detallado disponible</h3>
          <p>Este partido no tiene resultados detallados guardados. Los análisis detallados están disponibles para partidos simulados.</p>
        </div>
      )}
    </div>
  );
};

export default MatchDetailedAnalysis;
