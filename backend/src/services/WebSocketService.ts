import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketMessage } from '../types';
import { logger } from '../utils/Logger';

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionCount = 0;
  private maxConnections = 1000;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      try {
        // Check connection limits
        if (this.clients.size >= this.maxConnections) {
          logger.warn('WebSocket connection limit reached', { 
            currentConnections: this.clients.size,
            maxConnections: this.maxConnections,
            clientIP: req.socket.remoteAddress 
          });
          ws.close(1013, 'Service overloaded');
          return;
        }

        this.connectionCount++;
        const connectionId = this.connectionCount;
        
        logger.info('🔌 New WebSocket connection established', {
          connectionId,
          totalConnections: this.clients.size + 1,
          clientIP: req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
        
        this.clients.add(ws);

        // Add connection metadata
        (ws as any).connectionId = connectionId;
        (ws as any).connectedAt = new Date();
        (ws as any).isAlive = true;

        ws.on('message', (message: Buffer) => {
          this.handleMessage(ws, message, connectionId);
        });

        ws.on('close', (code: number, reason: Buffer) => {
          logger.info('🔌 WebSocket connection closed', {
            connectionId,
            code,
            reason: reason.toString(),
            duration: Date.now() - (ws as any).connectedAt?.getTime() || 0
          });
          this.clients.delete(ws);
        });

        ws.on('error', (error: Error) => {
          logger.error('❌ WebSocket error', error, { connectionId });
          this.clients.delete(ws);
        });

        ws.on('pong', () => {
          (ws as any).isAlive = true;
        });

        // Send welcome message
        this.sendToClient(ws, {
          type: 'connection',
          data: { 
            message: 'Connected to Quidditch Betting WebSocket',
            connectionId,
            serverTime: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        logger.error('Error setting up WebSocket connection', error instanceof Error ? error : new Error(String(error)));
        ws.close(1011, 'Server error');
      }
    });

    this.wss.on('error', (error: Error) => {
      logger.error('WebSocket Server error', error);
    });

    this.wss.on('close', () => {
      logger.info('WebSocket Server closed');
      this.stopHeartbeat();
    });
  }

  private handleMessage(ws: WebSocket, message: Buffer, connectionId: number): void {
    try {
      const data = JSON.parse(message.toString());
      
      logger.debug('📨 Received WebSocket message', {
        connectionId,
        type: data.type,
        messageSize: message.length
      });
      
      // Handle different message types
      switch (data.type) {
        case 'ping':
          this.sendToClient(ws, {
            type: 'pong',
            data: { 
              timestamp: new Date().toISOString(),
              connectionId 
            },
            timestamp: new Date().toISOString()
          });
          break;
        
        case 'subscribe':
          // Handle subscription to specific channels
          logger.debug(`📡 Client subscribed to: ${data.channel}`, { connectionId });
          (ws as any).subscriptions = (ws as any).subscriptions || new Set();
          (ws as any).subscriptions.add(data.channel);
          break;

        case 'unsubscribe':
          logger.debug(`📡 Client unsubscribed from: ${data.channel}`, { connectionId });
          if ((ws as any).subscriptions) {
            (ws as any).subscriptions.delete(data.channel);
          }
          break;
        
        default:
          logger.debug('❓ Unknown message type', { type: data.type, connectionId });
      }
    } catch (error) {
      logger.error('❌ Invalid WebSocket message', error instanceof Error ? error : new Error(String(error)), { connectionId });
    }
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const messageStr = JSON.stringify(message);
        ws.send(messageStr);
      } catch (error) {
        logger.error('Error sending message to WebSocket client', error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  public broadcast(message: WebSocketMessage, channel?: string): void {
    if (this.clients.size === 0) {
      return; // No clients to broadcast to
    }

    const messageStr = JSON.stringify(message);
    let successCount = 0;
    let errorCount = 0;

    this.clients.forEach(client => {
      try {
        // Check if client is subscribed to the channel (if specified)
        if (channel && (client as any).subscriptions && !(client as any).subscriptions.has(channel)) {
          return; // Skip clients not subscribed to this channel
        }

        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
          successCount++;
        } else {
          this.clients.delete(client);
        }
      } catch (error) {
        errorCount++;
        logger.error('Error broadcasting to WebSocket client', error instanceof Error ? error : new Error(String(error)));
        this.clients.delete(client);
      }
    });

    if (errorCount > 0) {
      logger.warn('WebSocket broadcast completed with errors', {
        messageType: message.type,
        successCount,
        errorCount,
        totalClients: this.clients.size,
        channel
      });
    } else {
      logger.debug('WebSocket broadcast completed', {
        messageType: message.type,
        clientCount: successCount,
        channel
      });
    }
  }

  public broadcastMatchUpdate(matchData: any): void {
    this.broadcast({
      type: 'match_update',
      data: matchData,
      timestamp: new Date().toISOString()
    }, 'matches');
  }

  public broadcastBetUpdate(betData: any): void {
    this.broadcast({
      type: 'bet_update',
      data: betData,
      timestamp: new Date().toISOString()
    }, 'bets');
  }

  public broadcastPredictionUpdate(predictionData: any): void {
    this.broadcast({
      type: 'prediction_update',
      data: predictionData,
      timestamp: new Date().toISOString()
    }, 'predictions');
  }

  public broadcastStandingsUpdate(standingsData: any): void {
    this.broadcast({
      type: 'standings_update',
      data: standingsData,
      timestamp: new Date().toISOString()
    }, 'standings');
  }

  public getStats() {
    return {
      totalConnections: this.connectionCount,
      activeConnections: this.clients.size,
      maxConnections: this.maxConnections,
      serverStartTime: new Date().toISOString()
    };
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach(ws => {
        if (!(ws as any).isAlive) {
          logger.debug('Terminating inactive WebSocket connection', { 
            connectionId: (ws as any).connectionId 
          });
          ws.terminate();
          this.clients.delete(ws);
          return;
        }

        (ws as any).isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public close(): void {
    logger.info('Closing WebSocket service');
    this.stopHeartbeat();
    
    // Close all client connections
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.close(1001, 'Server shutting down');
      }
    });
    
    this.clients.clear();
    this.wss.close();
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}
