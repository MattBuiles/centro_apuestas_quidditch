import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import TeamLogo from '@/components/teams/TeamLogo';
import { Team, Match } from '@/types/league';
import { virtualTimeManager } from '@/services/virtualTimeManager';
import { PredictionsService, MatchPredictionStats, Prediction, FinishedMatchData } from '@/services/predictionsService';
import { matchResultsService } from '@/services/matchResultsService';
import { useAuth } from '@/context/AuthContext';

// Import subcomponents
import MatchOverview from './components/MatchOverview';
import MatchPredictions from './components/MatchPredictions';
import MatchStats from './components/MatchStats';
import MatchLineups from './components/MatchLineups';
import MatchHeadToHead from './components/MatchHeadToHead';
import MatchBetting from './components/MatchBetting';
import MatchDetailedAnalysis from './components/MatchDetailedAnalysis';
import MatchRelatedMatches from './components/MatchRelatedMatches';

import styles from './MatchDetailPage.module.css';

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
  const [finishedMatchData, setFinishedMatchData] = useState<FinishedMatchData | null>(null);  // State for detailed match results
  const [hasDetailedResults, setHasDetailedResults] = useState(false);
  const [detailedMatchResult, setDetailedMatchResult] = useState<ReturnType<typeof matchResultsService.getMatchResult> | null>(null);
  
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
        
        // Check if detailed results are available for finished matches
        let finalHomeScore = foundMatch.homeScore || 0;
        let finalAwayScore = foundMatch.awayScore || 0;
        
        if (foundMatch.status === 'finished') {
          const detailedResults = matchResultsService.getMatchResult(foundMatch.id);
          setHasDetailedResults(detailedResults !== null);
          setDetailedMatchResult(detailedResults);
          
          // Use detailed results scores if available (more accurate)
          if (detailedResults) {
            finalHomeScore = detailedResults.finalScore.home;
            finalAwayScore = detailedResults.finalScore.away;
          }
        } else {
          setHasDetailedResults(false);
          setDetailedMatchResult(null);
        }

        // Convert to MatchDetails format with correct scores
        const matchDetails: MatchDetails = {
          id: foundMatch.id,
          homeTeam: foundHomeTeam?.name || foundMatch.localId,
          awayTeam: foundAwayTeam?.name || foundMatch.visitanteId,
          homeScore: finalHomeScore,
          awayScore: finalAwayScore,
          status: foundMatch.status === 'scheduled' ? 'upcoming' : 
                 foundMatch.status === 'live' ? 'live' : 'finished',
          minute: foundMatch.currentMinute?.toString(),
          date: new Date(foundMatch.fecha).toLocaleDateString('es-ES'),
          time: new Date(foundMatch.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          location: foundMatch.venue || 'Campo de Quidditch',
        };
        setMatch(matchDetails);
        
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
    }  }, [matchId, match, realMatch, predictionStats, predictionsService]);
  
  // Listen for prediction updates when matches finish
  useEffect(() => {    const handlePredictionsUpdate = (event: CustomEvent) => {
      console.log(`🎪 PREDICTIONS UPDATE EVENT RECEIVED:`, event.detail);
      const { matchId: updatedMatchId, result } = event.detail;
      
      if (updatedMatchId === matchId && matchId) {
        console.log(`🔮 Processing predictions update for match ${matchId}, result: ${result}`);
        
        // Refresh user prediction to get updated isCorrect status
        const updatedPrediction = predictionsService.getUserPrediction(matchId);
        console.log(`📊 Updated prediction from service:`, updatedPrediction);
        setUserPrediction(updatedPrediction);
        
        // Refresh prediction stats
        const updatedStats = predictionsService.getMatchPredictionStats(matchId);
        setPredictionStats(updatedStats);
        
        console.log(`🔄 About to reload page in 1 second...`);
        // Force component re-render to show updated results
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.log(`⚠️ Event is for different match: ${updatedMatchId} vs current ${matchId}`);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('predictionsUpdated', handlePredictionsUpdate as EventListener);
      
      return () => {
        window.removeEventListener('predictionsUpdated', handlePredictionsUpdate as EventListener);
      };
    }
  }, [matchId, predictionsService]);

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
  };
  
  const handlePrediction = async (winner: 'home' | 'away' | 'draw') => {
    if (!match || !isAuthenticated) return;
    
    console.log(`🎯 UI PREDICTION CREATION for match ${match.id}:`);
    console.log(`   🏠 Home team: "${match.homeTeam}"`);
    console.log(`   🚗 Away team: "${match.awayTeam}"`);
    console.log(`   👤 User clicked: "${winner}"`);
    console.log(`   📊 Match object:`, match);
    console.log(`   🔗 Real match data:`, realMatch);
    
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

  // Generate tabs dynamically based on match status
  const getTabsForMatch = (): TabConfig[] => {
    const baseTabs = [...tabs];
    
    // For finished matches, change 'Cronología' to 'Resumen' and move 'detailed-analysis' after it
    if (match?.status === 'finished') {
      const overviewTabIndex = baseTabs.findIndex(tab => tab.id === 'overview');
      const detailedAnalysisTabIndex = baseTabs.findIndex(tab => tab.id === 'detailed-analysis');
      
      if (overviewTabIndex !== -1) {
        baseTabs[overviewTabIndex] = {
          ...baseTabs[overviewTabIndex],
          label: 'Resumen',
          description: 'Resumen del encuentro finalizado'
        };
      }
      
      // Move detailed-analysis tab to position after overview (resumen)
      if (detailedAnalysisTabIndex !== -1 && overviewTabIndex !== -1) {
        const detailedTab = baseTabs.splice(detailedAnalysisTabIndex, 1)[0];
        baseTabs.splice(overviewTabIndex + 1, 0, detailedTab);
      }
    }
    
    return baseTabs;
  };

  // Get available tabs based on match status and user permissions
  const availableTabs = getTabsForMatch().filter(tab => {
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
            </span>            <span className={styles.metaItem}>
              <span className={styles.metaIcon}>🏆</span>
              Liga Profesional Quidditch
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
        <div className={styles.teamContainer}>          <div className={`${styles.teamCard} ${styles.homeTeam}`}>
            <div className={styles.teamBadge}>Local</div>
            <TeamLogo teamName={match.homeTeam} size="xl" className={styles.teamLogo} />
            <h2 className={styles.teamName}>{match.homeTeam}</h2>
            <div className={styles.teamScore}>{match.homeScore}</div>
            {detailedMatchResult && match.status === 'finished' && (
              <div className={styles.scoreBreakdown}>
                <small>Quaffle: {detailedMatchResult.statistics.quaffleGoals.home * 10}pts</small>
                {detailedMatchResult.statistics.snitchPoints.home > 0 && (
                  <small>Snitch: {detailedMatchResult.statistics.snitchPoints.home}pts</small>
                )}
              </div>
            )}
          </div>

          <div className={styles.scoreCenter}>
            <div className={styles.vsContainer}>
              <span className={styles.vsText}>VS</span>
              <div className={styles.magicalOrb}></div>
            </div>            <div className={styles.matchStatus}>
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
                  {detailedMatchResult && (
                    <div className={styles.detailedIndicator}>
                      <small>Duración: {detailedMatchResult.matchDuration}min</small>
                    </div>
                  )}
                </div>
              )}
              {match.status === 'upcoming' && (
                <div className={styles.upcomingIndicator}>
                  <span className={styles.upcomingIcon}>🌟</span>
                  Próximamente
                </div>
              )}
            </div>
          </div>          <div className={`${styles.teamCard} ${styles.awayTeam}`}>
            <div className={styles.teamBadge}>Visitante</div>
            <TeamLogo teamName={match.awayTeam} size="xl" className={styles.teamLogo} />
            <h2 className={styles.teamName}>{match.awayTeam}</h2>
            <div className={styles.teamScore}>{match.awayScore}</div>
            {detailedMatchResult && match.status === 'finished' && (
              <div className={styles.scoreBreakdown}>
                <small>Quaffle: {detailedMatchResult.statistics.quaffleGoals.away * 10}pts</small>
                {detailedMatchResult.statistics.snitchPoints.away > 0 && (
                  <small>Snitch: {detailedMatchResult.statistics.snitchPoints.away}pts</small>
                )}
              </div>
            )}
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
      <main className={styles.tabContent}>
        {activeTab === 'overview' && (
          <MatchOverview
            match={match}
            realMatch={realMatch}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            showLiveSimulation={showLiveSimulation}
            isStartingMatch={isStartingMatch}
            userPrediction={userPrediction}
            finishedMatchData={finishedMatchData}
            onStartMatch={handleStartMatch}
            onMatchEnd={(endedMatchState) => {
              console.log('Match ended:', endedMatchState);
              virtualTimeManager.finalizarPartidoEnVivo(realMatch!.id);
              setShowLiveSimulation(false);
              window.location.reload();
            }}
          />
        )}        {activeTab === 'predictions' && (
          <MatchPredictions
            match={match}
            userPrediction={userPrediction}
            predictionStats={predictionStats}
            isAuthenticated={isAuthenticated}
            isPredicting={isPredicting}
            canPredict={!!canPredict()}
            onPrediction={handlePrediction}
          />
        )}

        {activeTab === 'stats' && (
          <MatchStats
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
        )}

        {activeTab === 'lineups' && (
          <MatchLineups
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            getTeamRosterData={getTeamRosterData}
          />
        )}

        {activeTab === 'head-to-head' && (
          <MatchHeadToHead
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
        )}        {activeTab === 'betting' && (
          <MatchBetting
            match={match}
            canBet={!!canBet()}
          />
        )}

        {activeTab === 'detailed-analysis' && (
          <MatchDetailedAnalysis
            match={match}
            hasDetailedResults={hasDetailedResults}
          />
        )}
      </main>

      {/* Related Matches */}
      <MatchRelatedMatches relatedMatches={relatedMatches} />
    </div>
  );
};

export default MatchDetailPage;
