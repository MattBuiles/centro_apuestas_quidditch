// Test de conectividad WebSocket
console.log('🔌 Testing WebSocket connectivity...');

const wsUrl = 'ws://localhost:3002';
const ws = new WebSocket(wsUrl);

ws.onopen = () => {
  console.log('✅ WebSocket connected successfully to:', wsUrl);
  
  // Enviar un mensaje de prueba
  ws.send(JSON.stringify({
    type: 'ping',
    data: { message: 'Test from browser' }
  }));
};

ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    console.log('📨 Received message:', data);
    
    // Cerrar la conexión después de recibir la respuesta
    setTimeout(() => {
      ws.close();
      console.log('🔌 WebSocket connection closed');
    }, 1000);
  } catch (error) {
    console.error('❌ Error parsing WebSocket message:', error);
  }
};

ws.onerror = (error) => {
  console.error('❌ WebSocket error:', error);
};

ws.onclose = () => {
  console.log('🔌 WebSocket connection closed');
};

setTimeout(() => {
  if (ws.readyState === WebSocket.CONNECTING) {
    console.log('⏳ WebSocket still connecting...');
  } else if (ws.readyState === WebSocket.CLOSED) {
    console.log('❌ WebSocket connection failed');
  }
}, 5000);
