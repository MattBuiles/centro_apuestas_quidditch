// Test file for standings calculator validation

console.log('🏆 Testing Standings Calculator Improvements...\n');

// Test function to validate standings calculations
window.testStandingsCalculator = function() {
  console.log('🔍 Starting Standings Calculator Test...');
  
  try {
    // Get current virtual time manager state
    const timeManager = window.virtualTimeManager;
    if (!timeManager) {
      console.error('❌ VirtualTimeManager not available');
      return;
    }

    const state = timeManager.getState();
    if (!state.temporadaActiva) {
      console.error('❌ No active season found');
      return;
    }

    const { equipos, partidos } = state.temporadaActiva;
    console.log(`📊 Season: ${equipos.length} teams, ${partidos.length} matches`);

    // Test the standings calculator
    const standingsCalculator = window.standingsCalculator;
    if (!standingsCalculator) {
      console.error('❌ StandingsCalculator not available');
      return;
    }

    console.log('\n🧮 Calculating standings...');
    const standings = standingsCalculator.calculateStandings(equipos, partidos);
    
    console.log('\n📈 Current Standings:');
    console.log('Pos | Team           | P  | W | D | L | GF | GA | GD | Pts | Form');
    console.log('----+----------------+----+---+---+---+----+----+----+-----+--------');
    
    standings.forEach((standing, index) => {
      const pos = `${index + 1}`.padStart(2);
      const team = standing.team.name.padEnd(14);
      const played = `${standing.matchesPlayed}`.padStart(2);
      const wins = `${standing.wins}`.padStart(2);
      const draws = `${standing.draws}`.padStart(2);
      const losses = `${standing.losses}`.padStart(2);
      const gf = `${standing.goalsFor}`.padStart(3);
      const ga = `${standing.goalsAgainst}`.padStart(3);
      const gd = `${standing.goalDifference >= 0 ? '+' : ''}${standing.goalDifference}`.padStart(3);
      const pts = `${standing.points}`.padStart(3);
      const form = standing.form.slice(0, 5).join('');
      
      console.log(`${pos}  | ${team} | ${played} | ${wins} | ${draws} | ${losses} | ${gf} | ${ga} | ${gd} | ${pts} | ${form}`);
    });

    // Test validation
    console.log('\n🔍 Running validation checks...');
    const isValid = standingsCalculator.validateStandings(standings, partidos);
    
    // Additional checks
    console.log('\n📋 Additional Statistics:');
    const finishedMatches = partidos.filter(match => match.status === 'finished');
    console.log(`Finished matches: ${finishedMatches.length}`);
    
    const totalGoals = standings.reduce((sum, s) => sum + s.goalsFor, 0);
    console.log(`Total goals scored: ${totalGoals}`);
    
    const totalPoints = standings.reduce((sum, s) => sum + s.points, 0);
    const expectedPoints = finishedMatches.length * 3; // Each match awards 3 points total
    console.log(`Total points awarded: ${totalPoints} (expected: ${expectedPoints})`);

    if (isValid && totalPoints === expectedPoints) {
      console.log('\n✅ All tests passed! Standings calculator is working correctly.');
    } else {
      console.log('\n❌ Some tests failed. Check the logs above for details.');
    }

  } catch (error) {
    console.error('❌ Error testing standings calculator:', error);
  }
};

// Test function to simulate some matches and check standings
window.testStandingsWithSimulation = function() {
  console.log('🎮 Testing Standings with Match Simulation...');
  
  try {
    const timeManager = window.virtualTimeManager;
    if (!timeManager) {
      console.error('❌ VirtualTimeManager not available');
      return;
    }

    console.log('⏰ Advancing time to simulate matches...');
    // Advance time by 1 week to simulate some matches
    timeManager.avanzarTiempo(7);
    
    // Wait a moment for simulation to complete
    setTimeout(() => {
      console.log('\n📊 Standings after simulation:');
      window.testStandingsCalculator();
    }, 1000);

  } catch (error) {
    console.error('❌ Error in simulation test:', error);
  }
};

console.log('🔧 Test functions loaded:');
console.log('  - testStandingsCalculator()');
console.log('  - testStandingsWithSimulation()');
console.log('\nRun these functions in the console to test the standings calculator!');
