/**
 * Script de prueba para verificar la integración de apuestas con el backend
 */

const API_BASE = 'http://localhost:3001/api';

// Función para hacer login y obtener token
async function login() {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'harry@gryffindor.com',
      password: 'patronus123'
    })
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('✅ Login exitoso');
    console.log('Usuario:', data.data.user.username);
    console.log('Saldo:', data.data.user.balance);
    return data.data.tokens.accessToken;
  } else {
    console.log('❌ Error en login:', data.error);
    return null;
  }
}

// Función para obtener partidos disponibles
async function getMatches(token) {
  const response = await fetch(`${API_BASE}/matches`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('✅ Partidos obtenidos:', data.data.length);
    return data.data.filter(match => match.status === 'scheduled' || match.status === 'upcoming');
  } else {
    console.log('❌ Error obteniendo partidos:', data.error);
    return [];
  }
}

// Función para crear una apuesta
async function createBet(token, matchId) {
  const betData = {
    matchId: matchId,
    type: 'winner',
    prediction: 'home',
    odds: 2.15,
    amount: 10
  };

  const response = await fetch(`${API_BASE}/bets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(betData)
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('✅ Apuesta creada exitosamente');
    console.log('ID de apuesta:', data.data.id);
    console.log('Monto:', data.data.amount);
    console.log('Ganancia potencial:', data.data.potentialWin);
    return data.data;
  } else {
    console.log('❌ Error creando apuesta:', data.error);
    return null;
  }
}

// Función para verificar apuestas del usuario
async function getUserBets(token) {
  const response = await fetch(`${API_BASE}/bets`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('✅ Apuestas del usuario obtenidas:', data.data.length);
    return data.data;
  } else {
    console.log('❌ Error obteniendo apuestas:', data.error);
    return [];
  }
}

// Función principal de prueba
async function testBettingIntegration() {
  console.log('🧪 Iniciando prueba de integración de apuestas...\n');

  try {
    // 1. Login
    console.log('1. Autenticando usuario...');
    const token = await login();
    if (!token) return;
    console.log('');

    // 2. Obtener partidos
    console.log('2. Obteniendo partidos disponibles...');
    const matches = await getMatches(token);
    if (matches.length === 0) {
      console.log('❌ No hay partidos disponibles para apostar');
      return;
    }
    
    const firstMatch = matches[0];
    console.log(`Partido seleccionado: ${firstMatch.homeTeamName} vs ${firstMatch.awayTeamName}`);
    console.log('');

    // 3. Crear apuesta
    console.log('3. Creando apuesta...');
    const bet = await createBet(token, firstMatch.id);
    if (!bet) return;
    console.log('');

    // 4. Verificar apuestas del usuario
    console.log('4. Verificando apuestas del usuario...');
    const userBets = await getUserBets(token);
    const recentBet = userBets.find(b => b.id === bet.id);
    
    if (recentBet) {
      console.log('✅ Apuesta encontrada en la base de datos');
      console.log('Estado:', recentBet.status);
      console.log('Fecha de creación:', recentBet.placed_at);
    } else {
      console.log('❌ Apuesta no encontrada en la base de datos');
    }

    console.log('\n🎉 Prueba de integración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar la prueba si el script se ejecuta directamente
if (typeof module !== 'undefined' && require.main === module) {
  testBettingIntegration();
}

module.exports = { testBettingIntegration };
