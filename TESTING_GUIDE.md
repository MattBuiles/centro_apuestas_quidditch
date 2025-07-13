# 🧪 GUÍA DE PRUEBAS - EQUIPOS Y JUGADORES

## 🚀 PASO 1: Iniciar el Backend

```bash
# Navegar al directorio del backend
cd backend

# Instalar dependencias (si no está hecho)
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

**Deberías ver:**
```
✅ Connected to SQLite database: [path]
✅ Database tables created successfully
🌱 Initial data seeded successfully
👤 Default admin user created: admin@quidditch.com / admin123
👥 Seeding players for all teams...
✅ All players seeded successfully
🎲 Seeding bet types...
✅ Seeded 17 bet types
🏆 Creating sample season and matches...
✅ Created [X] matches for season [year]
✅ Generated league standings
🚀 Server running on port 3001
```

---

## 🔍 PASO 2: Probar Endpoints Básicos

### A) Test Manual con Browser/Postman

Abre tu navegador y prueba estos URLs:

#### 📋 **Equipos - Información Básica**
```
http://localhost:3001/api/teams
```
**Esperado:** Lista de 6 equipos con estadísticas

#### 🏠 **Detalle Completo de Equipo**
```
http://localhost:3001/api/teams/gryffindor
```
**Esperado:** Info completa + jugadores + alineación titular

#### 👥 **Jugadores de un Equipo**
```
http://localhost:3001/api/teams/gryffindor/players
```
**Esperado:** 11 jugadores con posiciones y habilidades

#### ⚡ **Alineación Titular**
```
http://localhost:3001/api/teams/gryffindor/lineup
```
**Esperado:** 7 jugadores titulares (1 keeper, 1 seeker, 2 beaters, 3 chasers)

#### 🎯 **Jugadores por Posición**
```
http://localhost:3001/api/teams/gryffindor/players/seeker
```
**Esperado:** Buscadores de Gryffindor (Harry Potter + suplente)

#### ⚽ **Partidos**
```
http://localhost:3001/api/matches
```
**Esperado:** Lista de partidos generados

#### 🏟️ **Alineaciones de un Partido**
```
http://localhost:3001/api/matches/[MATCH_ID]/lineups
```
**Esperado:** Alineaciones de ambos equipos

---

## 🤖 PASO 3: Test Automático con Script

### Opción A: Script Node.js

```bash
# Instalar fetch para Node.js
npm install node-fetch

# Ejecutar el script de prueba
node test-endpoints.js
```

### Opción B: Test desde Browser Console

1. Abre http://localhost:3001 en tu navegador
2. Abre Developer Tools (F12)
3. Ve a la pestaña Console
4. Copia y pega este código:

```javascript
async function testAll() {
  const baseUrl = 'http://localhost:3001/api';
  
  console.log('🧪 Testing All Endpoints...\n');
  
  // Test 1: Teams
  let response = await fetch(`${baseUrl}/teams`);
  let data = await response.json();
  console.log(`✅ Teams: ${data.data.length} found`);
  
  // Test 2: Gryffindor complete
  response = await fetch(`${baseUrl}/teams/gryffindor`);
  data = await response.json();
  console.log(`✅ Gryffindor: ${data.data.players.length} players, ${data.data.startingLineup.length} starters`);
  
  // Test 3: Players by position
  response = await fetch(`${baseUrl}/teams/gryffindor/players/seeker`);
  data = await response.json();
  console.log(`✅ Seekers: ${data.data.length} found`);
  data.data.forEach(p => console.log(`   - ${p.name}: ${p.skill_level} skill`));
  
  // Test 4: Match lineups
  response = await fetch(`${baseUrl}/matches`);
  data = await response.json();
  if (data.data.length > 0) {
    const matchId = data.data[0].id;
    response = await fetch(`${baseUrl}/matches/${matchId}/lineups`);
    data = await response.json();
    console.log(`✅ Match lineups: Home ${data.data.homeTeam.lineup.length}, Away ${data.data.awayTeam.lineup.length}`);
  }
  
  console.log('\n🎉 All tests completed!');
}

// Ejecutar
testAll();
```

---

## 🔍 PASO 4: Verificar Datos Específicos

### A) Verificar Estadísticas de Equipos

```javascript
// En browser console
fetch('http://localhost:3001/api/teams/gryffindor')
  .then(r => r.json())
  .then(data => {
    const team = data.data;
    console.log(`${team.name} Stats:`);
    console.log(`Attack: ${team.attack_strength}`);
    console.log(`Defense: ${team.defense_strength}`);
    console.log(`Seeker Skill: ${team.seeker_skill}`);
    console.log(`Win Rate: ${team.win_percentage}%`);
  });
```

### B) Verificar Distribución de Jugadores

```javascript
// Verificar que cada equipo tiene la plantilla correcta
const teams = ['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'];

for (const teamId of teams) {
  fetch(`http://localhost:3001/api/teams/${teamId}/players`)
    .then(r => r.json())
    .then(data => {
      const players = data.data;
      const positions = {};
      players.forEach(p => {
        positions[p.position] = (positions[p.position] || 0) + 1;
      });
      console.log(`${teamId}:`, positions);
    });
}
```

### C) Verificar Alineaciones Titulares

```javascript
// Verificar que cada equipo tiene exactamente 7 titulares
fetch('http://localhost:3001/api/teams/gryffindor/lineup')
  .then(r => r.json())
  .then(data => {
    console.log('Gryffindor Starting XI:');
    data.data.forEach(player => {
      console.log(`${player.position}: ${player.name} (${player.skill_level})`);
    });
  });
```

---

## 🎯 PASO 5: Verificar Frontend Integration

### A) Datos para "Detalles del Equipo"

El endpoint `/api/teams/:id` devuelve TODO lo necesario:
- ✅ Estadísticas (attack, defense, skills)
- ✅ Plantilla completa
- ✅ Alineación titular
- ✅ Información histórica
- ✅ Colores y logos

### B) Datos para "Detalles del Partido"

Los endpoints `/api/matches/:id/lineups` y `/api/matches/:id` devuelven:
- ✅ Info de ambos equipos
- ✅ Alineaciones de ambos equipos
- ✅ Estadísticas para comparar
- ✅ Eventos del partido

---

## 🐛 TROUBLESHOOTING

### Error: "Database not connected"
```bash
# Eliminar base de datos y reiniciar
rm backend/database/quidditch.db
npm run dev
```

### Error: "Port 3001 already in use"
```bash
# Matar proceso en puerto 3001
npx kill-port 3001
npm run dev
```

### Error: "Cannot find module"
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Datos no aparecen
```bash
# Verificar que el seeding funcionó
# Deberías ver estos logs al iniciar:
# "👥 Seeding players for all teams..."
# "✅ All players seeded successfully"
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Backend inicia sin errores
- [ ] Se crean 6 equipos con estadísticas
- [ ] Se generan 66 jugadores (11 por equipo)
- [ ] Cada equipo tiene 7 titulares marcados
- [ ] Endpoint `/api/teams` devuelve 6 equipos
- [ ] Endpoint `/api/teams/gryffindor` devuelve info completa
- [ ] Endpoint `/api/teams/gryffindor/players` devuelve 11 jugadores
- [ ] Endpoint `/api/teams/gryffindor/lineup` devuelve 7 titulares
- [ ] Endpoint de alineaciones de partido funciona
- [ ] Todos los jugadores tienen nombres auténticos
- [ ] Las estadísticas están balanceadas por equipo

---

## 🎉 SIGUIENTE PASO

Una vez que todo funcione correctamente, puedes:

1. **Integrar con Frontend**: Usar estos endpoints en tus componentes React
2. **Mejorar UI**: Mostrar estadísticas visuales y alineaciones
3. **Simular Partidos**: Usar las estadísticas para cálculos realistas
4. **Expandir Datos**: Agregar más logros, estadísticas históricas, etc.

**¡La base de datos está completa y lista para una experiencia inmersiva!** 🏆
