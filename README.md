# 🏆 Atrapa la Snitch - Sistema de Apuestas de Quidditch

## 📋 Descripción del Proyecto

**Atrapa la Snitch** es una aplicación web completa desarrollada en React con TypeScript que simula un sistema de apuestas para partidos de Quidditch. La aplicación combina la magia del mundo de Harry Potter con tecnología moderna para crear una experiencia inmersiva de apuestas deportivas ficticias.

### 🎯 Objetivos y Funcionalidades Principales

- **Sistema de Liga Profesional**: Generación automática de calendarios usando el método de círculo (round-robin)
- **Simulación de Partidos en Tiempo Real**: Motor de simulación minuto a minuto con eventos dinámicos
- **Sistema de Apuestas Completo**: Múltiples tipos de apuestas con cuotas y cálculos en tiempo real
- **Gestión de Usuarios**: Sistema de autenticación con roles (usuarios y administradores)
- **Panel Administrativo**: Gestión de usuarios, historial de apuestas y estadísticas
- **Interfaz Mágica**: Diseño temático inspirado en el mundo de Harry Potter

## 👥 Equipo de Desarrollo

- **Mateo Builes Duque**
- **Samuel Castaño Mira**

## 🚀 Instrucciones de Instalación y Ejecución

### 📋 Requisitos Previos

- **Node.js** (versión 18.0 o superior)
- **npm** o **yarn** como gestor de paquetes
- Navegador web moderno (Chrome, Firefox, Safari, Edge)

### 🔧 Instalación de Dependencias

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/MattBuiles/centro_apuestas_quidditch.git
   cd centro_apuestas_quidditch
   ```

2. **Instalar las dependencias**:
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   npm install
   cp .env.example .env
   ```

### 🏃‍♂️ Comandos de Ejecución

#### Desarrollo Local

**Opción 1: Solo Frontend (Modo actual)**
```bash
npm run dev
```
- Inicia el servidor de desarrollo en `http://localhost:5173`
- Funciona completamente en el cliente
- Usa datos simulados y localStorage

**Opción 2: Frontend + Backend (Nueva arquitectura)**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/health`
- **Teams API**: `http://localhost:3001/api/teams`

#### Producción
```bash
# Frontend
npm run build
npm run preview

# Backend
cd backend
npm run build
npm start
```

#### Linting
```bash
npm run lint
```
- Ejecuta ESLint para revisar la calidad del código
- Aplica las reglas de estilo definidas en `eslint.config.js`

### 🌐 Acceso a la Aplicación

Una vez ejecutado `npm run dev`, la aplicación estará disponible en:
- **URL Principal**: `http://localhost:3000`
- **Red Local**: También accesible desde otros dispositivos en la misma red

### 🔐 Primeros Pasos

1. **Acceder a la aplicación** en `http://localhost:3000`
2. **Usar una cuenta predefinida** (ver sección de Cuentas de Prueba más abajo)
3. **Explorar las funcionalidades**:
   - Usuarios regulares: Apostar en partidos
   - Administradores: Gestionar el sistema

## 🏗️ Estructura del Proyecto

### 📁 Directorios Clave

```
src/
├── components/          # Componentes reutilizables
│   ├── admin/          # Componentes del panel administrativo
│   ├── auth/           # Componentes de autenticación
│   ├── betting/        # Componentes del sistema de apuestas
│   ├── common/         # Componentes compartidos
│   ├── layout/         # Componentes de diseño
│   ├── matches/        # Componentes de partidos
│   └── teams/          # Componentes de equipos
├── pages/              # Páginas de la aplicación
├── services/           # Lógica de negocio y APIs simuladas
│   ├── quidditchSystem.ts        # Sistema central de Quidditch
│   ├── virtualTimeManager.ts    # Gestión de tiempo virtual
│   ├── betResolutionService.ts  # Resolución de apuestas
│   └── predictionsService.ts    # Sistema de predicciones
├── types/              # Definiciones TypeScript
├── context/            # Contextos de React
└── styles/             # Estilos globales

backend/                # Backend API (Nueva arquitectura)
├── src/
│   ├── controllers/    # Controladores de rutas
│   ├── routes/         # Definición de endpoints
│   ├── services/       # Lógica de negocio del servidor
│   ├── database/       # Configuración de base de datos
│   ├── middleware/     # Middleware personalizado
│   └── types/          # Tipos compartidos
├── database/           # Archivos SQLite
└── dist/               # Código compilado
```
├── context/            # Contextos de React (AuthContext)
├── types/              # Definiciones de TypeScript
├── styles/             # Estilos globales y variables CSS
└── assets/             # Imágenes y recursos estáticos
```

### 🔧 Archivos de Configuración

- `vite.config.ts`: Configuración del bundler Vite
- `tsconfig.json`: Configuración de TypeScript
- `eslint.config.js`: Reglas de linting
- `package.json`: Dependencias y scripts

## 🛠️ Tecnologías y Frameworks

### Frontend
- **React 19.1.0**: Biblioteca principal para la UI
- **TypeScript**: Tipado estático para mayor robustez
- **React Router DOM**: Navegación entre páginas
- **CSS Modules**: Estilos modulares y encapsulados

### Herramientas de Desarrollo
- **Vite**: Bundler y servidor de desarrollo ultrarrápido
- **ESLint**: Linter para mantener calidad de código
- **TypeScript Compiler**: Compilación y verificación de tipos

### Librerías Adicionales
- **clsx**: Utilidad para manejar clases CSS condicionales

## 🎮 Funcionalidades del Sistema

### 🔐 Sistema de Autenticación
- **Cuentas Predefinidas**: Sistema con 6 cuentas listas para usar (1 admin + 5 usuarios)
- **Roles de Usuario**: Usuarios regulares y administradores
- **Gestión de Sesiones**: Persistencia local del estado de autenticación

### 🏆 Sistema de Liga de Quidditch
- **Generación de Calendarios**: Algoritmo de círculo para partidos equilibrados
- **Simulación de Partidos**: Motor que simula eventos minuto a minuto
- **Clasificaciones**: Cálculo automático de tablas de posiciones
- **Equipos**: 6 equipos con estadísticas balanceadas (4 casas de Hogwarts + 2 equipos profesionales)

### 💰 Sistema de Apuestas
- **Tipos de Apuestas**:
  - Resultado del partido (Local/Visitante/Empate)
  - Resultado exacto
  - Captura de la Snitch
  - Duración del partido
- **Apuestas Combinadas**: Múltiples selecciones en un solo boleto
- **Límites Diarios**: Máximo 3 apuestas por usuario por día
- **Gestión de Balance**: Sistema de Galeones virtuales

### 👑 Panel de Administración
- **Gestión de Usuarios**: Ver, editar y administrar cuentas
- **Historial de Apuestas**: Seguimiento completo de todas las apuestas
- **Estadísticas**: Análisis detallado de la actividad del sistema
- **Alertas de Riesgo**: Identificación de patrones sospechosos

## 🔄 Integración y Backend Simulado

### 🗄️ Almacenamiento Local
- **LocalStorage**: Persistencia de datos de usuario y apuestas
- **Context API**: Gestión global del estado de la aplicación
- **Servicios Virtuales**: Simulación de APIs sin servidor backend

### ⏰ Gestión de Tiempo Virtual
- **VirtualTimeManager**: Sistema que simula el paso del tiempo
- **Programación de Partidos**: Partidos que se ejecutan automáticamente
- **Resolución de Apuestas**: Cálculo automático de resultados

### 🎲 Motor de Simulación
- **QuidditchSimulator**: Simula partidos con eventos realistas
- **Probabilidades Dinámicas**: Basadas en las estadísticas de los equipos
- **Eventos de Quidditch**: Goles, faltas, captura de Snitch, etc.

## 🧪 Testing y Validación

El proyecto incluye varios archivos de validación y testing:
- `validate-system.js`: Validación general del sistema
- `test-*.js`: Pruebas específicas de componentes
- `debug-*.js`: Herramientas de depuración

Para ejecutar las validaciones:
```bash
node validate-system.js
```

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

# Limpiar node_modules (si es necesario)
rm -rf node_modules && npm install
```

## 🚨 Notas Importantes

### 🎭 Cuentas de Prueba Predefinidas

El sistema incluye cuentas predefinidas para facilitar las pruebas:

#### 🏰 **Administrador**
- **Email:** `admin@quidditch.com`
- **Contraseña:** `admin123`
- **Usuario:** Administrador Mágico
- **Rol:** Administrador
- **Balance:** 0 galeones

#### 🦁 **Gryffindor**
**Harry Potter**
- **Email:** `harry@gryffindor.com`
- **Contraseña:** `patronus123`
- **Balance:** 250 galeones

**Hermione Granger**
- **Email:** `hermione@gryffindor.com`
- **Contraseña:** `magic456`
- **Balance:** 180 galeones

#### 🐍 **Slytherin**
**Draco Malfoy**
- **Email:** `draco@slytherin.com`
- **Contraseña:** `serpent789`
- **Balance:** 320 galeones

#### 🦅 **Ravenclaw**
**Luna Lovegood**
- **Email:** `luna@ravenclaw.com`
- **Contraseña:** `nargles321`
- **Balance:** 95 galeones

#### 🦡 **Hufflepuff**
**Cedric Diggory**
- **Email:** `cedric@hufflepuff.com`
- **Contraseña:** `champion987`
- **Balance:** 140 galeones

### 🔐 Funcionalidades de Autenticación

- **Login:** Solo las cuentas predefinidas pueden iniciar sesión inicialmente
- **Registro:** Nuevos usuarios pueden registrarse si el email no está en uso
- **Validación:** Previene registro con emails ya existentes
- **Recuperación:** Funciona para todas las cuentas registradas (predefinidas + nuevas)
- **Cambio de contraseña:** Disponible para usuarios autenticados (excepto admin)

### 🧪 Instrucciones de Prueba

1. **Inicia sesión** con cualquiera de las cuentas predefinidas
2. **Registra una nueva cuenta** con un email diferente
3. **Prueba la recuperación de contraseña** para cualquier cuenta
4. **Cambia contraseña** desde el perfil (usuarios no-admin)
5. **Reinicia** `npm run dev` para verificar el reset a estado original

### 💾 Persistencia de Datos
- Los datos se almacenan en `localStorage`
- Al limpiar el navegador se perderán los datos
- No hay conexión a base de datos externa

### 🎯 Características Especiales
- Sistema de tiempo virtual que acelera la simulación
- Resolución automática de apuestas
- Límites de apuestas para juego responsable
- Interfaz administrativa completa
- **Cuentas temporales:** Las cuentas nuevas solo duran durante la ejecución actual
- **Reset automático:** Al reiniciar `npm run dev`, vuelve a las cuentas originales
- **Restricciones admin:** La cuenta admin no puede apostar ni cambiar contraseña desde el perfil

## 🤝 Contribución y Desarrollo

Este proyecto fue desarrollado como parte de un curso de desarrollo web. La arquitectura está diseñada para ser escalable y mantenible:

- **Componentes Modulares**: Cada componente tiene una responsabilidad específica
- **Servicios Separados**: Lógica de negocio aislada en servicios
- **TypeScript**: Tipado fuerte para mejor mantenibilidad
- **CSS Modules**: Estilos encapsulados para evitar conflictos

## 📄 Licencia

Este proyecto es con fines educativos y no tiene fines comerciales. Desarrollado como parte del curso de Desarrollo Web.

---

*¡Que comience la magia de las apuestas de Quidditch! 🪄✨*