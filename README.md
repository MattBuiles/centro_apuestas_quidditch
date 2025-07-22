# 🏆 Atrapa la Snitch - Sistema de Apuestas de Quidditch

## 📋 Descripción del Proyecto

**Atrapa la Snitch** es una aplicación web completa desarrollada con React 19 + TypeScript en el frontend y Node.js + Express en el backend, que simula un sistema de apuestas para partidos de Quidditch. La aplicación combina la magia del mundo de Harry Potter con tecnología moderna para crear una experiencia inmersiva de apuestas deportivas ficticias.

### 🎯 Objetivos y Funcionalidades Principales

- **Arquitectura Full-Stack**: Frontend React con backend API REST y WebSockets
- **Sistema de Liga Profesional**: Generación automática de calendarios usando el método de círculo (round-robin)
- **Simulación de Partidos en Tiempo Real**: Motor de simulación minuto a minuto con eventos dinámicos
- **Sistema de Apuestas Completo**: Múltiples tipos de apuestas con cuotas y cálculos en tiempo real
- **Gestión de Usuarios**: Sistema de autenticación JWT con roles (usuarios y administradores)
- **Panel Administrativo**: Gestión de usuarios, historial de apuestas y estadísticas
- **Base de Datos SQLite**: Persistencia de datos con migraciones y seeds
- **WebSockets**: Comunicación en tiempo real para actualizaciones de partidos
- **Interfaz Mágica**: Diseño temático inspirado en el mundo de Harry Potter

### 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   React + TS    │◄──►│  Node.js + TS   │◄──►│    SQLite       │
│   Port: 5173    │    │   Port: 3001    │    │   quidditch.db  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │
        └───────────────────────┘
              WebSocket
             Port: 3002
```

## 👥 Equipo de Desarrollo

- **Mateo Builes Duque** (GitHub: @MattBuiles)
- **Samuel Castaño Mira** (GitHub: @SamuCasta)

## 🚀 Instrucciones de Instalación y Ejecución

### 📋 Requisitos Previos

- **Node.js** (versión 18.0 o superior)
- **npm** como gestor de paquetes
- **SQLite3** (incluido en dependencias)
- Navegador web moderno (Chrome, Firefox, Safari, Edge)

### 🔧 Instalación de Dependencias

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/MattBuiles/centro_apuestas_quidditch.git
   cd centro_apuestas_quidditch
   ```

2. **Instalar dependencias del frontend**:
   ```bash
   npm install
   ```

3. **Configurar y ejecutar el backend**:
   ```bash
   cd backend
   npm install
   
   # Copiar variables de entorno
   copy .env.example .env  # Windows
   # cp .env.example .env  # Linux/Mac
   
   # Configurar base de datos
   npm run migrate
   npm run seed
   ```

### 🏃‍♂️ Comandos de Ejecución

#### Desarrollo Local (Full-Stack)

**Opción Recomendada: Frontend + Backend**
```bash
# Terminal 1 - Backend API + WebSocket
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

**URLs de Acceso:**
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`
- **WebSocket**: `ws://localhost:3002`
- **Health Check**: `http://localhost:3001/health`
- **API Teams**: `http://localhost:3001/api/teams`

#### Solo Frontend (Modo Legacy)
```bash
npm run dev
```
- Usa datos simulados y localStorage
- No requiere backend activo

#### Producción
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
npm run build
npm run preview
```

#### Scripts Adicionales
```bash
# Linting
npm run lint

# Base de datos
cd backend
npm run migrate  # Ejecutar migraciones
npm run seed     # Poblar datos iniciales
npm run test     # Ejecutar tests
```

### 🌐 Acceso a la Aplicación

**Desarrollo**: `http://localhost:5173`
**Preview Producción**: URL mostrada después de `npm run preview`

### 🔐 Primeros Pasos

1. **Acceder a la aplicación** en `http://localhost:5173`
2. **Usar cuentas predefinidas** (ver sección de Cuentas de Prueba)
3. **Explorar las funcionalidades**:
   - Usuarios regulares: Apostar en partidos
   - Administradores: Gestionar el sistema

## 🏗️ Estructura del Proyecto

### 📁 Directorios Principales

```
centro_apuestas_quidditch/
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes reutilizables
│   │   │   ├── admin/          # Panel administrativo
│   │   │   ├── auth/           # Autenticación
│   │   │   ├── betting/        # Sistema de apuestas
│   │   │   ├── BalanceSync/    # Sincronización de balance
│   │   │   ├── common/         # Componentes compartidos
│   │   │   ├── layout/         # Layout y navegación
│   │   │   ├── matches/        # Gestión de partidos
│   │   │   ├── seasons/        # Temporadas
│   │   │   └── teams/          # Equipos
│   │   ├── pages/              # Páginas de la aplicación
│   │   │   ├── HomePage/       # Página principal
│   │   │   ├── BettingPage/    # Página de apuestas
│   │   │   ├── MatchesPage/    # Lista de partidos
│   │   │   ├── AdminTimeControlPage/ # Control de tiempo admin
│   │   │   └── ...             # Otras páginas
│   │   ├── services/           # Lógica de negocio y APIs
│   │   │   ├── quidditchSystem.ts    # Sistema central
│   │   │   ├── leagueTimeService.ts  # Gestión de tiempo
│   │   │   ├── matchesService.ts     # Servicio de partidos
│   │   │   ├── betsService.ts        # Servicio de apuestas
│   │   │   ├── liveMatchSimulator.ts # Simulador en vivo
│   │   │   └── ...                   # Otros servicios
│   │   ├── context/            # Contextos de React
│   │   ├── hooks/              # Custom hooks
│   │   ├── types/              # Definiciones TypeScript
│   │   ├── styles/             # Estilos globales
│   │   ├── assets/             # Imágenes y recursos
│   │   └── utils/              # Utilidades
│   ├── public/                 # Archivos públicos
│   └── dist/                   # Build de producción
├── backend/
│   ├── src/
│   │   ├── controllers/        # Controladores de rutas
│   │   ├── routes/             # Definición de endpoints
│   │   ├── services/           # Lógica de negocio del servidor
│   │   ├── database/           # Configuración y esquemas DB
│   │   ├── middleware/         # Middleware personalizado
│   │   ├── types/              # Tipos compartidos
│   │   └── index.ts            # Punto de entrada
│   ├── database/               # Archivos SQLite
│   │   └── quidditch.db        # Base de datos principal
│   ├── dist/                   # Código compilado
│   ├── .env                    # Variables de entorno
│   └── nodemon.json            # Configuración de desarrollo
└── README.md                   # Este archivo
```

### 🔧 Archivos de Configuración Importantes

**Frontend:**
- `vite.config.ts`: Configuración de Vite con proxy al backend
- `tsconfig.json`: Configuración de TypeScript
- `package.json`: Dependencias y scripts del frontend

**Backend:**
- `.env`: Variables de entorno (JWT, DB, puertos, CORS)
- `tsconfig.json`: Configuración TypeScript del backend
- `nodemon.json`: Configuración de desarrollo con recarga automática
- `package.json`: Dependencias y scripts del backend

## 🛠️ Tecnologías y Frameworks

### Frontend
- **React 19.1.0**: Biblioteca principal para la UI con las últimas características
- **TypeScript**: Tipado estático para mayor robustez del código
- **React Router DOM 7.6.1**: Navegación SPA avanzada
- **Vite**: Bundler y servidor de desarrollo ultrarrápido
- **CSS Modules**: Estilos modulares y encapsulados
- **Axios**: Cliente HTTP para comunicación con la API

### Backend
- **Node.js + TypeScript**: Runtime y tipado para el servidor
- **Express 4.18.2**: Framework web minimalista y flexible
- **SQLite3**: Base de datos embebida para persistencia
- **JWT (jsonwebtoken)**: Autenticación y autorización
- **WebSockets (ws)**: Comunicación en tiempo real
- **bcryptjs**: Hashing seguro de contraseñas
- **Express Validator**: Validación de entrada de datos
- **Helmet**: Seguridad HTTP headers
- **CORS**: Configuración de política de origen cruzado
- **Morgan**: Logger HTTP para desarrollo
- **Compression**: Compresión gzip de respuestas

### Herramientas de Desarrollo
- **ESLint**: Linter para mantener calidad de código
- **Nodemon**: Recarga automática del servidor en desarrollo
- **Jest**: Framework de testing (configurado)
- **TypeScript Compiler**: Compilación y verificación de tipos

### Librerías Adicionales
- **clsx**: Utilidad para manejar clases CSS condicionales
- **uuid**: Generación de identificadores únicos
- **dotenv**: Gestión de variables de entorno
- **express-rate-limit**: Limitación de tasa de peticiones

## 🎮 Funcionalidades del Sistema

### 🔐 Sistema de Autenticación
- **JWT Authentication**: Tokens seguros para sesiones
- **Hashing de Contraseñas**: Bcrypt para seguridad
- **Roles de Usuario**: Usuarios regulares y administradores
- **Gestión de Sesiones**: Persistencia segura del estado
- **Registro de Usuarios**: Sistema completo de alta de usuarios
- **Recuperación de Contraseña**: Funcionalidad de reset

### 🏆 Sistema de Liga de Quidditch
- **Generación de Calendarios**: Algoritmo de círculo para partidos equilibrados
- **Simulación de Partidos**: Motor que simula eventos minuto a minuto
- **Simulación en Tiempo Real**: WebSocket para actualizaciones live
- **Clasificaciones**: Cálculo automático de tablas de posiciones
- **Equipos**: 6 equipos balanceados (4 casas de Hogwarts + 2 equipos profesionales)
- **Estadísticas Avanzadas**: Análisis detallado de rendimiento de equipos

### 💰 Sistema de Apuestas
- **Tipos de Apuestas**:
  - Resultado del partido (Local/Visitante/Empate)
  - Resultado exacto
  - Captura de la Snitch
  - Duración del partido
- **Apuestas Combinadas**: Múltiples selecciones en un solo boleto
- **Cuotas Dinámicas**: Cálculo automático basado en probabilidades
- **Límites de Apuesta**: Control de riesgo y juego responsable
- **Historial Completo**: Seguimiento de todas las apuestas
- **Resolución Automática**: Pago automático de ganancias

### 👑 Panel de Administración
- **Gestión de Usuarios**: CRUD completo de cuentas de usuario
- **Gestión de Apuestas**: Visualización y administración de apuestas
- **Control de Tiempo**: Manipulación del tiempo de liga
- **Estadísticas del Sistema**: Métricas de uso y rendimiento
- **Alertas de Riesgo**: Identificación de patrones sospechosos
- **Configuración de Liga**: Parámetros de temporada y calendario

### 📊 Sistema de Reportes y Analytics
- **Dashboard Administrativo**: Métricas en tiempo real
- **Análisis de Usuarios**: Patrones de comportamiento
- **Estadísticas de Apuestas**: Volumen, tipos, éxito
- **Rendimiento de Equipos**: Análisis histórico y predictivo

## 🔄 Arquitectura e Integración

### 🗄️ Persistencia de Datos
- **Base de Datos SQLite**: Almacenamiento persistente y confiable
- **Migraciones**: Control de versiones del esquema de BD
- **Seeds**: Datos iniciales para desarrollo y testing
- **Respaldos Automáticos**: Sistema de backup de la base de datos

### ⏰ Gestión de Tiempo Virtual
- **League Time Service**: Sistema de tiempo acelerado para simulaciones
- **Sincronización Cliente-Servidor**: Tiempo consistente entre frontend y backend
- **Control Administrativo**: Los administradores pueden manipular el tiempo
- **Eventos Programados**: Partidos y resoluciones automáticas

### 🎲 Motor de Simulación
- **QuidditchSimulator**: Simula partidos con eventos realistas
- **Probabilidades Dinámicas**: Basadas en estadísticas de equipos
- **Eventos de Quidditch**: Goles, faltas, captura de Snitch, lesiones
- **Streaming en Tiempo Real**: WebSocket para actualizaciones live

### 🌐 Comunicación Frontend-Backend
- **API REST**: Endpoints estructurados para CRUD operations
- **WebSocket**: Comunicación bidireccional en tiempo real
- **Proxy Vite**: Configuración automática para desarrollo
- **Error Handling**: Manejo centralizado de errores
- **Request Queue**: Cola de peticiones para optimización

### 🔒 Seguridad
- **Autenticación JWT**: Tokens seguros con expiración
- **Middleware de Seguridad**: Helmet, CORS, Rate Limiting
- **Validación de Entrada**: Express Validator en todas las rutas
- **Hashing Seguro**: Bcrypt para contraseñas
- **Variables de Entorno**: Configuración sensible protegida

## 🧪 Testing y Validación

### 🔍 Herramientas de Testing
- **Jest**: Framework de testing configurado para el backend
- **Archivos de Validación**: Scripts personalizados para validar el sistema
- **Health Checks**: Endpoints de verificación de estado

### 🛠️ Debug y Desarrollo
- **Logging**: Sistema de logs con Morgan en desarrollo
- **Error Tracking**: Captura y manejo centralizado de errores
- **Hot Reload**: Recarga automática en desarrollo (nodemon + Vite)
- **Source Maps**: Mapeo de código para debugging

### 🌐 URLs de Testing
- **Health Check Backend**: `http://localhost:3001/health`
- **WebSocket Test**: `http://localhost:5173/websocket-test.html`
- **Match Simulation**: `http://localhost:5173/test-simulation.html`

## 🎨 Características de Diseño

### 🌟 Tema Mágico
- Paleta de colores inspirada en Harry Potter
- Animaciones CSS suaves y efectos visuales
- Iconografía temática (varitas, snitch, casas de Hogwarts)
- Tipografía que evoca el mundo mágico

### 📱 Diseño Responsivo
- Adaptable a dispositivos móviles, tablets y escritorio
- Grid CSS y Flexbox para layouts flexibles
- Variables CSS para consistencia visual

## 🔧 Comandos Útiles de Desarrollo

### Frontend
```bash
# Instalar dependencias
npm install

# Desarrollo con recarga automática
npm run dev

# Compilar para producción
npm run build

# Previsualizar compilación
npm run preview

# Verificar código con ESLint
npm run lint
```

### Backend
```bash
# Navegar al directorio backend
cd backend

# Instalar dependencias
npm install

# Desarrollo con recarga automática
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar en producción
npm start

# Ejecutar tests
npm run test

# Migraciones de base de datos
npm run migrate

# Poblar datos iniciales
npm run seed
```

### Utilidades del Sistema
```bash
# Limpiar node_modules completo
rm -rf node_modules backend/node_modules
npm install
cd backend && npm install

# Reset completo de base de datos
cd backend
rm database/quidditch.db
npm run migrate
npm run seed

# Verificar estado de servicios
curl http://localhost:3001/health
curl http://localhost:3001/api/teams
```

## 🚨 Configuración y Variables de Entorno

### 🔧 Backend (.env)
```properties
# Environment Configuration
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=./database/quidditch.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# WebSocket Configuration
WS_PORT=3002
```

### 📝 Cuentas de Administración

#### 🏰 **Administrador Principal**
- **Email:** `admin@quidditch.com`
- **Contraseña:** `admin123`
- **Rol:** Administrador
- **Permisos:** Acceso completo al sistema

### 🔐 Funcionalidades de Autenticación

- **Registro**: Sistema completo de registro de nuevos usuarios
- **Login**: Autenticación JWT con tokens seguros
- **Recuperación**: Sistema de recuperación de contraseña
- **Roles**: Diferenciación entre usuarios y administradores
- **Protección de Rutas**: Middleware de autenticación y autorización
- **Sesiones Persistentes**: Tokens con expiración configurable

### 💾 Persistencia y Base de Datos
- **SQLite Database**: Almacenamiento persistente en `backend/database/quidditch.db`
- **Migraciones**: Control de versiones del esquema
- **Seeds**: Datos iniciales para equipos, usuarios y configuración
- **Respaldos**: Los datos persisten entre reinicios del servidor

### 🎯 Características del Sistema

#### � Sistema de Tiempo de Liga
- **Control Administrativo**: Los admins pueden pausar/acelerar el tiempo
- **Sincronización**: Tiempo consistente entre todos los clientes
- **Eventos Programados**: Partidos y resoluciones automáticas

#### �️ Sistema de Partidos
- **Simulación en Tiempo Real**: Motor avanzado de simulación
- **WebSocket Updates**: Actualizaciones live durante los partidos
- **Eventos Dinámicos**: Goles, faltas, captura de Snitch
- **Estadísticas Detalladas**: Tracking completo de todas las acciones

#### 💰 Sistema de Apuestas Avanzado
- **Múltiples Tipos**: Resultado, exacto, eventos especiales
- **Cuotas Dinámicas**: Calculadas en tiempo real
- **Apuestas Combinadas**: Múltiples selecciones en un boleto
- **Límites de Riesgo**: Control de exposición por usuario
- **Resolución Automática**: Pago inmediato de ganancias

## 🤝 Contribución y Desarrollo

### 🏗️ Arquitectura del Código

Este proyecto sigue una **arquitectura Full-Stack moderna** diseñada para ser escalable y mantenible:

#### Frontend (React + TypeScript)
- **Componentes Modulares**: Cada componente tiene una responsabilidad específica
- **Servicios Separados**: Lógica de negocio aislada del UI
- **Context API**: Gestión de estado global centralizada
- **Custom Hooks**: Reutilización de lógica entre componentes
- **TypeScript Estricto**: Tipado fuerte para mejor mantenibilidad

#### Backend (Node.js + Express + TypeScript)
- **Arquitectura por Capas**: Controllers → Services → Database
- **Middleware Personalizado**: Autenticación, validación, logging
- **API REST**: Endpoints estructurados y documentados
- **WebSocket Integration**: Comunicación en tiempo real
- **Error Handling**: Manejo centralizado y logging de errores

### 🔄 Flujo de Desarrollo

1. **Setup del Entorno**: Instalar dependencias frontend y backend
2. **Base de Datos**: Ejecutar migraciones y seeds
3. **Desarrollo**: Ejecutar ambos servidores en paralelo
4. **Testing**: Usar health checks y scripts de validación
5. **Building**: Compilar para producción

### 📚 Documentación de APIs

#### Endpoints Principales
```
GET  /health              # Health check del servidor
GET  /api/teams           # Lista de equipos
POST /api/auth/login      # Autenticación de usuario
POST /api/auth/register   # Registro de usuario
GET  /api/matches         # Lista de partidos
POST /api/bets            # Crear nueva apuesta
GET  /api/users/profile   # Perfil del usuario actual
```

#### WebSocket Events
```
connection              # Conexión establecida
match:update           # Actualización de partido en vivo
bet:resolved           # Apuesta resuelta
league:time:update     # Actualización de tiempo de liga
```

### 🔧 Estándares de Código

- **ESLint**: Configuración estricta para mantener calidad
- **TypeScript**: Interfaces y tipos bien definidos
- **Naming Conventions**: camelCase para variables, PascalCase para componentes
- **File Structure**: Organización clara por funcionalidad
- **Comments**: JSDoc para funciones complejas

### 🚀 Roadmap Futuro

- [ ] Tests unitarios y de integración completos
- [ ] Deploy automatizado con CI/CD
- [ ] Base de datos en la nube (PostgreSQL)
- [ ] Notificaciones push en tiempo real
- [ ] Modo multijugador con ligas privadas
- [ ] Integración con APIs externas de estadísticas

## 📄 Información del Proyecto

### 🎓 Contexto Académico
Este proyecto fue desarrollado como parte del curso de **Desarrollo Web Full-Stack** con énfasis en:
- Arquitecturas modernas Frontend/Backend
- Sistemas de tiempo real con WebSockets
- Gestión de estado compleja
- Autenticación y autorización
- Persistencia de datos

### 🏆 Logros Técnicos
- ✅ **Full-Stack Completo**: Frontend React + Backend Node.js
- ✅ **Tiempo Real**: WebSockets para actualizaciones live
- ✅ **Base de Datos**: Persistencia con SQLite + migraciones
- ✅ **Autenticación**: JWT + bcrypt para seguridad
- ✅ **TypeScript**: Tipado fuerte en todo el stack
- ✅ **Testing**: Scripts de validación y health checks
- ✅ **DevOps**: Configuración de desarrollo optimizada

### 📊 Estadísticas del Proyecto
- **Líneas de Código**: ~15,000+ (frontend + backend)
- **Componentes React**: 30+ componentes modulares
- **Endpoints API**: 20+ rutas documentadas
- **Tipos TypeScript**: 50+ interfaces y types
- **Archivos de Servicios**: 20+ servicios especializados

### 🔗 Enlaces Importantes
- **Repositorio**: [https://github.com/MattBuiles/centro_apuestas_quidditch](https://github.com/MattBuiles/centro_apuestas_quidditch)
- **Branch Principal**: `main`
- **Branch de Desarrollo**: `backend-integration`

### 📞 Contacto del Equipo
- **Mateo Builes Duque**: The nightmare
- **Samuel Castaño Mira**: The crack

### 📝 Licencia
Este proyecto es con fines educativos y no tiene fines comerciales. Desarrollado como parte del curso de Desarrollo Web en 2024-2025.

---

*¡Que comience la magia de las apuestas de Quidditch! 🪄✨*

**"En el mundo del Quidditch, como en el desarrollo web, cada línea de código es una jugada hacia la victoria."** 🏆
