import { DatabaseConnection } from './DatabaseConnection';
import { TeamRow, TeamStats, FinishedMatch, Season } from './interfaces';

export class DatabaseSeed {
  private connection: DatabaseConnection;

  constructor() {
    this.connection = DatabaseConnection.getInstance();
  }

  public async seedInitialData(): Promise<void> {
    // Check if we already have data
    const existingUser = await this.connection.get('SELECT COUNT(*) as count FROM users') as { count: number };
    
    if (existingUser.count > 0) {
      console.log('📦 Database already has data, skipping seed');
      return;
    }

    // Seed teams data (from your existing frontend data)
    const teamsData = [
      {
        id: 'gryffindor',
        name: 'Gryffindor',
        logo: '/images/gryffindor-logo.png',
        founded: 990,
        description: 'Casa conocida por su valentía y determinación',
        stadium: 'Campo de Quidditch de Hogwarts',
        colors: JSON.stringify(['#740001', '#D3A625']),
        slogan: 'Donde habitan los valientes de corazón',
        history: 'Fundado por Godric Gryffindor, conocido por su coraje y caballerosidad. Los Gryffindor son famosos por su valentía, osadía, temple y caballerosidad.',
        titles: 7,
        achievements: JSON.stringify(['Campeón de la Copa de las Casas (7 veces)', 'Récord de la captura más rápida de la Snitch Dorada', 'Mayor número de victorias consecutivas (23 partidos)']),
        attack_strength: 85,
        defense_strength: 82,
        seeker_skill: 90,
        keeper_skill: 88,
        chaser_skill: 85,
        beater_skill: 80
      },
      {
        id: 'slytherin',
        name: 'Slytherin',
        logo: '/images/slytherin-logo.png',
        founded: 990,
        description: 'Casa conocida por su astucia y ambición',
        stadium: 'Campo de Quidditch de Hogwarts',
        colors: JSON.stringify(['#1A472A', '#AAAAAA']),
        slogan: 'Ambición pura y astucia refinada',
        history: 'Fundado por Salazar Slytherin, este equipo es conocido por su estrategia astuta y su determinación feroz en el campo de Quidditch.',
        titles: 6,
        achievements: JSON.stringify(['Campeón de la Copa de las Casas (6 veces)', 'Mejor defensa en la historia de Hogwarts', 'Record de victorias consecutivas en casa']),
        attack_strength: 88,
        defense_strength: 92,
        seeker_skill: 85,
        keeper_skill: 93,
        chaser_skill: 87,
        beater_skill: 90
      },
      {
        id: 'ravenclaw',
        name: 'Ravenclaw',
        logo: '/images/ravenclaw-logo.png',
        founded: 990,
        description: 'Casa conocida por su sabiduría e ingenio',
        stadium: 'Campo de Quidditch de Hogwarts',
        colors: JSON.stringify(['#0E1A40', '#946B2D']),
        slogan: 'Sabiduría más allá de la medida es el mayor tesoro del hombre',
        history: 'Fundado por Rowena Ravenclaw, este equipo combina inteligencia estratégica con habilidades técnicas excepcionales en el aire.',
        titles: 4,
        achievements: JSON.stringify(['Campeón de la Copa de las Casas (4 veces)', 'Mejor promedio académico del equipo', 'Innovadores en tácticas de vuelo']),
        attack_strength: 80,
        defense_strength: 85,
        seeker_skill: 92,
        keeper_skill: 85,
        chaser_skill: 90,
        beater_skill: 75
      },
      {
        id: 'hufflepuff',
        name: 'Hufflepuff',
        logo: '/images/hufflepuff-logo.png',
        founded: 990,
        description: 'Casa conocida por su lealtad y trabajo duro',
        stadium: 'Campo de Quidditch de Hogwarts',
        colors: JSON.stringify(['#ECB939', '#372E29']),
        slogan: 'Estos pacientes, leales y justos nunca temen al trabajo pesado',
        history: 'Fundado por Helga Hufflepuff, este equipo demuestra que la dedicación y el trabajo en equipo pueden superar cualquier obstáculo.',
        titles: 2,
        achievements: JSON.stringify(['Campeón de la Copa de las Casas (2 veces)', 'Mejor espíritu deportivo', 'Record de fair play']),
        attack_strength: 75,
        defense_strength: 88,
        seeker_skill: 78,
        keeper_skill: 90,
        chaser_skill: 82,
        beater_skill: 85
      },
      {
        id: 'chudley-cannons',
        name: 'Chudley Cannons',
        logo: '/images/chudley-cannons-logo.png',
        founded: 1892,
        description: 'Equipo profesional inglés con sede en Chudley',
        stadium: 'Estadio Chudley',
        colors: JSON.stringify(['#FFA500', '#000000']),
        slogan: 'Cañones que nunca se rinden',
        history: 'Un equipo profesional con una historia turbulenta pero con fans leales. Conocidos por su estilo de juego impredecible y su pasión.',
        titles: 1,
        achievements: JSON.stringify(['Liga Profesional de Quidditch (1 vez)', 'Mejor remontada de la historia', 'Fanáticos más leales']),
        attack_strength: 70,
        defense_strength: 65,
        seeker_skill: 75,
        keeper_skill: 70,
        chaser_skill: 72,
        beater_skill: 78
      },
      {
        id: 'holyhead-harpies',
        name: 'Holyhead Harpies',
        logo: '/images/holyhead-harpies-logo.png',
        founded: 1203,
        description: 'Equipo profesional femenino de Gales',
        stadium: 'Estadio Holyhead',
        colors: JSON.stringify(['#006400', '#FFFFFF']),
        slogan: 'Arpías veloces como el viento',
        history: 'El equipo totalmente femenino más exitoso en la historia del Quidditch profesional. Conocidas por su velocidad y técnica excepcional.',
        titles: 5,
        achievements: JSON.stringify(['Liga Profesional de Quidditch (5 veces)', 'Primer equipo totalmente femenino campeón', 'Record de velocidad en vuelo']),
        attack_strength: 92,
        defense_strength: 78,
        seeker_skill: 95,
        keeper_skill: 80,
        chaser_skill: 95,
        beater_skill: 73
      }
    ];

    // Insert teams
    for (const team of teamsData) {
      await this.connection.run(`
        INSERT INTO teams (id, name, logo, founded, description, stadium, colors, slogan, history, titles, achievements, 
                          attack_strength, defense_strength, seeker_skill, keeper_skill, chaser_skill, beater_skill)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [team.id, team.name, team.logo, team.founded, team.description, team.stadium, team.colors,
          team.slogan, team.history, team.titles, team.achievements,
          team.attack_strength, team.defense_strength, team.seeker_skill, team.keeper_skill, team.chaser_skill, team.beater_skill]);
    }

    // Seed players for each team
    await this.seedPlayers();

    // Create default admin user
    const bcrypt = await import('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await this.connection.run(`
      INSERT INTO users (id, username, email, password, role, balance)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['admin-user', 'admin', 'admin@quidditch.com', adminPassword, 'admin', 10000]);

    console.log('🌱 Initial data seeded successfully');
    console.log('👤 Default admin user created: admin@quidditch.com / admin123');

    // Seed bet types
    await this.seedBetTypes();

    // Create a sample season
    await this.createSampleSeason();
  }

  public async seedBetTypes(): Promise<void> {
    console.log('🎲 Seeding bet types...');

    const betTypes = [
      // Winner bets
      { id: 'winner-home', name: 'Ganador Local', description: 'El equipo local gana el partido', category: 'winner', base_odds: 2.15, risk_level: 'low' },
      { id: 'winner-away', name: 'Ganador Visitante', description: 'El equipo visitante gana el partido', category: 'winner', base_odds: 1.90, risk_level: 'low' },
      { id: 'winner-draw', name: 'Empate', description: 'El partido termina en empate', category: 'winner', base_odds: 8.50, risk_level: 'high' },
      
      // Score bets
      { id: 'total-over-300', name: 'Más de 300 puntos', description: 'Puntuación total mayor a 300', category: 'score', base_odds: 1.75, risk_level: 'medium' },
      { id: 'total-under-200', name: 'Menos de 200 puntos', description: 'Puntuación total menor a 200', category: 'score', base_odds: 2.50, risk_level: 'medium' },
      { id: 'exact-score', name: 'Puntuación Exacta', description: 'Predicción exacta del marcador final', category: 'score', base_odds: 12.50, risk_level: 'high' },
      
      // Snitch bets
      { id: 'snitch-home', name: 'Snitch por Local', description: 'El equipo local captura la Snitch Dorada', category: 'special', base_odds: 1.85, risk_level: 'medium' },
      { id: 'snitch-away', name: 'Snitch por Visitante', description: 'El equipo visitante captura la Snitch Dorada', category: 'special', base_odds: 2.10, risk_level: 'medium' },
      
      // Duration bets
      { id: 'duration-short', name: 'Partido Corto', description: 'Duración menor a 30 minutos', category: 'duration', base_odds: 7.50, risk_level: 'high' },
      { id: 'duration-medium', name: 'Duración Media', description: 'Duración entre 30-60 minutos', category: 'duration', base_odds: 3.25, risk_level: 'medium' },
      { id: 'duration-long', name: 'Partido Largo', description: 'Duración mayor a 60 minutos', category: 'duration', base_odds: 2.10, risk_level: 'medium' }
    ];

    for (const betType of betTypes) {
      await this.connection.run(`
        INSERT OR IGNORE INTO bet_types (id, name, description, category, base_odds, risk_level)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [betType.id, betType.name, betType.description, betType.category, betType.base_odds, betType.risk_level]);
    }

    console.log(`✅ Seeded ${betTypes.length} bet types`);
  }

  private async createSampleSeason(): Promise<void> {
    console.log('🏆 Creating sample season and matches...');

    // Create current season
    const currentYear = new Date().getFullYear();
    const seasonId = `season-${currentYear}`;
    
    await this.connection.run(`
      INSERT INTO seasons (id, name, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?)
    `, [
      seasonId,
      `Liga Quidditch ${currentYear}`,
      `${currentYear}-01-01T00:00:00Z`,
      `${currentYear}-12-31T23:59:59Z`,
      'active'
    ]);

    // Add all teams to the season
    const teams = await this.connection.all('SELECT id FROM teams') as TeamRow[];
    for (const team of teams) {
      await this.connection.run(`
        INSERT INTO season_teams (season_id, team_id)
        VALUES (?, ?)
      `, [seasonId, team.id]);
    }

    // Generate sample matches (round-robin tournament)
    const teamIds = teams.map(t => t.id);
    const matches = [];
    
    // Create all possible match combinations
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        const homeTeam = teamIds[i];
        const awayTeam = teamIds[j];
        
        // Create match for both home/away combinations
        matches.push({ home: homeTeam, away: awayTeam });
        matches.push({ home: awayTeam, away: homeTeam });
      }
    }

    // Insert matches with realistic dates
    const baseDate = new Date();
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const matchDate = new Date(baseDate);
      matchDate.setDate(baseDate.getDate() + (i * 3)); // 3 days between matches
      
      const matchId = `match-${seasonId}-${i + 1}`;
      const status = i < 5 ? 'finished' : i < 8 ? 'live' : 'scheduled';
      
      // Generate realistic scores for finished matches
      let homeScore = 0;
      let awayScore = 0;
      let snitchCaught = false;
      let snitchCaughtBy = null;
      
      if (status === 'finished') {
        homeScore = Math.floor(Math.random() * 200) + 50;
        awayScore = Math.floor(Math.random() * 200) + 50;
        snitchCaught = true;
        snitchCaughtBy = Math.random() > 0.5 ? match.home : match.away;
        
        // Add snitch catch bonus
        if (snitchCaughtBy === match.home) {
          homeScore += 150;
        } else {
          awayScore += 150;
        }
      } else if (status === 'live') {
        homeScore = Math.floor(Math.random() * 100);
        awayScore = Math.floor(Math.random() * 100);
      }

      await this.connection.run(`
        INSERT INTO matches (
          id, season_id, home_team_id, away_team_id, date, status,
          home_score, away_score, snitch_caught, snitch_caught_by,
          odds_home_win, odds_away_win, odds_draw, odds_total_over, odds_total_under
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        matchId, seasonId, match.home, match.away, matchDate.toISOString(), status,
        homeScore, awayScore, snitchCaught, snitchCaughtBy,
        (Math.random() * 2 + 1).toFixed(2), // Home win odds
        (Math.random() * 2 + 1).toFixed(2), // Away win odds  
        (Math.random() * 5 + 8).toFixed(2), // Draw odds (less likely)
        (Math.random() * 0.5 + 1.5).toFixed(2), // Over odds
        (Math.random() * 0.5 + 1.5).toFixed(2)  // Under odds
      ]);
    }

    // Update team statistics based on finished matches
    await this.updateTeamStatistics(seasonId);

    // Generate standings
    await this.generateStandings(seasonId);

    console.log(`✅ Created ${matches.length} matches for season ${seasonId}`);
  }

  private async updateTeamStatistics(seasonId: string): Promise<void> {
    const finishedMatches = await this.connection.all(`
      SELECT * FROM matches 
      WHERE season_id = ? AND status = 'finished'
    `, [seasonId]) as FinishedMatch[];

    const teamStats: { [key: string]: TeamStats } = {};

    // Initialize team stats
    const teams = await this.connection.all('SELECT id FROM teams') as TeamRow[];
    for (const team of teams) {
      teamStats[team.id] = {
        id: team.id,
        matches_played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        points_for: 0,
        points_against: 0,
        snitch_catches: 0
      };
    }

    // Calculate stats from finished matches
    for (const match of finishedMatches) {
      const homeTeam = match.home_team_id;
      const awayTeam = match.away_team_id;
      
      teamStats[homeTeam].matches_played++;
      teamStats[awayTeam].matches_played++;
      
      teamStats[homeTeam].points_for += match.home_score;
      teamStats[homeTeam].points_against += match.away_score;
      teamStats[awayTeam].points_for += match.away_score;
      teamStats[awayTeam].points_against += match.home_score;

      if (match.snitch_caught_by === homeTeam) {
        teamStats[homeTeam].snitch_catches++;
      } else if (match.snitch_caught_by === awayTeam) {
        teamStats[awayTeam].snitch_catches++;
      }

      // Determine winner
      if (match.home_score > match.away_score) {
        teamStats[homeTeam].wins++;
        teamStats[awayTeam].losses++;
      } else if (match.away_score > match.home_score) {
        teamStats[awayTeam].wins++;
        teamStats[homeTeam].losses++;
      } else {
        teamStats[homeTeam].draws++;
        teamStats[awayTeam].draws++;
      }
    }

    // Update team statistics in database
    for (const [teamId, stats] of Object.entries(teamStats)) {
      await this.connection.run(`
        UPDATE teams SET 
          matches_played = ?, wins = ?, losses = ?, draws = ?,
          points_for = ?, points_against = ?, snitch_catches = ?
        WHERE id = ?
      `, [
        stats.matches_played, stats.wins, stats.losses, stats.draws,
        stats.points_for, stats.points_against, stats.snitch_catches, teamId
      ]);
    }
  }

  private async generateStandings(seasonId: string): Promise<void> {
    const teams = await this.connection.all(`
      SELECT id, wins, losses, draws, points_for, points_against, snitch_catches
      FROM teams
    `) as TeamStats[];

    // Calculate league points (3 for win, 1 for draw)
    const standings = teams.map((team: TeamStats) => ({
      ...team,
      points: (team.wins * 3) + (team.draws * 1),
      points_difference: team.points_for - team.points_against,
      matches_played: team.wins + team.losses + team.draws
    }));

    // Sort by points, then by points difference, then by points for
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.points_difference !== a.points_difference) return b.points_difference - a.points_difference;
      return b.points_for - a.points_for;
    });

    // Insert standings
    for (let i = 0; i < standings.length; i++) {
      const team = standings[i];
      await this.connection.run(`
        INSERT OR REPLACE INTO standings (
          season_id, team_id, position, points, matches_played,
          wins, losses, draws, points_for, points_against, 
          points_difference, snitch_catches
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        seasonId, team.id, i + 1, team.points, team.matches_played,
        team.wins, team.losses, team.draws, team.points_for, 
        team.points_against, team.points_difference, team.snitch_catches
      ]);
    }

    console.log('✅ Generated league standings');
  }

  private async seedPlayers(): Promise<void> {
    console.log('👥 Seeding players for all teams...');

    // Get all teams
    const teams = await this.connection.all('SELECT id FROM teams') as Array<{ id: string }>;

    // Player data for each team
    const playersByTeam = {
      'gryffindor': [
        // Titulares (7 jugadores)
        { name: 'Harry Potter', position: 'seeker', skill_level: 95, is_starting: true, number: 1, years_active: 7, achievements: JSON.stringify(['Buscador más joven en un siglo', 'Captura récord de Snitch en 5 minutos', 'Héroe de la resistencia']) },
        { name: 'Ron Weasley', position: 'keeper', skill_level: 88, is_starting: true, number: 2, years_active: 6, achievements: JSON.stringify(['95% de efectividad en paradas', 'Guardián del año 2023']) },
        { name: 'Fred Weasley', position: 'beater', skill_level: 85, is_starting: true, number: 3, years_active: 7, achievements: JSON.stringify(['Mejor golpeador defensivo de la década', 'Récord de bludgers desviadas']) },
        { name: 'George Weasley', position: 'beater', skill_level: 85, is_starting: true, number: 4, years_active: 7, achievements: JSON.stringify(['Mejor golpeador ofensivo de la década', 'Jugada más espectacular 2022']) },
        { name: 'Angelina Johnson', position: 'chaser', skill_level: 90, is_starting: true, number: 5, years_active: 6, achievements: JSON.stringify(['Capitana del equipo 2 años', '150+ goles en su carrera']) },
        { name: 'Katie Bell', position: 'chaser', skill_level: 88, is_starting: true, number: 6, years_active: 5, achievements: JSON.stringify(['100+ goles en su carrera', 'Cazadora más rápida']) },
        { name: 'Alicia Spinnet', position: 'chaser', skill_level: 87, is_starting: true, number: 7, years_active: 6, achievements: JSON.stringify(['Mejor promedio de goles por partido', 'Jugadora más consistente']) },
        // Suplentes
        { name: 'Oliver Wood', position: 'keeper', skill_level: 92, is_starting: false, number: 8, years_active: 8, achievements: JSON.stringify(['Capitán legendario', 'Récord de partidos invicto']) },
        { name: 'Ginny Weasley', position: 'seeker', skill_level: 88, is_starting: false, number: 9, years_active: 4, achievements: JSON.stringify(['Buscadora más promisoria', 'Captura más joven']) },
        { name: 'Dean Thomas', position: 'chaser', skill_level: 75, is_starting: false, number: 10, years_active: 3, achievements: JSON.stringify(['Mejor jugador suplente']) },
        { name: 'Seamus Finnigan', position: 'beater', skill_level: 72, is_starting: false, number: 11, years_active: 3, achievements: JSON.stringify(['Golpeador más agresivo']) }
      ],
      'slytherin': [
        // Titulares
        { name: 'Draco Malfoy', position: 'seeker', skill_level: 87, is_starting: true, number: 1, years_active: 6, achievements: JSON.stringify(['Buscador más estratégico de su generación', 'Captura más elegante']) },
        { name: 'Blaise Zabini', position: 'keeper', skill_level: 93, is_starting: true, number: 2, years_active: 5, achievements: JSON.stringify(['Mejor promedio de paradas', 'Guardián más seguro']) },
        { name: 'Vincent Crabbe', position: 'beater', skill_level: 88, is_starting: true, number: 3, years_active: 6, achievements: JSON.stringify(['Golpeador más intimidante', 'Récord de bludgers conectadas']) },
        { name: 'Gregory Goyle', position: 'beater', skill_level: 86, is_starting: true, number: 4, years_active: 6, achievements: JSON.stringify(['Especialista en jugadas de fuerza', 'Mejor dupla de golpeadores']) },
        { name: 'Marcus Flint', position: 'chaser', skill_level: 92, is_starting: true, number: 5, years_active: 8, achievements: JSON.stringify(['Capitán más exitoso de Slytherin', 'Líder en goles anotados']) },
        { name: 'Adrian Pucey', position: 'chaser', skill_level: 89, is_starting: true, number: 6, years_active: 7, achievements: JSON.stringify(['Especialista en goles de larga distancia', 'Mejor precisión']) },
        { name: 'Terence Higgs', position: 'chaser', skill_level: 85, is_starting: true, number: 7, years_active: 5, achievements: JSON.stringify(['Cazador más técnico', 'Jugador más elegante']) },
        // Suplentes
        { name: 'Miles Bletchley', position: 'keeper', skill_level: 85, is_starting: false, number: 8, years_active: 4, achievements: JSON.stringify(['Guardián más joven en alcanzar 50 partidos']) },
        { name: 'Graham Montague', position: 'seeker', skill_level: 80, is_starting: false, number: 9, years_active: 3, achievements: JSON.stringify(['Buscador suplente más confiable']) },
        { name: 'Cassius Warrington', position: 'chaser', skill_level: 78, is_starting: false, number: 10, years_active: 4, achievements: JSON.stringify(['Mejor jugador de reserva']) },
        { name: 'Peregrine Derrick', position: 'beater', skill_level: 83, is_starting: false, number: 11, years_active: 5, achievements: JSON.stringify(['Golpeador más disciplinado']) }
      ],
      'ravenclaw': [
        // Titulares
        { name: 'Cho Chang', position: 'seeker', skill_level: 92, is_starting: true, number: 1, years_active: 5 },
        { name: 'Grant Page', position: 'keeper', skill_level: 85, is_starting: true, number: 2, years_active: 4 },
        { name: 'Jason Samuels', position: 'beater', skill_level: 78, is_starting: true, number: 3, years_active: 3 },
        { name: 'Duncan Inglebee', position: 'beater', skill_level: 76, is_starting: true, number: 4, years_active: 3 },
        { name: 'Roger Davies', position: 'chaser', skill_level: 90, is_starting: true, number: 5, years_active: 6 },
        { name: 'Randolph Burrow', position: 'chaser', skill_level: 88, is_starting: true, number: 6, years_active: 5 },
        { name: 'Jeremy Stretton', position: 'chaser', skill_level: 87, is_starting: true, number: 7, years_active: 4 },
        // Suplentes
        { name: 'Luna Lovegood', position: 'seeker', skill_level: 83, is_starting: false, number: 8, years_active: 2 },
        { name: 'Terry Boot', position: 'keeper', skill_level: 79, is_starting: false, number: 9, years_active: 3 },
        { name: 'Michael Corner', position: 'chaser', skill_level: 82, is_starting: false, number: 10, years_active: 3 },
        { name: 'Anthony Goldstein', position: 'beater', skill_level: 74, is_starting: false, number: 11, years_active: 2 }
      ],
      'hufflepuff': [
        // Titulares
        { name: 'Cedric Diggory', position: 'seeker', skill_level: 89, is_starting: true, number: 1, years_active: 6 },
        { name: 'Herbert Fleet', position: 'keeper', skill_level: 90, is_starting: true, number: 2, years_active: 5 },
        { name: 'Maxine O\'Flaherty', position: 'beater', skill_level: 82, is_starting: true, number: 3, years_active: 4 },
        { name: 'Anthony Rickett', position: 'beater', skill_level: 84, is_starting: true, number: 4, years_active: 5 },
        { name: 'Tamsin Applebee', position: 'chaser', skill_level: 86, is_starting: true, number: 5, years_active: 4 },
        { name: 'Heidi Macavoy', position: 'chaser', skill_level: 83, is_starting: true, number: 6, years_active: 3 },
        { name: 'Malcolm Preece', position: 'chaser', skill_level: 81, is_starting: true, number: 7, years_active: 3 },
        // Suplentes
        { name: 'Justin Finch-Fletchley', position: 'keeper', skill_level: 82, is_starting: false, number: 8, years_active: 4 },
        { name: 'Zacharias Smith', position: 'seeker', skill_level: 76, is_starting: false, number: 9, years_active: 3 },
        { name: 'Hannah Abbott', position: 'chaser', skill_level: 78, is_starting: false, number: 10, years_active: 3 },
        { name: 'Susan Bones', position: 'beater', skill_level: 75, is_starting: false, number: 11, years_active: 2 }
      ],
      'chudley-cannons': [
        // Titulares
        { name: 'Joey Jenkins', position: 'seeker', skill_level: 78, is_starting: true, number: 1, years_active: 4 },
        { name: 'Ronan Lynch', position: 'keeper', skill_level: 72, is_starting: true, number: 2, years_active: 6 },
        { name: 'Kevin Broadmoor', position: 'beater', skill_level: 80, is_starting: true, number: 3, years_active: 5 },
        { name: 'Karl Broadmoor', position: 'beater', skill_level: 78, is_starting: true, number: 4, years_active: 5 },
        { name: 'Galvin Gudgeon', position: 'chaser', skill_level: 75, is_starting: true, number: 5, years_active: 8 },
        { name: 'Lennox Campbell', position: 'chaser', skill_level: 73, is_starting: true, number: 6, years_active: 3 },
        { name: 'Rupert Brookstanton', position: 'chaser', skill_level: 71, is_starting: true, number: 7, years_active: 2 },
        // Suplentes
        { name: 'Dragomir Gorgovitch', position: 'seeker', skill_level: 82, is_starting: false, number: 8, years_active: 10 },
        { name: 'Ragmar Dorkins', position: 'keeper', skill_level: 68, is_starting: false, number: 9, years_active: 2 },
        { name: 'Catriona McCormack', position: 'chaser', skill_level: 77, is_starting: false, number: 10, years_active: 7 },
        { name: 'Meaghan McCormack', position: 'beater', skill_level: 74, is_starting: false, number: 11, years_active: 5 }
      ],
      'holyhead-harpies': [
        // Titulares
        { name: 'Ginny Weasley', position: 'seeker', skill_level: 95, is_starting: true, number: 1, years_active: 8 },
        { name: 'Glynnis Griffiths', position: 'keeper', skill_level: 88, is_starting: true, number: 2, years_active: 12 },
        { name: 'Gwenog Jones', position: 'beater', skill_level: 92, is_starting: true, number: 3, years_active: 15 },
        { name: 'Valmai Morgan', position: 'beater', skill_level: 89, is_starting: true, number: 4, years_active: 10 },
        { name: 'Wilda Griffiths', position: 'chaser', skill_level: 96, is_starting: true, number: 5, years_active: 14 },
        { name: 'Julia Johnson', position: 'chaser', skill_level: 94, is_starting: true, number: 6, years_active: 9 },
        { name: 'Gwendolyn Morgan', position: 'chaser', skill_level: 93, is_starting: true, number: 7, years_active: 11 },
        // Suplentes
        { name: 'Artemis Faulkner', position: 'keeper', skill_level: 84, is_starting: false, number: 8, years_active: 5 },
        { name: 'Lilywhite', position: 'seeker', skill_level: 87, is_starting: false, number: 9, years_active: 6 },
        { name: 'Emma Vanity', position: 'chaser', skill_level: 85, is_starting: false, number: 10, years_active: 4 },
        { name: 'Lucinda Talkalot', position: 'beater', skill_level: 82, is_starting: false, number: 11, years_active: 7 }
      ]
    };

    // Insert players for each team
    for (const team of teams) {
      const teamPlayers = playersByTeam[team.id as keyof typeof playersByTeam];
      if (teamPlayers) {
        for (const player of teamPlayers) {
          const playerId = `${team.id}-${player.name.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')}`;
          
          await this.connection.run(`
            INSERT INTO players (id, name, team_id, position, skill_level, is_starting, number, years_active, achievements)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            playerId,
            player.name,
            team.id,
            player.position,
            player.skill_level,
            player.is_starting,
            player.number,
            player.years_active,
            (player as any).achievements || '[]' // Use player achievements or empty array
          ]);
        }
      }
    }

    console.log('✅ All players seeded successfully');
  }
}
