# 🧙‍♂️ Centro de Apuestas Quidditch

<div align="center">

![Quidditch Betting](https://img.shields.io/badge/Quidditch-Betting_Platform-gold?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjRkY5NjAwIi8+Cjwvc3ZnPgo=)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?style=for-the-badge&logo=vite)
![Status](https://img.shields.io/badge/Status-En_Desarrollo-yellow?style=for-the-badge)

*Una plataforma mágica para apostar en partidos de Quidditch del mundo de Harry Potter*

</div>

---

## 📋 Tabla de Contenidos

- [🎯 Descripción del Proyecto](#-descripción-del-proyecto)
- [✨ Características Principales](#-características-principales)
- [🛠️ Tecnologías Utilizadas](#️-tecnologías-utilizadas)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)
- [🚀 Instalación y Configuración](#-instalación-y-configuración)
- [💻 Comandos Disponibles](#-comandos-disponibles)
- [📱 Capturas de Pantalla](#-capturas-de-pantalla)
- [🎮 Funcionalidades Implementadas](#-funcionalidades-implementadas)
- [🔮 Próximas Características](#-próximas-características)
- [🤝 Contribución](#-contribución)
- [📄 Licencia](#-licencia)

---

## 🎯 Descripción del Proyecto

**Centro de Apuestas Quidditch** es una aplicación web moderna e inmersiva que permite a los usuarios apostar en partidos de Quidditch del universo de Harry Potter. La plataforma combina la magia del mundo wizarding con tecnología web moderna para crear una experiencia única de apuestas deportivas.

> **⚠️ Nota Importante**: Este proyecto está actualmente en desarrollo y representa un boceto inicial. Las funcionalidades están siendo implementadas progresivamente.

### 🎪 Características del Mundo Mágico

- 🏰 **Ambientación Completa**: Diseño inspirado en el mundo de Harry Potter
- 🏛️ **Bóveda de Gringotts**: Sistema de monedero con Galeones mágicos
- 🏆 **Equipos de Quidditch**: Gryffindor, Slytherin, Hufflepuff, Ravenclaw y más
- ⚡ **Experiencia Inmersiva**: Elementos mágicos y animaciones temáticas

---

## ✨ Características Principales

### 🔐 Sistema de Autenticación
- Registro y login de usuarios
- Recuperación de contraseña
- Rutas protegidas
- Persistencia de sesión

### 🏠 Gestión de Cuenta
- **Perfil de Usuario**: Edición de información personal y estadísticas
- **Bóveda de Gringotts**: Gestión de Galeones (depósitos/retiros)
- **Historial de Apuestas**: Seguimiento completo de apuestas activas e historial
- **Configuración**: Notificaciones y preferencias personalizadas

### 🎯 Sistema de Apuestas
- Visualización de partidos disponibles  
- Diferentes tipos de apuestas (victoria, empate, puntuación)
- Cálculo automático de ganancias potenciales
- Estados de apuestas (activa, ganada, perdida)

### 📊 Información de Equipos y Partidos
- Perfiles detallados de equipos de Quidditch
- Estadísticas de jugadores
- Resultados de partidos históricos
- Clasificaciones y standings

---

## 🛠️ Tecnologías Utilizadas

### Frontend Core
- **[React 19.1.0](https://reactjs.org/)** - Biblioteca de interfaz de usuario
- **[TypeScript 5.8.3](https://www.typescriptlang.org/)** - Tipado estático para JavaScript
- **[Vite 6.3.5](https://vitejs.dev/)** - Build tool y dev server ultrarrápido

### Routing y Estado
- **[React Router Dom 7.6.1](https://reactrouter.com/)** - Enrutamiento SPA
- **React Context API** - Gestión de estado global

### Styling y UI
- **CSS Modules** - Estilos modulares y scoped
- **CSS Variables** - Sistema de design tokens
- **Flexbox & Grid** - Layout responsivo moderno

### Herramientas de Desarrollo
- **[ESLint](https://eslint.org/)** - Linting y calidad de código
- **[TypeScript ESLint](https://typescript-eslint.io/)** - Reglas específicas para TS
- **Vite Plugin React SWC** - Compilación optimizada

---

## 📁 Estructura del Proyecto

```
centro_apuestas_quidditch/
├── 📄 README.md
├── 📄 package.json
├── 🔧 wireframes/                    # Prototipos y diseños iniciales
│   └── quidditch-betting-system/
├── 🚀 my-quidditch-betting-app/      # Aplicación principal
│   ├── 📄 package.json
│   ├── 📄 vite.config.ts
│   ├── 📄 tsconfig.json
│   ├── 📄 eslint.config.js
│   ├── 🌐 index.html
│   ├── 🎨 public/
│   │   └── vite.svg
│   └── 📂 src/
│       ├── 📄 App.tsx               # Componente principal
│       ├── 📄 main.tsx              # Punto de entrada
│       ├── 🖼️ assets/               # Recursos estáticos
│       │   ├── User_Logo.png
│       │   ├── Page_Logo.png
│       │   ├── *_Logo.png           # Logos de equipos
│       │   └── teamLogos.ts         # Mapeo de logos
│       ├── 🧩 components/           # Componentes reutilizables
│       │   ├── account/             # Componentes de cuenta
│       │   ├── auth/                # Componentes de autenticación
│       │   ├── betting/             # Componentes de apuestas
│       │   ├── common/              # Componentes comunes
│       │   ├── layout/              # Componentes de layout
│       │   ├── matches/             # Componentes de partidos
│       │   └── teams/               # Componentes de equipos
│       ├── 🌐 context/              # Context providers
│       │   └── AuthContext.tsx      # Contexto de autenticación
│       ├── 📄 pages/                # Páginas principales
│       │   ├── AccountPage/         # ✅ Página de cuenta (implementada)
│       │   ├── HomePage/            # Página principal
│       │   ├── LoginPage/           # Página de login
│       │   ├── BettingPage/         # Página de apuestas
│       │   ├── MatchesPage/         # Página de partidos
│       │   ├── TeamsPage/           # Página de equipos
│       │   └── [...]               # Otras páginas
│       ├── 🔧 services/             # Servicios y APIs
│       │   ├── matchesService.ts
│       │   └── teamsService.ts
│       └── 🎨 styles/               # Estilos globales
│           ├── global.css
│           ├── theme.css
│           ├── variables.css
│           └── animations.css
```

---

## 🚀 Instalación y Configuración

### 📋 Prerrequisitos

Asegúrate de tener instalado en tu sistema:

- **[Node.js](https://nodejs.org/)** (versión 18.0 o superior)
- **[npm](https://www.npmjs.com/)** (viene incluido con Node.js)
- **[Git](https://git-scm.com/)** para clonar el repositorio

### 📦 Instalación Paso a Paso

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/centro_apuestas_quidditch.git
   cd centro_apuestas_quidditch
   ```

2. **Navegar al directorio de la aplicación**
   ```bash
   cd my-quidditch-betting-app
   ```

3. **Instalar dependencias**
   ```bash
   npm install
   ```

4. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador**
   ```
   http://localhost:5173
   ```

### 🔧 Configuración Adicional

#### Variables de Entorno (Futuro)
```bash
# Crear archivo .env.local
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Centro de Apuestas Quidditch
```

#### Configuración de VS Code (Recomendado)
```json
{
  "editor.formatOnSave": true,
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

---

## 💻 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | 🚀 Inicia el servidor de desarrollo |
| `npm run build` | 🏗️ Construye la aplicación para producción |
| `npm run preview` | 👀 Previsualiza la build de producción |
| `npm run lint` | 🔍 Ejecuta el linter para revisar código |

### 🐛 Comandos de Debugging

```bash
# Limpiar caché de Vite
npm run dev -- --force

# Verificar dependencias
npm audit

# Actualizar dependencias
npm update
```

---

## 📱 Capturas de Pantalla

> **📝 Nota**: Las capturas de pantalla se agregarán conforme se completen las funcionalidades.

### 🏠 Página Principal
*Próximamente...*

### 🔐 Sistema de Autenticación  
*Próximamente...*

### 👤 Página de Cuenta (✅ Implementada)
- **Perfil Mágico**: Gestión completa de información personal
- **Bóveda de Gringotts**: Sistema de monedero con historial de transacciones
- **Profecías de Quidditch**: Seguimiento de apuestas activas e historial
- **Configuración**: Personalización de notificaciones y preferencias

---

## 🎮 Funcionalidades Implementadas

### ✅ Completadas

- **Sistema de Rutas**: Navegación SPA con React Router
- **Página de Cuenta Completa**: 
  - Edición de perfil interactiva
  - Sistema de monedero con modales
  - Gestión de apuestas (activas/historial)
  - Configuración de usuario
- **Context de Autenticación**: Gestión de estado de usuario
- **Componentes Base**: Button, Card, Layout, etc.
- **Diseño Responsivo**: Adaptable a dispositivos móviles
- **Temática Mágica**: Elementos visuales del mundo Harry Potter

### 🚧 En Desarrollo

- **Página Principal**: Landing page con información general
- **Sistema de Apuestas**: Interfaz para realizar apuestas
- **Páginas de Equipos**: Información detallada de equipos
- **Gestión de Partidos**: Visualización y detalles de partidos
- **API Backend**: Servicios de datos reales

---

## 🔮 Próximas Características

### 🎯 Corto Plazo
- [ ] Página principal con diseño atractivo
- [ ] Sistema completo de login/registro
- [ ] Página de partidos con apuestas en vivo
- [ ] Integración con APIs simuladas

### 🚀 Mediano Plazo  
- [ ] Sistema de notificaciones push
- [ ] Chat en vivo para usuarios
- [ ] Estadísticas avanzadas de apuestas
- [ ] Sistema de niveles y logros

### 🌟 Largo Plazo
- [ ] Aplicación móvil (React Native)
- [ ] Integración con blockchain para transparencia
- [ ] IA para predicciones de partidos
- [ ] Modo multijugador con ligas privadas

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Este proyecto está en desarrollo activo.

### 📝 Cómo Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Realiza tus cambios
4. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
5. Push a la rama (`git push origin feature/nueva-funcionalidad`)
6. Abre un Pull Request

### 🎨 Estándares de Código

- Usar TypeScript para tipado estático
- Seguir convenciones de naming de React
- Mantener componentes pequeños y reutilizables
- Escribir código autodocumentado
- Usar CSS Modules para estilos

---

## 📞 Contacto y Soporte

### 👨‍💻 Desarrollador Principal
**Samuel Castaño**
- 📧 Email: [tu-email@ejemplo.com]
- 💼 LinkedIn: [tu-linkedin]
- 🐙 GitHub: [tu-github]

### 🐛 Reportar Issues
Si encuentras algún bug o tienes sugerencias, por favor:
1. Revisa los [issues existentes](../../issues)
2. Crea un [nuevo issue](../../issues/new) con detalles específicos

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

---

<div align="center">

### 🌟 ¡Gracias por tu interés en el Centro de Apuestas Quidditch! 🌟

*Hecho con ❤️ y un poquito de magia ✨*

---

![Hogwarts](https://img.shields.io/badge/Powered_by-Hogwarts_Magic-purple?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjRkZGRkZGIi8+Cjwvc3ZnPgo=)

</div>