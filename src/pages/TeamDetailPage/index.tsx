import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Card from '@/components/common/Card';
import TeamLogo from '@/components/teams/TeamLogo';
import { apiClient } from '@/utils/apiClient';
import styles from './TeamDetailPage.module.css';

// Define interfaces for backend data
interface BackendPlayer {
  id: string;
  name: string;
  position: string;
  number: number;
  yearsActive: number;
  achievements: string[];
}

interface BackendMatch {
  id: string;
  opponent: string;
  date: string;
  venue: string;
  result?: 'win' | 'loss' | 'draw';
  score?: string;
}

interface BackendIdol {
  id: string;
  name: string;
  position: string;
  period: string;
  achievements: string[];
  description: string;
  legendaryStats: string;
}

interface BackendRivalry {
  opponentId: string;
  opponentName: string;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winPercentage: number;
  lastMatch?: {
    date: string;
    result: string;
    score: string;
  };
}

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

interface HistoricalIdol {
  id: string;
  name: string;
  position: string;
  period: string;
  achievements: string[];
  description: string;
  legendaryStats?: string;
}

interface TeamRivalry {
  opponentId: string;
  opponentName: string;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winPercentage: number;
  lastMatch?: {
    date: string;
    result: 'win' | 'loss' | 'draw';
    score: string;
  };
  noteableVictories?: string[];
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
  historicalIdols?: HistoricalIdol[];
  rivalries?: TeamRivalry[];
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
      {id: 'ow', name: 'Oliver Wood', position: 'Guardián', number: 1, yearsActive: 5, achievements: ["95% de efectividad en paradas", "Capitán legendario"]}    ],
    upcomingMatches: [
      {id: '1', opponent: 'Slytherin', date: '2025-07-15', venue: 'Campo de Hogwarts'},
      {id: '2', opponent: 'Ravenclaw', date: '2025-07-28', venue: 'Campo de Hogwarts'},
      {id: '3', opponent: 'Hufflepuff', date: '2025-08-10', venue: 'Campo de Hogwarts'}
    ],
    historicalIdols: [
      {
        id: 'james-potter',
        name: 'James Potter',
        position: 'Cazador',
        period: '1971-1978',
        achievements: ['Capitán del equipo durante 3 años', 'Récord de goles en una temporada: 127', 'Medalla al Mérito Deportivo'],
        description: 'Legendario Cazador conocido por su liderazgo excepcional y habilidades ofensivas. Su estilo de juego audaz inspiró a toda una generación.',
        legendaryStats: '127 goles en una temporada, 89% de efectividad'
      },
      {
        id: 'charlie-weasley',
        name: 'Charlie Weasley',
        position: 'Buscador',
        period: '1984-1991',
        achievements: ['Capitán del equipo', 'Podría haber jugado para Inglaterra', 'Captura más rápida: 3 minutos 47 segundos'],
        description: 'Buscador extraordinario que rechazó ofertas profesionales para seguir su pasión por los dragones. Su velocidad era legendaria.',
        legendaryStats: 'Captura promedio: 12 minutos, 94% tasa de éxito'
      },
      {
        id: 'godric-gryffindor',
        name: 'Godric Gryffindor',
        position: 'Fundador/Cazador',
        period: '990-1020',
        achievements: ['Fundador de la casa', 'Creador de las primeras tácticas de Quidditch', 'Poseedor de la espada de Gryffindor'],
        description: 'El mismísimo fundador, cuyo valor y caballerosidad establecieron los estándares del equipo. Su legado trasciende el deporte.',
        legendaryStats: 'Fundador - Estadísticas inmensurables'
      }
    ],
    rivalries: [
      {
        opponentId: 'slytherin',
        opponentName: 'Slytherin',
        totalMatches: 67,
        wins: 35,
        losses: 28,
        draws: 4,
        winPercentage: 52.2,
        lastMatch: {
          date: '2025-06-20',
          result: 'win',
          score: '180-140'
        },
        noteableVictories: ['Final Copa de las Casas 2023: 210-160', 'Clásico Centenario 2022: 195-180']
      },
      {
        opponentId: 'ravenclaw',
        opponentName: 'Ravenclaw',
        totalMatches: 45,
        wins: 28,
        losses: 15,
        draws: 2,
        winPercentage: 62.2,
        lastMatch: {
          date: '2025-05-15',
          result: 'win',
          score: '165-140'
        },
        noteableVictories: ['Semifinal Liga Mágica 2024: 175-150']
      },
      {
        opponentId: 'hufflepuff',
        opponentName: 'Hufflepuff',
        totalMatches: 41,
        wins: 31,
        losses: 8,
        draws: 2,
        winPercentage: 75.6,
        lastMatch: {
          date: '2025-04-22',
          result: 'win',
          score: '145-120'
        },
        noteableVictories: ['Partido Benéfico 2023: 200-165']
      }
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
      {id: 'mp', name: 'Miles Bletchley', position: 'Guardián', number: 1, yearsActive: 3, achievements: ["Guardián más joven en alcanzar 50 partidos"]}    ],
    upcomingMatches: [
      {id: '1', opponent: 'Gryffindor', date: '2025-07-15', venue: 'Campo de Hogwarts'},
      {id: '2', opponent: 'Hufflepuff', date: '2025-08-02', venue: 'Campo de Hogwarts'},
      {id: '3', opponent: 'Ravenclaw', date: '2025-08-20', venue: 'Campo de Hogwarts'}
    ],
    historicalIdols: [
      {
        id: 'salazar-slytherin',
        name: 'Salazar Slytherin',
        position: 'Fundador/Estratega',
        period: '990-1020',
        achievements: ['Fundador de la casa', 'Creador de las tácticas defensivas modernas', 'Heredero de Slytherin'],
        description: 'El fundador original, cuya astucia y ambición establecieron las bases del estilo de juego Slytherin. Su legado estratégico perdura hasta hoy.',
        legendaryStats: 'Fundador - Innovador táctico'
      },
      {
        id: 'tom-riddle',
        name: 'Tom Marvolo Riddle',
        position: 'Buscador',
        period: '1938-1945',
        achievements: ['Capitán del equipo', 'Buscador más estratégico de su era', 'Récord de capturas consecutivas: 12'],
        description: 'Buscador excepcionalmente hábil conocido por su capacidad de leer el juego y anticipar movimientos. Su enfoque meticuloso era legendario.',
        legendaryStats: 'Captura promedio: 8 minutos, 97% tasa de éxito'
      },
      {
        id: 'regulus-black',
        name: 'Regulus Black',
        position: 'Buscador',
        period: '1972-1979',
        achievements: ['Capitán más joven de Slytherin', 'Mejor promedio de captura en 7 años', 'Medalla al Valor Deportivo'],
        description: 'Buscador talentoso cuyo coraje en el campo igualaba su determinación. Su estilo elegante inspiró a toda una generación de Slytherin.',
        legendaryStats: 'Captura promedio: 10 minutos, 91% tasa de éxito'
      }
    ],
    rivalries: [
      {
        opponentId: 'gryffindor',
        opponentName: 'Gryffindor',
        totalMatches: 67,
        wins: 28,
        losses: 35,
        draws: 4,
        winPercentage: 41.8,
        lastMatch: {
          date: '2025-06-20',
          result: 'loss',
          score: '140-180'
        },
        noteableVictories: ['Venganza del Heredero 2021: 190-170', 'Duelo de Rivalidad 2020: 205-195']
      },
      {
        opponentId: 'hufflepuff',
        opponentName: 'Hufflepuff',
        totalMatches: 38,
        wins: 25,
        losses: 11,
        draws: 2,
        winPercentage: 65.8,
        lastMatch: {
          date: '2025-05-30',
          result: 'win',
          score: '155-135'
        },
        noteableVictories: ['Final Intercasas 2023: 185-160']
      },
      {
        opponentId: 'ravenclaw',
        opponentName: 'Ravenclaw',
        totalMatches: 42,
        wins: 24,
        losses: 16,
        draws: 2,
        winPercentage: 57.1,
        lastMatch: {
          date: '2025-04-18',
          result: 'win',
          score: '170-155'
        },
        noteableVictories: ['Batalla de Estrategas 2022: 160-155']
      }
    ]
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
      {id: 'gb', name: 'Grant Page', position: 'Guardián', number: 1, yearsActive: 4, achievements: ["Portero del año - 89% paradas", "Mejor reflejos de la liga"]}    ],
    upcomingMatches: [
      {id: '1', opponent: 'Hufflepuff', date: '2025-07-18', venue: 'Campo de Hogwarts'},
      {id: '2', opponent: 'Gryffindor', date: '2025-07-28', venue: 'Campo de Hogwarts'},
      {id: '3', opponent: 'Holyhead Harpies', date: '2025-08-08', venue: 'Campo de Hogwarts'}
    ],
    historicalIdols: [
      {
        id: 'rowena-ravenclaw',
        name: 'Rowena Ravenclaw',
        position: 'Fundadora/Estratega',
        period: '990-1020',
        achievements: ['Fundadora de la casa', 'Creadora de la Snitch Dorada moderna', 'Inventora de las jugadas aéreas complejas'],
        description: 'La fundadora original, cuya inteligencia excepcional revolucionó el Quidditch. Sus innovaciones tácticas sentaron las bases del juego moderno.',
        legendaryStats: 'Fundadora - Innovadora del deporte'
      },
      {
        id: 'filius-flitwick',
        name: 'Filius Flitwick',
        position: 'Cazador',
        period: '1955-1962',
        achievements: ['Duelist campeón antes del Quidditch', 'Capitán durante 4 años', 'Record de precisión en pases: 98.7%'],
        description: 'Maestro de la precisión y la técnica, cuyas habilidades como duelista se tradujeron en un control magistral de la Quaffle.',
        legendaryStats: '98.7% precisión en pases, 84 goles en una temporada'
      },
      {
        id: 'luna-lovegood',
        name: 'Luna Lovegood',
        position: 'Cazadora',
        period: '1995-1998',
        achievements: ['Jugada más creativa registrada', 'Comentarista legendaria', 'Inspiración para jugadas no convencionales'],
        description: 'Jugadora única cuyo enfoque poco convencional del juego creó algunas de las jugadas más memorables y efectivas del Quidditch moderno.',
        legendaryStats: '23 jugadas únicas registradas, 76% efectividad en creatividad'
      }
    ],
    rivalries: [
      {
        opponentId: 'gryffindor',
        opponentName: 'Gryffindor',
        totalMatches: 45,
        wins: 15,
        losses: 28,
        draws: 2,
        winPercentage: 33.3,
        lastMatch: {
          date: '2025-05-15',
          result: 'loss',
          score: '140-165'
        },
        noteableVictories: ['Triunfo del Ingenio 2021: 180-175', 'Sorpresa Táctica 2019: 190-170']
      },
      {
        opponentId: 'slytherin',
        opponentName: 'Slytherin',
        totalMatches: 42,
        wins: 16,
        losses: 24,
        draws: 2,
        winPercentage: 38.1,
        lastMatch: {
          date: '2025-04-18',
          result: 'loss',
          score: '155-170'
        },
        noteableVictories: ['Duelo de Estrategas 2022: 165-160']
      },
      {
        opponentId: 'hufflepuff',
        opponentName: 'Hufflepuff',
        totalMatches: 39,
        wins: 22,
        losses: 15,
        draws: 2,
        winPercentage: 56.4,
        lastMatch: {
          date: '2025-05-08',
          result: 'win',
          score: '175-165'
        },
        noteableVictories: ['Batalla Intelectual 2023: 195-180', 'Creatividad vs Trabajo 2020: 160-145']
      }
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
      {id: 'sb', name: 'Susan Bones', position: 'Guardiana', number: 1, yearsActive: 4, achievements: ["Guardiana más confiable - 92% paradas", "Líder silenciosa del equipo"]}    ],
    upcomingMatches: [
      {id: '1', opponent: 'Ravenclaw', date: '2025-07-18', venue: 'Campo de Hogwarts'},
      {id: '2', opponent: 'Slytherin', date: '2025-08-02', venue: 'Campo de Hogwarts'},
      {id: '3', opponent: 'Chudley Cannons', date: '2025-08-22', venue: 'Campo de Hogwarts'}
    ],
    historicalIdols: [
      {
        id: 'helga-hufflepuff',
        name: 'Helga Hufflepuff',
        position: 'Fundadora/Guardiana',
        period: '990-1020',
        achievements: ['Fundadora de la casa', 'Creadora del Fair Play en Quidditch', 'Primera en establecer reglas de deportividad'],
        description: 'La fundadora cuyo corazón justo estableció los valores de deportividad y trabajo en equipo que definen el Quidditch moderno.',
        legendaryStats: 'Fundadora - Madre del Fair Play'
      },
      {
        id: 'cedric-diggory',
        name: 'Cedric Diggory',
        position: 'Buscador',
        period: '1991-1995',
        achievements: ['Capitán durante 3 años', 'Campeón de Quidditch Escolar', 'Leyenda inmortal de Hufflepuff'],
        description: 'El Buscador más noble y talentoso en la historia de Hufflepuff. Su liderazgo y carisma inspiraron a generaciones futuras.',
        legendaryStats: 'Captura promedio: 15 minutos, 88% tasa de éxito, 100% deportividad'
      },
      {
        id: 'amos-diggory',
        name: 'Amos Diggory',
        position: 'Cazador',
        period: '1968-1975',
        achievements: ['Goleador histórico de Hufflepuff', 'Padre del gran Cedric', 'Récord de 156 goles en una temporada'],
        description: 'Cazador legendario cuya dedicación y trabajo duro ejemplificaron los valores Hufflepuff. Mentor de muchos jugadores exitosos.',
        legendaryStats: '156 goles en una temporada, 82% precisión en tiros'
      }
    ],
    rivalries: [
      {
        opponentId: 'gryffindor',
        opponentName: 'Gryffindor',
        totalMatches: 41,
        wins: 8,
        losses: 31,
        draws: 2,
        winPercentage: 19.5,
        lastMatch: {
          date: '2025-04-22',
          result: 'loss',
          score: '120-145'
        },
        noteableVictories: ['Milagro de Hufflepuff 2020: 165-160', 'David vs Goliat 2018: 155-150']
      },
      {
        opponentId: 'slytherin',
        opponentName: 'Slytherin',
        totalMatches: 38,
        wins: 11,
        losses: 25,
        draws: 2,
        winPercentage: 28.9,
        lastMatch: {
          date: '2025-05-30',
          result: 'loss',
          score: '135-155'
        },
        noteableVictories: ['Sorpresa del Año 2021: 170-165']
      },
      {
        opponentId: 'ravenclaw',
        opponentName: 'Ravenclaw',
        totalMatches: 39,
        wins: 15,
        losses: 22,
        draws: 2,
        winPercentage: 38.5,
        lastMatch: {
          date: '2025-05-08',
          result: 'loss',
          score: '165-175'
        },
        noteableVictories: ['Triunfo del Corazón 2022: 180-175', 'Perseverancia Total 2019: 150-145']
      }
    ]
  },
  chudley: {
    id: 'chudley',
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
      {id: 'sp', name: 'Galvin Gudgeon', position: 'Cazador', number: 8, yearsActive: 4, achievements: ["Mejor anotador de la temporada actual"]},      {id: 'tk', name: 'Roderick Plumpton', position: 'Golpeador', number: 5, yearsActive: 7, achievements: ["Defensor más temido de la liga"]},
      {id: 'bl', name: 'Dragomir Gorgovitch', position: 'Golpeador', number: 4, yearsActive: 5, achievements: ["Mejor golpeador defensivo del equipo"]}
    ],
    upcomingMatches: [
      {id: '1', opponent: 'Holyhead Harpies', date: '2025-07-20', venue: 'Estadio Ballycastle'},
      {id: '2', opponent: 'Gryffindor', date: '2025-08-05', venue: 'Campo de Hogwarts'},
      {id: '3', opponent: 'Slytherin', date: '2025-08-18', venue: 'Estadio Ballycastle'}
    ],
    historicalIdols: [
      {
        id: 'galvin-gudgeon',
        name: 'Galvin Gudgeon',
        position: 'Cazador',
        period: '2020-Presente',
        achievements: ['Actual estrella del equipo', 'Récord de goles en una temporada reciente', 'Esperanza del renacimiento del equipo'],
        description: 'El talentoso Cazador actual que representa la nueva era de los Cannons. Su habilidad y dedicación han renovado las esperanzas de los fanáticos.',
        legendaryStats: '78 goles en la temporada actual, 73% efectividad'
      },
      {
        id: 'roderick-plumpton',
        name: 'Roderick Plumpton',
        position: 'Buscador',
        period: '1921-1939',
        achievements: ['Único título de liga de los Cannons (1922)', 'Buscador más querido en la historia del equipo', 'Récord de captura más emotiva'],
        description: 'Leyenda absoluta y héroe de la única victoria de liga de los Cannons. Su captura ganadora en 1922 sigue siendo el momento más glorioso del equipo.',
        legendaryStats: 'Captura histórica en Final 1922, 79% tasa de éxito en carrera'
      },
      {
        id: 'joey-jenkins',
        name: 'Joey Jenkins',
        position: 'Buscador',
        period: '2018-Presente',
        achievements: ['Buscador estrella actual', 'Especialista en capturas bajo presión', 'Líder del resurgimiento del equipo'],
        description: 'El Buscador actual cuya determinación y habilidad bajo presión han devuelto la competitividad a los Cannons en los últimos años.',
        legendaryStats: 'Captura promedio: 18 minutos, 71% tasa de éxito'
      }
    ],
    rivalries: [
      {
        opponentId: 'harpies',
        opponentName: 'Holyhead Harpies',
        totalMatches: 28,
        wins: 6,
        losses: 20,
        draws: 2,
        winPercentage: 21.4,
        lastMatch: {
          date: '2025-03-15',
          result: 'loss',
          score: '140-185'
        },
        noteableVictories: ['Sorpresa Naranja 2019: 160-155', 'Milagro de Ballycastle 2017: 175-170']
      },
      {
        opponentId: 'hufflepuff',
        opponentName: 'Hufflepuff',
        totalMatches: 15,
        wins: 8,
        losses: 6,
        draws: 1,
        winPercentage: 53.3,
        lastMatch: {
          date: '2025-04-10',
          result: 'win',
          score: '150-140'
        },
        noteableVictories: ['Duelo de Underdogs 2023: 165-160']
      },
      {
        opponentId: 'appleby-arrows',
        opponentName: 'Appleby Arrows',
        totalMatches: 35,
        wins: 12,
        losses: 21,
        draws: 2,
        winPercentage: 34.3,
        lastMatch: {
          date: '2025-02-28',
          result: 'loss',
          score: '135-150'
        },
        noteableVictories: ['Derby Regional 2020: 180-175']
      }
    ]  },
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
    ],
    historicalIdols: [
      {
        id: 'gwenog-jones',
        name: 'Gwenog Jones',
        position: 'Golpeadora',
        period: '1998-2015',
        achievements: ['Capitana durante 10 años', 'Mejor Golpeadora de la Liga (5 veces)', 'Líder histórica del equipo más exitoso'],
        description: 'La capitana más exitosa en la historia de las Harpies. Su liderazgo feroz y habilidades incomparables como Golpeadora llevaron al equipo a su época dorada.',
        legendaryStats: 'Capitana 10 años, 5 títulos de liga, 87% efectividad defensiva'
      },
      {
        id: 'wilda-griffiths',
        name: 'Wilda Griffiths',
        position: 'Buscadora',
        period: '2016-Presente',
        achievements: ['Capitana actual', 'Récord de captura más rápida: 3 minutos 47 segundos', 'Buscadora del año (3 veces)'],
        description: 'La actual capitana y una de las Buscadoras más talentosas de la era moderna. Su velocidad y precisión han redefinido la posición.',
        legendaryStats: 'Captura promedio: 12 minutos, 92% tasa de éxito, Récord de velocidad'
      },
      {
        id: 'ginny-weasley',
        name: 'Ginny Weasley',
        position: 'Cazadora',
        period: '2019-Presente',
        achievements: ['Estrella emergente del Quidditch', 'Mejor jugadora joven del año', 'Prometedora futura capitana'],
        description: 'La joven estrella que representa el futuro brillante de las Harpies. Su talento natural y determinación la convierten en una de las jugadoras más prometedoras.',
        legendaryStats: '89% precisión en pases, 67 goles en su primera temporada completa'
      }
    ],
    rivalries: [
      {
        opponentId: 'chudley',
        opponentName: 'Chudley Cannons',
        totalMatches: 28,
        wins: 20,
        losses: 6,
        draws: 2,
        winPercentage: 71.4,
        lastMatch: {
          date: '2025-03-15',
          result: 'win',
          score: '185-140'
        },
        noteableVictories: ['Dominación Verde 2023: 210-125', 'Clásico Femenino 2021: 195-160']
      },
      {
        opponentId: 'gryffindor',
        opponentName: 'Gryffindor',
        totalMatches: 22,
        wins: 16,
        losses: 5,
        draws: 1,
        winPercentage: 72.7,
        lastMatch: {
          date: '2025-06-10',
          result: 'win',
          score: '175-155'
        },
        noteableVictories: ['Duelo de Valor 2022: 190-175', 'Choque de Titanes 2020: 165-160']
      },
      {
        opponentId: 'slytherin',
        opponentName: 'Slytherin',
        totalMatches: 26,
        wins: 18,
        losses: 7,
        draws: 1,
        winPercentage: 69.2,
        lastMatch: {
          date: '2025-05-25',
          result: 'win',
          score: '170-150'
        },
        noteableVictories: ['Batalla de Elegancia 2023: 185-170', 'Superioridad Táctica 2019: 160-145']
      }
    ]
  },
};

const TeamDetailPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('historia');

  useEffect(() => {
    const loadTeamDetails = async () => {
      if (!teamId) return;
      
      setIsLoading(true);
      
      try {
        // Try to get team from backend first
        const response = await apiClient.get(`/teams/${teamId}`) as { 
          success?: boolean; 
          data?: Record<string, unknown>
        };
        
        if (response.success && response.data) {
          const teamData = response.data;
          
          // Transform backend data to match frontend interface
          const transformedTeam: TeamDetails = {
            id: String(teamData.id || teamId),
            name: String(teamData.name || ''),
            slogan: String(teamData.slogan || 'A proud Quidditch team'),
            history: String(teamData.history || 'This team has a rich history in Quidditch.'),
            wins: Number(teamData.wins) || 0,
            losses: Number(teamData.losses) || 0,
            draws: Number(teamData.draws) || 0,
            titles: Number(teamData.titles) || 0,
            founded: Number(teamData.founded) || 1000,
            stadium: String(teamData.stadium || 'Unknown Stadium'),
            colors: Array.isArray(teamData.colors) ? teamData.colors.map(String) : ['Unknown'],
            achievements: Array.isArray(teamData.achievements) ? teamData.achievements.map(String) : [],
            
            // Transform roster data from backend
            roster: Array.isArray(teamData.roster) ? teamData.roster.map((player: BackendPlayer) => ({
              id: String(player.id || ''),
              name: String(player.name || ''),
              position: String(player.position || ''),
              number: Number(player.number) || 0,
              yearsActive: Number(player.yearsActive) || 0,
              achievements: Array.isArray(player.achievements) ? player.achievements.map(String) : []
            })) : [],
            
            // Transform upcoming matches from backend
            upcomingMatches: Array.isArray(teamData.upcomingMatches) ? teamData.upcomingMatches.map((match: BackendMatch) => ({
              id: String(match.id || ''),
              opponent: String(match.opponent || ''),
              date: String(match.date || ''),
              venue: String(match.venue || ''),
              result: undefined // upcoming matches don't have results
            })) : [],
            
            // Transform recent matches from backend
            recentMatches: Array.isArray(teamData.recentMatches) ? teamData.recentMatches.map((match: BackendMatch) => ({
              id: String(match.id || ''),
              opponent: String(match.opponent || ''),
              date: String(match.date || ''),
              venue: String(match.venue || ''),
              result: match.result as 'win' | 'loss' | 'draw' | undefined,
              score: String(match.score || '')
            })) : [],
            
            // Transform historical idols from backend
            historicalIdols: Array.isArray(teamData.historicalIdols) ? teamData.historicalIdols.map((idol: BackendIdol) => ({
              id: String(idol.id || ''),
              name: String(idol.name || ''),
              position: String(idol.position || ''),
              period: String(idol.period || ''),
              achievements: Array.isArray(idol.achievements) ? idol.achievements.map(String) : [],
              description: String(idol.description || ''),
              legendaryStats: String(idol.legendaryStats || '')
            })) : [],
            
            // Transform rivalries from backend
            rivalries: Array.isArray(teamData.rivalries) ? teamData.rivalries.map((rivalry: BackendRivalry) => ({
              opponentId: String(rivalry.opponentId || ''),
              opponentName: String(rivalry.opponentName || ''),
              totalMatches: Number(rivalry.totalMatches) || 0,
              wins: Number(rivalry.wins) || 0,
              losses: Number(rivalry.losses) || 0,
              draws: Number(rivalry.draws) || 0,
              winPercentage: Number(rivalry.winPercentage) || 0,
              lastMatch: rivalry.lastMatch ? {
                date: String(rivalry.lastMatch.date || ''),
                result: (rivalry.lastMatch.result as 'win' | 'loss' | 'draw') || 'draw',
                score: String(rivalry.lastMatch.score || '')
              } : undefined
            })) : []
          };
          
          setTeam(transformedTeam);
        } else {
          throw new Error('Team not found in backend');
        }
      } catch (error) {
        console.error(`Failed to load team ${teamId} from backend:`, error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        
        // Fallback to mock data
        if (teamId && mockTeamDetails[teamId]) {
          console.warn(`Using mock data for team ${teamId}`);
          setTeam(mockTeamDetails[teamId]);
        } else {
          setTeam(null);
        }
      }
      
      setIsLoading(false);
    };

    loadTeamDetails();
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
          </button>          <button 
            className={`${styles.tabButton} ${activeTab === 'logros' ? styles.active : ''}`} 
            onClick={() => handleTabClick('logros')}
          >
            Logros
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'idolos' ? styles.active : ''}`} 
            onClick={() => handleTabClick('idolos')}
          >
            Ídolos Históricos
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'rivalidades' ? styles.active : ''}`} 
            onClick={() => handleTabClick('rivalidades')}
          >
            Rivalidades
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
          )}          {/* Tab Próximos Partidos */}
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

          {/* Tab Ídolos Históricos */}
          {activeTab === 'idolos' && (
            <div>
              <h2 className={styles.tabTitle}>Ídolos Históricos</h2>
              {team.historicalIdols && team.historicalIdols.length > 0 ? (
                <div className={styles.idolsList}>
                  {team.historicalIdols.map(idol => (
                    <div key={idol.id} className={styles.idolItem}>
                      <div className={styles.idolHeader}>
                        <div className={styles.idolBasicInfo}>
                          <h3 className={styles.idolName}>{idol.name}</h3>
                          <span className={styles.idolPosition}>{idol.position}</span>
                          <span className={styles.idolPeriod}>📅 {idol.period}</span>
                        </div>
                        {idol.legendaryStats && (
                          <div className={styles.idolStats}>
                            <span className={styles.idolStatsLabel}>Estadísticas Legendarias:</span>
                            <span className={styles.idolStatsValue}>{idol.legendaryStats}</span>
                          </div>
                        )}
                      </div>
                      <p className={styles.idolDescription}>{idol.description}</p>
                      <div className={styles.idolAchievements}>
                        <h4 className={styles.idolAchievementsTitle}>🏆 Logros Principales:</h4>
                        <ul className={styles.idolAchievementsList}>
                          {idol.achievements.map((achievement, index) => (
                            <li key={index} className={styles.idolAchievementItem}>
                              {achievement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.tabText}>No hay información de ídolos históricos disponible.</p>
              )}
            </div>
          )}

          {/* Tab Rivalidades */}
          {activeTab === 'rivalidades' && (
            <div>
              <h2 className={styles.tabTitle}>Estadísticas de Enfrentamientos</h2>
              {team.rivalries && team.rivalries.length > 0 ? (
                <div className={styles.rivalriesList}>
                  {team.rivalries.map(rivalry => (
                    <div key={rivalry.opponentId} className={styles.rivalryItem}>
                      <div className={styles.rivalryHeader}>
                        <div className={styles.rivalryTeamInfo}>
                          <h3 className={styles.rivalryOpponent}>
                            {team.name} vs {rivalry.opponentName}
                          </h3>
                          <span className={styles.rivalryRecord}>
                            Historial: {rivalry.wins}-{rivalry.losses}-{rivalry.draws} 
                            ({rivalry.winPercentage.toFixed(1)}% victorias)
                          </span>
                        </div>
                        <div className={styles.rivalryStats}>
                          <div className={styles.rivalryStatItem}>
                            <span className={styles.rivalryStatValue}>{rivalry.totalMatches}</span>
                            <span className={styles.rivalryStatLabel}>Partidos</span>
                          </div>
                          <div className={styles.rivalryStatItem}>
                            <span className={styles.rivalryStatValue}>{rivalry.wins}</span>
                            <span className={styles.rivalryStatLabel}>Victorias</span>
                          </div>
                          <div className={styles.rivalryStatItem}>
                            <span className={styles.rivalryStatValue}>{rivalry.losses}</span>
                            <span className={styles.rivalryStatLabel}>Derrotas</span>
                          </div>
                        </div>
                      </div>
                      
                      {rivalry.lastMatch && (
                        <div className={styles.rivalryLastMatch}>
                          <h4 className={styles.rivalryLastMatchTitle}>Último Enfrentamiento:</h4>
                          <div className={styles.rivalryLastMatchInfo}>
                            <span className={styles.rivalryLastMatchDate}>
                              📅 {formatDate(rivalry.lastMatch.date)}
                            </span>
                            <span className={`${styles.rivalryLastMatchResult} ${styles[rivalry.lastMatch.result]}`}>
                              {rivalry.lastMatch.result === 'win' ? '✅ Victoria' : 
                               rivalry.lastMatch.result === 'loss' ? '❌ Derrota' : '⚖️ Empate'}
                            </span>
                            <span className={styles.rivalryLastMatchScore}>
                              {rivalry.lastMatch.score}
                            </span>
                          </div>
                        </div>
                      )}

                      {rivalry.noteableVictories && rivalry.noteableVictories.length > 0 && (
                        <div className={styles.rivalryVictories}>
                          <h4 className={styles.rivalryVictoriesTitle}>🌟 Victorias Memorables:</h4>
                          <ul className={styles.rivalryVictoriesList}>
                            {rivalry.noteableVictories.map((victory, index) => (
                              <li key={index} className={styles.rivalryVictoryItem}>
                                {victory}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.tabText}>No hay información de rivalidades disponible.</p>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TeamDetailPage;