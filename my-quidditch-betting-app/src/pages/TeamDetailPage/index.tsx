import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Card from '@/components/common/Card';
import styles from './TeamDetailPage.module.css';

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
    id: 'gryffindor', 
    name: 'Gryffindor', 
    logoChar: 'G', 
    league: 'Liga de Hogwarts', 
    slogan: "Donde habitan los valientes de corazón", 
    history: "Fundado por Godric Gryffindor, conocido por su coraje y caballerosidad. Los Gryffindor son famosos por su valentía, osadía, temple y caballerosidad.", 
    wins: 152, 
    titles: 7, 
    founded: 990,
    roster: [ 
      {id: 'hp', name: 'Harry Potter', position: 'Buscador', number: 7}, 
      {id: 'kg', name: 'Katie Bell', position: 'Cazadora', number: 6},
      {id: 'aw', name: 'Angelina Johnson', position: 'Cazadora', number: 8},
      {id: 'fw', name: 'Fred Weasley', position: 'Golpeador', number: 5},
      {id: 'gw', name: 'George Weasley', position: 'Golpeador', number: 4},
      {id: 'ow', name: 'Oliver Wood', position: 'Guardián', number: 1}
    ]
  },
  slytherin: {
    id: 'slytherin', 
    name: 'Slytherin', 
    logoChar: 'S', 
    league: 'Liga de Hogwarts', 
    slogan: "Lograrás tus fines verdaderos", 
    history: "Fundado por Salazar Slytherin, valora la ambición y la astucia. Los Slytherin son conocidos por su determinación, liderazgo y recursos para alcanzar sus objetivos.", 
    wins: 145, 
    titles: 6, 
    founded: 990,
    roster: [ 
      {id: 'dm', name: 'Draco Malfoy', position: 'Buscador', number: 7}, 
      {id: 'mf', name: 'Marcus Flint', position: 'Cazador', number: 9},
      {id: 'cb', name: 'Vincent Crabbe', position: 'Golpeador', number: 3},
      {id: 'gg', name: 'Gregory Goyle', position: 'Golpeador', number: 2},
      {id: 'ap', name: 'Adrian Pucey', position: 'Cazador', number: 8},
      {id: 'mp', name: 'Miles Bletchley', position: 'Guardián', number: 1}
    ]
  },
  ravenclaw: {
    id: 'ravenclaw', 
    name: 'Ravenclaw', 
    logoChar: 'R', 
    league: 'Liga de Hogwarts', 
    slogan: "Inteligencia es la primera y más grande virtud", 
    history: "Fundado por Rowena Ravenclaw, valora la inteligencia, el saber, la agudeza mental y el aprendizaje. Los Ravenclaw son conocidos por su sabiduría y creatividad.", 
    wins: 134, 
    titles: 5, 
    founded: 990,
    roster: [ 
      {id: 'cc', name: 'Cho Chang', position: 'Buscadora', number: 7}, 
      {id: 'rl', name: 'Roger Davies', position: 'Cazador', number: 9},
      {id: 'jq', name: 'Jeremy Stretton', position: 'Golpeador', number: 4},
      {id: 'ag', name: 'Anthony Goldstein', position: 'Golpeador', number: 3},
      {id: 'pb', name: 'Padma Patil', position: 'Cazadora', number: 6},
      {id: 'gb', name: 'Grant Page', position: 'Guardián', number: 1}
    ]
  },
  hufflepuff: {
    id: 'hufflepuff', 
    name: 'Hufflepuff', 
    logoChar: 'H', 
    league: 'Liga de Hogwarts', 
    slogan: "Los de corazón justo y leal", 
    history: "Fundado por Helga Hufflepuff, valora el trabajo duro, la paciencia, la lealtad y la justicia. Los Hufflepuff son conocidos por su dedicación y espíritu de equipo.", 
    wins: 128, 
    titles: 4, 
    founded: 990,
    roster: [ 
      {id: 'cd', name: 'Cedric Diggory', position: 'Buscador', number: 7}, 
      {id: 'za', name: 'Zacharias Smith', position: 'Cazador', number: 8},
      {id: 'hm', name: 'Hannah Abbott', position: 'Cazadora', number: 6},
      {id: 'jm', name: 'Justin Finch-Fletchley', position: 'Golpeador', number: 4},
      {id: 'el', name: 'Ernie Macmillan', position: 'Golpeador', number: 3},
      {id: 'sb', name: 'Susan Bones', position: 'Guardiana', number: 1}
    ]
  },
  chudley_cannons: {
    id: 'chudley_cannons', 
    name: 'Chudley Cannons', 
    logoChar: 'C', 
    league: 'Liga Británica e Irlandesa', 
    slogan: "¡Vamos Cannons!", 
    history: "Un equipo profesional británico conocido por su larga sequía de títulos pero con una base de fanáticos muy leal. Famosos por sus uniformes naranjas brillantes.", 
    wins: 89, 
    titles: 1, 
    founded: 1892,
    roster: [ 
      {id: 'jw', name: 'Joey Jenkins', position: 'Buscador', number: 7}, 
      {id: 'rw', name: 'Ron Weasley', position: 'Guardián', number: 1},
      {id: 'mb', name: 'Michael Chang', position: 'Cazador', number: 9},
      {id: 'sp', name: 'Sarah Potter', position: 'Cazadora', number: 8},
      {id: 'tk', name: 'Tom King', position: 'Golpeador', number: 5},
      {id: 'bl', name: 'Ben Lewis', position: 'Golpeador', number: 4}
    ]
  },
  holyhead_harpies: {
    id: 'holyhead_harpies', 
    name: 'Holyhead Harpies', 
    logoChar: 'H', 
    league: 'Liga Británica e Irlandesa', 
    slogan: "Vuela alto, golpea fuerte", 
    history: "Un equipo profesional conocido por ser el único equipo completamente femenino en la liga. Tienen una historia rica y son famosas por su juego agresivo y habilidoso.", 
    wins: 156, 
    titles: 8, 
    founded: 1203,
    roster: [ 
      {id: 'gw', name: 'Ginny Weasley', position: 'Cazadora', number: 8}, 
      {id: 'cj', name: 'Claire Johnson', position: 'Buscadora', number: 7},
      {id: 'md', name: 'Mary Davies', position: 'Cazadora', number: 9},
      {id: 'lb', name: 'Lisa Brown', position: 'Cazadora', number: 6},
      {id: 'jh', name: 'Jane Harris', position: 'Golpeadora', number: 4},
      {id: 'kt', name: 'Kate Thompson', position: 'Golpeadora', number: 3},
      {id: 'sw', name: 'Sophie Wilson', position: 'Guardiana', number: 1}
    ]
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