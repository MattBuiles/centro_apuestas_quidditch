const fetch = require('node-fetch');

async function testVirtualTimeDates() {
  console.log('🧪 Testing Virtual Time in Database Dates...\n');

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
      return;
    }

    // 2. Get current virtual time
    console.log('\n⏰ Getting current virtual time...');
    const timeResponse = await fetch(`${BASE_URL}/virtual-time/current`);
    const timeData = await timeResponse.json();
    const virtualTime = new Date(timeData.data.currentDate);
    console.log('Virtual time:', virtualTime.toISOString());
    console.log('Real time:   ', new Date().toISOString());

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

    // 4. Create a prediction
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
      return;
    }

    // 5. Wait and check the prediction dates in database
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n📊 Checking prediction dates...');
    const predictionsResponse = await fetch(`${BASE_URL}/predictions/match/${nextMatch.id}`);
    const predictions = await predictionsResponse.json();
    
    if (predictions.data && predictions.data.length > 0) {
      const prediction = predictions.data[0];
      const createdAt = new Date(prediction.created_at);
      
      console.log('Prediction created_at:', createdAt.toISOString());
      console.log('Virtual time:        ', virtualTime.toISOString());
      console.log('Real time:           ', new Date().toISOString());
      
      // Check if prediction uses virtual time (should be close to virtual time)
      const timeDiffVirtual = Math.abs(createdAt.getTime() - virtualTime.getTime());
      const timeDiffReal = Math.abs(createdAt.getTime() - new Date().getTime());
      
      console.log(`\nTime differences:`);
      console.log(`From virtual time: ${Math.round(timeDiffVirtual / 1000)} seconds`);
      console.log(`From real time:    ${Math.round(timeDiffReal / 1000)} seconds`);
      
      if (timeDiffVirtual < timeDiffReal) {
        console.log('✅ Prediction is using VIRTUAL TIME correctly!');
      } else {
        console.log('❌ Prediction seems to be using REAL TIME (incorrect)');
      }
    }

    // 6. Advance virtual time significantly
    console.log('\n⏭️  Advancing virtual time by 1 day...');
    const advanceResponse = await fetch(`${BASE_URL}/league-time/advance`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        days: 1,
        simulateMatches: true
      })
    });
    
    const advanceData = await advanceResponse.json();
    console.log('Time advancement result:', advanceData.data);

    // 7. Get new virtual time
    const newTimeResponse = await fetch(`${BASE_URL}/virtual-time/current`);
    const newTimeData = await newTimeResponse.json();
    const newVirtualTime = new Date(newTimeData.data.currentDate);
    console.log('New virtual time:', newVirtualTime.toISOString());

    // 8. Check if predictions were resolved with virtual time
    console.log('\n📊 Checking resolved predictions...');
    const resolvedPredictionsResponse = await fetch(`${BASE_URL}/predictions/user`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (resolvedPredictionsResponse.ok) {
      const userPredictions = await resolvedPredictionsResponse.json();
      const resolvedPredictions = userPredictions.data?.filter(pred => pred.status !== 'pending') || [];
      
      if (resolvedPredictions.length > 0) {
        const resolvedPred = resolvedPredictions[0];
        if (resolvedPred.resolved_at) {
          const resolvedAt = new Date(resolvedPred.resolved_at);
          console.log('Prediction resolved_at:', resolvedAt.toISOString());
          console.log('Virtual time:         ', newVirtualTime.toISOString());
          console.log('Real time:            ', new Date().toISOString());
          
          const resolvedTimeDiffVirtual = Math.abs(resolvedAt.getTime() - newVirtualTime.getTime());
          const resolvedTimeDiffReal = Math.abs(resolvedAt.getTime() - new Date().getTime());
          
          console.log(`\nResolution time differences:`);
          console.log(`From virtual time: ${Math.round(resolvedTimeDiffVirtual / 1000)} seconds`);
          console.log(`From real time:    ${Math.round(resolvedTimeDiffReal / 1000)} seconds`);
          
          if (resolvedTimeDiffVirtual < resolvedTimeDiffReal) {
            console.log('✅ Prediction resolution is using VIRTUAL TIME correctly!');
          } else {
            console.log('❌ Prediction resolution seems to be using REAL TIME (incorrect)');
          }
        }
      }
    }

    console.log('\n✅ Virtual time test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testVirtualTimeDates();
