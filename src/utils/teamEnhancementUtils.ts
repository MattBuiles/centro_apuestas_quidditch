// Función para generar historias más elaboradas de equipos
export function generateEnhancedTeamHistory(teamName: string, founded: number, existingHistory?: string): string {
  // Historias base mejoradas por equipo
  const enhancedHistories: { [key: string]: string } = {
    'Gryffindor': `Fundado en el año ${founded} por el valiente Godric Gryffindor, este equipo ha sido el estandarte del coraje y la caballerosidad en el mundo del Quidditch. Durante más de mil años, los colores rojo y dorado han ondeado en los campos de juego, representando no solo la valentía, sino también la determinación inquebrantable que caracteriza a sus jugadores.
    
    La época dorada del equipo comenzó en el siglo XV, cuando establecieron el récord de victorias consecutivas que perduró durante tres siglos. Su estilo de juego, conocido como "Ataque del León", se basa en jugadas audaces y arriesgadas que han inspirado a generaciones de jugadores de Quidditch en todo el mundo.
    
    Los momentos más memorables incluyen la legendaria final de 1994, donde Harry Potter, siendo el buscador más joven en un siglo, capturó la Snitch Dorada en tiempo récord. El equipo es conocido por su capacidad de convertir situaciones desesperadas en victorias triunfales, un testimonio del espíritu indomable que Godric Gryffindor inculcó en sus fundamentos.`,
    
    'Slytherin': `Establecido en ${founded} por Salazar Slytherin, este equipo ha forjado una reputación legendaria basada en la astucia, la estrategia y la ambición desmedida. Los colores verde y plata no solo representan la elegancia, sino también la frialdad calculada con la que abordan cada partido.
    
    Durante los siglos XII y XIII, Slytherin dominó el Quidditch estudiantil con una serie de tácticas innovadoras que revolucionaron el deporte. Su formación defensiva, conocida como "La Muralla de Serpientes", se convirtió en el estándar para equipos de todo el mundo mágico.
    
    El equipo alcanzó su apogeo en la era moderna bajo el liderazgo de Marcus Flint, estableciendo un récord de cuatro campeonatos consecutivos. Su filosofía de juego se basa en la paciencia estratégica y la ejecución precisa, convirtiendo cada partido en una lección magistral de táctica deportiva.`,
    
    'Ravenclaw': `Fundado en ${founded} por Rowena Ravenclaw, este equipo ha sido sinónimo de inteligencia táctica y brillantez estratégica en el campo de Quidditch. Los colores azul y bronce reflejan la sabiduría y la creatividad que han caracterizado su juego durante más de un milenio.
    
    Ravenclaw es reconocido por haber introducido las formaciones más innovadoras en la historia del Quidditch. Durante el siglo XVI, desarrollaron el "Sistema de Vuelo Helicoidal", una técnica que permite a los jugadores cambiar de posición dinámicamente durante el juego, confundiendo a los oponentes y creando oportunidades inesperadas.
    
    Su momento más glorioso llegó con Cho Chang como buscadora, quien no solo dominó el arte de la captura de la Snitch, sino que también estableció nuevos estándares de velocidad y precisión. El equipo es admirado por su capacidad de analizar a los oponentes y adaptar su estrategia en tiempo real, convirtiendo cada partido en una exhibición de genio táctico.`,
    
    'Hufflepuff': `Establecido en ${founded} por Helga Hufflepuff, este equipo ha construido su legado sobre los pilares de la lealtad, el trabajo en equipo y la perseverancia. Los colores amarillo y negro simbolizan la determinación dorada y la solidez inquebrantable que caracterizan su estilo de juego.
    
    Aunque a menudo subestimado, Hufflepuff ha demostrado repetidamente que el trabajo duro y la dedicación pueden superar el talento natural. Durante el siglo XVIII, establecieron el récord de la temporada más larga sin derrotas en casa, un testimonio de su increíble cohesión como equipo.
    
    Su filosofía de juego se centra en el apoyo mutuo y la resistencia. El equipo es famoso por sus remontadas en los últimos minutos, ganándose el apodo de "Los Indestructibles". Bajo el liderazgo de Cedric Diggory, alcanzaron nuevas alturas, demostrando que la humildad y la determinación pueden conquistar cualquier adversario.`,
    
    'Chudley Cannons': `Fundado en ${founded} en el pequeño pueblo de Chudley, este equipo profesional ha capturado los corazones de los fanáticos del Quidditch con su espíritu indomable y su resistencia ante la adversidad. Los colores naranja brillante y negro representan la energía ardiente y la determinación férrea que han mantenido viva la esperanza durante décadas de dificultades.
    
    Durante su época dorada en los años 1890, los Cannons fueron una fuerza formidable en la liga profesional, conquistando su único campeonato en una final memorable que aún se recuerda como uno de los partidos más emocionantes de la historia. Su estilo de juego agresivo y directo los convirtió en los favoritos de las multitudes.
    
    A pesar de atravesar largos períodos de sequía de títulos, los Cannons han mantenido una de las bases de fanáticos más leales del deporte. Su filosofía de "nunca rendirse" ha inspirado a generaciones de jugadores y seguidores, demostrando que el verdadero valor no se mide solo en trofeos, sino en la pasión y la dedicación constante.`,
    
    'Holyhead Harpies': `Establecido en ${founded} en las costas de Gales, este equipo ha sido pionero en el Quidditch femenino profesional y una inspiración para atletas de todo el mundo mágico. Los colores verde esmeralda y dorado representan la elegancia natural y la excelencia que han definido su juego durante siglos.
    
    Las Harpies revolucionaron el deporte al convertirse en el primer equipo completamente femenino en competir al más alto nivel profesional. Su estilo de juego, caracterizado por la velocidad, la precisión y la coordinación perfecta, estableció nuevos estándares que aún hoy son estudiados por entrenadores de todo el mundo.
    
    Con ocho campeonatos de liga en su historia, las Harpies han demostrado consistentemente que la excelencia no conoce géneros. Bajo el liderazgo de leyendas como Ginny Weasley, han inspirado a millones de jóvenes brujas a perseguir sus sueños deportivos, convirtiendo cada victoria en un símbolo de progreso y determinación.`
  };
  
  // Si existe una historia base mejorada para el equipo, usarla
  if (enhancedHistories[teamName]) {
    return enhancedHistories[teamName];
  }
  
  // Si se proporciona una historia existente pero es muy corta, expandirla
  if (existingHistory && existingHistory.length < 200) {
    return `${existingHistory} Este equipo ha construido su legado a través de décadas de dedicación y excelencia deportiva. Su filosofía de juego se ha transmitido de generación en generación, creando una tradición rica en momentos memorables y jugadores legendarios.
    
    Durante su historia, el equipo ha enfrentado numerosos desafíos, desde temporadas difíciles hasta rivalidades intensas, pero siempre ha mantenido su espíritu competitivo y su compromiso con la excelencia. Los valores fundamentales que establecieron sus fundadores continúan guiando a los jugadores modernos.
    
    En la actualidad, el equipo sigue escribiendo su historia, combinando las tradiciones del pasado con las innovaciones del presente para crear un futuro brillante en el mundo del Quidditch profesional.`;
  }
  
  // Historia genérica mejorada para equipos no especificados
  return `Fundado en el año ${founded}, este equipo ha forjado una historia rica en tradición y excelencia deportiva a lo largo de los siglos. Desde sus humildes comienzos hasta convertirse en una fuerza respetada en el mundo del Quidditch, cada capítulo de su historia ha sido escrito con pasión y determinación.
  
  Durante sus años de formación, el equipo desarrolló un estilo de juego único que combinaba técnica refinada con espíritu competitivo. Sus fundadores establecieron una filosofía deportiva que ha perdurado a través de las generaciones, creando una cultura de excelencia que sigue inspirando a jugadores y fanáticos por igual.
  
  A lo largo de los siglos, el equipo ha vivido épocas doradas de triunfos memorables, así como períodos de reconstrucción que han fortalecido su carácter. Cada victoria ha sido celebrada con orgullo, y cada derrota ha servido como lección para crecer y mejorar, manteniendo siempre el espíritu indomable que define su esencia.`;
}

// Función para generar logros más específicos basados en el equipo
export function generateEnhancedAchievements(teamName: string, titles: number, existingAchievements?: string[]): string[] {
  const baseAchievements: { [key: string]: string[] } = {
    'Gryffindor': [
      `Campeón de la Copa de las Casas (${titles} veces)`,
      "Récord de la captura más rápida de la Snitch Dorada (5 minutos)",
      "Mayor número de victorias consecutivas (23 partidos)",
      "Mejor comeback en una final (deficitario por 150 puntos)",
      "Premio al Fair Play por excelencia deportiva",
      "Formación del buscador más joven en un siglo"
    ],
    'Slytherin': [
      `Campeón de Liga Intercasas (${titles} veces)`,
      "Récord de mayor número de títulos consecutivos (4)",
      "Estrategia defensiva más efectiva de la década",
      "Mayor porcentaje de victorias en finales (89%)",
      "Innovadores de la formación 'Muralla de Serpientes'",
      "Mejor disciplina táctica en la historia del deporte"
    ],
    'Ravenclaw': [
      `Campeón de Torneos Académicos (${titles} veces)`,
      "Creadores del Sistema de Vuelo Helicoidal",
      "Mayor número de jugadas innovadoras registradas",
      "Récord de precisión en pases (94.7%)",
      "Premio a la Excelencia Táctica por 5 años consecutivos",
      "Mejor análisis estratégico pre-partido"
    ],
    'Hufflepuff': [
      `Campeón de Resistencia (${titles} veces)`,
      "Récord de la temporada más larga sin derrotas en casa",
      "Mayor número de remontadas exitosas",
      "Premio al Espíritu Deportivo por 10 años consecutivos",
      "Mejor cohesión de equipo medida científicamente",
      "Récord de menor número de tarjetas por juego sucio"
    ],
    'Chudley Cannons': [
      `Campeón de Liga Profesional (${titles} vez)`,
      "Mayor base de fanáticos leales del país",
      "Récord de asistencia en partidos locales",
      "Premio al Coraje Deportivo",
      "Mejor espíritu de superación ante la adversidad",
      "Jugadores más queridos por la comunidad mágica"
    ],
    'Holyhead Harpies': [
      `Campeonas de Liga Femenina (${titles} veces)`,
      "Primer equipo completamente femenino en liga profesional",
      "Récord de mayor cantidad de títulos consecutivos (3)",
      "Mejor porcentaje de victorias en la historia de la liga",
      "Inspiración para el desarrollo del Quidditch femenino",
      "Premio a la Excelencia Deportiva e Igualdad"
    ]
  };
  
  // Si existe una lista específica para el equipo, usarla
  if (baseAchievements[teamName]) {
    return baseAchievements[teamName];
  }
  
  // Si se proporcionan logros existentes, mantenerlos y posiblemente expandirlos
  if (existingAchievements && existingAchievements.length > 0) {
    return existingAchievements;
  }
  
  // Logros genéricos para equipos no especificados
  return [
    `Campeón de Liga (${titles} veces)`,
    "Excelencia deportiva reconocida por la federación",
    "Desarrollo de jóvenes talentos sobresalientes",
    "Contribución al crecimiento del deporte",
    "Mantenimiento de tradiciones deportivas centenarias",
    "Espíritu competitivo exemplar"
  ];
}

// Función para mejorar la información de próximos partidos
export function enhanceUpcomingMatches(upcomingMatches: unknown[]): unknown[] {
  return upcomingMatches.map(match => ({
    ...(match as object),
    description: generateMatchDescription(),
    importance: getMatchImportance(match)
  }));
}

function generateMatchDescription(): string {
  const descriptions = [
    "Un enfrentamiento que promete emociones hasta el último minuto",
    "Duelo de titanes que definirá el rumbo de la temporada",
    "Partido crucial para las aspiraciones del campeonato",
    "Encuentro que reavivará una histórica rivalidad",
    "Oportunidad perfecta para demostrar el potencial del equipo"
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function getMatchImportance(match: unknown): 'low' | 'medium' | 'high' {
  // Lógica simple para determinar importancia
  const rivalTeams = ['Slytherin', 'Gryffindor', 'Ravenclaw', 'Hufflepuff'];
  const matchObj = match as { opponent?: string; venue?: string };
  const opponent = matchObj.opponent || '';
  
  if (rivalTeams.includes(opponent)) {
    return 'high';
  } else if (matchObj.venue === 'Home') {
    return 'medium';
  } else {
    return 'low';
  }
}
