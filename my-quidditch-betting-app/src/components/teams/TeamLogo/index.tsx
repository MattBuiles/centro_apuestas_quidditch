import React from 'react';
import { getTeamLogo, getTeamInitial } from '@/assets/teamLogos';
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
  // Try to get the team logo first
  const logoSrc = getTeamLogo(teamName);
  const initial = getTeamInitial(teamName);
  
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

  // If we have a logo, show it
  if (logoSrc) {
    return (
      <div 
        className={clsx(
          styles.teamLogo,
          styles.logoContainer,
          sizeClass,
          animated && styles.animated,
          className
        )}
        title={teamName}
      >
        <img 
          src={logoSrc} 
          alt={`${teamName} logo`}
          className={styles.logoImage}
          onError={(e) => {
            // Fallback to initial if image fails to load
            const target = e.target as HTMLImageElement;
            const container = target.parentElement;
            if (container) {
              container.innerHTML = initial;
              container.className = clsx(
                styles.teamLogo,
                getTeamStyle(teamName),
                sizeClass,
                animated && styles.animated,
                className
              );
            }
          }}
        />
      </div>
    );
  }

  // Fallback to initial
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
