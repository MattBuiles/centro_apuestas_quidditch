const API_BASE = 'http://localhost:3001/api';

async function testBetsAPI() {
  try {
    // 1. Login
    console.log('🔐 Haciendo login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'a@gmail.com',
        password: '12345678A'
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.error);
      return;
    }

    const token = loginData.data.tokens.accessToken;
    const userId = loginData.data.user.id;
    console.log('✅ Login successful, User ID:', userId);

    // 2. Get user bets
    console.log('\n📋 Obteniendo apuestas del usuario...');
    const betsResponse = await fetch(`${API_BASE}/bets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const betsData = await betsResponse.json();
    console.log('Bets response:', JSON.stringify(betsData, null, 2));

    if (betsData.success) {
      console.log(`✅ Se encontraron ${betsData.data.length} apuestas`);
      betsData.data.forEach((bet, index) => {
        console.log(`  ${index + 1}. Bet ID: ${bet.id}`);
        console.log(`     Match: ${bet.homeTeamName} vs ${bet.awayTeamName}`);
        console.log(`     Amount: ${bet.amount} | Status: ${bet.status}`);
        console.log(`     Prediction: ${bet.prediction} (Odds: ${bet.odds})`);
        console.log(`     Placed at: ${bet.placed_at}`);
      });
    } else {
      console.error('❌ Error getting bets:', betsData.error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBetsAPI();
