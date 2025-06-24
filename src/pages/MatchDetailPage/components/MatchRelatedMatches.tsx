import React from 'react';
import { Link } from 'react-router-dom';
import TeamLogo from '@/components/teams/TeamLogo';
import { Match } from '@/types/league';
import { virtualTimeManager } from '@/services/virtualTimeManager';
import styles from '../MatchDetailPage.module.css';

interface MatchRelatedMatchesProps {
  relatedMatches: Match[];
}

const MatchRelatedMatches: React.FC<MatchRelatedMatchesProps> = ({ relatedMatches }) => {
  if (relatedMatches.length === 0) {
    return null;
  }

  return (
    <section className={styles.relatedMatches}>
      <h2 className={styles.sectionTitle}>
        <span className={styles.sectionIcon}>⚡</span>
        Próximos Duelos Mágicos
      </h2>
      <div className={styles.relatedMatchesGrid}>
        {relatedMatches.map((relatedMatch) => {
          // Get the season data to resolve team IDs to team names
          const timeState = virtualTimeManager.getState();
          const homeTeamData = timeState.temporadaActiva?.equipos.find(t => t.id === relatedMatch.localId);
          const awayTeamData = timeState.temporadaActiva?.equipos.find(t => t.id === relatedMatch.visitanteId);
          const homeTeamName = homeTeamData?.name || relatedMatch.localId;
          const awayTeamName = awayTeamData?.name || relatedMatch.visitanteId;
          
          return (
            <Link 
              key={relatedMatch.id} 
              to={`/matches/${relatedMatch.id}`} 
              className={styles.relatedMatchCard}
            >
              <div className={styles.relatedMatchHeader}>
                <div className={styles.relatedMatchTeams}>
                  <TeamLogo teamName={homeTeamName} size="sm" />
                  <span className={styles.relatedMatchVs}>vs</span>
                  <TeamLogo teamName={awayTeamName} size="sm" />
                </div>
                <div className={styles.relatedMatchInfo}>
                  <span className={styles.relatedMatchName}>
                    {homeTeamName} vs {awayTeamName}
                  </span>
                  <span className={styles.relatedMatchDate}>
                    {new Date(relatedMatch.fecha).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
              <div className={styles.relatedMatchFooter}>
                <span className={styles.relatedMatchAction}>Ver Detalles ✨</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default MatchRelatedMatches;
