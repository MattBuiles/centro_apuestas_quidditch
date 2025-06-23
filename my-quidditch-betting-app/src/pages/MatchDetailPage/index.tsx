import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import TeamLogo from '@/components/teams/TeamLogo';
import LiveMatchViewer from '@/components/matches/LiveMatchViewer';
import MatchResultDetail from '@/components/matches/MatchResultDetail';
import { Team, Match } from '@/types/league';
import { virtualTimeManager } from '@/services/virtualTimeManager';
import { PredictionsService, MatchPredictionStats, Prediction, FinishedMatchData } from '@/services/predictionsService';
import { matchResultsService } from '@/services/matchResultsService';
import styles from './MatchDetailPage.module.css';
import { useAuth } from '@/context/AuthContext';

// Tab definitions with magical icons
type TabType = 'overview' | 'predictions' | 'stats' | 'lineups' | 'head-to-head' | 'betting' | 'detailed-analysis';

interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
  magicalIcon: string;
  description: string;
}

const tabs: TabConfig[] = [
  { 
    id: 'overview', 
    label: 'Cronología', 
    icon: '📊', 
    magicalIcon: '⚡', 
    description: 'Cronología en vivo del encuentro mágico' 
  },
  { 
    id: 'predictions', 
    label: 'Predicciones', 
    icon: '🔮', 
    magicalIcon: '🌟', 
    description: 'Predicciones y pronósticos místicos' 
  },
  { 
    id: 'stats', 
    label: 'Estadísticas', 
    icon: '📈', 
    magicalIcon: '⚡', 
    description: 'Análisis detallado del rendimiento' 
  },
  { 
    id: 'lineups', 
    label: 'Alineaciones', 
    icon: '👥', 
    magicalIcon: '🏆', 
    description: 'Formaciones y jugadores estrella' 
  },
  { 
    id: 'head-to-head', 
    label: 'Cara a Cara', 
    icon: '⚔️', 
    magicalIcon: '🔥', 
    description: 'Historial de enfrentamientos épicos' 
  },  { 
    id: 'betting', 
    label: 'Apuestas', 
    icon: '💰', 
    magicalIcon: '💎', 
    description: 'Mercados de apuestas disponibles' 
  },
  { 
    id: 'detailed-analysis', 
    label: 'Análisis Detallado', 
    icon: '📊', 
    magicalIcon: '🔍', 
    description: 'Análisis completo post-partido con cronología y estadísticas avanzadas' 
  }
];

// Mock data - replace with actual data fetching
interface MatchDetails {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'live' | 'upcoming' | 'finished';
  minute?: string;
  date: string;
  time: string;
  league: string;
  location: string;
}

// Mock teams for live simulation
const mockHomeTeam: Team = {
  id: 'gryffindor',
  name: 'Gryffindor',
  house: 'Gryffindor',
  fuerzaAtaque: 85,
  fuerzaDefensa: 78,
  attackStrength: 85,
  defenseStrength: 78,
  seekerSkill: 90,
  chaserSkill: 85,
  keeperSkill: 80,
  beaterSkill: 75,
  venue: 'Gryffindor Tower Pitch'
};

const mockAwayTeam: Team = {
  id: 'slytherin',
  name: 'Slytherin',
  house: 'Slytherin',
  fuerzaAtaque: 82,
  fuerzaDefensa: 88,
  attackStrength: 82,
  defenseStrength: 88,
  seekerSkill: 85,
  chaserSkill: 80,
  keeperSkill: 90,
  beaterSkill: 85,
  venue: 'Slytherin Dungeon Pitch'
};

const mockMatchDetail: MatchDetails = {
  id: '1',
  homeTeam: 'Gryffindor',
  awayTeam: 'Slytherin',
  homeScore: 120,
  awayScore: 90,
  status: 'live',
  minute: "75'",
  date: 'Hoy',
  time: '19:00',
  league: 'Liga de Hogwarts',
  location: 'Campo de Quidditch de Hogwarts',
};

const MatchDetailPage = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { isAuthenticated, canBet: userCanBet } = useAuth();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [realMatch, setRealMatch] = useState<Match | null>(null);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showLiveSimulation, setShowLiveSimulation] = useState(false);
  const [isStartingMatch, setIsStartingMatch] = useState(false);
  
  // Predictions state
  const [predictionsService] = useState(() => new PredictionsService());
  const [predictionStats, setPredictionStats] = useState<MatchPredictionStats | null>(null);
  const [userPrediction, setUserPrediction] = useState<Prediction | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
    // Related matches state
  const [relatedMatches, setRelatedMatches] = useState<Match[]>([]);
  // State for finished match data
  const [finishedMatchData, setFinishedMatchData] = useState<FinishedMatchData | null>(null);
  // State for detailed match results
  const [hasDetailedResults, setHasDetailedResults] = useState(false);
  // Helper function to get team roster data with real player names
  const getTeamRosterData = (teamName: string) => {
    const teamMockData: { [key: string]: { roster: { id: string; name: string; position: string; number: number; yearsActive: number; achievements: string[] }[] } } = {
      'Gryffindor': {
        roster: [
          { id: 'hp', name: 'Harry Potter', position: 'Buscador', number: 7, yearsActive: 6, achievements: ["Buscador más joven en un siglo"] },
          { id: 'kg', name: 'Katie Bell', position: 'Cazadora', number: 6, yearsActive: 4, achievements: ["100+ goles en su carrera"] },
          { id: 'aw', name: 'Angelina Johnson', position: 'Cazadora', number: 8, yearsActive: 5, achievements: ["Capitana del equipo"] },
          { id: 'as', name: 'Alicia Spinnet', position: 'Cazadora', number: 12, yearsActive: 4, achievements: ["Especialista en tiros largos"] },
          { id: 'fw', name: 'Fred Weasley', position: 'Golpeador', number: 5, yearsActive: 4, achievements: ["Mejor golpeador defensivo"] },
          { id: 'gw', name: 'George Weasley', position: 'Golpeador', number: 4, yearsActive: 4, achievements: ["Mejor golpeador ofensivo"] },
          { id: 'ow', name: 'Oliver Wood', position: 'Guardián', number: 1, yearsActive: 5, achievements: ["95% efectividad en paradas"] }
        ]
      },
      'Slytherin': {
        roster: [
          { id: 'dm', name: 'Draco Malfoy', position: 'Buscador', number: 7, yearsActive: 4, achievements: ["Buscador más estratégico"] },
          { id: 'mf', name: 'Marcus Flint', position: 'Cazador', number: 9, yearsActive: 6, achievements: ["Capitán más exitoso"] },
          { id: 'ap', name: 'Adrian Pucey', position: 'Cazador', number: 8, yearsActive: 4, achievements: ["Especialista en goles largos"] },
          { id: 'gz', name: 'Blaise Zabini', position: 'Cazador', number: 11, yearsActive: 3, achievements: ["Mejor promedio de gol"] },
          { id: 'cb', name: 'Vincent Crabbe', position: 'Golpeador', number: 3, yearsActive: 3, achievements: ["Golpeador más intimidante"] },
          { id: 'gg', name: 'Gregory Goyle', position: 'Golpeador', number: 2, yearsActive: 3, achievements: ["Especialista en fuerza"] },
          { id: 'mp', name: 'Miles Bletchley', position: 'Guardián', number: 1, yearsActive: 3, achievements: ["Guardián más joven"] }
        ]
      },      'Ravenclaw': {
        roster: [
          { id: 'cc', name: 'Cho Chang', position: 'Buscadora', number: 7, yearsActive: 5, achievements: ["Velocidad récord en captura de Snitch"] },
          { id: 'rd', name: 'Roger Davies', position: 'Cazador', number: 9, yearsActive: 4, achievements: ["Goleador del año - Liga Escolar"] },
          { id: 'js', name: 'Jeremy Stretton', position: 'Cazador', number: 6, yearsActive: 3, achievements: ["Pase perfecto - 95% precisión"] },
          { id: 'rb', name: 'Randolph Burrow', position: 'Cazador', number: 12, yearsActive: 2, achievements: ["Promesa del año - Mejor novato"] },
          { id: 'jq', name: 'Jason Samuels', position: 'Golpeador', number: 4, yearsActive: 4, achievements: ["Defensor implacable del aire"] },
          { id: 'ag', name: 'Anthony Goldstein', position: 'Golpeador', number: 3, yearsActive: 3, achievements: ["Jugada defensiva del año"] },
          { id: 'gb', name: 'Grant Page', position: 'Guardián', number: 1, yearsActive: 4, achievements: ["Portero del año - 89% paradas"] }
        ]
      },
      'Hufflepuff': {
        roster: [
          { id: 'cd', name: 'Cedric Diggory', position: 'Buscador', number: 7, yearsActive: 5, achievements: ["Leyenda viviente de Hufflepuff"] },
          { id: 'zs', name: 'Zacharias Smith', position: 'Cazador', number: 9, yearsActive: 3, achievements: ["Anotador más consistente del equipo"] },
          { id: 'hm', name: 'Heidi Macavoy', position: 'Cazadora', number: 8, yearsActive: 4, achievements: ["Mejor jugadora femenina - 3 años"] },
          { id: 'tm', name: 'Tamsin Applebee', position: 'Cazadora', number: 6, yearsActive: 3, achievements: ["Especialista en corners y tiros libres"] },
          { id: 'mc', name: 'Malcolm Preece', position: 'Golpeador', number: 4, yearsActive: 4, achievements: ["Golpeador más técnico y preciso"] },
          { id: 'ac', name: 'Andrew Kirke', position: 'Golpeador', number: 3, yearsActive: 2, achievements: ["Revelación del año - Mejor debutante"] },          { id: 'hs', name: 'Herbert Fleet', position: 'Guardián', number: 1, yearsActive: 5, achievements: ["Guardián más confiable - 92% paradas"] }
        ]
      },
      'Chudley Cannons': {
        roster: [
          { id: 'rw', name: 'Ron Weasley', position: 'Guardián', number: 1, yearsActive: 2, achievements: ["Guardián estrella en ascenso"] },
          { id: 'bc1', name: 'Barry Ryan', position: 'Cazador', number: 9, yearsActive: 8, achievements: ["Veterano del equipo - 200+ partidos"] },
          { id: 'bc2', name: 'Joey Jenkins', position: 'Cazador', number: 7, yearsActive: 6, achievements: ["Especialista en jugadas rápidas"] },
          { id: 'bc3', name: 'Galvin Gudgeon', position: 'Cazador', number: 11, yearsActive: 4, achievements: ["Mejor anotador de la temporada"] },
          { id: 'bb1', name: 'Roderick Plumpton', position: 'Golpeador', number: 4, yearsActive: 7, achievements: ["Defensor más temido de la liga"] },
          { id: 'bb2', name: 'Dragomir Gorgovitch', position: 'Golpeador', number: 3, yearsActive: 5, achievements: ["Mejor golpeador defensivo"] },
          { id: 'bs', name: 'Cho Chang Jr.', position: 'Buscadora', number: 8, yearsActive: 3, achievements: ["Promesa más brillante del equipo"] }
        ]
      },
      'Holyhead Harpies': {
        roster: [
          { id: 'gw', name: 'Ginny Weasley', position: 'Cazadora', number: 7, yearsActive: 4, achievements: ["Estrella emergente del Quidditch"] },
          { id: 'hh1', name: 'Wilda Griffiths', position: 'Cazadora', number: 9, yearsActive: 9, achievements: ["Capitana y líder histórica"] },
          { id: 'hh2', name: 'Valmai Morgan', position: 'Cazadora', number: 6, yearsActive: 7, achievements: ["Anotadora más precisa del equipo"] },
          { id: 'hh3', name: 'Gwendolyn Morgan', position: 'Golpeadora', number: 4, yearsActive: 6, achievements: ["Hermana legendaria"] },
          { id: 'hh4', name: 'Gwenog Jones', position: 'Golpeadora', number: 2, yearsActive: 10, achievements: ["Capitana legendaria retirada"] },
          { id: 'hh5', name: 'Glynnis Griffiths', position: 'Guardiana', number: 1, yearsActive: 8, achievements: ["Portera más confiable de la liga"] },
          { id: 'hh6', name: 'Artemis Fido', position: 'Buscadora', number: 3, yearsActive: 5, achievements: ["Velocidad supersónica certificada"] }
        ]
      }
    };

    return teamMockData[teamName] || { roster: [] };
  };

  useEffect(() => {
    // Get the real match from virtual time manager
    setIsLoading(true);
    
    const timeState = virtualTimeManager.getState();
    if (timeState.temporadaActiva && matchId) {
      const foundMatch = timeState.temporadaActiva.partidos.find(p => p.id === matchId);
      
      if (foundMatch) {
        setRealMatch(foundMatch);
        
        // Find teams
        const foundHomeTeam = timeState.temporadaActiva.equipos.find(t => t.id === foundMatch.localId);
        const foundAwayTeam = timeState.temporadaActiva.equipos.find(t => t.id === foundMatch.visitanteId);
        
        setHomeTeam(foundHomeTeam || mockHomeTeam);
        setAwayTeam(foundAwayTeam || mockAwayTeam);
        
        // Convert to MatchDetails format
        const matchDetails: MatchDetails = {
          id: foundMatch.id,
          homeTeam: foundHomeTeam?.name || foundMatch.localId,
          awayTeam: foundAwayTeam?.name || foundMatch.visitanteId,
          homeScore: foundMatch.homeScore || 0,
          awayScore: foundMatch.awayScore || 0,
          status: foundMatch.status === 'scheduled' ? 'upcoming' : 
                 foundMatch.status === 'live' ? 'live' : 'finished',
          minute: foundMatch.currentMinute?.toString(),
          date: new Date(foundMatch.fecha).toLocaleDateString('es-ES'),
          time: new Date(foundMatch.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          league: timeState.temporadaActiva.name || 'Liga Quidditch',
          location: foundMatch.venue || 'Campo de Quidditch',
        };
          setMatch(matchDetails);
        
        // Check if detailed results are available for finished matches
        if (foundMatch.status === 'finished') {
          const detailedResults = matchResultsService.getMatchResult(foundMatch.id);
          setHasDetailedResults(detailedResults !== null);
        }
        
        // Load prediction data and ensure mock predictions exist
        predictionsService.addMockPredictionsForMatch(foundMatch.id);
        const stats = predictionsService.getMatchPredictionStats(foundMatch.id);
        setPredictionStats(stats);
        setUserPrediction(stats.userPrediction || null);// Set default tab based on match status
        if (foundMatch.status === 'scheduled') {
          setActiveTab('predictions'); // Show predictions for upcoming matches
        } else {
          setActiveTab('overview'); // Show timeline for live and finished matches
        }
        
        // Check if match is already in live simulation
        if (foundMatch.status === 'live') {
          const liveState = virtualTimeManager.getEstadoPartidoEnVivo(foundMatch.id);
          if (liveState) {
            setShowLiveSimulation(true);
          }
        }
        
        // Get related matches (next 2 upcoming matches)
        const upcomingMatches = timeState.temporadaActiva.partidos
          .filter(p => p.status === 'scheduled' && p.id !== foundMatch.id)
          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
          .slice(0, 2);
        setRelatedMatches(upcomingMatches);
        
      } else {
        // Fallback to mock data if match not found
        setMatch(mockMatchDetail);
        setHomeTeam(mockHomeTeam);
        setAwayTeam(mockAwayTeam);
      }
    } else {
      // Fallback to mock data
      setMatch(mockMatchDetail);
      setHomeTeam(mockHomeTeam);
      setAwayTeam(mockAwayTeam);
    }
    
    setIsLoading(false);
  }, [matchId, predictionsService]);

  // Check if we have saved finished match data
  useEffect(() => {
    if (matchId && match && match.status === 'finished') {
      const savedData = predictionsService.getFinishedMatchData(matchId);
      if (savedData) {
        setFinishedMatchData(savedData);
      } else if (realMatch) {
        // Save current match data for future reference
        const timelineEvents = [
          { minute: 0, event: 'Inicio del partido', score: { home: 0, away: 0 } },
          { minute: 45, event: 'Final del primer tiempo', score: { home: Math.floor(realMatch.homeScore! / 2), away: Math.floor(realMatch.awayScore! / 2) } },
          { minute: 90, event: 'Final del partido', score: { home: realMatch.homeScore!, away: realMatch.awayScore! } }
        ];

        const winner: 'home' | 'away' | 'draw' = 
          realMatch.homeScore! > realMatch.awayScore! ? 'home' :
          realMatch.awayScore! > realMatch.homeScore! ? 'away' : 'draw';

        const matchData: FinishedMatchData = {
          matchId: realMatch.id,
          finalScore: {
            home: realMatch.homeScore!,
            away: realMatch.awayScore!
          },
          winner,
          timeline: timelineEvents,
          predictions: predictionStats!,
          finishedAt: new Date()
        };

        predictionsService.saveFinishedMatchData(matchData);
        setFinishedMatchData(matchData);
      }
    }
  }, [matchId, match, realMatch, predictionStats, predictionsService]);

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
  };

  const handlePrediction = async (winner: 'home' | 'away' | 'draw') => {
    if (!match || !isAuthenticated) return;
    
    setIsPredicting(true);
    try {
      const prediction = predictionsService.createPrediction(match.id, winner);
      setUserPrediction(prediction);
      // Update prediction stats
      const updatedStats = predictionsService.getMatchPredictionStats(match.id);
      setPredictionStats(updatedStats);
    } catch (error) {
      console.error('Error creating prediction:', error);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleStartMatch = async () => {
    if (!realMatch || realMatch.status !== 'live') return;
    
    setIsStartingMatch(true);
    try {
      const liveState = await virtualTimeManager.comenzarPartidoEnVivo(realMatch.id);
      if (liveState) {
        setShowLiveSimulation(true);
      }
    } catch (error) {
      console.error('Error starting match:', error);
    } finally {
      setIsStartingMatch(false);
    }
  };

  const canPredict = () => {
    return match && (match.status === 'upcoming' || (match.status === 'live' && !showLiveSimulation));
  };  const canBet = () => {
    return userCanBet && match && (match.status === 'upcoming' || match.status === 'live');
  };
  // Get available tabs based on match status and user permissions
  const availableTabs = tabs.filter(tab => {
    if (tab.id === 'betting' && !canBet()) return false;
    if (tab.id === 'detailed-analysis' && (!hasDetailedResults || match?.status !== 'finished')) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.magicalLoader}>
          <div className={styles.goldenSnitch}></div>
          <p className={styles.loadingText}>Convocando la magia del Quidditch...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>🏟️</div>
          <h2>Partido no encontrado</h2>
          <p>El encuentro que buscas parece haber volado más alto que una Snitch Dorada.</p>
          <Link to="/matches">
            <Button>Volver a Partidos</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.magicalContainer}>
      {/* Magical Background Elements */}
      <div className={styles.magicalBackground}>
        <div className={styles.floatingParticle}></div>
        <div className={styles.floatingParticle}></div>
        <div className={styles.floatingParticle}></div>
      </div>

      {/* Breadcrumbs */}
      <nav className={styles.breadcrumbs}>
        <Link to="/" className={styles.breadcrumbLink}>
          <span className={styles.breadcrumbIcon}>🏠</span>
          Inicio
        </Link>
        <span className={styles.breadcrumbSeparator}>✨</span>
        <Link to="/matches" className={styles.breadcrumbLink}>
          <span className={styles.breadcrumbIcon}>⚡</span>
          Partidos
        </Link>
        <span className={styles.breadcrumbSeparator}>✨</span>
        <span className={styles.breadcrumbCurrent}>
          {match.homeTeam} vs {match.awayTeam}
        </span>
      </nav>

      {/* Match Header */}
      <header className={styles.matchHeader}>
        <div className={styles.statusBadgeContainer}>
          {match.status === 'live' && (
            <div className={`${styles.statusBadge} ${styles.live}`}>
              <span className={styles.statusIcon}>🔴</span>
              EN VIVO
            </div>
          )}
          {match.status === 'finished' && (
            <div className={`${styles.statusBadge} ${styles.finished}`}>
              <span className={styles.statusIcon}>✅</span>
              FINALIZADO
            </div>
          )}
          {match.status === 'upcoming' && (
            <div className={`${styles.statusBadge} ${styles.upcoming}`}>
              <span className={styles.statusIcon}>⏰</span>
              PRÓXIMO
            </div>
          )}
        </div>

        <div className={styles.matchTitle}>
          <h1 className={styles.title}>
            <span className={styles.titleAccent}>Duelo Mágico</span>
            {match.homeTeam} vs {match.awayTeam}
          </h1>
          <div className={styles.matchMeta}>
            <span className={styles.metaItem}>
              <span className={styles.metaIcon}>📅</span>
              {match.date}
            </span>
            <span className={styles.metaItem}>
              <span className={styles.metaIcon}>🕐</span>
              {match.time}
            </span>
            <span className={styles.metaItem}>
              <span className={styles.metaIcon}>🏆</span>
              {match.league}
            </span>
            <span className={styles.metaItem}>
              <span className={styles.metaIcon}>🏟️</span>
              {match.location}
            </span>
          </div>
        </div>
      </header>

      {/* Magical Scoreboard */}
      <section className={styles.magicalScoreboard}>
        <div className={styles.teamContainer}>
          <div className={`${styles.teamCard} ${styles.homeTeam}`}>
            <div className={styles.teamBadge}>Local</div>
            <TeamLogo teamName={match.homeTeam} size="xl" className={styles.teamLogo} />
            <h2 className={styles.teamName}>{match.homeTeam}</h2>
            <div className={styles.teamScore}>{match.homeScore}</div>
          </div>

          <div className={styles.scoreCenter}>
            <div className={styles.vsContainer}>
              <span className={styles.vsText}>VS</span>
              <div className={styles.magicalOrb}></div>
            </div>
            <div className={styles.matchStatus}>
              {match.status === 'live' && match.minute && (
                <div className={styles.liveTimer}>
                  <span className={styles.timerIcon}>⚡</span>
                  {match.minute}
                </div>
              )}
              {match.status === 'finished' && (
                <div className={styles.finalIndicator}>
                  <span className={styles.finalIcon}>🏁</span>
                  Final
                </div>
              )}
              {match.status === 'upcoming' && (
                <div className={styles.upcomingIndicator}>
                  <span className={styles.upcomingIcon}>🌟</span>
                  Próximamente
                </div>
              )}
            </div>
          </div>

          <div className={`${styles.teamCard} ${styles.awayTeam}`}>
            <div className={styles.teamBadge}>Visitante</div>
            <TeamLogo teamName={match.awayTeam} size="xl" className={styles.teamLogo} />
            <h2 className={styles.teamName}>{match.awayTeam}</h2>
            <div className={styles.teamScore}>{match.awayScore}</div>
          </div>
        </div>

        {/* Quick Actions */}
        {canBet() && (
          <div className={styles.quickActions}>
            <Link to={`/betting/${match.id}`}>
              <Button className={styles.primaryAction}>
                <span className={styles.actionIcon}>💎</span>
                Apostar en este Duelo
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Magical Tab Navigation */}
      <nav className={styles.tabNavigation}>
        <div className={styles.tabContainer}>
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => handleTabClick(tab.id)}
              title={tab.description}
            >
              <span className={styles.tabIcon}>
                {activeTab === tab.id ? tab.magicalIcon : tab.icon}
              </span>
              <span className={styles.tabLabel}>{tab.label}</span>
              {activeTab === tab.id && <div className={styles.tabIndicator}></div>}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      <main className={styles.tabContent}>        {activeTab === 'overview' && (
          <div className={styles.overviewTab}>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>⚡</span>
                Cronología en Vivo
              </h2>
              
              {match.status === 'upcoming' && (
                <div className={styles.timelineUnavailable}>
                  <div className={styles.unavailableIcon}>⏰</div>
                  <h3>Cronología No Disponible</h3>
                  <p>
                    La cronología en vivo estará disponible cuando el duelo mágico comience. 
                    Mientras tanto, puedes revisar las predicciones y estadísticas de los equipos.
                  </p>
                  <div className={styles.upcomingMatchInfo}>
                    <div className={styles.matchCountdown}>
                      <span className={styles.countdownLabel}>Inicio programado:</span>
                      <span className={styles.countdownTime}>{match.date} a las {match.time}</span>
                    </div>
                  </div>
                </div>
              )}

              {match.status === 'live' && (
                <div className={styles.liveTimeline}>
                  {realMatch && homeTeam && awayTeam ? (
                    <>
                      {!showLiveSimulation && (
                        <div className={styles.liveReadyCard}>
                          <div className={styles.liveReadyIcon}>🔴</div>
                          <h3>Partido Listo para Comenzar</h3>
                          <p>La cronología en vivo comenzará cuando inicies la simulación del duelo.</p>
                          <Button 
                            onClick={handleStartMatch} 
                            className={styles.startMatchButton}
                            isLoading={isStartingMatch}
                            disabled={isStartingMatch}
                          >
                            <span className={styles.actionIcon}>�</span>
                            {isStartingMatch ? 'Invocando la Magia...' : 'Iniciar Cronología'}
                          </Button>
                        </div>
                      )}

                      {showLiveSimulation && (
                        <div className={styles.liveTimelineContainer}>
                          <div className={styles.timelineHeader}>
                            <div className={styles.liveIndicator}>
                              <span className={styles.liveDot}></span>
                              EN VIVO
                            </div>
                            <div className={styles.currentMinute}>
                              Minuto: {realMatch.currentMinute || 0}'
                            </div>
                          </div>
                          
                          <LiveMatchViewer 
                            match={realMatch} 
                            homeTeam={homeTeam} 
                            awayTeam={awayTeam}
                            refreshInterval={3}
                            onMatchEnd={(endedMatchState) => {
                              console.log('Match ended:', endedMatchState);
                              virtualTimeManager.finalizarPartidoEnVivo(realMatch.id);
                              setShowLiveSimulation(false);
                              window.location.reload();
                            }}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.timelineError}>
                      <div className={styles.errorIcon}>⚠️</div>
                      <h3>Error al Cargar Cronología</h3>
                      <p>No se pudieron cargar los datos del partido en vivo.</p>
                    </div>
                  )}
                </div>
              )}              {match.status === 'finished' && (
                <div className={styles.finishedTimeline}>
                  <div className={styles.timelineHeader}>
                    <div className={styles.finishedIndicator}>
                      <span className={styles.finishedIcon}>🏁</span>
                      FINALIZADO
                    </div>
                    <div className={styles.finalScore}>
                      {match.homeTeam} {match.homeScore} - {match.awayTeam} {match.awayScore}
                    </div>
                  </div>
                  
                  <div className={styles.matchSummary}>
                    <div className={styles.summaryCard}>
                      <h3>Resumen del Duelo</h3>
                      <div className={styles.matchResult}>
                        <div className={styles.winner}>
                          🏆 {match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam}
                        </div>
                        <div className={styles.resultDetails}>
                          <span>Victoria por {Math.abs(match.homeScore - match.awayScore)} puntos</span>
                        </div>
                      </div>
                      
                      {userPrediction && (
                        <div className={styles.predictionResult}>
                          <h4>Tu Predicción</h4>
                          <div className={userPrediction.isCorrect ? styles.correctPrediction : styles.incorrectPrediction}>
                            <span className={styles.predictionIcon}>
                              {userPrediction.isCorrect ? '🎯' : '❌'}
                            </span>
                            <span>
                              {userPrediction.isCorrect ? '¡Predicción acertada!' : 'Predicción incorrecta'}
                            </span>
                          </div>
                        </div>
                      )}

                      {finishedMatchData && (
                        <div className={styles.communityPredictionsResult}>
                          <h4>Resultados de Predicciones</h4>
                          <div className={styles.predictionsStats}>
                            <p>📊 Total de predicciones: <strong>{finishedMatchData.predictions.totalPredictions}</strong></p>
                            <p>🎯 Predicciones correctas: <strong>
                              {finishedMatchData.winner === 'home' ? finishedMatchData.predictions.homeWinPredictions :
                               finishedMatchData.winner === 'away' ? finishedMatchData.predictions.awayWinPredictions :
                               finishedMatchData.predictions.drawPredictions}
                            </strong></p>
                            <p>✨ Finalizado el: <strong>{new Date(finishedMatchData.finishedAt).toLocaleString('es-ES')}</strong></p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.timelineHistoryCard}>
                      <h4>Cronología del Partido</h4>
                      <div className={styles.timelineHistory}>
                        {finishedMatchData && finishedMatchData.timeline ? (
                          finishedMatchData.timeline.map((event, index) => (
                            <div key={index} className={styles.timelineEvent}>
                              <span className={styles.eventTime}>{event.minute}'</span>
                              <span className={styles.eventDescription}>{event.event}</span>
                              {event.score && (
                                <span className={styles.eventScore}>
                                  {event.score.home} - {event.score.away}
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <>
                            <div className={styles.timelineEvent}>
                              <span className={styles.eventTime}>0'</span>
                              <span className={styles.eventDescription}>🏃‍♂️ Inicio del duelo mágico</span>
                            </div>
                            <div className={styles.timelineEvent}>
                              <span className={styles.eventTime}>Final</span>
                              <span className={styles.eventDescription}>
                                🟡 Snitch capturada - {match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam} obtiene la victoria
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className={styles.timelineNote}>
                        <small>
                          {finishedMatchData ? 
                            '✨ Cronología completa guardada del partido simulado' : 
                            '💡 La cronología detallada estará disponible en futuras simulaciones'}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className={styles.predictionsTab}>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🔮</span>
                Predicciones Mágicas
              </h2>
              
              {userPrediction ? (
                <div className={styles.userPredictionCard}>
                  <h3>Tu Visión del Futuro</h3>
                  <div className={styles.predictionDisplay}>
                    <span className={styles.predictionTeam}>
                      {userPrediction.predictedWinner === 'home' ? match.homeTeam :
                       userPrediction.predictedWinner === 'away' ? match.awayTeam :
                       'Empate'}
                    </span>
                    <span className={styles.confidenceLevel}>
                      Confianza: {userPrediction.confidence}/5 ⭐
                    </span>
                  </div>
                </div>
              ) : (
                canPredict() && isAuthenticated && (
                  <div className={styles.predictionInterface}>
                    <h3>¿Qué dice tu bola de cristal?</h3>
                    <p>Consulta las estrellas y haz tu predicción sobre este duelo épico.</p>
                    <div className={styles.predictionButtons}>
                      <Button 
                        variant="outline"
                        onClick={() => handlePrediction('home')}
                        disabled={isPredicting}
                        className={styles.predictionButton}
                      >
                        <TeamLogo teamName={match.homeTeam} size="sm" />
                        {match.homeTeam}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handlePrediction('draw')}
                        disabled={isPredicting}
                        className={styles.predictionButton}
                      >
                        <span className={styles.drawIcon}>⚖️</span>
                        Empate
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handlePrediction('away')}
                        disabled={isPredicting}
                        className={styles.predictionButton}
                      >
                        <TeamLogo teamName={match.awayTeam} size="sm" />
                        {match.awayTeam}
                      </Button>
                    </div>
                  </div>
                )
              )}

              {!isAuthenticated && (
                <div className={styles.authPrompt}>
                  <p>
                    <Link to="/login" className={styles.authLink}>
                      Inicia sesión
                    </Link> 
                    para desbloquear el poder de las predicciones mágicas.
                  </p>
                </div>
              )}

              {predictionStats && (
                <div className={styles.communityPredictions}>
                  <h3>Sabiduría de la Comunidad</h3>
                  <div className={styles.predictionStats}>
                    <div className={styles.predictionBars}>
                      <div 
                        className={styles.predictionBar}
                        style={{width: `${predictionStats.homeWinPercentage}%`}}
                      >
                        <span>{match.homeTeam}</span>
                        <span>{predictionStats.homeWinPercentage.toFixed(1)}%</span>
                      </div>
                      <div 
                        className={styles.predictionBar}
                        style={{width: `${predictionStats.drawPercentage}%`}}
                      >
                        <span>Empate</span>
                        <span>{predictionStats.drawPercentage.toFixed(1)}%</span>
                      </div>
                      <div 
                        className={styles.predictionBar}
                        style={{width: `${predictionStats.awayWinPercentage}%`}}
                      >
                        <span>{match.awayTeam}</span>
                        <span>{predictionStats.awayWinPercentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <p className={styles.totalPredictions}>
                      {predictionStats.totalPredictions} magos han consultado sus cristales
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}        {activeTab === 'stats' && (
          <div className={styles.statsTab}>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>⚡</span>
                Análisis Místico de Rendimiento
              </h2>
              <div className={styles.statsContainer}>
                {homeTeam && awayTeam ? (
                  <div className={styles.teamsComparison}>
                    <div className={styles.comparisonGrid}>
                      <div className={styles.teamStats}>
                        <div className={styles.teamStatsHeader}>
                          <TeamLogo teamName={homeTeam.name} size="md" />
                          <h3>{homeTeam.name}</h3>
                        </div>
                        <div className={styles.statsList}>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Fuerza de Ataque</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${homeTeam.attackStrength}%`}}
                              ></div>
                              <span className={styles.statBarValue}>{homeTeam.attackStrength}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Fuerza Defensiva</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${homeTeam.defenseStrength}%`}}
                              ></div>                              <span className={styles.statBarValue}>{homeTeam.defenseStrength}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Habilidad Buscador</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${homeTeam.seekerSkill}%`}}
                              ></div>
                              <span className={styles.statBarValue}>{homeTeam.seekerSkill}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Habilidad Cazadores</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${homeTeam.chaserSkill}%`}}
                              ></div>
                              <span className={styles.statBarValue}>{homeTeam.chaserSkill}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Habilidad Guardián</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${homeTeam.keeperSkill}%`}}
                              ></div>
                              <span className={styles.statBarValue}>{homeTeam.keeperSkill}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Habilidad Golpeadores</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${homeTeam.beaterSkill}%`}}
                              ></div>
                              <span className={styles.statBarValue}>{homeTeam.beaterSkill}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={styles.vsStatsCenter}>
                        <div className={styles.comparisonTitle}>
                          <span className={styles.magicalVs}>⚡ VS ⚡</span>
                        </div>
                        <div className={styles.overallComparison}>
                          <div className={styles.powerMeter}>
                            <div className={styles.powerLabel}>Poder Mágico Total</div>
                            <div className={styles.powerBars}>
                              <div className={styles.homePowerBar}>
                                <span>{Math.round((homeTeam.attackStrength + homeTeam.defenseStrength + homeTeam.seekerSkill) / 3)}</span>
                              </div>
                              <div className={styles.awayPowerBar}>
                                <span>{Math.round((awayTeam.attackStrength + awayTeam.defenseStrength + awayTeam.seekerSkill) / 3)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={styles.teamStats}>
                        <div className={styles.teamStatsHeader}>
                          <TeamLogo teamName={awayTeam.name} size="md" />
                          <h3>{awayTeam.name}</h3>
                        </div>
                        <div className={styles.statsList}>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Fuerza de Ataque</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${awayTeam.attackStrength}%`}}
                              ></div>                              <span className={styles.statBarValue}>{awayTeam.attackStrength}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Fuerza Defensiva</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${awayTeam.defenseStrength}%`}}
                              ></div>
                              <span className={styles.statBarValue}>{awayTeam.defenseStrength}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Habilidad Buscador</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${awayTeam.seekerSkill}%`}}
                              ></div>
                              <span className={styles.statBarValue}>{awayTeam.seekerSkill}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Habilidad Cazadores</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${awayTeam.chaserSkill}%`}}
                              ></div>
                              <span className={styles.statBarValue}>{awayTeam.chaserSkill}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Habilidad Guardián</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${awayTeam.keeperSkill}%`}}
                              ></div>
                              <span className={styles.statBarValue}>{awayTeam.keeperSkill}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Habilidad Golpeadores</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${awayTeam.beaterSkill}%`}}
                              ></div>
                              <span className={styles.statBarValue}>{awayTeam.beaterSkill}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.comingSoon}>
                    <div className={styles.comingSoonIcon}>⚡</div>
                    <h3>Cargando Análisis Mágico</h3>
                    <p>Los pergaminos con las estadísticas detalladas están siendo preparados por nuestros escribas mágicos.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}        {activeTab === 'lineups' && (
          <div className={styles.lineupsTab}>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🏆</span>
                Formaciones Mágicas
              </h2>
              <div className={styles.lineupsContainer}>
                {homeTeam && awayTeam ? (
                  <div className={styles.lineupsGrid}>
                    <div className={styles.teamLineup}>
                      <div className={styles.lineupHeader}>
                        <TeamLogo teamName={homeTeam.name} size="lg" />
                        <h3>{homeTeam.name}</h3>
                        <span className={styles.teamType}>Equipo Local</span>
                      </div>
                      <div className={styles.positionsList}>
                        {(() => {
                          const rosterData = getTeamRosterData(homeTeam.name);
                          const roster = rosterData.roster;
                          
                          return (
                            <>
                              {/* Guardián */}
                              <div className={styles.positionGroup}>
                                <h4 className={styles.positionTitle}>
                                  <span className={styles.positionIcon}>🥅</span>
                                  Guardián
                                </h4>
                                {roster.filter(player => player.position === 'Guardián').map(player => (
                                  <div key={player.id} className={styles.playerCard}>
                                    <div className={styles.playerHeader}>
                                      <div className={styles.playerName}>{player.name}</div>
                                      <div className={styles.playerNumber}>#{player.number}</div>
                                    </div>
                                    <div className={styles.playerStats}>
                                      <span className={styles.playerStat}>Habilidad: {homeTeam.keeperSkill}</span>
                                      <span className={styles.playerStat}>Años activo: {player.yearsActive}</span>
                                      <span className={styles.playerStat}>Especialidad: Paradas Mágicas</span>
                                    </div>
                                    {player.achievements.length > 0 && (
                                      <div className={styles.playerAchievements}>
                                        <span className={styles.achievementLabel}>🏆 {player.achievements[0]}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Cazadores */}
                              <div className={styles.positionGroup}>
                                <h4 className={styles.positionTitle}>
                                  <span className={styles.positionIcon}>⚡</span>
                                  Cazadores
                                </h4>
                                {roster.filter(player => player.position === 'Cazador' || player.position === 'Cazadora').map(player => (
                                  <div key={player.id} className={styles.playerCard}>
                                    <div className={styles.playerHeader}>
                                      <div className={styles.playerName}>{player.name}</div>
                                      <div className={styles.playerNumber}>#{player.number}</div>
                                    </div>
                                    <div className={styles.playerStats}>
                                      <span className={styles.playerStat}>Habilidad: {homeTeam.chaserSkill}</span>
                                      <span className={styles.playerStat}>Años activo: {player.yearsActive}</span>
                                      <span className={styles.playerStat}>Especialidad: Anotación</span>
                                    </div>
                                    {player.achievements.length > 0 && (
                                      <div className={styles.playerAchievements}>
                                        <span className={styles.achievementLabel}>🏆 {player.achievements[0]}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Golpeadores */}
                              <div className={styles.positionGroup}>
                                <h4 className={styles.positionTitle}>
                                  <span className={styles.positionIcon}>🏏</span>
                                  Golpeadores
                                </h4>
                                {roster.filter(player => player.position === 'Golpeador').map(player => (
                                  <div key={player.id} className={styles.playerCard}>
                                    <div className={styles.playerHeader}>
                                      <div className={styles.playerName}>{player.name}</div>
                                      <div className={styles.playerNumber}>#{player.number}</div>
                                    </div>
                                    <div className={styles.playerStats}>
                                      <span className={styles.playerStat}>Habilidad: {homeTeam.beaterSkill}</span>
                                      <span className={styles.playerStat}>Años activo: {player.yearsActive}</span>
                                      <span className={styles.playerStat}>Especialidad: Defensa</span>
                                    </div>
                                    {player.achievements.length > 0 && (
                                      <div className={styles.playerAchievements}>
                                        <span className={styles.achievementLabel}>🏆 {player.achievements[0]}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Buscador */}
                              <div className={styles.positionGroup}>
                                <h4 className={styles.positionTitle}>
                                  <span className={styles.positionIcon}>🟡</span>
                                  Buscador
                                </h4>
                                {roster.filter(player => player.position === 'Buscador' || player.position === 'Buscadora').map(player => (
                                  <div key={player.id} className={styles.playerCard}>
                                    <div className={styles.playerHeader}>
                                      <div className={styles.playerName}>{player.name}</div>
                                      <div className={styles.playerNumber}>#{player.number}</div>
                                    </div>
                                    <div className={styles.playerStats}>
                                      <span className={styles.playerStat}>Habilidad: {homeTeam.seekerSkill}</span>
                                      <span className={styles.playerStat}>Años activo: {player.yearsActive}</span>
                                      <span className={styles.playerStat}>Especialidad: Captura de Snitch</span>
                                    </div>
                                    {player.achievements.length > 0 && (
                                      <div className={styles.playerAchievements}>
                                        <span className={styles.achievementLabel}>🏆 {player.achievements[0]}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className={styles.lineupVs}>
                      <div className={styles.fieldVisualization}>
                        <div className={styles.quidditchField}>
                          <div className={styles.fieldCenter}>
                            <span className={styles.fieldIcon}>🏟️</span>
                            <span className={styles.fieldLabel}>Campo de Quidditch</span>
                          </div>
                          <div className={styles.fieldGoals}>
                            <div className={styles.goalLeft}>🥅</div>
                            <div className={styles.goalRight}>🥅</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.teamLineup}>
                      <div className={styles.lineupHeader}>
                        <TeamLogo teamName={awayTeam.name} size="lg" />
                        <h3>{awayTeam.name}</h3>
                        <span className={styles.teamType}>Equipo Visitante</span>
                      </div>
                      <div className={styles.positionsList}>
                        {(() => {
                          const rosterData = getTeamRosterData(awayTeam.name);
                          const roster = rosterData.roster;
                          
                          return (
                            <>
                              {/* Guardián */}
                              <div className={styles.positionGroup}>
                                <h4 className={styles.positionTitle}>
                                  <span className={styles.positionIcon}>🥅</span>
                                  Guardián
                                </h4>
                                {roster.filter(player => player.position === 'Guardián').map(player => (
                                  <div key={player.id} className={styles.playerCard}>
                                    <div className={styles.playerHeader}>
                                      <div className={styles.playerName}>{player.name}</div>
                                      <div className={styles.playerNumber}>#{player.number}</div>
                                    </div>
                                    <div className={styles.playerStats}>
                                      <span className={styles.playerStat}>Habilidad: {awayTeam.keeperSkill}</span>
                                      <span className={styles.playerStat}>Años activo: {player.yearsActive}</span>
                                      <span className={styles.playerStat}>Especialidad: Paradas Mágicas</span>
                                    </div>
                                    {player.achievements.length > 0 && (
                                      <div className={styles.playerAchievements}>
                                        <span className={styles.achievementLabel}>🏆 {player.achievements[0]}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Cazadores */}
                              <div className={styles.positionGroup}>
                                <h4 className={styles.positionTitle}>
                                  <span className={styles.positionIcon}>⚡</span>
                                  Cazadores
                                </h4>
                                {roster.filter(player => player.position === 'Cazador' || player.position === 'Cazadora').map(player => (
                                  <div key={player.id} className={styles.playerCard}>
                                    <div className={styles.playerHeader}>
                                      <div className={styles.playerName}>{player.name}</div>
                                      <div className={styles.playerNumber}>#{player.number}</div>
                                    </div>
                                    <div className={styles.playerStats}>
                                      <span className={styles.playerStat}>Habilidad: {awayTeam.chaserSkill}</span>
                                      <span className={styles.playerStat}>Años activo: {player.yearsActive}</span>
                                      <span className={styles.playerStat}>Especialidad: Anotación</span>
                                    </div>
                                    {player.achievements.length > 0 && (
                                      <div className={styles.playerAchievements}>
                                        <span className={styles.achievementLabel}>🏆 {player.achievements[0]}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Golpeadores */}
                              <div className={styles.positionGroup}>
                                <h4 className={styles.positionTitle}>
                                  <span className={styles.positionIcon}>🏏</span>
                                  Golpeadores
                                </h4>
                                {roster.filter(player => player.position === 'Golpeador').map(player => (
                                  <div key={player.id} className={styles.playerCard}>
                                    <div className={styles.playerHeader}>
                                      <div className={styles.playerName}>{player.name}</div>
                                      <div className={styles.playerNumber}>#{player.number}</div>
                                    </div>
                                    <div className={styles.playerStats}>
                                      <span className={styles.playerStat}>Habilidad: {awayTeam.beaterSkill}</span>
                                      <span className={styles.playerStat}>Años activo: {player.yearsActive}</span>
                                      <span className={styles.playerStat}>Especialidad: Defensa</span>
                                    </div>
                                    {player.achievements.length > 0 && (
                                      <div className={styles.playerAchievements}>
                                        <span className={styles.achievementLabel}>🏆 {player.achievements[0]}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Buscador */}
                              <div className={styles.positionGroup}>
                                <h4 className={styles.positionTitle}>
                                  <span className={styles.positionIcon}>🟡</span>
                                  Buscador
                                </h4>
                                {roster.filter(player => player.position === 'Buscador' || player.position === 'Buscadora').map(player => (
                                  <div key={player.id} className={styles.playerCard}>
                                    <div className={styles.playerHeader}>
                                      <div className={styles.playerName}>{player.name}</div>
                                      <div className={styles.playerNumber}>#{player.number}</div>
                                    </div>
                                    <div className={styles.playerStats}>
                                      <span className={styles.playerStat}>Habilidad: {awayTeam.seekerSkill}</span>
                                      <span className={styles.playerStat}>Años activo: {player.yearsActive}</span>
                                      <span className={styles.playerStat}>Especialidad: Captura de Snitch</span>
                                    </div>
                                    {player.achievements.length > 0 && (
                                      <div className={styles.playerAchievements}>
                                        <span className={styles.achievementLabel}>🏆 {player.achievements[0]}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.comingSoon}>
                    <div className={styles.comingSoonIcon}>🏆</div>
                    <h3>Cargando Alineaciones</h3>
                    <p>Los entrenadores están finalizando sus estrategias. Las formaciones estarán disponibles pronto.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}{activeTab === 'head-to-head' && (
          <div className={styles.headToHeadTab}>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🔥</span>
                Historial de Duelos Épicos
              </h2>
              <div className={styles.h2hContainer}>
                {homeTeam && awayTeam ? (
                  <div className={styles.historyContent}>
                    <div className={styles.historyHeader}>
                      <div className={styles.historyTeams}>
                        <div className={styles.historyTeam}>
                          <TeamLogo teamName={homeTeam.name} size="lg" />
                          <span className={styles.historyTeamName}>{homeTeam.name}</span>
                        </div>
                        <div className={styles.historyVs}>
                          <span className={styles.historyVsText}>HISTORIAL</span>
                          <div className={styles.historyRecord}>
                            <div className={styles.recordStats}>
                              <div className={styles.recordStat}>
                                <span className={styles.recordNumber}>7</span>
                                <span className={styles.recordLabel}>Victorias</span>
                              </div>
                              <div className={styles.recordSeparator}>-</div>
                              <div className={styles.recordStat}>
                                <span className={styles.recordNumber}>2</span>
                                <span className={styles.recordLabel}>Empates</span>
                              </div>
                              <div className={styles.recordSeparator}>-</div>
                              <div className={styles.recordStat}>
                                <span className={styles.recordNumber}>5</span>
                                <span className={styles.recordLabel}>Victorias</span>
                              </div>
                            </div>
                            <div className={styles.totalMatches}>
                              14 encuentros disputados
                            </div>
                          </div>
                        </div>
                        <div className={styles.historyTeam}>
                          <TeamLogo teamName={awayTeam.name} size="lg" />
                          <span className={styles.historyTeamName}>{awayTeam.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.historyStats}>
                      <div className={styles.historyStatCard}>
                        <h4>Últimos 5 Encuentros</h4>
                        <div className={styles.recentMatches}>
                          {[
                            { result: 'W', score: '180-120', date: '2025-05-15', venue: 'Hogwarts' },
                            { result: 'L', score: '90-150', date: '2025-03-22', venue: 'Slytherin Dungeons' },
                            { result: 'W', score: '200-170', date: '2025-01-18', venue: 'Hogwarts' },
                            { result: 'W', score: '160-130', date: '2024-11-25', venue: 'Neutral' },
                            { result: 'L', score: '110-140', date: '2024-10-07', venue: 'Slytherin Dungeons' }
                          ].map((match, index) => (
                            <div key={index} className={styles.recentMatch}>
                              <div className={`${styles.matchResult} ${match.result === 'W' ? styles.win : styles.loss}`}>
                                {match.result}
                              </div>
                              <div className={styles.matchDetails}>
                                <span className={styles.matchScore}>{match.score}</span>
                                <span className={styles.matchDate}>{match.date}</span>
                                <span className={styles.matchVenue}>{match.venue}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={styles.historyStatCard}>
                        <h4>Estadísticas de Enfrentamientos</h4>
                        <div className={styles.comparisonStats}>
                          <div className={styles.comparisonStat}>
                            <span className={styles.statName}>Promedio de Puntos (Local)</span>
                            <div className={styles.statComparison}>
                              <div className={styles.statBar}>
                                <div className={styles.homeStatBar} style={{width: '65%'}}>145</div>
                                <div className={styles.awayStatBar} style={{width: '55%'}}>125</div>
                              </div>
                            </div>
                          </div>
                          <div className={styles.comparisonStat}>
                            <span className={styles.statName}>Capturas de Snitch</span>
                            <div className={styles.statComparison}>
                              <div className={styles.statBar}>
                                <div className={styles.homeStatBar} style={{width: '60%'}}>8</div>
                                <div className={styles.awayStatBar} style={{width: '40%'}}>6</div>
                              </div>
                            </div>
                          </div>
                          <div className={styles.comparisonStat}>
                            <span className={styles.statName}>Partidos de más de 200 pts</span>
                            <div className={styles.statComparison}>
                              <div className={styles.statBar}>
                                <div className={styles.homeStatBar} style={{width: '50%'}}>3</div>
                                <div className={styles.awayStatBar} style={{width: '33%'}}>2</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.legendaryMatches}>
                      <h4>Encuentros Legendarios</h4>
                      <div className={styles.legendaryMatchesList}>
                        <div className={styles.legendaryMatch}>
                          <div className={styles.legendaryMatchHeader}>
                            <span className={styles.legendaryIcon}>🏆</span>
                            <span className={styles.legendaryTitle}>La Final de los Milenios</span>
                            <span className={styles.legendaryDate}>2024-06-15</span>
                          </div>
                          <div className={styles.legendaryMatchDetails}>
                            <span className={styles.legendaryScore}>230 - 220</span>
                            <p className={styles.legendaryDescription}>
                              Un enfrentamiento épico que duró 4 horas. La Snitch fue capturada en el último minuto 
                              tras una persecución que recorrió todo el estadio.
                            </p>
                          </div>
                        </div>
                        <div className={styles.legendaryMatch}>
                          <div className={styles.legendaryMatchHeader}>
                            <span className={styles.legendaryIcon}>⚡</span>
                            <span className={styles.legendaryTitle}>El Duelo de los Rayos</span>
                            <span className={styles.legendaryDate}>2023-12-03</span>
                          </div>
                          <div className={styles.legendaryMatchDetails}>
                            <span className={styles.legendaryScore}>180 - 30</span>
                            <p className={styles.legendaryDescription}>
                              Una demostración de dominación absoluta con 15 goles consecutivos 
                              antes de que la Snitch fuera capturada.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.comingSoon}>
                    <div className={styles.comingSoonIcon}>🔥</div>
                    <h3>Cargando Historial</h3>
                    <p>Los archivos de la historia están siendo consultados para revelar los encuentros legendarios.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}        {activeTab === 'betting' && canBet() && (
          <div className={styles.bettingTab}>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>💰</span>
                Mercados de Apuestas Mágicas
              </h2>
              <div className={styles.bettingContainer}>
                <div className={styles.comingSoon}>
                  <div className={styles.comingSoonIcon}>💎</div>
                  <h3>Apuestas Disponibles</h3>
                  <p>Los mercados de apuestas están siendo preparados por nuestros goblins financieros de Gringotts.</p>
                  <div className={styles.featuresPreview}>
                    <ul>
                      <li>🏆 Ganador del partido</li>
                      <li>🎯 Total de puntos anotados</li>
                      <li>⚡ Primer equipo en anotar</li>
                      <li>🟡 Tiempo de captura de la Snitch</li>
                      <li>📊 Apuestas especiales y combinadas</li>
                    </ul>
                  </div>
                  <Link to={`/betting/${match.id}`}>
                    <Button className={styles.bettingCta}>
                      <span className={styles.actionIcon}>🎲</span>
                      Ir a Apuestas Detalladas
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'detailed-analysis' && hasDetailedResults && match && (
          <div className={styles.detailedAnalysisTab}>
            <MatchResultDetail matchId={match.id} />
          </div>
        )}
      </main>

      {/* Related Matches */}
      {relatedMatches.length > 0 && (
        <section className={styles.relatedMatches}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>⚡</span>
            Próximos Duelos Mágicos
          </h2>
          <div className={styles.relatedMatchesGrid}>            {relatedMatches.map((relatedMatch) => {
              // Get the season data to resolve team IDs to team names
              const timeState = virtualTimeManager.getState();
              const homeTeamData = timeState.temporadaActiva?.equipos.find(t => t.id === relatedMatch.localId);
              const awayTeamData = timeState.temporadaActiva?.equipos.find(t => t.id === relatedMatch.visitanteId);
              const homeTeamName = homeTeamData?.name || relatedMatch.localId;
              const awayTeamName = awayTeamData?.name || relatedMatch.visitanteId;
              return (
                <Link 
                  key={relatedMatch.id} 
                  to={`/matches/${relatedMatch.id}`} 
                  className={styles.relatedMatchCard}
                >
                  <div className={styles.relatedMatchHeader}>
                    <div className={styles.relatedMatchTeams}>
                      <TeamLogo teamName={homeTeamName} size="sm" />
                      <span className={styles.relatedMatchVs}>vs</span>
                      <TeamLogo teamName={awayTeamName} size="sm" />
                    </div>
                    <div className={styles.relatedMatchInfo}>
                      <span className={styles.relatedMatchName}>
                        {homeTeamName} vs {awayTeamName}
                      </span>
                      <span className={styles.relatedMatchDate}>
                        {new Date(relatedMatch.fecha).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                  <div className={styles.relatedMatchFooter}>
                    <span className={styles.relatedMatchAction}>Ver Detalles ✨</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default MatchDetailPage;