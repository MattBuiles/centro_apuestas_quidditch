async function testAdvanceToNextMatch() {
  try {
    console.log('🧪 Probando el endpoint de avance al próximo partido...\n');
    
    const { default: fetch } = await import('node-fetch');
    
    const response = await fetch('http://localhost:3001/api/league-time/advance-to-next-match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });
    
    const data = await response.json();
    
    console.log('📊 Resultado:');
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Message: ${data.message}`);
    
    if (data.success && data.data) {
      console.log(`Nueva fecha: ${new Date(data.data.newDate).toLocaleString('es-ES')}`);
      console.log(`Mensaje interno: ${data.data.message}`);
    }
    
    if (data.error) {
      console.error(`Error: ${data.error}`);
    }
    
  } catch (error) {
    console.error('Error ejecutando la prueba:', error);
  }
}

testAdvanceToNextMatch();
