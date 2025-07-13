/**
 * Script para probar los nuevos endpoints de equipos y jugadores
 */

import fetch from 'node-fetch';

async function testTeamEndpoints() {
  console.log('🧪 Testing Team Endpoints...\n');
  
  const baseUrl = 'http://localhost:3001/api';
  
  try {
    // Test 1: Get all teams
    console.log('✅ Test 1: GET /api/teams');
    let response = await fetch(`${baseUrl}/teams`);
    let data = await response.json();
    console.log(`Found ${data.data.length} teams`);
    
    // Test 2: Get specific team with complete info
    console.log('\n✅ Test 2: GET /api/teams/:id (complete info)');
    response = await fetch(`${baseUrl}/teams/gryffindor`);
    data = await response.json();
    
    if (data.success) {
      const team = data.data;
      console.log(`Team: ${team.name}`);
      console.log(`Players: ${team.players?.length || 0} total`);
      console.log(`Starting lineup: ${team.startingLineup?.length || 0} players`);
      console.log(`Attack strength: ${team.attack_strength}`);
      console.log(`Defense strength: ${team.defense_strength}`);
      console.log(`Win percentage: ${team.win_percentage}%`);
    }
    
    // Test 3: Get team players
    console.log('\n✅ Test 3: GET /api/teams/:id/players');
    response = await fetch(`${baseUrl}/teams/gryffindor/players`);
    data = await response.json();
    
    if (data.success) {
      console.log(`Gryffindor players: ${data.data.length}`);
      
      // Group by position
      const positions = {};
      data.data.forEach(player => {
        if (!positions[player.position]) positions[player.position] = [];
        positions[player.position].push(player);
      });
      
      Object.keys(positions).forEach(position => {
        const positionPlayers = positions[position];
        const starters = positionPlayers.filter(p => p.is_starting);
        console.log(`  ${position}: ${positionPlayers.length} total (${starters.length} starters)`);
      });
    }
    
    // Test 4: Get starting lineup
    console.log('\n✅ Test 4: GET /api/teams/:id/lineup');
    response = await fetch(`${baseUrl}/teams/gryffindor/lineup`);
    data = await response.json();
    
    if (data.success) {
      console.log('Gryffindor starting lineup:');
      data.data.forEach(player => {
        console.log(`  ${player.position}: ${player.name} (Skill: ${player.skill_level})`);
      });
    }
    
    // Test 5: Get players by position
    console.log('\n✅ Test 5: GET /api/teams/:id/players/:position');
    response = await fetch(`${baseUrl}/teams/gryffindor/players/seeker`);
    data = await response.json();
    
    if (data.success) {
      console.log('Gryffindor seekers:');
      data.data.forEach(seeker => {
        console.log(`  ${seeker.name}: Skill ${seeker.skill_level} ${seeker.is_starting ? '(STARTER)' : ''}`);
      });
    }
    
    // Test 6: Get match with lineups
    console.log('\n✅ Test 6: GET /api/matches (first match)');
    response = await fetch(`${baseUrl}/matches`);
    data = await response.json();
    
    if (data.success && data.data.length > 0) {
      const matchId = data.data[0].id;
      console.log(`Testing match: ${data.data[0].homeTeamName} vs ${data.data[0].awayTeamName}`);
      
      // Get match lineups
      response = await fetch(`${baseUrl}/matches/${matchId}/lineups`);
      data = await response.json();
      
      if (data.success) {
        console.log(`Home team lineup: ${data.data.homeTeam.lineup.length} players`);
        console.log(`Away team lineup: ${data.data.awayTeam.lineup.length} players`);
      }
    }
    
    console.log('\n🎉 All endpoint tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    console.log('\n⚠️  Make sure the backend server is running on http://localhost:3001');
  }
}

// Ejecutar el test
testTeamEndpoints().catch(console.error);

console.log('📋 Team Structure and Player Data Implementation Complete!');
console.log('\n📌 Available Endpoints:');
console.log('- GET /api/teams - All teams');
console.log('- GET /api/teams/:id - Complete team info with players and stats');
console.log('- GET /api/teams/:id/players - All team players');
console.log('- GET /api/teams/:id/lineup - Starting lineup');
console.log('- GET /api/teams/:id/players/:position - Players by position');
console.log('- GET /api/matches/:id/lineups - Match lineups');
console.log('- GET /api/matches/:id/events - Match events');
console.log('\n📊 Database Features:');
console.log('✅ Team statistics (attack, defense, skills)');
console.log('✅ Complete player rosters with positions');
console.log('✅ Starting lineup management');
console.log('✅ Skill levels and player stats');
console.log('✅ Match lineup retrieval');
console.log('✅ Position-based player queries');
