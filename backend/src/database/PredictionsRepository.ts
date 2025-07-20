import { DatabaseConnection } from './DatabaseConnection';
import { PredictionData, DatabaseResult } from './interfaces';

export class PredictionsRepository {
  private connection: DatabaseConnection;

  constructor() {
    this.connection = DatabaseConnection.getInstance();
  }

  public async createPrediction(predictionData: PredictionData): Promise<DatabaseResult> {
    // Get current virtual time
    let virtualTime: string;
    try {
      const { VirtualTimeService } = await import('../services/VirtualTimeService');
      const virtualTimeService = VirtualTimeService.getInstance();
      await virtualTimeService.initialize();
      const currentState = await virtualTimeService.getCurrentState();
      virtualTime = currentState.currentDate.toISOString();
    } catch (error) {
      console.error('Error getting virtual time for prediction, using real time:', error);
      virtualTime = new Date().toISOString();
    }

    const sql = `
      INSERT INTO predictions (id, user_id, match_id, prediction, confidence, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `;
    return await this.connection.run(sql, [
      predictionData.id,
      predictionData.userId,
      predictionData.matchId,
      predictionData.prediction,
      predictionData.confidence,
      virtualTime
    ]);
  }

  public async getPredictionsByUser(userId: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        p.*,
        m.date as matchDate,
        ht.name as homeTeamName,
        at.name as awayTeamName,
        u.username
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `;
    return await this.connection.all(sql, [userId]);
  }

  public async getPredictionsByMatch(matchId: string): Promise<unknown[]> {
    const sql = `
      SELECT 
        p.*,
        u.username
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      WHERE p.match_id = ?
      ORDER BY p.created_at DESC
    `;
    return await this.connection.all(sql, [matchId]);
  }

  public async updatePredictionStatus(predictionId: string, status: string, points: number, resolvedAt?: string): Promise<DatabaseResult> {
    let finalResolvedAt = resolvedAt;
    
    // If no resolvedAt provided, use virtual time
    if (!finalResolvedAt) {
      try {
        const { VirtualTimeService } = await import('../services/VirtualTimeService');
        const virtualTimeService = VirtualTimeService.getInstance();
        await virtualTimeService.initialize();
        const currentState = await virtualTimeService.getCurrentState();
        finalResolvedAt = currentState.currentDate.toISOString();
      } catch (error) {
        console.error('Error getting virtual time for prediction status update, using real time:', error);
        finalResolvedAt = new Date().toISOString();
      }
    }

    const sql = `
      UPDATE predictions 
      SET status = ?, points = ?, resolved_at = ?
      WHERE id = ?
    `;
    return await this.connection.run(sql, [status, points, finalResolvedAt, predictionId]);
  }

  public async getAllPredictions(): Promise<unknown[]> {
    const sql = `
      SELECT 
        p.*,
        u.username,
        m.date as matchDate,
        ht.name as homeTeamName,
        at.name as awayTeamName
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      JOIN matches m ON p.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      ORDER BY p.created_at DESC
    `;
    return await this.connection.all(sql);
  }

  public async getUserPredictionForMatch(userId: string, matchId: string): Promise<unknown> {
    const sql = `
      SELECT * FROM predictions 
      WHERE user_id = ? AND match_id = ?
    `;
    return await this.connection.get(sql, [userId, matchId]);
  }

  public async resolveMatchPredictions(matchId: string, homeScore: number, awayScore: number): Promise<{ resolved: number; correct: number; incorrect: number }> {
    try {
      console.log(`🔮 Resolving predictions for match ${matchId} - Final score: ${homeScore}-${awayScore}`);
      
      // Determinar el resultado real del partido
      let actualResult: 'home' | 'away' | 'draw';
      if (homeScore > awayScore) {
        actualResult = 'home';
      } else if (awayScore > homeScore) {
        actualResult = 'away';
      } else {
        actualResult = 'draw';
      }

      console.log(`🎯 Match result: ${actualResult}`);

      // Obtener todas las predicciones pendientes para este partido
      const pendingPredictions = await this.connection.all(`
        SELECT id, prediction, user_id, confidence 
        FROM predictions 
        WHERE match_id = ? AND status = 'pending'
      `, [matchId]);

      console.log(`📊 Found ${pendingPredictions.length} pending predictions to resolve`);

      let resolvedCount = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      
      // Get current virtual time for resolved_at
      let virtualTime: string;
      try {
        const { VirtualTimeService } = await import('../services/VirtualTimeService');
        const virtualTimeService = VirtualTimeService.getInstance();
        await virtualTimeService.initialize();
        const currentState = await virtualTimeService.getCurrentState();
        virtualTime = currentState.currentDate.toISOString();
      } catch (error) {
        console.error('Error getting virtual time for prediction resolution, using real time:', error);
        virtualTime = new Date().toISOString();
      }

      const resolvedAt = virtualTime;

      // Resolver cada predicción
      for (const prediction of pendingPredictions) {
        const pred = prediction as { id: string; prediction: string; user_id: string; confidence: number };
        const isCorrect = pred.prediction === actualResult;
        const newStatus = isCorrect ? 'correct' : 'incorrect';
        
        // Calcular puntos basados en la confianza y si acertó
        const points = isCorrect ? pred.confidence * 10 : 0;

        // Actualizar la predicción
        await this.connection.run(`
          UPDATE predictions 
          SET status = ?, points = ?, resolved_at = ?
          WHERE id = ?
        `, [newStatus, points, resolvedAt, pred.id]);

        resolvedCount++;
        if (isCorrect) {
          correctCount++;
          console.log(`✅ User ${pred.user_id}: Correct prediction (${pred.prediction}) - Points: ${points}`);
        } else {
          incorrectCount++;
          console.log(`❌ User ${pred.user_id}: Incorrect prediction (${pred.prediction} vs ${actualResult}) - Points: 0`);
        }
      }

      console.log(`🏆 Predictions resolved: ${resolvedCount} total, ${correctCount} correct, ${incorrectCount} incorrect`);

      return {
        resolved: resolvedCount,
        correct: correctCount,
        incorrect: incorrectCount
      };
    } catch (error) {
      console.error('❌ Error resolving match predictions:', error);
      throw error;
    }
  }
}
