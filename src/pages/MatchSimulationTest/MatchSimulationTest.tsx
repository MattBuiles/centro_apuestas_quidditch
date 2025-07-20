import React, { useState, useEffect } from 'react';
import { FEATURES } from '../../config/features';

interface MatchData {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  status: string;
  home_score: number;
  away_score: number;
  date: string;
}

const MatchSimulationTest: React.FC = () => {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<any>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const addMessage = (message: string) => {
    setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Cargar partidos programados
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch(`${FEATURES.API_BASE_URL}/matches`);
        const data = await response.json();
        
        if (data.success) {
          const scheduledMatches = data.matches.filter((match: MatchData) => match.status === 'scheduled');
          setMatches(scheduledMatches);
          addMessage(`✅ Cargados ${scheduledMatches.length} partidos programados`);
        }
      } catch (error) {
        addMessage(`❌ Error cargando partidos: ${error}`);
      }
    };

    fetchMatches();
  }, []);

  // Conectar WebSocket
  const connectWebSocket = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      addMessage('❌ WebSocket ya está conectado');
      return;
    }

    const wsUrl = FEATURES.WS_URL;
    addMessage(`🔌 Conectando WebSocket a: ${wsUrl}`);
    
    const newWs = new WebSocket(wsUrl);
    
    newWs.onopen = () => {
      setIsConnected(true);
      addMessage('✅ WebSocket conectado exitosamente');
    };

    newWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addMessage(`📨 WebSocket mensaje: ${JSON.stringify(data)}`);
        
        // Actualizar estado de simulación
        if (data.type === 'match_event' && selectedMatch) {
          setSimulationStatus(prev => ({
            ...prev,
            homeScore: data.homeScore,
            awayScore: data.awayScore,
            currentMinute: data.minute,
            lastEvent: data.event
          }));
        }
      } catch (error) {
        addMessage(`❌ Error parseando mensaje WebSocket: ${error}`);
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

  // Iniciar simulación
  const startSimulation = async () => {
    if (!selectedMatch) {
      addMessage('❌ Selecciona un partido primero');
      return;
    }

    try {
      addMessage(`🎮 Iniciando simulación para: ${selectedMatch.homeTeamName} vs ${selectedMatch.awayTeamName}`);
      
      const response = await fetch(`${FEATURES.API_BASE_URL}/matches/${selectedMatch.id}/iniciar-simulacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        addMessage('✅ Simulación iniciada exitosamente');
        setSimulationStatus({
          status: 'live',
          homeScore: 0,
          awayScore: 0,
          currentMinute: 0,
          lastEvent: null
        });
      } else {
        addMessage(`❌ Error iniciando simulación: ${data.message}`);
      }
    } catch (error) {
      addMessage(`❌ Error en simulación: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🎯 Test de Simulación de Partidos</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>🔌 WebSocket</h3>
        <div style={{ marginBottom: '10px' }}>
          <strong>Estado:</strong> {isConnected ? '✅ Conectado' : '❌ Desconectado'}
        </div>
        <button onClick={connectWebSocket} style={{ marginRight: '10px' }}>
          Conectar WebSocket
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>⚽ Partidos Programados</h3>
        {matches.length === 0 ? (
          <p>Cargando partidos...</p>
        ) : (
          <div>
            {matches.map((match) => (
              <div 
                key={match.id} 
                style={{ 
                  border: selectedMatch?.id === match.id ? '2px solid #4CAF50' : '1px solid #ccc',
                  padding: '10px', 
                  margin: '5px 0',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedMatch(match)}
              >
                <strong>{match.homeTeamName} vs {match.awayTeamName}</strong>
                <br />
                <small>Estado: {match.status} | Fecha: {match.date}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>🎮 Simulación</h3>
        <div style={{ marginBottom: '10px' }}>
          <strong>Partido Seleccionado:</strong> {
            selectedMatch 
              ? `${selectedMatch.homeTeamName} vs ${selectedMatch.awayTeamName}`
              : 'Ninguno'
          }
        </div>
        <button onClick={startSimulation} disabled={!selectedMatch}>
          Iniciar Simulación
        </button>
      </div>

      {simulationStatus && (
        <div style={{ marginBottom: '20px' }}>
          <h3>📊 Estado de la Simulación</h3>
          <div style={{ 
            border: '1px solid #ccc', 
            padding: '10px', 
            backgroundColor: '#f0f0f0' 
          }}>
            <p><strong>Estado:</strong> {simulationStatus.status}</p>
            <p><strong>Marcador:</strong> {simulationStatus.homeScore} - {simulationStatus.awayScore}</p>
            <p><strong>Minuto:</strong> {simulationStatus.currentMinute}</p>
            {simulationStatus.lastEvent && (
              <p><strong>Último evento:</strong> {simulationStatus.lastEvent.description}</p>
            )}
          </div>
        </div>
      )}

      <div style={{ 
        border: '1px solid #ccc', 
        padding: '10px', 
        height: '300px', 
        overflow: 'auto', 
        backgroundColor: '#f9f9f9' 
      }}>
        <h3>📝 Log de Mensajes</h3>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchSimulationTest;
