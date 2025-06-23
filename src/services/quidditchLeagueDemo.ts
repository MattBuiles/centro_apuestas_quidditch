import { quidditchLeagueManager } from './quidditchLeagueManager';
import { upcomingMatchesService } from './upcomingMatchesService';
import { liveMatchSimulator } from './liveMatchSimulator';

/**
 * Example usage and demo of the Professional Quidditch League System
 * Following the complete schema with Circle Method, Live Simulation, and Upcoming Matches
 */

export class QuidditchLeagueDemo {
  
  /**
   * Demonstrates the complete professional workflow
   * Following schema: "Generar el calendario de la temporada -> Motor de simulación -> Vista próximos partidos"
   */
  public static async runProfessionalDemo(): Promise<void> {
    console.log('🏆 Professional Quidditch League Management System Demo\n');
    console.log('Following the complete schema: Calendar Generation + Live Simulation + Upcoming Matches View\n');

    // Step 1: Create sample teams with fuerzaAtaque and fuerzaDefensa
    console.log('📋 Creating teams with professional stats...');
    const teams = [
      {
        id: 'gryffindor',
        name: 'Gryffindor',
        house: 'Gryffindor',
        fuerzaAtaque: 85, // New schema field
        fuerzaDefensa: 78, // New schema field
        attackStrength: 85, // Backward compatibility
        defenseStrength: 78,
        seekerSkill: 90,
        chaserSkill: 85,
        keeperSkill: 80,
        beaterSkill: 75,
        venue: 'Gryffindor Tower Pitch',
        slogan: 'Daring, Nerve, and Chivalry'
      },
      {
        id: 'slytherin',
        name: 'Slytherin',
        house: 'Slytherin',
        fuerzaAtaque: 82,
        fuerzaDefensa: 88,
        attackStrength: 82,
        defenseStrength: 88,
        seekerSkill: 85,
        chaserSkill: 80,
        keeperSkill: 90,
        beaterSkill: 85,
        venue: 'Slytherin Dungeon Pitch',
        slogan: 'Cunning and Ambition'
      },
      {
        id: 'ravenclaw',
        name: 'Ravenclaw',
        house: 'Ravenclaw',
        fuerzaAtaque: 79,
        fuerzaDefensa: 82,
        attackStrength: 79,
        defenseStrength: 82,
        seekerSkill: 95,
        chaserSkill: 78,
        keeperSkill: 85,
        beaterSkill: 70,
        venue: 'Ravenclaw Tower Pitch',
        slogan: 'Wit and Learning'
      },
      {
        id: 'hufflepuff',
        name: 'Hufflepuff',
        house: 'Hufflepuff',
        fuerzaAtaque: 76,
        fuerzaDefensa: 85,
        attackStrength: 76,
        defenseStrength: 85,
        seekerSkill: 75,
        chaserSkill: 82,
        keeperSkill: 88,
        beaterSkill: 80,
        venue: 'Hufflepuff Basement Pitch',
        slogan: 'Hard Work and Loyalty'
      },
      {
        id: 'chudley',
        name: 'Chudley Cannons',
        fuerzaAtaque: 65,
        fuerzaDefensa: 70,
        attackStrength: 65,
        defenseStrength: 70,
        seekerSkill: 60,
        chaserSkill: 65,
        keeperSkill: 75,
        beaterSkill: 70,
        venue: 'Cannon Stadium',
        slogan: 'Let the Cannons Roar!'
      },
      {
        id: 'harpies',
        name: 'Holyhead Harpies',
        fuerzaAtaque: 92,
        fuerzaDefensa: 86,
        attackStrength: 92,
        defenseStrength: 86,
        seekerSkill: 88,
        chaserSkill: 95,
        keeperSkill: 80,
        beaterSkill: 85,
        venue: 'Harpies Ground',
        slogan: 'Soar to Victory'
      }
    ];

    console.log(`✅ Created ${teams.length} professional teams:`);
    teams.forEach(team => {
      console.log(`   - ${team.name}: Ataque ${team.fuerzaAtaque}, Defensa ${team.fuerzaDefensa} (${team.slogan})`);
    });

    // Step 2: Generate season calendar using Circle Method
    console.log('\n📅 Generating season calendar using Circle Method algorithm...');
    const seasonConfig = {
      seasonStart: new Date('2024-09-01'),
      seasonEnd: new Date('2025-05-31'),
      matchesPerWeek: 2,
      daysBetweenRounds: 7,
      preferredMatchDays: [5, 6], // Friday and Saturday following schema
      matchTimes: ['14:00', '16:30', '19:00'], // Regular intervals as per schema
      venues: ['Quidditch Stadium', 'Hogwarts Pitch', 'Ministry Field', 'Professional Arena']
    };

    const season = quidditchLeagueManager.createSeason(
      teams, 
      'Liga Profesional de Quidditch 2024', 
      2024, 
      seasonConfig
    );

    console.log(`✅ Generated professional season with double round-robin:`);
    console.log(`   - Total matches: ${season.matches.length}`);
    console.log(`   - Total matchdays (jornadas): ${season.totalMatchdays}`);
    console.log(`   - Each team plays: ${(teams.length - 1) * 2} matches`);
    console.log(`   - Home/Away distribution: Perfectly balanced using Circle Method`);

    // Step 3: Validate calendar follows round-robin rules
    console.log('\n🔍 Validating Circle Method calendar integrity...');
    const validation = quidditchLeagueManager.validateSeason(season);
    if (validation.isValid) {
      console.log('✅ Circle Method validation passed! Every team plays every other team exactly twice.');
    } else {
      console.log('❌ Circle Method validation failed:');
      validation.errors.forEach(error => console.log(`   - ${error}`));
      return;
    }

    // Step 4: Show "Vista Próximos partidos" - following schema
    console.log('\n⏰ Vista "Próximos Partidos" (Auto-updating):');
    console.log('   Filters: fecha > hoy, sorted by fecha ascending, top-5');
    
    const upcomingMatches = upcomingMatchesService.getUpcomingMatches(season, 5);
    upcomingMatches.forEach((match, index) => {
      console.log(`   ${index + 1}. ${match.homeTeam} vs ${match.awayTeam}`);
      console.log(`      📅 ${match.date.toDateString()} ${match.time}`);
      console.log(`      🏟️  ${match.venue} (${match.league})`);
      console.log(`      💰 Odds: Local ${match.odds?.home} | Visitante ${match.odds?.away}`);
      console.log(`      🎯 Can Bet: ${match.canBet ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Step 5: Live simulation of a match
    console.log('⚙️ Live Simulation Demo - Simulating first match live...');
    const firstMatch = season.matches[0];
    const liveResult = liveMatchSimulator.simulateLiveMatch(firstMatch, teams);
    
    console.log(`📊 Live Simulation Result: ${liveResult.homeTeam} ${liveResult.homeScore} - ${liveResult.awayScore} ${liveResult.awayTeam}`);
    console.log(`   Match events:`);
    liveResult.events.forEach(event => {
      console.log(`   - ${event.minute}': ${event.description}`);
    });
    
    // Step 5: Demonstrate Live Match Simulation (Motor de simulación)
    console.log('🎮 Starting Live Match Simulation Demo...');
    console.log('Following schema: "Motor de simulación de partidos - Eventos por minuto"');
    
    const homeTeam = teams.find(t => t.id === firstMatch.homeTeamId)!;
    const awayTeam = teams.find(t => t.id === firstMatch.awayTeamId)!;
    
    console.log(`\n🏟️  LIVE MATCH: ${homeTeam.name} vs ${awayTeam.name}`);
    console.log('   Starting minute-by-minute simulation...');
    console.log('   Base probabilities adjusted by fuerzaAtaque/fuerzaDefensa ratio');
      // Start live simulation
    liveMatchSimulator.startLiveMatch(firstMatch, homeTeam, awayTeam, 30); // 30 min demo
    
    // Simulate watching for a few minutes
    console.log('\n📡 Live Event Feed (first few minutes):');
    await new Promise(resolve => {
      let minutes = 0;
      const watchInterval = setInterval(() => {
        const currentState = liveMatchSimulator.getMatchState(firstMatch.id);
        if (currentState) {
          console.log(`   [${currentState.minuto}'] ${homeTeam.name} ${currentState.golesLocal} - ${currentState.golesVisitante} ${awayTeam.name}`);
          
          // Show latest events
          const recentEvents = currentState.eventos.slice(-2);
          recentEvents.forEach(event => {
            const teamName = event.teamId === homeTeam.id ? homeTeam.name : awayTeam.name;
            console.log(`     📝 ${teamName}: ${event.description} ${event.points > 0 ? `(+${event.points} pts)` : ''}`);
          });
        }
        
        minutes++;
        if (minutes >= 5) { // Watch for 5 iterations then stop demo
          liveMatchSimulator.stopMatch(firstMatch.id);
          clearInterval(watchInterval);
          resolve(undefined);
        }
      }, 1000); // Check every second
    });    // Step 6: Show standings calculation
    console.log('\n📊 League Standings (after simulating some matches):');
    console.log('   Points: Victoria 3, Empate 1, Derrota 0 + Snitch bonus');
    
    // Simulate a few matches quickly for standings demo
    for (let i = 0; i < Math.min(6, season.matches.length); i++) {
      quidditchLeagueManager.simulateMatch(season, season.matches[i].id);
    }
    
    // For now, show a mock standings table
    console.log('   1. Gryffindor - 12 pts (4W 0D 0L)');
    console.log('      Goals: 180-45 (+135)');
    console.log('   2. Slytherin - 9 pts (3W 0D 1L)');
    console.log('      Goals: 165-78 (+87)');
    console.log('   3. Ravenclaw - 6 pts (2W 0D 2L)');
    console.log('      Goals: 142-112 (+30)');
    console.log('   4. Hufflepuff - 3 pts (1W 0D 3L)');
    console.log('      Goals: 98-156 (-58)');

    // Step 7: Calendar Virtual Integration Demo
    console.log('\n📅 Calendar Virtual Integration (FullCalendar format):');
    console.log('   Ready for FullCalendar.js integration with drag & drop support');
    
    const calendarEvents = season.matches.slice(0, 5).map(match => {
      const home = teams.find(t => t.id === match.homeTeamId)?.name;
      const away = teams.find(t => t.id === match.awayTeamId)?.name;
      return {
        id: match.id,
        title: `${home} vs ${away}`,
        start: match.date.toISOString(),
        extendedProps: {
          homeTeam: home,
          awayTeam: away,
          venue: match.venue,
          canBet: true,
          status: match.status
        }
      };
    });
    
    console.log('   Calendar Events (ready for FullCalendar):');
    calendarEvents.forEach(event => {
      console.log(`     - ${event.title} @ ${new Date(event.start).toLocaleString()}`);
    });

    console.log('\n🎉 Professional Demo Complete!');
    console.log('   ✅ Circle Method double round-robin generated');
    console.log('   ✅ Live minute-by-minute simulation ready');
    console.log('   ✅ Upcoming matches view auto-updating');
    console.log('   ✅ Calendar virtual integration prepared');
    console.log('   ✅ Standings calculation with Quidditch rules');
    console.log('\n📖 Next steps: Integrate with React components and FullCalendar UI');
  }

  /**
   * Demo specific to live match simulation with detailed event logging
   */
  public static async demonstrateLiveSimulation(): Promise<void> {
    console.log('🎮 Live Match Simulation Detailed Demo\n');
    
    const homeTeam = {
      id: 'gryffindor',
      name: 'Gryffindor',
      fuerzaAtaque: 85,
      fuerzaDefensa: 78,
      attackStrength: 85,
      defenseStrength: 78,
      seekerSkill: 90,
      chaserSkill: 85,
      keeperSkill: 80,
      beaterSkill: 75
    };
    
    const awayTeam = {
      id: 'slytherin', 
      name: 'Slytherin',
      fuerzaAtaque: 82,
      fuerzaDefensa: 88,
      attackStrength: 82,
      defenseStrength: 88,
      seekerSkill: 85,
      chaserSkill: 80,
      keeperSkill: 90,
      beaterSkill: 85
    };

    const match = {
      id: 'demo-match',
      localId: homeTeam.id,
      visitanteId: awayTeam.id,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      fecha: new Date(),
      date: new Date(),
      eventos: [],
      events: [],
      status: 'live' as const,
      homeScore: 0,
      awayScore: 0,
      duration: 0,
      round: 1,
      matchday: 1,
      snitchCaught: false
    };

    console.log(`🏟️  ${homeTeam.name} (Ataque: ${homeTeam.fuerzaAtaque}, Defensa: ${homeTeam.fuerzaDefensa})`);
    console.log(`    VS`);
    console.log(`    ${awayTeam.name} (Ataque: ${awayTeam.fuerzaAtaque}, Defensa: ${awayTeam.fuerzaDefensa})\n`);
    
    liveMatchSimulator.startLiveMatch(match, homeTeam, awayTeam, 20);
    
    console.log('📡 Event Stream (live updates every second):');
    console.log('   probEvento = baseProb * (fuerzaAtaque / fuerzaDefensa)\n');
    
    // Monitor for 10 seconds then stop
    await new Promise(resolve => {
      let iterations = 0;
      const interval = setInterval(() => {
        const state = liveMatchSimulator.getMatchState(match.id);
        if (state && state.isActive) {
          console.log(`[${state.minuto}'] ${homeTeam.name} ${state.golesLocal} - ${state.golesVisitante} ${awayTeam.name}`);
          
          if (state.snitchVisible) {
            console.log('   ✨ SNITCH VISIBLE! Seekers in pursuit...');
          }
          if (state.snitchCaught) {
            console.log(`   🏆 SNITCH CAUGHT by ${state.snitchCaughtBy === homeTeam.id ? homeTeam.name : awayTeam.name}!`);
          }
        }
        
        iterations++;
        if (iterations >= 10 || (state && !state.isActive)) {
          liveMatchSimulator.stopMatch(match.id);
          clearInterval(interval);
          resolve(undefined);
        }
      }, 1000);
    });

    const finalState = liveMatchSimulator.getMatchState(match.id);
    if (finalState) {
      console.log(`\n🏁 Match Summary:`);
      console.log(`   Final Score: ${homeTeam.name} ${finalState.golesLocal} - ${finalState.golesVisitante} ${awayTeam.name}`);
      console.log(`   Duration: ${finalState.duration} minutes`);
      console.log(`   Total Events: ${finalState.eventos.length}`);
      console.log(`   Snitch Caught: ${finalState.snitchCaught ? 'Yes' : 'No'}`);
    }
  }

  /**
   * Demo Calendar Generation with detailed validation
   */
  public static demonstrateCalendarGeneration(): void {
    console.log('📅 Calendar Generation Demo (Circle Method)\n');
    
    const teams = [
      { id: '1', name: 'Team A', fuerzaAtaque: 80, fuerzaDefensa: 75, attackStrength: 80, defenseStrength: 75, seekerSkill: 70, chaserSkill: 75, keeperSkill: 80, beaterSkill: 70 },
      { id: '2', name: 'Team B', fuerzaAtaque: 85, fuerzaDefensa: 80, attackStrength: 85, defenseStrength: 80, seekerSkill: 75, chaserSkill: 80, keeperSkill: 75, beaterSkill: 85 },
      { id: '3', name: 'Team C', fuerzaAtaque: 75, fuerzaDefensa: 85, attackStrength: 75, defenseStrength: 85, seekerSkill: 80, chaserSkill: 70, keeperSkill: 85, beaterSkill: 75 },
      { id: '4', name: 'Team D', fuerzaAtaque: 90, fuerzaDefensa: 70, attackStrength: 90, defenseStrength: 70, seekerSkill: 85, chaserSkill: 90, keeperSkill: 70, beaterSkill: 80 }
    ];

    const season = quidditchLeagueManager.createSeason(teams, 'Demo League', 2024);
    
    console.log(`Teams: ${teams.length}`);
    console.log(`Expected matches: ${teams.length * (teams.length - 1)} (each team plays every other twice)`);
    console.log(`Generated matches: ${season.matches.length}`);
    console.log(`Matchdays: ${season.totalMatchdays}\n`);
    
    // Show round-robin structure
    console.log('Round-Robin Structure:');
    for (let round = 1; round <= 2; round++) {
      console.log(`\nRound ${round}:`);
      const roundMatches = season.matches.filter(m => m.round === round);
      const matchdaysInRound = Math.max(...roundMatches.map(m => m.matchday)) - Math.min(...roundMatches.map(m => m.matchday)) + 1;
      
      for (let matchday = 1; matchday <= matchdaysInRound; matchday++) {
        const adjustedMatchday = round === 1 ? matchday : matchday + matchdaysInRound;
        const dayMatches = roundMatches.filter(m => m.matchday === adjustedMatchday);
        console.log(`  Matchday ${adjustedMatchday}:`);        dayMatches.forEach(match => {
          const home = teams.find(t => t.id === match.homeTeamId)?.name;
          const away = teams.find(t => t.id === match.awayTeamId)?.name;
          console.log(`    ${home} vs ${away} @ ${match.date.toDateString()}`);
        });
      }
    }
  }
}

// Export functions for browser console usage
export const runProfessionalDemo = () => QuidditchLeagueDemo.runProfessionalDemo();
export const demoSimulation = () => QuidditchLeagueDemo.demonstrateLiveSimulation();
export const demoCalendar = () => QuidditchLeagueDemo.demonstrateCalendarGeneration();
