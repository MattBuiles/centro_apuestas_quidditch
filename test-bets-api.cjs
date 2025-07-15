const https = require('http');

async function testBetsAPI() {
  // Primero vamos a intentar hacer login para obtener un token
  const loginData = JSON.stringify({
    email: 'a@gmail.com',
    password: 'tintin123'
  });

  console.log('🔐 Intentando hacer login...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📊 Login response status:', res.statusCode);
        console.log('📊 Login response:', data);
        
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            if (response.success && response.data.token) {
              const token = response.data.token;
              console.log('✅ Login exitoso, token obtenido');
              
              // Ahora hacer la consulta de apuestas
              testGetBets(token);
            } else {
              console.log('❌ Login falló:', response);
            }
          } catch (error) {
            console.error('❌ Error parsing login response:', error);
          }
        } else {
          console.log('❌ Login failed with status:', res.statusCode);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error en login request:', error);
      reject(error);
    });

    req.write(loginData);
    req.end();
  });
}

function testGetBets(token) {
  console.log('\n🎯 Obteniendo apuestas del usuario...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/bets',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📊 Bets response status:', res.statusCode);
      console.log('📊 Bets response:', data);
      
      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          console.log('✅ Apuestas obtenidas exitosamente');
          console.log('📊 Número de apuestas:', response.data ? response.data.length : 'No data property');
        } catch (error) {
          console.error('❌ Error parsing bets response:', error);
        }
      } else {
        console.log('❌ Bets request failed with status:', res.statusCode);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error en bets request:', error);
  });

  req.end();
}

// Ejecutar el test
testBetsAPI().catch(console.error);
