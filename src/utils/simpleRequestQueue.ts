/**
 * Sistema simple de cola de peticiones para prevenir errores HTTP 429
 * Implementa throttling, deduplicación y reintentos automáticos
 */

interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
  retryCount: number;
  timestamp: number;
}

export class SimpleRequestQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private pendingRequests = new Map<string, Promise<Response>>();
  
  // Configuración conservadora para evitar 429
  private readonly MAX_CONCURRENT = 2; // Máximo 2 peticiones concurrentes
  private readonly MIN_DELAY = 300; // 300ms entre peticiones
  private readonly MAX_RETRIES = 3;
  
  private activeRequests = 0;

  /**
   * Añade una petición a la cola con deduplicación
   */
  async enqueue(url: string, options: RequestInit = {}): Promise<Response> {
    const requestKey = this.getRequestKey(url, options);
    
    // Verificar si ya hay una petición pendiente para la misma URL
    const pendingRequest = this.pendingRequests.get(requestKey);
    if (pendingRequest) {
      console.log(`🔄 Deduplicating request for: ${url}`);
      return pendingRequest;
    }

    // Crear nueva petición
    const requestPromise = new Promise<Response>((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: requestKey,
        url,
        options,
        resolve: (response: Response) => {
          this.pendingRequests.delete(requestKey);
          resolve(response);
        },
        reject: (error: Error) => {
          this.pendingRequests.delete(requestKey);
          reject(error);
        },
        retryCount: 0,
        timestamp: Date.now()
      };

      this.queue.push(queuedRequest);
      this.processQueue();
    });

    this.pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  /**
   * Procesa la cola de peticiones de manera secuencial
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && this.activeRequests < this.MAX_CONCURRENT) {
      const request = this.queue.shift();
      if (!request) continue;

      this.activeRequests++;
      
      // Procesar petición de manera asíncrona
      this.executeRequest(request).catch(() => {
        // El error ya se maneja en executeRequest
      });

      // Pequeña pausa entre peticiones para evitar saturar el servidor
      await this.delay(this.MIN_DELAY);
    }

    this.isProcessing = false;

    // Si quedan peticiones en cola, programar próximo procesamiento
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), this.MIN_DELAY);
    }
  }

  /**
   * Ejecuta una petición individual con manejo de errores y reintentos
   */
  private async executeRequest(request: QueuedRequest): Promise<void> {
    try {
      console.log(`🚀 Making request: ${request.options.method || 'GET'} ${request.url}`);
      
      const response = await fetch(request.url, request.options);
      
      // Si es 429, reintentamos con backoff exponencial
      if (response.status === 429 && request.retryCount < this.MAX_RETRIES) {
        const delay = Math.pow(2, request.retryCount) * 1000; // 1s, 2s, 4s
        console.warn(`⏱️ Rate limited! Retrying in ${delay}ms... (attempt ${request.retryCount + 1}/${this.MAX_RETRIES})`);
        
        request.retryCount++;
        
        setTimeout(() => {
          this.queue.unshift(request); // Volver a añadir al principio
          this.processQueue();
        }, delay);
        
        return;
      }
      
      // Resolver la promesa con la respuesta (exitosa o con error)
      request.resolve(response);
      
    } catch (error) {
      // Reintentar errores de red
      if (request.retryCount < this.MAX_RETRIES) {
        const delay = Math.pow(2, request.retryCount) * 1000;
        console.warn(`💥 Request failed! Retrying in ${delay}ms... (attempt ${request.retryCount + 1}/${this.MAX_RETRIES})`);
        
        request.retryCount++;
        
        setTimeout(() => {
          this.queue.unshift(request);
          this.processQueue();
        }, delay);
        
        return;
      }
      
      // Si se agotaron los reintentos, rechazar la promesa
      request.reject(error as Error);
    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Genera una clave única para cada petición para deduplicación
   */
  private getRequestKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Utility para crear delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtiene estadísticas de la cola
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      pendingRequests: this.pendingRequests.size,
      isProcessing: this.isProcessing
    };
  }
}

// Instancia singleton
export const requestQueue = new SimpleRequestQueue();
