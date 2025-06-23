import React from 'react';
import styles from './TeamHeader.module.css';

interface TeamHeaderProps {
  teamName: string;
  teamLogo: string; // Assuming the logo is a URL or path
}

const TeamHeader: React.FC<TeamHeaderProps> = ({ teamName, teamLogo }) => {
  return (
    <div className={styles.teamHeaderContainer}>
      <img src={teamLogo} alt={`${teamName} Logo`} className={styles.teamLogo} />
      <h2 className={styles.teamName}>{teamName}</h2>
    </div>
  );
};

export default TeamHeader;