# CTAButton Component

## Descripción
Botón Call-to-Action "Atrapa tu Suerte" que cambia su comportamiento según el estado de autenticación del usuario.

## Funcionalidad

### Usuario No Autenticado
- **Texto**: "¡Atrapa tu Suerte!"
- **Icono**: ✨ (estrella brillante)
- **Acción**: Redirige a `/register`
- **Color**: Gradiente púrpura a dorado (tema mágico)

### Usuario Autenticado
- **Texto**: "¡Hacer Apuestas!"
- **Icono**: 🎯 (diana de tiro)
- **Acción**: Redirige a `/betting`
- **Color**: Gradiente verde a dorado (indica acción disponible)

## Características Visuales

### Efectos de Hover
- Elevación y escalado del botón
- Brillo interno (shimmer effect)
- Rotación y escalado del icono
- Intensificación de sombras

### Responsividad
- Tamaño de fuente adaptativo con `clamp()`
- Padding ajustado para pantallas pequeñas
- Ancho mínimo en desktop para consistencia

### Accesibilidad
- Atributo `title` descriptivo
- Estados de focus visibles
- Contraste adecuado en modo oscuro
- Estructura semántica correcta

## Uso

```tsx
import CTAButton from '@/components/common/CTAButton'

// Uso básico
<CTAButton />

// Con personalización
<CTAButton 
  size="lg" 
  className="custom-styles"
  fullWidth={true}
/>
```

## Dependencias
- `useAuth()` - Context de autenticación
- `useNavigate()` - Hook de React Router para navegación
- `Button` - Componente base de botón

## Rutas
- `/register` - Página de registro (usuarios no autenticados)
- `/betting` - Página de apuestas (usuarios autenticados, ruta protegida)
