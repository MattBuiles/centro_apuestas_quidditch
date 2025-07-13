const fetch = require('node-fetch');

// Test predictions system after fixing infinite loops
async function testPredictionsSystem() {
    console.log('🧪 Testing Fixed Predictions System...\n');
    
    try {
        // 1. Check backend health
        console.log('1. Checking backend health...');
        const healthResponse = await fetch('http://localhost:3001/health');
        const healthData = await healthResponse.json();
        console.log('✅ Backend status:', healthData.status);
        
        // 2. Get available matches
        console.log('\n2. Getting available matches...');
        const matchesResponse = await fetch('http://localhost:3001/api/matches');
        const matchesData = await matchesResponse.json();
        console.log(`✅ Found ${matchesData.length} matches`);
        
        if (matchesData.length > 0) {
            const firstMatch = matchesData[0];
            console.log(`   First match: ${firstMatch.homeTeam?.name} vs ${firstMatch.awayTeam?.name}`);
            console.log(`   Match ID: ${firstMatch.id}`);
            console.log(`   Status: ${firstMatch.status}`);
            
            // 3. Test authentication (auto-login should work)
            console.log('\n3. Testing authentication...');
            const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: 'testuser', 
                    password: 'testpass' 
                })
            });
            
            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                console.log('✅ Authentication successful');
                const token = loginData.token;
                
                // 4. Test prediction submission
                console.log('\n4. Testing prediction submission...');
                const predictionResponse = await fetch('http://localhost:3001/api/predictions', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        matchId: firstMatch.id,
                        prediction: 'home'
                    })
                });
                
                if (predictionResponse.ok) {
                    const predictionData = await predictionResponse.json();
                    console.log('✅ Prediction submitted successfully');
                    console.log('   Response:', predictionData);
                } else {
                    console.log('❌ Prediction submission failed:', predictionResponse.status);
                    const errorText = await predictionResponse.text();
                    console.log('   Error:', errorText);
                }
                
                // 5. Test prediction retrieval
                console.log('\n5. Testing prediction retrieval...');
                const getPredictionResponse = await fetch(
                    `http://localhost:3001/api/predictions/match/${firstMatch.id}`, 
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                );
                
                if (getPredictionResponse.ok) {
                    const getPredictionData = await getPredictionResponse.json();
                    console.log('✅ Prediction retrieved successfully');
                    console.log('   Data:', getPredictionData);
                } else {
                    console.log('❌ Prediction retrieval failed:', getPredictionResponse.status);
                }
            } else {
                console.log('❌ Authentication failed:', loginResponse.status);
            }
        }
        
        console.log('\n🎉 Predictions system test completed!');
        console.log('\nNext steps:');
        console.log('1. Open http://localhost:5173 in your browser');
        console.log('2. Navigate to a match detail page');
        console.log('3. Verify that predictions load without infinite loops');
        console.log('4. Test submitting predictions');
        console.log('5. Check that the correct selection is displayed');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testPredictionsSystem();
