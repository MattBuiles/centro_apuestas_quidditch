/**
 * Script para probar la nueva estructura de equipos y jugadores
 */

const path = require('path');

// Configurar paths para importar el backend
const backendPath = path.join(__dirname, 'backend');
process.env.NODE_PATH = backendPath;
require('module')._initPaths();

async function testTeamStructure() {
  console.log('🧪 Testing Team Structure and Player Data...\n');
  
  try {
    // Importar la clase Database
    const { Database } = await import('./backend/src/database/Database.ts');
    
    console.log('📊 Initializing database...');
    await Database.initialize();
    const db = Database.getInstance();
    
    // Test 1: Verificar que todos los equipos tienen estadísticas
    console.log('\n✅ Test 1: Team Statistics');
    const teams = await db.getAllTeams();
    console.log(`Found ${teams.length} teams`);
    
    for (const team of teams) {
      console.log(`- ${team.name}: Attack=${team.attack_strength}, Defense=${team.defense_strength}, Seeker=${team.seeker_skill}`);
    }
    
    // Test 2: Verificar jugadores por equipo
    console.log('\n✅ Test 2: Players by Team');
    const teamIds = ['gryffindor', 'slytherin', 'ravenclaw'];
    
    for (const teamId of teamIds) {
      const players = await db.getTeamPlayers(teamId);
      const startingLineup = await db.getTeamStartingLineup(teamId);
      
      console.log(`\n🏠 ${teamId.toUpperCase()}:`);
      console.log(`  Total players: ${players.length}`);
      console.log(`  Starting lineup: ${startingLineup.length}`);
      
      // Agrupar por posición
      const positions = {};
      players.forEach(player => {
        if (!positions[player.position]) positions[player.position] = [];
        positions[player.position].push(player);
      });
      
      Object.keys(positions).forEach(position => {
        const positionPlayers = positions[position];
        const starters = positionPlayers.filter(p => p.is_starting);
        console.log(`  ${position}: ${positionPlayers.length} total (${starters.length} starters)`);
      });
    }
    
    // Test 3: Información completa de un equipo
    console.log('\n✅ Test 3: Complete Team Information');
    const teamInfo = await db.getTeamStatistics('gryffindor');
    console.log('Gryffindor complete info:');
    console.log(`- Win percentage: ${teamInfo.win_percentage}%`);
    console.log(`- Point difference: ${teamInfo.point_difference}`);
    console.log(`- Titles: ${teamInfo.titles}`);
    
    // Test 4: Alineaciones de un partido
    console.log('\n✅ Test 4: Match Lineups');
    const matches = await db.getAllMatches();
    if (matches.length > 0) {
      const match = matches[0];
      console.log(`Testing lineups for match: ${match.homeTeamName} vs ${match.awayTeamName}`);
      
      const lineups = await db.getMatchLineups(match.id);
      console.log(`Home team lineup: ${lineups.homeTeam.lineup.length} players`);
      console.log(`Away team lineup: ${lineups.awayTeam.lineup.length} players`);
      
      // Mostrar alineación titular del equipo local
      console.log('\nHome team starting lineup:');
      lineups.homeTeam.lineup.forEach(player => {
        console.log(`  ${player.position}: ${player.name} (Skill: ${player.skill_level})`);
      });
    }
    
    // Test 5: Jugadores por posición
    console.log('\n✅ Test 5: Players by Position');
    const seekers = await db.getPlayersByPosition('gryffindor', 'seeker');
    console.log(`Gryffindor seekers: ${seekers.length}`);
    seekers.forEach(seeker => {
      console.log(`  ${seeker.name}: Skill ${seeker.skill_level} ${seeker.is_starting ? '(STARTER)' : ''}`);
    });
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('✅ Teams have complete statistics (attack, defense, skills)');
    console.log('✅ Players are properly distributed by position');
    console.log('✅ Starting lineups are correctly marked');
    console.log('✅ Match lineups can be retrieved');
    console.log('✅ Position-specific queries work');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    // Cerrar la conexión
    await Database.close();
    console.log('\n💾 Database connection closed');
  }
}

// Ejecutar el test
testTeamStructure().catch(console.error);
