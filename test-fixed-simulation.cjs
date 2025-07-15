const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'quidditch.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Testing the fixed simulation - Events vs Final Score consistency\n');

// Test the backend simulation through a simple match creation and simulation
async function testFixedSimulation() {
  try {
    // Get current virtual time
    const virtualTime = await new Promise((resolve, reject) => {
      db.get('SELECT current_date FROM virtual_time_state ORDER BY id DESC LIMIT 1', (err, row) => {
        if (err) reject(err);
        else resolve(row ? new Date(row.current_date) : new Date());
      });
    });

    console.log(`📅 Virtual time: ${virtualTime.toISOString()}`);

    // Find a scheduled match
    const scheduledMatch = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          m.*,
          ht.name as homeTeamName,
          at.name as awayTeamName
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        WHERE m.status = 'scheduled'
        ORDER BY m.date ASC
        LIMIT 1
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!scheduledMatch) {
      console.log('❌ No scheduled matches found');
      return;
    }

    console.log(`🏐 Found scheduled match: ${scheduledMatch.homeTeamName} vs ${scheduledMatch.awayTeamName}`);
    console.log(`📅 Match date: ${new Date(scheduledMatch.date).toISOString()}`);

    // Use the MatchSimulationService to simulate the match
    const { MatchSimulationService } = require('./backend/src/services/MatchSimulationService');
    const simulationService = new MatchSimulationService();

    console.log('\n🎮 Starting simulation...');
    const result = await simulationService.simulateMatchComplete(scheduledMatch.id);

    console.log('\n✅ Simulation completed!');
    console.log(`🎯 Final Score: ${result.homeScore} - ${result.awayScore}`);
    console.log(`⏱️ Duration: ${result.duration} minutes`);
    console.log(`🏆 Snitch caught: ${result.snitchCaught ? 'Yes' : 'No'}`);
    if (result.snitchCaught) {
      console.log(`🔍 Snitch caught by: ${result.snitchCaughtBy || 'Unknown'}`);
    }

    // Now verify that the events match the final score
    const events = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM match_events WHERE match_id = ? ORDER BY minute ASC', [scheduledMatch.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log(`\n📝 Events generated: ${events.length}`);
    
    // Calculate score from events
    let homeScoreFromEvents = 0;
    let awayScoreFromEvents = 0;
    
    events.forEach(event => {
      if (event.points > 0) {
        if (event.team === scheduledMatch.home_team_id) {
          homeScoreFromEvents += event.points;
        } else if (event.team === scheduledMatch.away_team_id) {
          awayScoreFromEvents += event.points;
        }
      }
    });

    console.log(`\n🧮 Score calculation from events:`);
    console.log(`   Home (${scheduledMatch.homeTeamName}): ${homeScoreFromEvents} points`);
    console.log(`   Away (${scheduledMatch.awayTeamName}): ${awayScoreFromEvents} points`);

    // Verify consistency
    const homeConsistent = result.homeScore === homeScoreFromEvents;
    const awayConsistent = result.awayScore === awayScoreFromEvents;

    console.log(`\n🔍 Consistency check:`);
    console.log(`   Home score matches events: ${homeConsistent ? '✅' : '❌'} (${result.homeScore} === ${homeScoreFromEvents})`);
    console.log(`   Away score matches events: ${awayConsistent ? '✅' : '❌'} (${result.awayScore} === ${awayScoreFromEvents})`);

    if (homeConsistent && awayConsistent) {
      console.log(`\n🎉 SUCCESS! The final score matches the events generated.`);
      console.log(`✅ Fixed simulation working correctly - no more inconsistencies!`);
    } else {
      console.log(`\n❌ FAILURE! The final score still doesn't match the events.`);
    }

    // Show some sample events
    if (events.length > 0) {
      console.log(`\n📋 Sample events:`);
      events.slice(0, 5).forEach(event => {
        const teamName = event.team === scheduledMatch.home_team_id ? scheduledMatch.homeTeamName : scheduledMatch.awayTeamName;
        console.log(`   ${event.minute}' - ${teamName}: ${event.description} (${event.points} points)`);
      });
      if (events.length > 5) {
        console.log(`   ... and ${events.length - 5} more events`);
      }
    }

  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    db.close();
  }
}

testFixedSimulation();
