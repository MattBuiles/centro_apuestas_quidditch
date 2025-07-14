const fetch = require('node-fetch');

async function testPredictionsResolutionComplete() {
  console.log('🧪 Testing Predictions Resolution with Time Advancement...\n');

  const BASE_URL = 'http://localhost:3001/api';
  const testUser = {
    email: 'test@example.com',
    password: 'password123'
  };

  let authToken = null;

  try {
    // 1. Login
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      authToken = loginData.data.token;
      console.log('✅ Login successful');
    } else {
      console.log('⚠️  Login failed, continuing without authentication');
    }

    // 2. Get current time state
    console.log('\n⏰ Getting current virtual time...');
    const timeResponse = await fetch(`${BASE_URL}/virtual-time/current`);
    const timeData = await timeResponse.json();
    console.log('Current virtual time:', timeData.data.currentDate);

    // 3. Get next upcoming match
    console.log('\n🔍 Looking for upcoming matches...');
    const matchesResponse = await fetch(`${BASE_URL}/matches/status/scheduled`);
    const matchesData = await matchesResponse.json();
    
    if (!matchesData.data || matchesData.data.length === 0) {
      console.log('❌ No scheduled matches found');
      return;
    }

    const nextMatch = matchesData.data[0];
    console.log(`Found match: ${nextMatch.homeTeam} vs ${nextMatch.awayTeam} (ID: ${nextMatch.id})`);

    // 4. Create a prediction if authenticated
    if (authToken) {
      console.log('\n🔮 Creating prediction...');
      const predictionResponse = await fetch(`${BASE_URL}/predictions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          matchId: nextMatch.id,
          prediction: 'home',
          confidence: 4
        })
      });
      
      if (predictionResponse.ok) {
        const predictionData = await predictionResponse.json();
        console.log('✅ Prediction created:', predictionData.data);
      } else {
        const errorData = await predictionResponse.json();
        console.log('⚠️  Prediction creation failed:', errorData.message);
      }
    }

    // 5. Check predictions before advancing time
    console.log('\n📊 Checking predictions before time advancement...');
    const beforePredictionsResponse = await fetch(`${BASE_URL}/predictions/match/${nextMatch.id}`);
    const beforePredictions = await beforePredictionsResponse.json();
    console.log('Predictions before:', beforePredictions.data?.length || 0);
    
    if (beforePredictions.data && beforePredictions.data.length > 0) {
      beforePredictions.data.forEach((pred, index) => {
        console.log(`  Prediction ${index + 1}: ${pred.prediction} (${pred.status}, confidence: ${pred.confidence})`);
      });
    }

    // 6. Advance to next match (this should simulate the match and resolve predictions)
    console.log('\n⏭️  Advancing to next match...');
    const advanceResponse = await fetch(`${BASE_URL}/league-time/advance-to-next-match`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      }
    });
    
    const advanceData = await advanceResponse.json();
    console.log('Time advancement result:', advanceData.data);

    // 7. Wait a moment for database updates
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 8. Check match status after advancement
    console.log('\n🏆 Checking match status after advancement...');
    const updatedMatchResponse = await fetch(`${BASE_URL}/matches/${nextMatch.id}`);
    const updatedMatch = await updatedMatchResponse.json();
    console.log(`Match status: ${updatedMatch.data.status}`);
    console.log(`Final score: ${updatedMatch.data.homeScore} - ${updatedMatch.data.awayScore}`);

    // 9. Check predictions after advancement
    console.log('\n📊 Checking predictions after time advancement...');
    const afterPredictionsResponse = await fetch(`${BASE_URL}/predictions/match/${nextMatch.id}`);
    const afterPredictions = await afterPredictionsResponse.json();
    console.log('Predictions after:', afterPredictions.data?.length || 0);
    
    if (afterPredictions.data && afterPredictions.data.length > 0) {
      afterPredictions.data.forEach((pred, index) => {
        console.log(`  Prediction ${index + 1}: ${pred.prediction} (Status: ${pred.status}, Points: ${pred.points}, Resolved: ${pred.resolved_at})`);
      });
    }

    // 10. Test bulk time advancement
    console.log('\n⏭️⏭️  Testing bulk time advancement (1 day)...');
    const bulkAdvanceResponse = await fetch(`${BASE_URL}/league-time/advance`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({
        days: 1,
        simulateMatches: true
      })
    });
    
    const bulkAdvanceData = await bulkAdvanceResponse.json();
    console.log('Bulk advancement result:', bulkAdvanceData.data);
    console.log(`Simulated matches: ${bulkAdvanceData.data.simulatedMatches?.length || 0}`);

    // 11. Check all predictions status
    if (authToken) {
      console.log('\n🔮 Checking all user predictions...');
      const userPredictionsResponse = await fetch(`${BASE_URL}/predictions/user`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (userPredictionsResponse.ok) {
        const userPredictions = await userPredictionsResponse.json();
        console.log(`Total user predictions: ${userPredictions.data?.length || 0}`);
        
        const resolvedPredictions = userPredictions.data?.filter(pred => pred.status !== 'pending') || [];
        console.log(`Resolved predictions: ${resolvedPredictions.length}`);
        
        resolvedPredictions.forEach((pred, index) => {
          console.log(`  ${index + 1}. ${pred.prediction} - ${pred.status} (${pred.points} points)`);
        });
      }
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPredictionsResolutionComplete();
