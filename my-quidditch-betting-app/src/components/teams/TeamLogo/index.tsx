import React from 'react';
import styles from './TeamLogo.module.css';
import clsx from 'clsx';

interface TeamLogoProps {
  teamName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}

const TeamLogo: React.FC<TeamLogoProps> = ({
  teamName,
  size = 'md',
  animated = false,
  className
}) => {
  // Get first letter of team name
  const initial = teamName.charAt(0);
  
  // Determine team style based on name
  const getTeamStyle = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('gryffindor')) return styles.gryffindor;
    if (lowerName.includes('slytherin')) return styles.slytherin;
    if (lowerName.includes('ravenclaw')) return styles.ravenclaw;
    if (lowerName.includes('hufflepuff')) return styles.hufflepuff;
    return styles.generic;
  };

  // Get size class
  const sizeClass = 
    size === 'sm' ? styles.sm :
    size === 'md' ? styles.md :
    size === 'lg' ? styles.lg :
    styles.xl;

  return (
    <div 
      className={clsx(
        styles.teamLogo,
        getTeamStyle(teamName),
        sizeClass,
        animated && styles.animated,
        className
      )}
      title={teamName}
    >
      {initial}
    </div>
  );
};

export default TeamLogo;
