import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketMessage } from '../types';

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('🔌 New WebSocket connection established');
      this.clients.add(ws);

      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('❌ Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connection',
        data: { message: 'Connected to Quidditch Betting WebSocket' },
        timestamp: new Date().toISOString()
      });
    });
  }

  private handleMessage(ws: WebSocket, message: any): void {
    console.log('📨 Received WebSocket message:', message);
    
    // Handle different message types
    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, {
          type: 'pong',
          data: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString()
        });
        break;
      
      case 'subscribe':
        // Handle subscription to specific channels (matches, bets, etc.)
        console.log(`📡 Client subscribed to: ${message.channel}`);
        break;
      
      default:
        console.log('❓ Unknown message type:', message.type);
    }
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  public broadcast(message: WebSocketMessage): void {
    this.clients.forEach(client => {
      this.sendToClient(client, message);
    });
  }

  public broadcastMatchUpdate(matchData: any): void {
    this.broadcast({
      type: 'match_update',
      data: matchData,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastBetUpdate(betData: any): void {
    this.broadcast({
      type: 'bet_update',
      data: betData,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastPredictionUpdate(predictionData: any): void {
    this.broadcast({
      type: 'prediction_update',
      data: predictionData,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastStandingsUpdate(standingsData: any): void {
    this.broadcast({
      type: 'standings_update',
      data: standingsData,
      timestamp: new Date().toISOString()
    });
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}
