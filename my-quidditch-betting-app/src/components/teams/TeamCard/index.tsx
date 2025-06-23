import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import TeamLogo from '@/components/teams/TeamLogo';
import styles from './TeamCard.module.css';

interface Team {
  id: string;
  name: string;
  wins?: number;
  losses?: number;
}

interface TeamCardProps {
  team: Team;
}

const TeamCard = ({ team }: TeamCardProps) => {
  return (
    <div className={styles.teamCard}>
      <div className={styles.teamCardContent}>
        <TeamLogo 
          teamName={team.name} 
          size="lg" 
          animated
          className={styles.teamCardLogo}
        />        <h3 className={styles.teamName}>{team.name}</h3>
        <p className={styles.teamLeague}>Liga Profesional Quidditch</p>
        
        {(team.wins !== undefined || team.losses !== undefined) && (
          <div className={styles.teamStats}>
            {team.wins !== undefined && (
              <div className={styles.statItem}>
                <div className={styles.statValue}>{team.wins}</div>
                <div className={styles.statLabel}>Victorias</div>
              </div>
            )}
            {team.losses !== undefined && (
              <div className={styles.statItem}>
                <div className={styles.statValue}>{team.losses}</div>
                <div className={styles.statLabel}>Derrotas</div>
              </div>
            )}
          </div>
        )}
        
        <div className={styles.teamCardButton}>
          <Link to={`/teams/${team.id}`}>
            <Button variant="outline" size="sm" fullWidth>Ver Detalles</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeamCard;