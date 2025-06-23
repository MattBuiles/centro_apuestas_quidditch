# 🧙‍♀️ Cuentas Predefinidas del Sistema de Apuestas de Quidditch

## 📋 Cuentas Disponibles para Iniciar Sesión

### 🏰 **Administrador**
- **Email:** `admin@quidditch.com`
- **Contraseña:** `admin123`
- **Usuario:** Administrador Mágico
- **Rol:** Administrador
- **Balance:** 0 galeones

### 🦁 **Gryffindor**
#### Harry Potter
- **Email:** `harry@gryffindor.com`
- **Contraseña:** `patronus123`
- **Balance:** 250 galeones

#### Hermione Granger
- **Email:** `hermione@gryffindor.com`
- **Contraseña:** `magic456`
- **Balance:** 180 galeones

### 🐍 **Slytherin**
#### Draco Malfoy
- **Email:** `draco@slytherin.com`
- **Contraseña:** `serpent789`
- **Balance:** 320 galeones

### 🦅 **Ravenclaw**
#### Luna Lovegood
- **Email:** `luna@ravenclaw.com`
- **Contraseña:** `nargles321`
- **Balance:** 95 galeones

### 🦡 **Hufflepuff**
#### Cedric Diggory
- **Email:** `cedric@hufflepuff.com`
- **Contraseña:** `champion987`
- **Balance:** 140 galeones

---

## ✨ **Funcionalidades Implementadas**

### 🔐 **Autenticación**
- **Login:** Solo las cuentas predefinidas pueden iniciar sesión inicialmente
- **Registro:** Nuevos usuarios pueden registrarse si el email no está en uso
- **Validación:** Previene registro con emails ya existentes

### 🔑 **Gestión de Contraseñas**
- **Recuperación:** Funciona para todas las cuentas registradas (predefinidas + nuevas)
- **Cambio desde perfil:** Disponible para usuarios autenticados (excepto admin)
- **Validación:** Requiere contraseña actual para cambios

### 💾 **Persistencia**
- **Temporal:** Las cuentas nuevas solo duran durante la ejecución actual
- **Reset:** Al reiniciar `npm run dev`, vuelve a las 5 cuentas originales
- **Balance:** Se mantiene durante la sesión actual para todas las cuentas

---

## 🧪 **Instrucciones de Prueba**

1. **Inicia sesión** con cualquiera de las cuentas predefinidas
2. **Registra una nueva cuenta** con un email diferente
3. **Prueba la recuperación de contraseña** para cualquier cuenta
4. **Cambia contraseña** desde el perfil (usuarios no-admin)
5. **Reinicia** `npm run dev` para verificar el reset a estado original

---

## 🚨 **Notas Importantes**

- **Solo Admin:** La cuenta admin no puede apostar ni cambiar contraseña desde el perfil
- **Registro:** El sistema valida que el email no esté previamente registrado
- **Recuperación:** Funciona tanto para cuentas predefinidas como registradas dinámicamente
- **Reset:** Al parar y volver a ejecutar el proyecto, solo quedan las 5 cuentas originales

¡Que la magia esté contigo! ⚡✨
