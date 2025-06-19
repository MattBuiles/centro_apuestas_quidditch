import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import styles from './TeamCard.module.css';

interface Team {
  id: string;
  name: string;
  logoChar: string;
  league: string;
  wins?: number;
  losses?: number;
}

interface TeamCardProps {
  team: Team;
}

const getTeamLogoClass = (teamName: string) => {
  const name = teamName.toLowerCase();
  if (name.includes('gryffindor')) return styles.gryffindorLogo;
  if (name.includes('slytherin')) return styles.slytherinLogo;
  if (name.includes('ravenclaw')) return styles.ravenclawLogo;
  if (name.includes('hufflepuff')) return styles.hufflepuffLogo;
  return '';
};

const TeamCard = ({ team }: TeamCardProps) => {
  return (
    <div className={styles.teamCard}>
      <div className={styles.teamCardContent}>
        <div className={`${styles.teamLogoPlaceholder} ${getTeamLogoClass(team.name)}`}>
          {team.logoChar}
        </div>
        <h3 className={styles.teamName}>{team.name}</h3>
        <p className={styles.teamLeague}>{team.league}</p>
        
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