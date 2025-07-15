// Test script para verificar el endpoint de apuestas
const testBetsEndpoint = async () => {
  try {
    // Simular login para obtener token
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'a@gmail.com',
        password: 'a'
      })
    });

    if (!loginResponse.ok) {
      console.log('Login failed, using mock data...');
      // Si el login falla, usar datos mock para testing
      return;
    }

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (loginData.success && loginData.data?.tokens?.accessToken) {
      const token = loginData.data.tokens.accessToken;
      
      // Test endpoint de apuestas
      const betsResponse = await fetch('http://localhost:3001/api/bets', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const betsData = await betsResponse.json();
      console.log('Bets endpoint response:', betsData);

      if (betsData.success && betsData.data?.data) {
        console.log('Number of bets:', betsData.data.data.length);
        console.log('Sample bet:', betsData.data.data[0]);
        
        // Verificar estructura de datos
        betsData.data.data.forEach((bet, index) => {
          console.log(`Bet ${index + 1}:`, {
            id: bet.id,
            user_id: bet.user_id,
            status: bet.status,
            placed_at: bet.placed_at,
            homeTeamName: bet.homeTeamName,
            awayTeamName: bet.awayTeamName
          });
        });
      } else {
        console.log('No bets data found');
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Ejecutar test
testBetsEndpoint();
