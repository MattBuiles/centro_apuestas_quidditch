import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import TeamLogo from '@/components/teams/TeamLogo';
import { Team, Match } from '@/types/league';
import { virtualTimeManager } from '@/services/virtualTimeManager';
import { PredictionsService, MatchPredictionStats, Prediction } from '@/services/predictionsService';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/utils/apiClient';

// Import subcomponents
import {
  MatchOverview,
  MatchPredictions,
  MatchStats,
  MatchLineups,
  MatchHeadToHead,
  MatchBetting,
  MatchDetailedAnalysis,
  MatchRelatedMatches
} from './components';

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

// Removed mock data - now using backend data exclusively

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
    const loadMatchFromBackend = async () => {
      if (!matchId) return;
      
      setIsLoading(true);
      
      try {
        // First try to get match from backend
        const matchResponse = await apiClient.get(`/matches/${matchId}`);
        
        if (matchResponse.success && matchResponse.data) {
          const backendMatch = matchResponse.data as Record<string, unknown>;
          
          // Load team details from backend
          const [homeTeamResponse, awayTeamResponse] = await Promise.all([
            apiClient.get(`/teams/${backendMatch.home_team_id}`),
            apiClient.get(`/teams/${backendMatch.away_team_id}`)
          ]);
          
          if (homeTeamResponse.success && awayTeamResponse.success) {
            setHomeTeam(homeTeamResponse.data as Team);
            setAwayTeam(awayTeamResponse.data as Team);
          }
          
          // Convert backend match to MatchDetails format
          const matchDetails: MatchDetails = {
            id: String(backendMatch.id || ''),
            homeTeam: String(backendMatch.homeTeamName || 'Unknown'),
            awayTeam: String(backendMatch.awayTeamName || 'Unknown'),
            homeScore: Number(backendMatch.home_score) || 0,
            awayScore: Number(backendMatch.away_score) || 0,
            status: String(backendMatch.status) === 'scheduled' ? 'upcoming' : 
                   String(backendMatch.status) === 'live' ? 'live' : 'finished',
            minute: backendMatch.current_minute ? String(backendMatch.current_minute) : undefined,
            date: backendMatch.match_date ? new Date(String(backendMatch.match_date)).toLocaleDateString('es-ES') : 'Unknown',
            time: backendMatch.match_date ? new Date(String(backendMatch.match_date)).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Unknown',
            location: String(backendMatch.venue || 'Campo de Quidditch'),
          };
          setMatch(matchDetails);
          setRealMatch(backendMatch as unknown as Match);
          
          // Load prediction data
          try {
            const predictionStats = await predictionsService.getMatchPredictionStats(matchId);
            setPredictionStats(predictionStats);
            
            const userPred = await predictionsService.getUserPrediction(matchId);
            setUserPrediction(userPred);
          } catch (error) {
            console.warn('Failed to load prediction data:', error);
            setPredictionStats(null);
            setUserPrediction(null);
          }
          
          // Set default tab based on match status
          if (String(backendMatch.status) === 'scheduled') {
            setActiveTab('predictions');
          } else {
            setActiveTab('overview');
          }
          
        } else {
          // Fallback to virtual time manager
          await loadMatchFromSimulation();
        }
      } catch (error) {
        console.warn('Failed to load match from backend, falling back to simulation:', error);
        await loadMatchFromSimulation();
      }
      
      setIsLoading(false);
    };

    const loadMatchFromSimulation = async () => {
      const timeState = virtualTimeManager.getState();
      if (timeState.temporadaActiva && matchId) {
        const foundMatch = timeState.temporadaActiva.partidos.find(p => p.id === matchId);
        
        if (foundMatch) {
          setRealMatch(foundMatch);
          
          // Find teams from simulation
          const foundHomeTeam = timeState.temporadaActiva.equipos.find(t => t.id === foundMatch.localId);
          const foundAwayTeam = timeState.temporadaActiva.equipos.find(t => t.id === foundMatch.visitanteId);
          
          setHomeTeam(foundHomeTeam || null);
          setAwayTeam(foundAwayTeam || null);
          
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
            location: foundMatch.venue || 'Campo de Quidditch',
          };
          setMatch(matchDetails);
          
          // Load prediction data
          try {
            const predictionStats = await predictionsService.getMatchPredictionStats(foundMatch.id);
            setPredictionStats(predictionStats);
            
            const userPred = await predictionsService.getUserPrediction(foundMatch.id);
            setUserPrediction(userPred);
          } catch (error) {
            console.warn('Failed to load prediction data:', error);
            setPredictionStats(null);
            setUserPrediction(null);
          }
          
          // Set default tab
          if (foundMatch.status === 'scheduled') {
            setActiveTab('predictions');
          } else {
            setActiveTab('overview');
          }
          
          // Check if match is live
          if (foundMatch.status === 'live') {
            const liveState = virtualTimeManager.getEstadoPartidoEnVivo(foundMatch.id);
            if (liveState) {
              setShowLiveSimulation(true);
            }
          }
          
          // Get related matches
          const upcomingMatches = timeState.temporadaActiva.partidos
            .filter(p => p.status === 'scheduled' && p.id !== foundMatch.id)
            .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
            .slice(0, 2);
          setRelatedMatches(upcomingMatches);
        }
      }
    };

    loadMatchFromBackend();
  }, [matchId, predictionsService]);

  // Listen for prediction updates when matches finish
  useEffect(() => {
    const handlePredictionsUpdate = async (event: CustomEvent) => {
      console.log(`🎪 PREDICTIONS UPDATE EVENT RECEIVED:`, event.detail);
      const { matchId: updatedMatchId, result } = event.detail;
      
      if (updatedMatchId === matchId && matchId) {
        console.log(`🔮 Processing predictions update for match ${matchId}, result: ${result}`);
        
        // Refresh user prediction to get updated isCorrect status
        try {
          const updatedPrediction = await predictionsService.getUserPrediction(matchId);
          console.log(`📊 Updated prediction from service:`, updatedPrediction);
          setUserPrediction(updatedPrediction);
          
          // Refresh prediction stats
          const updatedStats = await predictionsService.getMatchPredictionStats(matchId);
          setPredictionStats(updatedStats);
        } catch (error) {
          console.warn('Failed to refresh prediction data:', error);
        }
      } else {
        console.log(`⚠️ Event is for different match: ${updatedMatchId} vs current ${matchId}`);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('predictionsUpdated', handlePredictionsUpdate as unknown as EventListener);
      
      return () => {
        window.removeEventListener('predictionsUpdated', handlePredictionsUpdate as unknown as EventListener);
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
      await predictionsService.submitPrediction(match.id, winner, 3);
      
      // Update prediction stats
      const updatedStats = await predictionsService.getMatchPredictionStats(match.id);
      setPredictionStats(updatedStats);
      
      const userPred = await predictionsService.getUserPrediction(match.id);
      setUserPrediction(userPred);
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
    if (tab.id === 'detailed-analysis' && match?.status !== 'finished') return false;
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
            {match.status === 'finished' && (
              <div className={styles.scoreBreakdown}>
                <small>Partido finalizado</small>
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
            {match.status === 'finished' && (
              <div className={styles.scoreBreakdown}>
                <small>Partido finalizado</small>
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
            finishedMatchData={null}
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
            hasDetailedResults={false}
          />
        )}
      </main>

      {/* Related Matches */}
      <MatchRelatedMatches relatedMatches={relatedMatches} />
    </div>
  );
};

export default MatchDetailPage;
