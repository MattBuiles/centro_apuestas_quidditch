# 🏆 Quidditch Betting Backend API

## 📋 Descripción

Backend API RESTful para el sistema de apuestas de Quidditch desarrollado en Node.js con TypeScript, Express y SQLite.

## 🚀 Inicio Rápido

### 📋 Requisitos Previos

- **Node.js** v18.0 o superior
- **npm** o **yarn**

### 🔧 Instalación

1. **Instalar dependencias**:
   ```bash
   cd backend
   npm install
   ```

2. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   ```
   
   Editar `.env` con tus configuraciones:
   ```env
   NODE_ENV=development
   PORT=3001
   DATABASE_URL=./database/quidditch.db
   JWT_SECRET=your-super-secret-jwt-key
   FRONTEND_URL=http://localhost:5173
   ```

3. **Iniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```

4. **Verificar funcionamiento**:
   - Health Check: http://localhost:3001/health
   - Teams API: http://localhost:3001/api/teams

## 🏗️ Arquitectura

### 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── controllers/       # Controladores de rutas
│   ├── middleware/        # Middleware personalizado
│   ├── routes/           # Definición de rutas
│   ├── services/         # Lógica de negocio
│   ├── database/         # Configuración y migraciones
│   ├── types/            # Definiciones de TypeScript
│   ├── utils/            # Utilidades
│   ├── index.ts          # Servidor principal (completo)
│   └── index-simple.ts   # Servidor simple (desarrollo)
├── dist/                 # Código compilado
├── database/             # Archivos de base de datos
├── package.json
├── tsconfig.json
└── .env
```

### 🔌 Endpoints API

#### 🔍 Health Check
- `GET /health` - Estado del servidor

#### 👥 Equipos
- `GET /api/teams` - Lista de equipos
- `GET /api/teams/:id` - Detalles de equipo

#### 🏆 Partidos
- `GET /api/matches` - Lista de partidos
- `POST /api/matches` - Crear partido (admin)
- `PUT /api/matches/:id` - Actualizar partido (admin)

#### 💰 Apuestas
- `GET /api/bets` - Lista de apuestas del usuario
- `POST /api/bets` - Crear nueva apuesta
- `GET /api/bets/:id` - Detalles de apuesta

#### 🔮 Predicciones
- `GET /api/predictions` - Lista de predicciones del usuario
- `POST /api/predictions` - Crear predicción
- `PUT /api/predictions/:id` - Actualizar predicción

#### 🔐 Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrarse
- `GET /api/auth/me` - Perfil del usuario

#### 👑 Admin
- `GET /api/admin/stats` - Estadísticas generales
- `GET /api/admin/users` - Gestión de usuarios
- `GET /api/admin/bets` - Historial de apuestas

## 🛠️ Scripts Disponibles

```bash
# Desarrollo (servidor simple)
npm run dev

# Desarrollo (servidor completo)
npm run dev-full

# Compilar TypeScript
npm run build

# Producción (servidor simple)
npm start

# Producción (servidor completo)
npm run start-full

# Tests
npm test

# Migraciones de base de datos
npm run migrate

# Datos de prueba
npm run seed
```

## 📊 Base de Datos

### 🗄️ SQLite Schema

- **users** - Usuarios y autenticación
- **teams** - Equipos de Quidditch
- **seasons** - Temporadas de la liga
- **matches** - Partidos
- **match_events** - Eventos de partidos
- **bets** - Apuestas de usuarios
- **predictions** - Predicciones de usuarios
- **standings** - Tabla de posiciones

### 🔄 Migraciones

Las tablas se crean automáticamente al iniciar el servidor por primera vez.

## 🌐 Integración con Frontend

### 📡 CORS

El backend está configurado para aceptar requests desde:
- `http://localhost:5173` (Vite dev server)
- Configurable en `.env` con `FRONTEND_URL`

### 🔌 WebSocket (En desarrollo)

Para actualizaciones en tiempo real:
- Puerto: 3002 (configurable)
- Eventos: partidos en vivo, apuestas, predicciones

## 🚀 Migración desde Frontend

### 📋 Estado Actual

Tu frontend actual maneja todo el estado localmente. Para migrar al backend:

1. **Reemplazar servicios locales** por llamadas HTTP
2. **Implementar autenticación** JWT
3. **Migrar datos** desde localStorage a base de datos
4. **Configurar WebSocket** para tiempo real

### 🔄 Pasos de Migración

#### 1. Actualizar servicios frontend

```typescript
// Antes (frontend)
import { teamsService } from '../services/teamsService';

// Después (con backend)
const response = await fetch('http://localhost:3001/api/teams');
const teams = await response.json();
```

#### 2. Implementar cliente HTTP

```typescript
// utils/api.ts
const API_BASE = 'http://localhost:3001/api';

export const apiClient = {
  get: (endpoint: string) => fetch(`${API_BASE}${endpoint}`).then(r => r.json()),
  post: (endpoint: string, data: any) => 
    fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json())
};
```

#### 3. Migrar servicios específicos

**Teams Service:**
```typescript
export const teamsAPI = {
  getAll: () => apiClient.get('/teams'),
  getById: (id: string) => apiClient.get(`/teams/${id}`)
};
```

**Matches Service:**
```typescript
export const matchesAPI = {
  getAll: () => apiClient.get('/matches'),
  getById: (id: string) => apiClient.get(`/matches/${id}`),
  getLive: () => apiClient.get('/matches?status=live')
};
```

## 🛡️ Seguridad

- **Helmet** - Headers de seguridad
- **CORS** - Control de origen cruzado
- **Rate Limiting** - Límite de requests
- **JWT** - Autenticación stateless
- **bcrypt** - Hash de contraseñas

## 📈 Próximos Pasos

1. ✅ **Servidor básico funcionando**
2. 🔄 **Implementar endpoints completos**
3. 🔄 **Sistema de autenticación JWT**
4. 🔄 **Base de datos y migraciones**
5. 🔄 **WebSocket para tiempo real**
6. 🔄 **Tests unitarios e integración**
7. 🔄 **Documentación API (Swagger)**
8. 🔄 **Docker y deployment**

## 🤝 Desarrollo

### 🔧 Configuración de Desarrollo

```bash
# Clonar y configurar
git clone <repo>
cd centro_apuestas_quidditch/backend
npm install
cp .env.example .env

# Iniciar desarrollo
npm run dev

# En otra terminal, probar endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/teams
```

### 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con cobertura
npm run test:coverage
```

## 📞 Soporte

Si tienes problemas:

1. Verificar que Node.js v18+ esté instalado
2. Verificar que el puerto 3001 esté libre
3. Revisar logs en la consola
4. Verificar archivo `.env`

## 📄 Licencia

Este proyecto es parte del sistema de apuestas de Quidditch desarrollado por Mateo Builes Duque y Samuel Castaño Mira.
