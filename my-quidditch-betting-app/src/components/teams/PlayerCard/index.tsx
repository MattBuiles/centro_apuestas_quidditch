import React from 'react';
import styles from './PlayerCard.module.css';

interface Player {
  name: string;
  position: string;
  number?: number;
  stats?: {
    goals?: number;
    assists?: number;
    games?: number;
  };
}

interface PlayerCardProps {
  player: Player;
}

const getPositionClass = (position: string) => {
  const pos = position.toLowerCase();
  if (pos.includes('buscador') || pos.includes('seeker')) return styles.seeker;
  if (pos.includes('cazador') || pos.includes('chaser')) return styles.chaser;
  if (pos.includes('golpeador') || pos.includes('beater')) return styles.beater;
  if (pos.includes('guardián') || pos.includes('keeper')) return styles.keeper;
  return '';
};

const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className={`${styles.playerCard} ${getPositionClass(player.position)}`}>
      <div className={styles.playerHeader}>
        <div className={styles.playerAvatar}>
          {getInitials(player.name)}
        </div>
        <div className={styles.playerInfo}>
          <h3 className={styles.playerName}>
            {player.name}
            {player.number && (
              <span className={styles.playerNumber}>#{player.number}</span>
            )}
          </h3>
          <p className={styles.playerPosition}>{player.position}</p>
        </div>
      </div>

      {player.stats && (
        <div className={styles.playerStats}>
          {player.stats.goals !== undefined && (
            <div className={styles.statItem}>
              <div className={styles.statValue}>{player.stats.goals}</div>
              <div className={styles.statLabel}>Goles</div>
            </div>
          )}
          {player.stats.assists !== undefined && (
            <div className={styles.statItem}>
              <div className={styles.statValue}>{player.stats.assists}</div>
              <div className={styles.statLabel}>Asistencias</div>
            </div>
          )}
          {player.stats.games !== undefined && (
            <div className={styles.statItem}>
              <div className={styles.statValue}>{player.stats.games}</div>
              <div className={styles.statLabel}>Partidos</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerCard;