import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketMessage } from '../types';
import { VirtualTimeService } from './VirtualTimeService';

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private virtualTimeService: VirtualTimeService;

  constructor(wss: WebSocketServer, virtualTimeService: VirtualTimeService) {
    this.wss = wss;
    this.virtualTimeService = virtualTimeService;
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

      // Send current virtual time state
      this.sendCurrentTimeState(ws);
    });
  }

  private async handleMessage(ws: WebSocket, message: any): Promise<void> {
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
      
      case 'get_time_state':
        await this.sendCurrentTimeState(ws);
        break;
      
      case 'advance_time':
        await this.handleAdvanceTime(message.data);
        break;
      
      case 'simulate_match':
        await this.handleSimulateMatch(message.data.matchId);
        break;
      
      default:
        console.log('❓ Unknown message type:', message.type);
    }
  }

  private async sendCurrentTimeState(ws: WebSocket): Promise<void> {
    try {
      const timeState = await this.virtualTimeService.getCurrentState();
      this.sendToClient(ws, {
        type: 'time_update',
        data: timeState,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending time state:', error);
    }
  }

  private async handleAdvanceTime(data: any): Promise<void> {
    try {
      const result = await this.virtualTimeService.advanceTime(data);
      
      // Broadcast time update to all clients
      this.broadcast({
        type: 'time_update',
        data: {
          newDate: result.newDate,
          matchesSimulated: result.matchesSimulated,
          seasonUpdated: result.seasonUpdated
        },
        timestamp: new Date().toISOString()
      });

      // Broadcast match updates for each simulated match
      for (const matchResult of result.matchesSimulated) {
        this.broadcast({
          type: 'match_update',
          data: matchResult,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error advancing time:', error);
    }
  }

  private async handleSimulateMatch(matchId: string): Promise<void> {
    try {
      // This would call the private method through the controller
      this.broadcast({
        type: 'match_update',
        data: { matchId, message: 'Match simulation requested' },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error simulating match:', error);
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

  public broadcastTimeUpdate(timeState: any): void {
    this.broadcast({
      type: 'time_update',
      data: timeState,
      timestamp: new Date().toISOString()
    });
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}
