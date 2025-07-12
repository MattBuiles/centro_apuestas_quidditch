import { Database } from '../database/Database';
import { WebSocketService } from './WebSocketService';
import { MatchEvent } from '../types';

interface MatchData {
  id: string;
  status: string;
  home_team_id: string;
  away_team_id: string;
  home_score?: number;
  away_score?: number;
}

interface MatchSimulationData {
  type: string;
  minute: number;
  homeScore: number;
  awayScore: number;
  status?: string;
  event?: {
    type: string;
    team: string;
    description: string;
    points: number;
  };
  winner?: string;
}

interface MatchSimulationStatus {
  matchId: string;
  status: string;
  homeScore: number;
  awayScore: number;
  events: unknown[];
  isLive: boolean;
}

export class MatchSimulationService {
  private db: Database;
  private wsService: WebSocketService | null = null;
  
  constructor() {
    this.db = Database.getInstance();
  }

  public setWebSocketService(wsService: WebSocketService): void {
    this.wsService = wsService;
  }

  /**
   * Inicia la simulación en vivo de un partido
   */
  public async startMatchSimulation(matchId: string): Promise<boolean> {
    try {
      // Verificar que el partido existe y no ha sido jugado
      const match = await this.db.getMatchById(matchId) as MatchData;
      if (!match) {
        throw new Error('Partido no encontrado');
      }

      // Verificar status del partido
      if (match.status === 'finished') {
        throw new Error('El partido ya ha sido finalizado');
      }

      // Cambiar estado del partido a 'live'
      await this.db.updateMatchStatus(matchId, 'live');

      // Iniciar simulación en segundo plano
      this.simulateMatchLive(matchId);

      return true;
    } catch (error) {
      console.error('Error starting match simulation:', error);
      throw error;
    }
  }

  /**
   * Simula un partido en tiempo real con eventos paso a paso
   */
  private async simulateMatchLive(matchId: string): Promise<void> {
    try {
      const match = await this.db.getMatchById(matchId) as MatchData;
      if (!match) return;

      // Notificar inicio de simulación
      this.broadcastMatchUpdate(matchId, {
        type: 'match_started',
        minute: 0,
        homeScore: 0,
        awayScore: 0,
        status: 'live'
      });

      // Generar eventos del partido
      const events = this.generateMatchEvents(match);
      let homeScore = 0;
      let awayScore = 0;
      let currentMinute = 0;

      // Simular eventos paso a paso
      for (const event of events) {
        // Esperar tiempo realista entre eventos (2-8 segundos)
        await this.delay(Math.random() * 6000 + 2000);

        // Actualizar minuto actual
        currentMinute = event.minute;

        // Procesar evento
        if (event.type === 'goal') {
          if (event.team === match.home_team_id) {
            homeScore += event.points;
          } else {
            awayScore += event.points;
          }
        } else if (event.type === 'snitch') {
          // Snitch otorga 150 puntos
          if (event.team === match.home_team_id) {
            homeScore += 150;
          } else {
            awayScore += 150;
          }
        }

        // Guardar evento en base de datos
        await this.db.createMatchEvent({
          id: `event_${matchId}_${Date.now()}_${Math.random()}`,
          matchId,
          minute: event.minute,
          type: event.type,
          team: event.team,
          player: event.player,
          description: event.description,
          points: event.points
        });

        // Actualizar scores en tiempo real
        await this.db.updateMatchScore(matchId, homeScore, awayScore);

        // Broadcast evento a clientes conectados
        this.broadcastMatchUpdate(matchId, {
          type: 'match_event',
          minute: currentMinute,
          homeScore,
          awayScore,
          event: {
            type: event.type,
            team: event.team,
            description: event.description,
            points: event.points
          }
        });

        // Si se captura la snitch, el partido termina
        if (event.type === 'snitch') {
          break;
        }
      }

      // Finalizar partido
      await this.finishMatch(matchId, homeScore, awayScore, currentMinute);

    } catch (error) {
      console.error('Error in match simulation:', error);
      // En caso de error, marcar partido como terminado
      await this.db.updateMatchStatus(matchId, 'finished');
    }
  }

  /**
   * Genera eventos aleatorios para un partido
   */
  private generateMatchEvents(match: MatchData): MatchEvent[] {
    const events: MatchEvent[] = [];
    const teams = [match.home_team_id, match.away_team_id];
    
    // Duración del partido (30-120 minutos)
    const matchDuration = Math.random() * 90 + 30;
    
    // Generar eventos de gol (10-25 goles por partido)
    const goalCount = Math.floor(Math.random() * 15) + 10;
    
    for (let i = 0; i < goalCount; i++) {
      const minute = Math.floor(Math.random() * matchDuration);
      const team = teams[Math.floor(Math.random() * teams.length)];
      const goalType = Math.random() < 0.8 ? 'quaffle' : 'bludger';
      
      events.push({
        id: `goal_${i}`,
        matchId: match.id,
        minute,
        type: 'goal',
        team,
        description: goalType === 'quaffle' 
          ? 'Gol de Quaffle - ¡Excelente jugada de los Cazadores!'
          : 'Gol asistido por Bludger - ¡Jugada espectacular!',
        points: 10
      });
    }

    // Generar eventos de falta (3-8 faltas)
    const foulCount = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < foulCount; i++) {
      const minute = Math.floor(Math.random() * matchDuration);
      const team = teams[Math.floor(Math.random() * teams.length)];
      
      events.push({
        id: `foul_${i}`,
        matchId: match.id,
        minute,
        type: 'foul',
        team,
        description: 'Falta - Infracción de las reglas de Quidditch',
        points: 0
      });
    }

    // Evento de captura de snitch (siempre al final)
    const snitchMinute = Math.floor(matchDuration);
    const snitchTeam = teams[Math.floor(Math.random() * teams.length)];
    
    events.push({
      id: 'snitch_catch',
      matchId: match.id,
      minute: snitchMinute,
      type: 'snitch',
      team: snitchTeam,
      description: '¡SNITCH CAPTURADA! - ¡El Buscador ha atrapado la Snitch Dorada!',
      points: 150
    });

    // Ordenar eventos por minuto
    return events.sort((a, b) => a.minute - b.minute);
  }

  /**
   * Finaliza un partido y actualiza la base de datos
   */
  private async finishMatch(matchId: string, homeScore: number, awayScore: number, duration: number): Promise<void> {
    try {
      // Actualizar estado del partido
      await this.db.updateMatchStatus(matchId, 'finished');
      await this.db.updateMatchScore(matchId, homeScore, awayScore);
      
      // Marcar snitch como capturada
      await this.db.updateMatchSnitchCaught(matchId, true, homeScore > awayScore ? 'home' : 'away');

      // Broadcast finalización del partido
      this.broadcastMatchUpdate(matchId, {
        type: 'match_finished',
        minute: duration,
        homeScore,
        awayScore,
        status: 'finished',
        winner: homeScore > awayScore ? 'home' : 'away'
      });

    } catch (error) {
      console.error('Error finishing match:', error);
      throw error;
    }
  }

  /**
   * Envía actualizaciones en tiempo real via WebSocket
   */
  private broadcastMatchUpdate(matchId: string, data: MatchSimulationData): void {
    if (this.wsService) {
      this.wsService.broadcastMatchUpdate({
        matchId,
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Utility para delay en async
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtiene el estado actual de un partido en simulación
   */
  public async getMatchSimulationStatus(matchId: string): Promise<MatchSimulationStatus> {
    try {
      const match = await this.db.getMatchById(matchId) as MatchData;
      if (!match) {
        throw new Error('Partido no encontrado');
      }

      const events = await this.db.getMatchEvents(matchId);
      
      return {
        matchId,
        status: match.status,
        homeScore: match.home_score || 0,
        awayScore: match.away_score || 0,
        events: events || [],
        isLive: match.status === 'live'
      };
    } catch (error) {
      console.error('Error getting match simulation status:', error);
      throw error;
    }
  }
}