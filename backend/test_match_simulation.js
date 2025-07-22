const { Database } = require('./dist/database/Database');
const { MatchSimulationService } = require('./dist/services/MatchSimulationService');

async function testMatchSimulation() {
  console.log('🧪 Testing match simulation with events...');
  
  try {
    // Initialize database
    const db = Database.getInstance();
    await db.initialize();
    
    // Initialize match simulation service
    const matchSimulationService = new MatchSimulationService();
    
    // Get a scheduled match
    const matches = await db.all(`
      SELECT id, home_team_id, away_team_id, status 
      FROM matches 
      WHERE status = 'scheduled' 
      LIMIT 1
    `);
    
    if (matches.length === 0) {
      console.log('❌ No scheduled matches found');
      return;
    }
    
    const match = matches[0];
    console.log(`🎯 Testing with match: ${match.id} (${match.home_team_id} vs ${match.away_team_id})`);
    
    // Simulate the match
    console.log('⚡ Starting match simulation...');
    const result = await matchSimulationService.simulateMatchComplete(match.id);
    
    console.log(`✅ Match simulated: ${result.homeScore} - ${result.awayScore}`);
    console.log(`⏱️ Duration: ${result.duration} minutes`);
    console.log(`🏆 Snitch caught: ${result.snitchCaught ? 'Yes' : 'No'}`);
    
    // Check if events were saved
    console.log('🔍 Checking saved events...');
    const events = await db.getMatchEvents(match.id);
    console.log(`📊 Events saved: ${events.length}`);
    
    if (events.length > 0) {
      console.log('✅ Events found! First few events:');
      events.slice(0, 5).forEach((event, index) => {
        console.log(`  ${index + 1}. [${event.minute}']: ${event.description} (${event.points} pts)`);
      });
    } else {
      console.log('❌ No events found in database!');
    }
    
    // Check match status
    const updatedMatch = await db.getMatchById(match.id);
    console.log(`📋 Match status: ${updatedMatch.status}`);
    console.log(`🎯 Final score: ${updatedMatch.home_score} - ${updatedMatch.away_score}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMatchSimulation().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test error:', error);
  process.exit(1);
});
