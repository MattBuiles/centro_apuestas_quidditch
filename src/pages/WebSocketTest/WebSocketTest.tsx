import React, { useState, useEffect } from 'react';
import { FEATURES } from '../../config/features';

const WebSocketTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const addMessage = (message: string) => {
    setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const connectWebSocket = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      addMessage('❌ Ya está conectado');
      return;
    }

    const wsUrl = FEATURES.WS_URL;
    addMessage(`🔌 Conectando a: ${wsUrl}`);
    
    const newWs = new WebSocket(wsUrl);
    
    newWs.onopen = () => {
      setIsConnected(true);
      addMessage('✅ WebSocket conectado exitosamente');
    };

    newWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addMessage(`📨 Mensaje recibido: ${JSON.stringify(data)}`);
      } catch (error) {
        addMessage(`❌ Error parseando mensaje: ${error}`);
      }
    };

    newWs.onerror = (error) => {
      addMessage(`❌ Error de WebSocket: ${error}`);
    };

    newWs.onclose = () => {
      setIsConnected(false);
      addMessage('🔌 WebSocket desconectado');
    };

    setWs(newWs);
  };

  const sendPing = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      addMessage('❌ WebSocket no está conectado');
      return;
    }

    const message = {
      type: 'ping',
      data: { message: 'Test desde React', timestamp: new Date().toISOString() }
    };

    ws.send(JSON.stringify(message));
    addMessage('📤 Ping enviado');
  };

  const disconnect = () => {
    if (ws) {
      ws.close();
      setWs(null);
    }
  };

  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🔌 WebSocket Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Estado:</strong> {isConnected ? '✅ Conectado' : '❌ Desconectado'}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Configuración:</strong>
        <ul>
          <li>WebSocket URL: {FEATURES.WS_URL}</li>
          <li>WebSocket Habilitado: {FEATURES.USE_WEBSOCKETS ? 'Sí' : 'No'}</li>
          <li>Backend Habilitado: {FEATURES.USE_BACKEND_MATCHES ? 'Sí' : 'No'}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={connectWebSocket} style={{ marginRight: '10px' }}>
          Conectar WebSocket
        </button>
        <button onClick={sendPing} style={{ marginRight: '10px' }}>
          Enviar Ping
        </button>
        <button onClick={disconnect} style={{ marginRight: '10px' }}>
          Desconectar
        </button>
        <button onClick={() => setMessages([])}>
          Limpiar Mensajes
        </button>
      </div>

      <div style={{ 
        border: '1px solid #ccc', 
        padding: '10px', 
        height: '300px', 
        overflow: 'auto', 
        backgroundColor: '#f9f9f9' 
      }}>
        <h3>Mensajes:</h3>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WebSocketTest;
