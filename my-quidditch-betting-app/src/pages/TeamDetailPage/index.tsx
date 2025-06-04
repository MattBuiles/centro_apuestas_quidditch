import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Card from '@/components/common/Card';
import styles from './TeamDetailPage.module.css';
import { getTeamDetails } from '../../services/teamsService'; // Adjust path if necessary

interface Player {
  id: string;
  name: string;
  position: string;
  number?: number;
}
interface TeamDetails {
  id: string;
  name: string;
  logoChar: string;
  league: string;
  slogan: string;
  history: string;
  wins: number;
  titles: number;
  founded: number;
  roster: Player[];
  // Add more details
}

const mockTeamDetails: { [key: string]: TeamDetails } = {
  gryffindor: {
    id: 'gryffindor', name: 'Gryffindor', logoChar: 'G', league: 'Liga de Hogwarts', slogan: "Donde habitan los valientes de corazón", history: "Fundado por Godric Gryffindor, conocido por su coraje y caballerosidad.", wins: 152, titles: 7, founded: 990,
    roster: [ {id: 'hp', name: 'Harry Potter', position: 'Buscador', number: 7}, {id: 'kg', name: 'Katie Bell', position: 'Cazadora'} ]
  },
  slytherin: {
    id: 'slytherin', name: 'Slytherin', logoChar: 'S', league: 'Liga de Hogwarts', slogan: "Lograrás tus fines verdaderos", history: "Fundado por Salazar Slytherin, valora la ambición y la astucia.", wins: 145, titles: 6, founded: 990,
    roster: [ {id: 'dm', name: 'Draco Malfoy', position: 'Buscador'}, {id: 'mf', name: 'Marcus Flint', position: 'Cazador'} ]
  },
};

const TeamDetailPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history'); // history, idols, stats, roster, upcoming

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      if (teamId && mockTeamDetails[teamId]) {
        setTeam(mockTeamDetails[teamId]);
      } else {
        setTeam(null);
      }
      setIsLoading(false);
    }, 1000);
  }, [teamId]);

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
  };

  if (isLoading) return <LoadingSpinner />;
  if (!team) return <div className="text-center p-8">Equipo no encontrado.</div>;

  // Determine team logo style based on team name
  const getTeamLogoClass = (teamName: string) => {
    const lowerTeam = teamName.toLowerCase();
    if (lowerTeam.includes('gryffindor')) return styles.gryffindorLogo;
    if (lowerTeam.includes('slytherin')) return styles.slytherinLogo;
    if (lowerTeam.includes('ravenclaw')) return styles.ravenclawLogo;
    if (lowerTeam.includes('hufflepuff')) return styles.hufflepuffLogo;
    return '';
  };
  // Determine card variant based on team name
  const getTeamCardVariant = (teamName: string): 'default' | 'magical' | 'gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff' => {
    const lowerTeam = teamName.toLowerCase();
    if (lowerTeam.includes('gryffindor')) return 'gryffindor';
    if (lowerTeam.includes('slytherin')) return 'slytherin';
    if (lowerTeam.includes('ravenclaw')) return 'ravenclaw';
    if (lowerTeam.includes('hufflepuff')) return 'hufflepuff';
    return 'magical';
  };

  return (
    <div className={styles.teamDetailPageContainer}>
      <div className={styles.backNavigation}>
        <Link to="/teams" className={styles.backButton}>
          &larr; Volver a Equipos
        </Link>
      </div>

      <section className={styles.teamHeaderDetail}>
        <div className={`${styles.teamLogoPlaceholder} ${getTeamLogoClass(team.name)}`}>
          {team.logoChar}
        </div>
        <div className={styles.teamInfoMain}>
          <h1 className={styles.teamName}>{team.name}</h1>
          <p className={styles.teamSlogan}>"{team.slogan}"</p>
          <p className={styles.teamMetaInfo}>Liga: {team.league} | Fundado: {team.founded}</p>
          <div className={styles.teamQuickStats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{team.wins}</div>
              <div className={styles.statLabel}>Victorias</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{team.titles}</div>
              <div className={styles.statLabel}>Títulos</div>
            </div>
          </div>
        </div>
      </section>

      <Card variant={getTeamCardVariant(team.name)} className={styles.teamContentTabs}>
         <div className={styles.tabsNavigation}>
            <button 
              className={`${styles.tabButton} ${activeTab === 'history' ? styles.active : ''}`} 
              onClick={() => handleTabClick('history')}
            >
              Historia
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'roster' ? styles.active : ''}`} 
              onClick={() => handleTabClick('roster')}
            >
              Plantilla
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'stats' ? styles.active : ''}`} 
              onClick={() => handleTabClick('stats')}
            >
              Estadísticas
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'upcoming' ? styles.active : ''}`} 
              onClick={() => handleTabClick('upcoming')}
            >
              Próximos Partidos
            </button>
        </div>

        <div className={styles.tabContent}>
            <div className={`${activeTab === 'history' ? '' : styles.hidden}`}>
                <h2 className={styles.tabTitle}>Historia del Equipo</h2>
                <p className={styles.tabText}>{team.history}</p>
            </div>
            <div className={`${activeTab === 'roster' ? '' : styles.hidden}`}>
                <h2 className={styles.tabTitle}>Plantilla Actual</h2>
                {team.roster.length > 0 ? (
                <ul className={styles.playersList}>
                    {team.roster.map(player => (
                    <li key={player.id} className={styles.playerItem}>
                        <strong className={styles.playerName}>{player.name}</strong> 
                        <span className={styles.playerPosition}> - {player.position} {player.number && `(#${player.number})`}</span>
                    </li>
                    ))}
                </ul>
                ) : <p>Información de la plantilla no disponible.</p>}
            </div>
            <div className={`${activeTab === 'stats' ? '' : styles.hidden}`}>
                <h2 className={styles.tabTitle}>Estadísticas Acumuladas</h2>
                <p className={styles.tabText}>Estadísticas detalladas del equipo aparecerán aquí...</p>
            </div>
            <div className={`${activeTab === 'upcoming' ? '' : styles.hidden}`}>
                <h2 className={styles.tabTitle}>Próximos Partidos</h2>
                <p className={styles.tabText}>Lista de próximos partidos del equipo aparecerá aquí...</p>
            </div>
        </div>
      </Card>
    </div>
  );
};

export default TeamDetailPage;