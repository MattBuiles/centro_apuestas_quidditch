import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import TeamLogo from '@/components/teams/TeamLogo';
import styles from './MatchCard.module.css';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date?: string;
  time?: string;
  league?: string;
  location?: string; 
  status?: 'live' | 'upcoming' | 'finished';
  homeScore?: number;
  awayScore?: number;
  minute?: string;
}

interface MatchCardProps {
  match: Match;
}

const MatchCard = ({ match }: MatchCardProps) => {
  return (
    <div className={`${styles.matchCard} ${match.status === 'live' ? styles.live : ''}`}>
      {match.status === 'live' && (
        <div className={styles.liveTag}>
          <span className={styles.liveIndicator}></span>EN VIVO
        </div>
      )}
      <div className={styles.matchDetails}>
        <div className={styles.teams}>          <div className={`${styles.team} ${styles.homeTeam}`}>
            <TeamLogo 
              teamName={match.homeTeam} 
              size="sm" 
              className={styles.matchTeamLogo}
            />
            <span className={styles.teamName}>{match.homeTeam}</span>
            {typeof match.homeScore !== 'undefined' && <span className={styles.score}>{match.homeScore}</span>}
          </div>
          <div className={styles.vsIndicator}>VS</div>          <div className={`${styles.team} ${styles.awayTeam}`}>
            <TeamLogo 
              teamName={match.awayTeam} 
              size="sm" 
              className={styles.matchTeamLogo}
            />
            <span className={styles.teamName}>{match.awayTeam}</span>
            {typeof match.awayScore !== 'undefined' && <span className={styles.score}>{match.awayScore}</span>}
          </div>
        </div>
        <div className={styles.matchStatus}>
          <span className={styles.matchTime}>{match.date} • {match.time} {match.minute && `(${match.minute}')`}</span>
          {match.league && <span className={styles.leagueName}>{match.league}</span>}
        </div>
      </div>
      <div className={styles.matchActions}>
        <Link to={`/matches/${match.id}`}>
          <Button variant="outline" size="sm">Ver Detalles</Button>
        </Link>
        <Link to={`/betting/${match.id}`}>
          <Button variant="magical" size="sm">Apostar</Button>
        </Link>
      </div>
    </div>
  );
};

export default MatchCard;