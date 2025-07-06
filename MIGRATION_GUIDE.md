# 🔄 Guía de Migración Frontend → Backend

## 📋 Resumen

Esta guía te ayuda a migrar tu aplicación de Quidditch de un sistema completamente frontend a una arquitectura frontend-backend.

## 🎯 Objetivos de la Migración

1. **Separar lógica de negocio** del frontend al backend
2. **Persistir datos** en base de datos real
3. **Implementar autenticación** segura
4. **Habilitar funcionalidades multi-usuario**
5. **Preparar para escalabilidad**

## 🎉 Estado Actual de la Migración (Actualización)

### ✅ Completado en esta sesión:

#### 🔧 Backend (Express/TypeScript)
- **Endpoints de temporadas implementados**:
  - `GET /api/seasons` - Lista todas las temporadas
  - `GET /api/seasons/:id` - Obtiene temporada específica con equipos y partidos
  - `GET /api/seasons/current` - Obtiene la temporada actual activa
  - `GET /api/seasons/:id/standings` - Obtiene clasificación de una temporada
- **Datos mock implementados**: Temporadas, equipos y standings de ejemplo
- **Manejo de errores**: Try-catch en todos los endpoints con respuestas consistentes
- **Tipos compatibles**: Datos que funcionan tanto con backend como frontend

#### 🔧 Frontend (React/TypeScript)  
- **Servicio de temporadas creado** (`seasonsService.ts`):
  - Integración completa con backend usando `apiClient`
  - Fallback automático a datos locales si backend no disponible
  - Feature flags para habilitar/deshabilitar backend gradualmente
  - Tipos TypeScript consistentes con el sistema existente

- **Contexto de autenticación migrado** (`AuthContext.tsx`):
  - **Login migrado**: Usa backend cuando está habilitado, fallback local
  - **Register migrado**: Registro en backend con fallback automático
  - **Token management**: Manejo de JWT tokens con apiClient
  - **Verificación automática**: Verifica token al cargar la app
  - **Logout mejorado**: Limpia tokens y datos de autenticación
  - **Compatibilidad total**: Mantiene toda la funcionalidad existente

- **Configuración mejorada**:
  - **Alias `@` configurado**: Imports absolutos desde `src` (ej. `@/context/AuthContext`)
  - **Proxy Vite**: `/api` → `localhost:3001` para desarrollo
  - **Variables de entorno**: `.env` para configuración de backend

#### 🚀 Feature Flags
- **`USE_BACKEND_SEASONS`**: Control granular de migración de temporadas
- **Migración incremental**: Cada servicio se puede migrar independientemente
- **Fallback robusto**: Si backend falla, usa datos locales sin interrupciones

### 📊 Progreso de Migración

| Componente | Estado | Backend | Frontend | Fallback |
|------------|--------|---------|----------|----------|
| **Teams** | ✅ Completado | ✅ | ✅ | ✅ |
| **Matches** | ✅ Completado | ✅ | ✅ | ✅ |
| **Seasons** | ✅ Completado | ✅ | ✅ | ✅ |
| **Auth** | ✅ Completado | ✅ | ✅ | ✅ |
| **Bets** | ⏳ Pendiente | ❌ | ❌ | ❌ |
| **Predictions** | ⏳ Pendiente | ❌ | ❌ | ❌ |
| **WebSocket** | ⏳ Pendiente | ❌ | ❌ | ❌ |

### 🧪 Testing

Para probar la migración:

1. **Backend funcionando**: Los endpoints responden correctamente
2. **Frontend with backend**: `VITE_USE_BACKEND=true` - Usa backend completo
3. **Frontend fallback**: Backend desconectado - Usa datos locales automáticamente
4. **Migración gradual**: Se puede habilitar/deshabilitar cada servicio

### 🔄 Próximos Pasos

1. **Implementar endpoints de apuestas** (`/api/bets`)
2. **Migrar servicios de predicciones** (`/api/predictions`)  
3. **Implementar base de datos SQLite** para persistencia real
4. **Añadir autenticación JWT real** con bcrypt
5. **Implementar WebSocket** para tiempo real
6. **Testing completo** de integración frontend-backend

---

## 📊 Estado Actua### 🔄 Frontend Migration
- ✅ Cliente HTTP configurado
- ✅ Teams service migrado
- ✅ Matches service migrado
- ✅ Seasons service migrado  
- ✅ Auth context migrado (con fallback)
- ✅ Error handling mejorado
- ✅ Loading states añadidosjetivo

| Componente | Actual (Frontend) | Objetivo (Backend) |
|------------|-------------------|-------------------|
| **Datos** | localStorage | SQLite Database |
| **Autenticación** | Mock local | JWT + bcrypt |
| **Tiempo Virtual** | Cliente | Servidor + WebSocket |
| **Simulaciones** | Cliente | Servidor |
| **API** | Servicios mock | REST API |
| **Estado** | React Context | Base de datos |

## 🚀 Plan de Migración (Fases)

### 📅 Fase 1: Backend Básico ✅

**Ya completado:**
- ✅ Servidor Express funcionando
- ✅ Endpoints básicos de equipos
- ✅ Configuración CORS
- ✅ Health check

### 📅 Fase 2: API de Datos ✅

**Migrar servicios:**
1. ✅ `teamsService.ts` → `GET /api/teams` (Completado)
2. ✅ `matchesService.ts` → `GET/POST /api/matches` (Completado)
3. ✅ `seasonsService.ts` → `GET/POST /api/seasons` (Completado)

**Endpoints implementados:**
- ✅ `GET /api/seasons` - Todas las temporadas
- ✅ `GET /api/seasons/:id` - Temporada específica  
- ✅ `GET /api/seasons/current` - Temporada actual
- ✅ `GET /api/seasons/:id/standings` - Clasificación de temporada

### 📅 Fase 3: Autenticación ✅

**Implementar:**
1. ✅ `POST /api/auth/login` (Completado)
2. ✅ `POST /api/auth/register` (Completado)
3. ✅ Middleware de autenticación (Mock implementado)
4. ✅ Migrar `AuthContext.tsx` (Completado con fallback)

### 📅 Fase 4: Sistema de Apuestas

**Migrar:**
1. `betsService.ts` → API endpoints
2. `predictionsService.ts` → API endpoints
3. Sistema de resolución de apuestas

### 📅 Fase 5: Tiempo Real

**Implementar:**
1. WebSocket para partidos en vivo
2. `virtualTimeManager.ts` → Servidor
3. `liveMatchSimulator.ts` → Servidor

## 🛠️ Migración Paso a Paso

### 🔧 Paso 1: Configurar Cliente HTTP

Crear `src/utils/apiClient.ts`:

```typescript
const API_BASE = process.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE);
```

### 🔧 Paso 2: Migrar Teams Service

Actualizar `src/services/teamsService.ts`:

```typescript
import { apiClient } from '../utils/apiClient';
import { Team } from '../types/league';

// Mantener interfaz actual para compatibilidad
export const teamsService = {
  async getAllTeams(): Promise<Team[]> {
    try {
      const response = await apiClient.get<Team[]>('/teams');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching teams:', error);
      // Fallback a datos locales si el backend no está disponible
      return this.getLocalTeams();
    }
  },

  async getTeamById(id: string): Promise<Team | null> {
    try {
      const response = await apiClient.get<Team>(`/teams/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching team:', error);
      return this.getLocalTeamById(id);
    }
  },

  // Mantener métodos locales como fallback
  getLocalTeams(): Team[] {
    // Tu implementación actual...
  },

  getLocalTeamById(id: string): Team | null {
    // Tu implementación actual...
  }
};
```

### 🔧 Paso 2.5: Migrar Matches Service

Actualizar `src/services/matchesService.ts`:

```typescript
import { apiClient } from '../utils/apiClient';
import { Match, EventType } from '../types/league';
import { FEATURES } from '../config/features';

// Tipo para las respuestas del backend
interface BackendMatch {
  id: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  status: 'scheduled' | 'live' | 'finished' | 'postponed';
  homeScore?: number;
  awayScore?: number;
  snitchCaught?: boolean;
  snitchCaughtBy?: string;
  duration?: number;
  events: Array<{
    id: string;
    matchId: string;
    minute: number;
    type: string;
    team: string;
    player?: string;
    description: string;
    points: number;
  }>;
}

export const matchesService = {
  async getMatches(): Promise<Match[]> {
    if (FEATURES.USE_BACKEND_MATCHES) {
      try {
        const response = await apiClient.get<BackendMatch[]>('/matches');
        if (response.success && response.data) {
          return response.data.map(adaptBackendMatch);
        }
        throw new Error('Backend response was not successful');
      } catch (error) {
        console.error('❌ Error fetching matches from backend:', error);
        if (FEATURES.SHOW_FALLBACK_MESSAGES) {
          console.warn('🔄 Falling back to local mock data for matches');
        }
        return generateMockMatches();
      }
    } else {
      return generateMockMatches();
    }
  },

  async getMatchDetails(matchId: string): Promise<Match | null> {
    if (FEATURES.USE_BACKEND_MATCHES) {
      try {
        const response = await apiClient.get<BackendMatch>(`/matches/${matchId}`);
        if (response.success && response.data) {
          return adaptBackendMatch(response.data);
        }
        throw new Error('Backend response was not successful');
      } catch (error) {
        console.error(`❌ Error fetching match details for ${matchId}:`, error);
        const localMatches = generateMockMatches();
        return localMatches.find(m => m.id === matchId) || null;
      }
    } else {
      const localMatches = generateMockMatches();
      return localMatches.find(m => m.id === matchId) || null;
    }
  },

  async getLiveMatches(): Promise<Match[]> {
    if (FEATURES.USE_BACKEND_MATCHES) {
      try {
        const response = await apiClient.get<BackendMatch[]>('/matches/status/live');
        if (response.success && response.data) {
          return response.data.map(adaptBackendMatch);
        }
        throw new Error('Backend response was not successful');
      } catch (error) {
        console.error('❌ Error fetching live matches from backend:', error);
        const localMatches = generateMockMatches();
        return localMatches.filter(m => m.status === 'live');
      }
    } else {
      const localMatches = generateMockMatches();
      return localMatches.filter(m => m.status === 'live');
    }
  },

  async getUpcomingMatches(limit: number = 10): Promise<Match[]> {
    if (FEATURES.USE_BACKEND_MATCHES) {
      try {
        const response = await apiClient.get<BackendMatch[]>(`/matches/status/upcoming?limit=${limit}`);
        if (response.success && response.data) {
          return response.data.map(adaptBackendMatch);
        }
        throw new Error('Backend response was not successful');
      } catch (error) {
        console.error('❌ Error fetching upcoming matches from backend:', error);
        const localMatches = generateMockMatches();
        return localMatches.filter(m => m.status === 'scheduled').slice(0, limit);
      }
    } else {
      const localMatches = generateMockMatches();
      return localMatches.filter(m => m.status === 'scheduled').slice(0, limit);
    }
  }
};
```

**Endpoints del Backend implementados:**
- `GET /api/matches` - Obtener todos los partidos
- `GET /api/matches/:id` - Obtener un partido específico
- `GET /api/matches/status/live` - Obtener partidos en vivo
- `GET /api/matches/status/upcoming?limit=N` - Obtener próximos partidos

### 🔧 Paso 3: Actualizar Componentes

Actualizar componentes para manejar estado async:

```typescript
// Antes
const teams = teamsService.getAllTeams();

// Después
const [teams, setTeams] = useState<Team[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchTeams = async () => {
    try {
      setLoading(true);
      const fetchedTeams = await teamsService.getAllTeams();
      setTeams(fetchedTeams);
      setError(null);
    } catch (err) {
      setError('Error loading teams');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchTeams();
}, []);
```

### 🔧 Paso 4: Variables de Entorno

Actualizar `.env` del frontend:

```env
# Frontend .env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3002
```

### 🔧 Paso 5: Migrar Autenticación

Actualizar `AuthContext.tsx`:

```typescript
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post<{
        user: User;
        tokens: { accessToken: string };
      }>('/auth/login', { email, password });

      if (response.success && response.data) {
        const { user, tokens } = response.data;
        apiClient.setToken(tokens.accessToken);
        setUser(user);
      }
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await apiClient.post<{
        user: User;
        tokens: { accessToken: string };
      }>('/auth/register', userData);

      if (response.success && response.data) {
        const { user, tokens } = response.data;
        apiClient.setToken(tokens.accessToken);
        setUser(user);
      }
    } catch (error) {
      throw new Error('Registration failed');
    }
  };

  const logout = () => {
    apiClient.clearToken();
    setUser(null);
  };

  // Verificar token al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.get<User>('/auth/me');
        if (response.success && response.data) {
          setUser(response.data);
        }
      } catch (error) {
        // Token inválido o expirado
        apiClient.clearToken();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 🔄 Estrategia de Migración Incremental

### 🎯 Enfoque Gradual

1. **Mantener compatibilidad**: Los servicios actuales siguen funcionando
2. **Fallback a local**: Si el backend falla, usar datos locales
3. **Feature flags**: Habilitar/deshabilitar funcionalidades backend
4. **Testing paralelo**: Probar ambas implementaciones

### 🔧 Feature Flags

```typescript
// config/features.ts
export const FEATURES = {
  USE_BACKEND_TEAMS: process.env.VITE_USE_BACKEND === 'true',
  USE_BACKEND_AUTH: process.env.VITE_USE_BACKEND === 'true',
  USE_BACKEND_MATCHES: false, // Gradual
  USE_WEBSOCKETS: false, // Última fase
};
```

## 📋 Checklist de Migración

### ✅ Backend Setup
- [x] Servidor Express funcionando
- [x] Endpoints básicos de equipos
- [x] Endpoints completos de partidos
- [x] Endpoints completos de temporadas
- [x] Endpoints de autenticación mock
- [x] CORS configurado
- [x] Health check
- [ ] Base de datos configurada
- [ ] Autenticación JWT real
- [ ] WebSocket setup

### 🔄 Frontend Migration
- [x] Cliente HTTP configurado
- [x] Teams service migrado
- [x] Matches service migrado
- [x] Seasons service migrado
- [x] Auth context migrado (con fallback)
- [x] Error handling mejorado
- [x] Loading states añadidos
- [ ] Error handling mejorado
- [ ] Loading states añadidos

### 🧪 Testing
- [ ] Endpoints backend testados
- [ ] Frontend con backend testado
- [ ] Fallbacks funcionando
- [ ] Performance comparado

## 🚨 Consideraciones Importantes

### 🔧 Manejo de Errores

```typescript
// Error boundary para APIs
const withErrorHandling = (apiCall: () => Promise<any>) => {
  return async () => {
    try {
      return await apiCall();
    } catch (error) {
      if (error.name === 'NetworkError') {
        // Usar datos locales como fallback
        console.warn('Backend unavailable, using local data');
        return getLocalData();
      }
      throw error;
    }
  };
};
```

### ⚡ Performance

- **Caché local**: Mantener datos en localStorage como caché
- **Optimistic updates**: Actualizar UI antes de confirmar servidor
- **Debouncing**: Para búsquedas y filtros
- **Pagination**: Para listas grandes

### 🔒 Seguridad

- **Validación dual**: Cliente y servidor
- **Rate limiting**: En el backend
- **HTTPS**: En producción
- **Token refresh**: Para sesiones largas

## 📞 Próximos Pasos

1. **Implementar endpoints completos** en el backend
2. **Migrar primer servicio** (teams) completamente
3. **Probar integración** frontend-backend
4. **Implementar autenticación** JWT
5. **Migrar servicios restantes** uno por uno
6. **Implementar WebSocket** para tiempo real

¿Por dónde te gustaría continuar la migración?
