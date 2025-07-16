/**
 * Sistema de cola de peticiones para evitar HTTP 429 (Too Many Requests)
 * Implementa throttling, retry y deduplicación de peticiones
 */

interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  retryCount: number;
  timestamp: number;
}

interface RequestCacheEntry {
  data: unknown;
  timestamp: number;
  expiresAt: number;
}

export class RequestQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private pendingRequests = new Map<string, Promise<unknown>>();
  private cache = new Map<string, RequestCacheEntry>();
  
  // Configuración
  private readonly MAX_CONCURRENT = 3; // Máximo 3 peticiones concurrentes
  private readonly MIN_DELAY = 100; // Mínimo 100ms entre peticiones
  private readonly MAX_RETRIES = 3;
  private readonly RATE_LIMIT_WINDOW = 1000; // 1 segundo
  private readonly MAX_REQUESTS_PER_WINDOW = 5; // Máximo 5 peticiones por segundo
  
  private requestTimes: number[] = [];
  private activeRequests = 0;

  /**
   * Añade una petición a la cola con deduplicación y caché
   */
  async enqueue<T>(
    url: string, 
    options: RequestInit = {}, 
    cacheSeconds: number = 30
  ): Promise<T> {
    const requestKey = this.getRequestKey(url, options);
    
    // 1. Verificar caché primero
    const cached = this.getFromCache<T>(requestKey);
    if (cached) {
      console.log(`🎯 Cache hit for: ${url}`);
      return cached;
    }

    // 2. Verificar si ya hay una petición pendiente para la misma URL
    const pendingRequest = this.pendingRequests.get(requestKey);
    if (pendingRequest) {
      console.log(`🔄 Deduplicating request for: ${url}`);
      return pendingRequest as Promise<T>;
    }

    // 3. Crear nueva petición
    const requestPromise = new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: requestKey,
        url,
        options,
        resolve: (data: unknown) => {
          this.pendingRequests.delete(requestKey);
          this.setCache(requestKey, data, cacheSeconds);
          resolve(data as T);
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
   * Procesa la cola de peticiones respetando rate limits
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && this.activeRequests < this.MAX_CONCURRENT) {
      // Verificar rate limiting
      if (!this.canMakeRequest()) {
        console.log('⏳ Rate limit reached, waiting...');
        await this.delay(this.MIN_DELAY);
        continue;
      }

      const request = this.queue.shift();
      if (!request) continue;

      this.activeRequests++;
      this.recordRequestTime();

      try {
        const result = await this.executeRequest(request);
        request.resolve(result);
      } catch (error) {
        await this.handleRequestError(request, error as Error);
      } finally {
        this.activeRequests--;
      }

      // Pequeña pausa entre peticiones
      await this.delay(this.MIN_DELAY);
    }

    this.isProcessing = false;

    // Si quedan peticiones en cola, programar próximo procesamiento
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), this.MIN_DELAY);
    }
  }

  /**
   * Ejecuta una petición HTTP individual
   */
  private async executeRequest<T>(request: QueuedRequest): Promise<T> {
    console.log(`🌐 Making request: ${request.url}`);
    
    const response = await fetch(request.url, request.options);
    
    if (!response.ok) {
      if (response.status === 429) {
        // Rate limit específico - esperar más tiempo
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000;
        throw new Error(`HTTP 429: Rate limited. Retry after ${delay}ms`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Return the full response object so that apiClient can handle the success field
    return data;
  }

  /**
   * Maneja errores de petición con retry automático
   */
  private async handleRequestError(
    request: QueuedRequest, 
    error: Error
  ): Promise<void> {
    console.error(`❌ Request failed: ${request.url}`, error.message);

    // Verificar si es un error que puede beneficiarse de retry
    const isRetryable = error.message.includes('429') || 
                       error.message.includes('timeout') ||
                       error.message.includes('network');

    if (isRetryable && request.retryCount < this.MAX_RETRIES) {
      request.retryCount++;
      
      // Backoff exponencial
      const delay = Math.min(1000 * Math.pow(2, request.retryCount), 10000);
      console.log(`🔄 Retrying request ${request.retryCount}/${this.MAX_RETRIES} after ${delay}ms`);
      
      await this.delay(delay);
      this.queue.unshift(request); // Reinsertar al principio de la cola
      
      return;
    }

    // No se puede reintentar más, rechazar la promesa
    request.reject(error);
  }

  /**
   * Verifica si se puede hacer una petición respetando rate limits
   */
  private canMakeRequest(): boolean {
    const now = Date.now();
    
    // Limpiar registros antiguos
    this.requestTimes = this.requestTimes.filter(
      time => now - time < this.RATE_LIMIT_WINDOW
    );

    return this.requestTimes.length < this.MAX_REQUESTS_PER_WINDOW;
  }

  /**
   * Registra el timestamp de una petición para rate limiting
   */
  private recordRequestTime(): void {
    this.requestTimes.push(Date.now());
  }

  /**
   * Genera una clave única para la petición (para caché y deduplicación)
   */
  private getRequestKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Obtiene datos del caché si están disponibles y no han expirado
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Guarda datos en el caché
   */
  private setCache<T>(key: string, data: T, seconds: number): void {
    const entry: RequestCacheEntry = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (seconds * 1000)
    };
    
    this.cache.set(key, entry);
    
    // Limpiar caché cada cierto tiempo para evitar memory leaks
    if (this.cache.size > 100) {
      this.cleanupCache();
    }
  }

  /**
   * Limpia entradas expiradas del caché
   */
  private cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    console.log(`🧹 Cleaned ${expiredKeys.length} expired cache entries`);
  }

  /**
   * Pausa la ejecución por el tiempo especificado
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Limpia todo el caché manualmente
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Cache cleared manually');
  }

  /**
   * Invalida caché específico para league-time y matches
   */
  invalidateLeagueTimeCache(): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache.entries()) {
      if (key.includes('league-time') || key.includes('/matches')) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🔄 Invalidated ${keysToDelete.length} league-time related cache entries`);
  }

  /**
   * Obtiene estadísticas de la cola y caché
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      isProcessing: this.isProcessing
    };
  }
}

// Instancia singleton
export const requestQueue = new RequestQueue();
