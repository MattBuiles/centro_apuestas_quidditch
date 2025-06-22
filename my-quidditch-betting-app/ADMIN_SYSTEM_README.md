# 🏰 Sistema de Administración - Centro de Apuestas Quidditch

## 🧙‍♂️ Credenciales de Administrador

Para acceder al panel de administración, utiliza las siguientes credenciales:

**Email:** `admin@example.com`  
**Contraseña:** `admin123`

## ✨ Funcionalidades del Panel de Administración

### 📊 Panel General (Dashboard)
- **Estadísticas en tiempo real:** Usuarios totales, usuarios activos, apuestas totales, ingresos
- **Métricas avanzadas:** Apuesta promedio, tasa de ganancia del sistema
- **Gráficos interactivos:** 
  - Apuestas por día de la semana
  - Equipos más populares
- **Actividad reciente:** Feed en tiempo real de registros, apuestas y partidos
- **Indicadores visuales:** Cards con animaciones y estados de tendencia

### 📈 Historial de Apuestas
- **Filtros avanzados:** Por estado, rango de fechas, monto, usuario
- **Tabla completa:** ID, usuario, partido, predicción, monto, cuotas, ganancia potencial
- **Estados de apuestas:** Pendiente, Ganada, Perdida, Cancelada
- **Exportación:** CSV y JSON de los datos filtrados
- **Paginación:** Navegación eficiente por grandes volúmenes de datos
- **Estadísticas dinámicas:** Totales que se actualizan según filtros aplicados

### 👥 Gestión de Usuarios
- **CRUD completo:** Crear, editar, eliminar usuarios
- **Filtros múltiples:** Por rol (usuario/admin), estado (activo/suspendido/inactivo), búsqueda por nombre/email
- **Vista de tarjetas:** Información visual clara de cada usuario
- **Estadísticas por usuario:** Saldo, apuestas totales, ganancias
- **Modales interactivos:** Formularios para crear/editar con validación
- **Confirmación de eliminación:** Seguridad adicional para acciones destructivas
- **Badges visuales:** Indicadores de rol y estado

## 🎨 Características de Diseño

### 🌟 Interfaz Diferenciada
- **Detección automática:** El sistema detecta automáticamente usuarios admin
- **Navegación específica:** Menu lateral adaptado para funciones administrativas
- **Identidad visual:** Badges de administrador, iconos especiales, colores distintivos
- **Animaciones:** Efectos visuales que mejoran la experiencia de usuario

### 📱 Responsividad Completa
- **Diseño adaptativo:** Funciona perfectamente en desktop, tablet y móvil
- **Grids flexibles:** Componentes que se reorganizan según el tamaño de pantalla
- **Navegación móvil:** Optimizada para dispositivos táctiles

### 🎯 Experiencia de Usuario
- **Estados de carga:** Spinners y animaciones durante la carga de datos
- **Feedback visual:** Notificaciones, estados hover, transiciones suaves
- **Datos simulados:** Sistema completamente funcional con datos de ejemplo
- **Performance:** Componentes optimizados para carga rápida

## 🔧 Implementación Técnica

### 🏗️ Arquitectura
- **Componentes modulares:** Cada sección es un componente independiente
- **Estilos CSS Modules:** Aislamiento de estilos por componente
- **TypeScript:** Tipado completo para mejor desarrollo y mantenimiento
- **React Router:** Navegación fluida entre secciones

### 📦 Estructura de Archivos
```
src/
├── components/
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── AdminDashboard.module.css
│       ├── AdminBetsHistory.tsx
│       ├── AdminBetsHistory.module.css
│       ├── AdminUsersManagement.tsx
│       └── AdminUsersManagement.module.css
├── context/
│   └── AuthContext.tsx (modificado para soportar roles)
└── pages/
    └── AccountPage/
        └── index.tsx (modificado para admin)
```

### 🔐 Sistema de Autenticación
- **Detección de rol:** Automática al hacer login
- **Protección de rutas:** Solo admins pueden acceder a funciones administrativas
- **Persistencia:** El rol se mantiene en localStorage/sessionStorage
- **Redirección:** Los admins son redirigidos a `/account` automáticamente

## 🚀 Cómo Probar

1. **Accede a la aplicación:** http://localhost:3000
2. **Ve al login:** Haz clic en "Iniciar Sesión"
3. **Usa las credenciales de admin:**
   - Email: `admin@example.com`
   - Contraseña: `admin123`
4. **Explora el panel:** Serás redirigido automáticamente al panel de administración
5. **Navega entre secciones:** Usa el menú lateral para explorar todas las funcionalidades

## 🎭 Datos de Ejemplo

El sistema incluye datos simulados realistas:
- **Usuarios:** 8 usuarios de ejemplo con diferentes roles y estados
- **Apuestas:** Historial completo con diferentes estados y montos
- **Estadísticas:** Métricas calculadas dinámicamente
- **Actividad:** Feed de eventos recientes

## 🔄 Funcionalidades Dinámicas

- **Filtrado en tiempo real:** Los filtros se aplican inmediatamente
- **Actualizaciones automáticas:** Las estadísticas se recalculan al filtrar
- **Persistencia local:** Los datos se mantienen en localStorage
- **Estados reactivos:** La interfaz responde a todos los cambios de estado

---

## 👨‍💻 Desarrollado por
**Equipo 12 - DEVWEB**
- Mateo Builes Duque
- Samuel Castaño Mira

*Sistema desarrollado siguiendo las especificaciones del documento DEVWEB_E12 Primera entrega.pdf*
