import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Card from '@/components/common/Card';
import TeamLogo from '@/components/teams/TeamLogo';
import styles from './TeamDetailPage.module.css';

interface Player {
  id: string;
  name: string;
  position: string;
  number?: number;
  yearsActive?: number;
  achievements?: string[];
}

interface Match {
  id: string;
  opponent: string;
  date: string;
  venue: string;
  result?: 'win' | 'loss' | 'draw';
  score?: string;
}

interface TeamDetails {
  id: string;
  name: string;
  slogan: string;
  history: string;
  wins: number;
  losses?: number;
  draws?: number;
  titles: number;
  founded: number;
  roster: Player[];
  recentMatches?: Match[];
  upcomingMatches?: Match[];
  achievements?: string[];
  stadium?: string;
  colors?: string[];
}

const mockTeamDetails: { [key: string]: TeamDetails } = {
  gryffindor: {
    id: 'gryffindor', 
    name: 'Gryffindor', 
    slogan: "Donde habitan los valientes de corazón", 
    history: "Fundado por Godric Gryffindor, conocido por su coraje y caballerosidad. Los Gryffindor son famosos por su valentía, osadía, temple y caballerosidad. A lo largo de los siglos, este equipo ha demostrado que el coraje y la determinación pueden superar cualquier obstáculo en el campo de Quidditch. Sus jugadores legendarios han inspirado a generaciones con su juego audaz y su espíritu indomable.", 
    wins: 152, 
    losses: 48,
    draws: 15,
    titles: 7, 
    founded: 990,
    stadium: "Campo de Quidditch de Hogwarts",
    colors: ["Dorado", "Rojo Escarlata"],
    achievements: ["Campeón de la Copa de las Casas (7 veces)", "Récord de la captura más rápida de la Snitch Dorada", "Mayor número de victorias consecutivas (23 partidos)"],
    roster: [ 
      {id: 'hp', name: 'Harry Potter', position: 'Buscador', number: 7, yearsActive: 6, achievements: ["Buscador más joven en un siglo", "Captura récord de Snitch en 5 minutos"]}, 
      {id: 'kg', name: 'Katie Bell', position: 'Cazadora', number: 6, yearsActive: 4, achievements: ["100+ goles en su carrera"]},
      {id: 'aw', name: 'Angelina Johnson', position: 'Cazadora', number: 8, yearsActive: 5, achievements: ["Capitana del equipo 2 años"]},
      {id: 'fw', name: 'Fred Weasley', position: 'Golpeador', number: 5, yearsActive: 4, achievements: ["Mejor golpeador defensivo de la década"]},
      {id: 'gw', name: 'George Weasley', position: 'Golpeador', number: 4, yearsActive: 4, achievements: ["Mejor golpeador ofensivo de la década"]},
      {id: 'ow', name: 'Oliver Wood', position: 'Guardián', number: 1, yearsActive: 5, achievements: ["95% de efectividad en paradas", "Capitán legendario"]}
    ],
    upcomingMatches: [
      {id: '1', opponent: 'Slytherin', date: '2025-07-15', venue: 'Campo de Hogwarts'},
      {id: '2', opponent: 'Ravenclaw', date: '2025-07-28', venue: 'Campo de Hogwarts'},
      {id: '3', opponent: 'Hufflepuff', date: '2025-08-10', venue: 'Campo de Hogwarts'}
    ]
  },  slytherin: {
    id: 'slytherin',
    name: 'Slytherin', 
    slogan: "Lograrás tus fines verdaderos", 
    history: "Fundado por Salazar Slytherin, valora la ambición y la astucia. Los Slytherin son conocidos por su determinación, liderazgo y recursos para alcanzar sus objetivos. Su estilo de juego se caracteriza por la estrategia meticulosa y la ejecución precisa. Han dominado el campo de Quidditch con su inteligencia táctica y su capacidad para adaptarse a cualquier situación durante el juego.", 
    wins: 145, 
    losses: 52,
    draws: 18,
    titles: 6, 
    founded: 990,
    stadium: "Campo de Quidditch de Hogwarts",
    colors: ["Verde Esmeralda", "Plata"],
    achievements: ["Récord de mayor número de títulos consecutivos (4)", "Estrategia defensiva más efectiva", "Mayor porcentaje de victorias en finales"],
    roster: [ 
      {id: 'dm', name: 'Draco Malfoy', position: 'Buscador', number: 7, yearsActive: 4, achievements: ["Buscador más estratégico de su generación"]}, 
      {id: 'mf', name: 'Marcus Flint', position: 'Cazador', number: 9, yearsActive: 6, achievements: ["Capitán más exitoso de Slytherin"]},
      {id: 'cb', name: 'Vincent Crabbe', position: 'Golpeador', number: 3, yearsActive: 3, achievements: ["Golpeador más intimidante"]},
      {id: 'gg', name: 'Gregory Goyle', position: 'Golpeador', number: 2, yearsActive: 3, achievements: ["Especialista en jugadas de fuerza"]},
      {id: 'ap', name: 'Adrian Pucey', position: 'Cazador', number: 8, yearsActive: 4, achievements: ["Especialista en goles de larga distancia"]},
      {id: 'mp', name: 'Miles Bletchley', position: 'Guardián', number: 1, yearsActive: 3, achievements: ["Guardián más joven en alcanzar 50 partidos"]}
    ],
    upcomingMatches: [
      {id: '1', opponent: 'Gryffindor', date: '2025-07-15', venue: 'Campo de Hogwarts'},
      {id: '2', opponent: 'Hufflepuff', date: '2025-08-02', venue: 'Campo de Hogwarts'},
      {id: '3', opponent: 'Ravenclaw', date: '2025-08-20', venue: 'Campo de Hogwarts'}    ]
  },  ravenclaw: {
    id: 'ravenclaw',
    name: 'Ravenclaw', 
    slogan: "Inteligencia es la primera y más grande virtud", 
    history: "Fundado por Rowena Ravenclaw, valora la inteligencia, el saber, la agudeza mental y el aprendizaje. Los Ravenclaw son conocidos por su sabiduría y creatividad en el campo de Quidditch, utilizando estrategias innovadoras y jugadas inteligentes que sorprenden a sus oponentes. Su enfoque analítico del juego les ha permitido desarrollar algunas de las tácticas más brillantes del deporte.", 
    wins: 134, 
    losses: 56,
    draws: 14,
    titles: 5, 
    founded: 990,
    stadium: "Campo de Quidditch de Hogwarts",
    colors: ["Azul Bronce", "Plata"],
    achievements: ["Campeón de la Copa de las Casas (5 veces)", "Estrategia más innovadora del torneo", "Mayor número de jugadas creativas registradas"],
    roster: [ 
      {id: 'cc', name: 'Cho Chang', position: 'Buscadora', number: 7, yearsActive: 5, achievements: ["Velocidad récord en captura de Snitch", "Buscadora más inteligente de su generación"]}, 
      {id: 'rl', name: 'Roger Davies', position: 'Cazador', number: 9, yearsActive: 4, achievements: ["Goleador del año - Liga Escolar", "Capitán estratega"]},
      {id: 'jq', name: 'Jeremy Stretton', position: 'Golpeador', number: 4, yearsActive: 3, achievements: ["Especialista en jugadas defensivas"]},
      {id: 'ag', name: 'Anthony Goldstein', position: 'Golpeador', number: 3, yearsActive: 3, achievements: ["Jugada defensiva del año"]},
      {id: 'pb', name: 'Padma Patil', position: 'Cazadora', number: 6, yearsActive: 4, achievements: ["Pase perfecto - 95% precisión"]},
      {id: 'gb', name: 'Grant Page', position: 'Guardián', number: 1, yearsActive: 4, achievements: ["Portero del año - 89% paradas", "Mejor reflejos de la liga"]}
    ],
    upcomingMatches: [
      {id: '1', opponent: 'Hufflepuff', date: '2025-07-18', venue: 'Campo de Hogwarts'},
      {id: '2', opponent: 'Gryffindor', date: '2025-07-28', venue: 'Campo de Hogwarts'},
      {id: '3', opponent: 'Holyhead Harpies', date: '2025-08-08', venue: 'Campo de Hogwarts'}
    ]
  },  hufflepuff: {
    id: 'hufflepuff',
    name: 'Hufflepuff', 
    slogan: "Los de corazón justo y leal", 
    history: "Fundado por Helga Hufflepuff, valora el trabajo duro, la paciencia, la lealtad y la justicia. Los Hufflepuff son conocidos por su dedicación y espíritu de equipo incomparable. Su filosofía de juego se basa en la perseverancia, el trabajo en equipo y la deportividad. Aunque a menudo subestimados, han demostrado que la determinación y la lealtad pueden superar la falta de talento natural.", 
    wins: 128, 
    losses: 62,
    draws: 18,
    titles: 4, 
    founded: 990,
    stadium: "Campo de Quidditch de Hogwarts",
    colors: ["Amarillo", "Negro"],
    achievements: ["Campeón de la Copa de las Casas (4 veces)", "Equipo más deportivo (10 años consecutivos)", "Mayor espíritu de equipo reconocido"],
    roster: [ 
      {id: 'cd', name: 'Cedric Diggory', position: 'Buscador', number: 7, yearsActive: 5, achievements: ["Leyenda viviente de Hufflepuff", "Capitán más querido de la historia"]}, 
      {id: 'za', name: 'Zacharias Smith', position: 'Cazador', number: 8, yearsActive: 3, achievements: ["Anotador más consistente del equipo"]},
      {id: 'hm', name: 'Hannah Abbott', position: 'Cazadora', number: 6, yearsActive: 4, achievements: ["Mejor jugadora femenina de Hufflepuff"]},
      {id: 'jm', name: 'Justin Finch-Fletchley', position: 'Golpeador', number: 4, yearsActive: 4, achievements: ["Golpeador más técnico y preciso"]},
      {id: 'el', name: 'Ernie Macmillan', position: 'Golpeador', number: 3, yearsActive: 3, achievements: ["Especialista en jugadas defensivas"]},
      {id: 'sb', name: 'Susan Bones', position: 'Guardiana', number: 1, yearsActive: 4, achievements: ["Guardiana más confiable - 92% paradas", "Líder silenciosa del equipo"]}
    ],
    upcomingMatches: [
      {id: '1', opponent: 'Ravenclaw', date: '2025-07-18', venue: 'Campo de Hogwarts'},
      {id: '2', opponent: 'Slytherin', date: '2025-08-02', venue: 'Campo de Hogwarts'},
      {id: '3', opponent: 'Chudley Cannons', date: '2025-08-22', venue: 'Campo de Hogwarts'}
    ]
  },
  cannons: {
    id: 'cannons',
    name: 'Chudley Cannons', 
    slogan: "¡Vamos Cannons!", 
    history: "Un equipo profesional británico conocido por su larga sequía de títulos pero con una base de fanáticos muy leal. Famosos por sus uniformes naranjas brillantes y su espíritu indomable. A pesar de las dificultades, los Cannons han mantenido una tradición de juego valiente y han cultivado algunos de los jugadores más queridos del Quidditch profesional.", 
    wins: 89, 
    losses: 98,
    draws: 12,
    titles: 1, 
    founded: 1892,
    stadium: "Estadio Ballycastle",
    colors: ["Naranja Brillante", "Negro"],
    achievements: ["Campeón de Liga (1 vez)", "Mayor base de fanáticos leales", "Récord de asistencia en partidos locales"],
    roster: [ 
      {id: 'jw', name: 'Joey Jenkins', position: 'Buscador', number: 7, yearsActive: 4, achievements: ["Especialista en capturas bajo presión"]}, 
      {id: 'rw', name: 'Ron Weasley', position: 'Guardián', number: 1, yearsActive: 3, achievements: ["Guardián estrella en ascenso", "Mejor parada del año"]},
      {id: 'mb', name: 'Barry Ryan', position: 'Cazador', number: 9, yearsActive: 8, achievements: ["Veterano del equipo", "200+ partidos jugados"]},
      {id: 'sp', name: 'Galvin Gudgeon', position: 'Cazador', number: 8, yearsActive: 4, achievements: ["Mejor anotador de la temporada actual"]},
      {id: 'tk', name: 'Roderick Plumpton', position: 'Golpeador', number: 5, yearsActive: 7, achievements: ["Defensor más temido de la liga"]},
      {id: 'bl', name: 'Dragomir Gorgovitch', position: 'Golpeador', number: 4, yearsActive: 5, achievements: ["Mejor golpeador defensivo del equipo"]}
    ],
    upcomingMatches: [
      {id: '1', opponent: 'Holyhead Harpies', date: '2025-07-20', venue: 'Estadio Ballycastle'},
      {id: '2', opponent: 'Gryffindor', date: '2025-08-05', venue: 'Campo de Hogwarts'},
      {id: '3', opponent: 'Slytherin', date: '2025-08-18', venue: 'Estadio Ballycastle'}
    ]
  },
  harpies: {
    id: 'harpies',
    name: 'Holyhead Harpies', 
    slogan: "Vuela alto, golpea fuerte", 
    history: "Un equipo profesional conocido por ser el único equipo completamente femenino en la liga profesional. Tienen una historia rica y gloriosa, siendo famosas por su juego agresivo, técnico y habilidoso. Las Harpies han sido pioneras en el Quidditch femenino y han inspirado a generaciones de jugadoras con su excelencia deportiva.", 
    wins: 156, 
    losses: 34,
    draws: 8,
    titles: 8, 
    founded: 1203,
    stadium: "Estadio Holyhead",
    colors: ["Verde Esmeralda", "Dorado"],
    achievements: ["Campeonas de Liga (8 veces)", "Equipo completamente femenino más exitoso", "Récord de mayor cantidad de títulos consecutivos (3)", "Mejor porcentaje de victorias de la liga"],
    roster: [ 
      {id: 'gw', name: 'Ginny Weasley', position: 'Cazadora', number: 8, yearsActive: 4, achievements: ["Estrella emergente del Quidditch", "Mejor jugadora joven del año"]}, 
      {id: 'cj', name: 'Wilda Griffiths', position: 'Buscadora', number: 7, yearsActive: 9, achievements: ["Capitana y líder histórica", "Velocidad récord en captura de Snitch"]},
      {id: 'md', name: 'Valmai Morgan', position: 'Cazadora', number: 9, yearsActive: 7, achievements: ["Anotadora más precisa del equipo", "300+ goles en su carrera"]},
      {id: 'lb', name: 'Gwendolyn Morgan', position: 'Cazadora', number: 6, yearsActive: 6, achievements: ["Hermana legendaria", "Especialista en jugadas aéreas"]},
      {id: 'jh', name: 'Gwenog Jones', position: 'Golpeadora', number: 4, yearsActive: 10, achievements: ["Ex-capitana legendaria", "Mejor golpeadora de la década"]},
      {id: 'kt', name: 'Glynnis Griffiths', position: 'Golpeadora', number: 3, yearsActive: 8, achievements: ["Especialista en defensa aérea"]},
      {id: 'sw', name: 'Artemis Fido', position: 'Guardiana', number: 1, yearsActive: 5, achievements: ["Portera más confiable de la liga", "Velocidad supersónica certificada"]}
    ],
    upcomingMatches: [
      {id: '1', opponent: 'Chudley Cannons', date: '2025-07-20', venue: 'Estadio Holyhead'},
      {id: '2', opponent: 'Ravenclaw', date: '2025-08-08', venue: 'Campo de Hogwarts'},
      {id: '3', opponent: 'Hufflepuff', date: '2025-08-22', venue: 'Estadio Holyhead'}
    ]
  },  chudley_cannons: {
    id: 'chudley_cannons',
    name: 'Chudley Cannons', 
    slogan: "¡Vamos Cannons!", 
    history: "Un equipo profesional británico conocido por su larga sequía de títulos pero con una base de fanáticos muy leal. Famosos por sus uniformes naranjas brillantes y su espíritu indomable. A pesar de las dificultades, los Cannons han mantenido una tradición de juego valiente y han cultivado algunos de los jugadores más queridos del Quidditch profesional.", 
    wins: 89, 
    losses: 98,
    draws: 12,
    titles: 1, 
    founded: 1892,
    stadium: "Estadio Ballycastle",
    colors: ["Naranja Brillante", "Negro"],
    achievements: ["Campeón de Liga (1 vez)", "Mayor base de fanáticos leales", "Récord de asistencia en partidos locales"],
    roster: [ 
      {id: 'jw', name: 'Joey Jenkins', position: 'Buscador', number: 7, yearsActive: 4, achievements: ["Especialista en capturas bajo presión"]}, 
      {id: 'rw', name: 'Ron Weasley', position: 'Guardián', number: 1, yearsActive: 3, achievements: ["Guardián estrella en ascenso", "Mejor parada del año"]},
      {id: 'mb', name: 'Barry Ryan', position: 'Cazador', number: 9, yearsActive: 8, achievements: ["Veterano del equipo", "200+ partidos jugados"]},
      {id: 'sp', name: 'Galvin Gudgeon', position: 'Cazador', number: 8, yearsActive: 4, achievements: ["Mejor anotador de la temporada actual"]},
      {id: 'tk', name: 'Roderick Plumpton', position: 'Golpeador', number: 5, yearsActive: 7, achievements: ["Defensor más temido de la liga"]},
      {id: 'bl', name: 'Dragomir Gorgovitch', position: 'Golpeador', number: 4, yearsActive: 5, achievements: ["Mejor golpeador defensivo del equipo"]}
    ],
    upcomingMatches: [
      {id: '1', opponent: 'Holyhead Harpies', date: '2025-07-20', venue: 'Estadio Ballycastle'},
      {id: '2', opponent: 'Gryffindor', date: '2025-08-05', venue: 'Campo de Hogwarts'},
      {id: '3', opponent: 'Slytherin', date: '2025-08-18', venue: 'Estadio Ballycastle'}
    ]
  },  holyhead_harpies: {
    id: 'holyhead_harpies',
    name: 'Holyhead Harpies', 
    slogan: "Vuela alto, golpea fuerte", 
    history: "Un equipo profesional conocido por ser el único equipo completamente femenino en la liga profesional. Tienen una historia rica y gloriosa, siendo famosas por su juego agresivo, técnico y habilidoso. Las Harpies han sido pioneras en el Quidditch femenino y han inspirado a generaciones de jugadoras con su excelencia deportiva.", 
    wins: 156, 
    losses: 34,
    draws: 8,
    titles: 8, 
    founded: 1203,
    stadium: "Estadio Holyhead",
    colors: ["Verde Esmeralda", "Dorado"],
    achievements: ["Campeonas de Liga (8 veces)", "Equipo completamente femenino más exitoso", "Récord de mayor cantidad de títulos consecutivos (3)", "Mejor porcentaje de victorias de la liga"],
    roster: [ 
      {id: 'gw', name: 'Ginny Weasley', position: 'Cazadora', number: 8, yearsActive: 4, achievements: ["Estrella emergente del Quidditch", "Mejor jugadora joven del año"]}, 
      {id: 'cj', name: 'Wilda Griffiths', position: 'Buscadora', number: 7, yearsActive: 9, achievements: ["Capitana y líder histórica", "Velocidad récord en captura de Snitch"]},
      {id: 'md', name: 'Valmai Morgan', position: 'Cazadora', number: 9, yearsActive: 7, achievements: ["Anotadora más precisa del equipo", "300+ goles en su carrera"]},
      {id: 'lb', name: 'Gwendolyn Morgan', position: 'Cazadora', number: 6, yearsActive: 6, achievements: ["Hermana legendaria", "Especialista en jugadas aéreas"]},
      {id: 'jh', name: 'Gwenog Jones', position: 'Golpeadora', number: 4, yearsActive: 10, achievements: ["Ex-capitana legendaria", "Mejor golpeadora de la década"]},
      {id: 'kt', name: 'Glynnis Griffiths', position: 'Golpeadora', number: 3, yearsActive: 8, achievements: ["Especialista en defensa aérea"]},
      {id: 'sw', name: 'Artemis Fido', position: 'Guardiana', number: 1, yearsActive: 5, achievements: ["Portera más confiable de la liga", "Velocidad supersónica certificada"]}
    ],
    upcomingMatches: [
      {id: '1', opponent: 'Chudley Cannons', date: '2025-07-20', venue: 'Estadio Holyhead'},
      {id: '2', opponent: 'Ravenclaw', date: '2025-08-08', venue: 'Campo de Hogwarts'},
      {id: '3', opponent: 'Hufflepuff', date: '2025-08-22', venue: 'Estadio Holyhead'}
    ]
  },
};

const TeamDetailPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('historia');

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
  if (!team) return (
    <div className={styles.teamDetailPageContainer}>
      <div className={styles.backNavigation}>
        <Link to="/teams" className={styles.backButton}>
          ← Volver a Equipos
        </Link>
      </div>
      <div className={styles.notFound}>
        <h2>🔍 Equipo no encontrado</h2>
        <p>El equipo que buscas no existe o ha sido movido.</p>
        <Link to="/teams" className={styles.backButton}>
          Ver todos los equipos
        </Link>
      </div>
    </div>
  );

  // Determine card variant based on team name
  const getTeamCardVariant = (teamName: string): 'default' | 'magical' | 'gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff' => {
    const lowerTeam = teamName.toLowerCase();
    if (lowerTeam.includes('gryffindor')) return 'gryffindor';
    if (lowerTeam.includes('slytherin')) return 'slytherin';
    if (lowerTeam.includes('ravenclaw')) return 'ravenclaw';
    if (lowerTeam.includes('hufflepuff')) return 'hufflepuff';
    return 'magical';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className={styles.teamDetailPageContainer}>
      {/* Navegación de regreso */}
      <div className={styles.backNavigation}>
        <Link to="/teams" className={styles.backButton}>
          ← Volver a Equipos
        </Link>
      </div>

      {/* Header del equipo */}
      <section className={styles.teamHeaderDetail}>
        <TeamLogo 
          teamName={team.name} 
          size="xl" 
          animated
          className={styles.teamDetailLogo}
        />
        <div className={styles.teamInfoMain}>
          <h1 className={styles.teamName}>{team.name}</h1>
          <p className={styles.teamSlogan}>"{team.slogan}"</p>          <div className={styles.teamMetaInfo}>
            <span>� Liga Profesional Quidditch</span>
            <span>📅 Fundado en {team.founded}</span>
            {team.stadium && <span>🏟️ {team.stadium}</span>}
          </div>
          {team.colors && (
            <div className={styles.teamColors}>
              <span>🎨 Colores del equipo: {team.colors.join(', ')}</span>
            </div>
          )}
          <div className={styles.teamQuickStats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{team.wins}</div>
              <div className={styles.statLabel}>Victorias</div>
            </div>
            {team.losses && (
              <div className={styles.stat}>
                <div className={styles.statValue}>{team.losses}</div>
                <div className={styles.statLabel}>Derrotas</div>
              </div>
            )}
            {team.draws && (
              <div className={styles.stat}>
                <div className={styles.statValue}>{team.draws}</div>
                <div className={styles.statLabel}>Empates</div>
              </div>
            )}
            <div className={styles.stat}>
              <div className={styles.statValue}>{team.titles}</div>
              <div className={styles.statLabel}>Títulos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenido con tabs */}
      <Card variant={getTeamCardVariant(team.name)} className={styles.teamContentTabs}>
        <div className={styles.tabsNavigation}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'historia' ? styles.active : ''}`} 
            onClick={() => handleTabClick('historia')}
          >
            Historia
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'plantilla' ? styles.active : ''}`} 
            onClick={() => handleTabClick('plantilla')}
          >
            Plantilla
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'logros' ? styles.active : ''}`} 
            onClick={() => handleTabClick('logros')}
          >
            Logros
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'proximos' ? styles.active : ''}`} 
            onClick={() => handleTabClick('proximos')}
          >
            Próximos Partidos
          </button>
        </div>

        <div className={styles.tabContent}>
          {/* Tab Historia */}
          {activeTab === 'historia' && (
            <div>
              <h2 className={styles.tabTitle}>Historia del Equipo</h2>
              <p className={styles.tabText}>{team.history}</p>
            </div>
          )}

          {/* Tab Plantilla */}
          {activeTab === 'plantilla' && (
            <div>
              <h2 className={styles.tabTitle}>Plantilla Actual</h2>
              {team.roster.length > 0 ? (
                <div className={styles.playersList}>
                  {team.roster.map(player => (
                    <div key={player.id} className={styles.playerItem}>
                      <div className={styles.playerHeader}>
                        <span className={styles.playerName}>{player.name}</span>
                        <span className={styles.playerNumber}>#{player.number}</span>
                      </div>
                      <div className={styles.playerDetails}>
                        <span className={styles.playerPosition}>{player.position}</span>
                        {player.yearsActive && (
                          <span className={styles.playerYears}>• {player.yearsActive} años activo</span>
                        )}
                      </div>
                      {player.achievements && player.achievements.length > 0 && (
                        <div className={styles.playerAchievements}>
                          <strong>Logros:</strong>
                          <ul>
                            {player.achievements.map((achievement, index) => (
                              <li key={index}>{achievement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.tabText}>Información de la plantilla no disponible.</p>
              )}
            </div>
          )}

          {/* Tab Logros */}
          {activeTab === 'logros' && (
            <div>
              <h2 className={styles.tabTitle}>Logros y Reconocimientos</h2>
              {team.achievements && team.achievements.length > 0 ? (
                <div className={styles.achievementsList}>
                  {team.achievements.map((achievement, index) => (
                    <div key={index} className={styles.achievementItem}>
                      <span className={styles.achievementIcon}>🏆</span>
                      <span className={styles.achievementText}>{achievement}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.tabText}>Información de logros no disponible.</p>
              )}
            </div>
          )}

          {/* Tab Próximos Partidos */}
          {activeTab === 'proximos' && (
            <div>
              <h2 className={styles.tabTitle}>Próximos Partidos</h2>
              {team.upcomingMatches && team.upcomingMatches.length > 0 ? (
                <div className={styles.matchesList}>
                  {team.upcomingMatches.map(match => (
                    <div key={match.id} className={styles.matchItem}>
                      <div className={styles.matchHeader}>
                        <span className={styles.matchOpponent}>{team.name} vs {match.opponent}</span>
                        <span className={styles.matchDate}>{formatDate(match.date)}</span>
                      </div>
                      <div className={styles.matchDetails}>
                        <span className={styles.matchVenue}>🏟️ {match.venue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.tabText}>No hay próximos partidos programados.</p>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TeamDetailPage;