# 🏆 Professional Quidditch League System

## Overview

This is a complete professional Quidditch league management system implementing:
- **Circle Method Calendar Generation** - Double round-robin tournament scheduling
- **Live Match Simulation** - Minute-by-minute event simulation with probabilistic events
- **UI Components** - React components for upcoming matches and live match viewing
- **Complete Integration** - Ready for production use

## 🚀 Quick Start

### From Browser Console

Once the application is running, you can access the system from the browser console:

```javascript
// Run complete system validation
window.runQuidditchValidation()

// Access the main system
window.QuidditchSystem

// Create a professional league
const league = QuidditchSystem.createProfessionalLeague()

// Run demos
QuidditchSystem.demos.calendar()
QuidditchSystem.demos.liveMatch()
```

### From Code

```typescript
import { QuidditchSystem } from './services/quidditchSystem'

// Create a professional league with 6 teams
const season = QuidditchSystem.createProfessionalLeague()
console.log(`Generated ${season.partidos.length} matches`)

// Start a live match simulation
const match = season.partidos[0]
const localTeam = season.equipos.find(t => t.id === match.localId)
const visitanteTeam = season.equipos.find(t => t.id === match.visitanteId)

QuidditchSystem.services.liveSimulator.startLiveMatch(match, localTeam, visitanteTeam)
```

## 🏗️ Architecture

### Core Services

1. **leagueScheduler** - Circle Method calendar generation
2. **liveMatchSimulator** - Real-time match simulation
3. **upcomingMatchesService** - Match querying and filtering
4. **quidditchLeagueManager** - Season orchestration
5. **standingsCalculator** - League table calculations

### UI Components

1. **UpcomingMatches** - Shows next matches with auto-refresh
2. **LiveMatchViewer** - Real-time match simulation display

### Data Model

- **Teams** with attack/defense strengths and detailed stats
- **Matches** with full event logs and state tracking
- **Seasons** with complete tournament structure
- **Events** with configurable probabilities and outcomes

## 🎮 Features

### Calendar Generation
- Double round-robin (each team plays every other team twice)
- Circle Method algorithm for balanced scheduling
- Date and time assignment with preferences
- Support for odd number of teams (dummy team)
- Configurable season length and match frequency

### Live Simulation
- Minute-by-minute event processing
- Probability-based events adjusted by team strengths
- 14 different event types (goals, fouls, snitch catches, etc.)
- Real-time score updates and event feeds
- Configurable match duration

### Match Events
- **Quaffle Goals** (10 points)
- **Snitch Catches** (150 points, ends match)
- **Bludger Hits** and blocks
- **7 Different Fouls** (Blagging, Blatching, Cobbing, etc.)
- **Weather Changes** and timeouts
- **Injuries** and substitutions

## 🔧 Configuration

### Season Configuration
```typescript
const config = {
  seasonStart: new Date('2024-09-01'),
  seasonEnd: new Date('2025-05-31'),
  matchesPerWeek: 2,
  daysBetweenRounds: 7,
  preferredMatchDays: [5, 6], // Friday, Saturday
  matchTimes: ['14:00', '16:30', '19:00']
}
```

### Event Configuration
Events have configurable probabilities that are adjusted by team strengths:
- **Base probability** for each event type
- **Attack modifier** based on team's fuerzaAtaque
- **Defense modifier** based on opponent's fuerzaDefensa
- **Home advantage** bonus
- **Minimum time** requirements (e.g., Snitch can't be caught before minute 10)

## 🧪 Testing

Run the complete system validation:
```javascript
window.runQuidditchValidation()
```

This will test:
1. Professional league creation
2. Live match simulation
3. UI component integration
4. Demo execution
5. System health check

## 📊 Demo Teams

The system includes 6 professional teams:
1. **Gryffindor** (85 attack, 78 defense)
2. **Slytherin** (82 attack, 88 defense)
3. **Ravenclaw** (88 attack, 82 defense)
4. **Hufflepuff** (75 attack, 85 defense)
5. **Chudley Cannons** (65 attack, 70 defense)
6. **Holyhead Harpies** (92 attack, 86 defense)

## 🎯 Integration Points

### With FullCalendar
```typescript
const season = QuidditchSystem.createProfessionalLeague()
const calendarEvents = season.partidos.map(match => ({
  title: `${match.localId} vs ${match.visitanteId}`,
  start: match.fecha,
  extendedProps: { match }
}))
```

### With UI Components
```tsx
import { UpcomingMatches, LiveMatchViewer } from '@/components/matches'

// Show upcoming matches
<UpcomingMatches />

// Show live match simulation
<LiveMatchViewer matchId="match-123" />
```

## 🚨 Error Handling

The system includes comprehensive error handling:
- Invalid team configurations
- Missing match data
- Simulation state errors
- Network timeout handling
- Graceful degradation

## 📈 Performance

- **Efficient algorithms** - O(n²) calendar generation
- **Optimized rendering** - React components use proper memoization
- **Background processing** - Live simulations run without blocking UI
- **Memory management** - Automatic cleanup of completed matches

## 🛠️ Development

### Adding New Event Types
1. Add to `EventType` union in `types/league.ts`
2. Add configuration to `EVENTOS` array in `liveMatchSimulator.ts`
3. Add handling logic in `processMinuteEvents`

### Creating Custom Teams
```typescript
const customTeam = {
  id: 'custom-team',
  name: 'Custom Team',
  fuerzaAtaque: 80,
  fuerzaDefensa: 75,
  // ... other required fields
}
```

### Extending UI Components
All components are modular and can be extended or customized for specific needs.

---

**System Status**: ✅ Production Ready  
**Last Updated**: January 2025  
**Version**: 1.0.0
