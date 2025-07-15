import React, { Component, ReactNode, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Match, Team } from '@/types/league';
import { getMatchDetails, getRelatedMatches } from '@/services/matchesService';
import { getTeams } from '@/services/teamsService';
import { PredictionsService, MatchPredictionStats, Prediction } from '@/services/predictionsService';
import { FEATURES } from '@/config/features';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import TeamLogo from '@/components/teams/TeamLogo';
import {
  MatchOverview,
  MatchStats,
  MatchLineups,
  MatchHeadToHead,
  MatchRelatedMatches,
  MatchDetailedAnalysis,
  MatchPredictions,
} from './components';
import styles from './MatchDetailPage.module.css';

type TabType = 'overview' | 'predictions' | 'stats' | 'lineups' | 'head-to-head' | 'betting' | 'analysis' | 'related';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

class MatchDetailErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MatchDetailPage Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h2>⚠️ Error en Detalles del Partido</h2>
          <p>Ha ocurrido un error al mostrar los detalles del partido.</p>
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary>Detalles técnicos del error</summary>
            <pre style={{ 
              backgroundColor: '#f1f3f4', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {this.state.error && this.state.error.toString()}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Recargar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const MatchDetailPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  
  const [match, setMatch] = useState<Match | null>(null);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [relatedMatches, setRelatedMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLiveSimulation, setShowLiveSimulation] = useState(false);
  const [isStartingMatch, setIsStartingMatch] = useState(false);
  
  // Predictions state
  const [userPrediction, setUserPrediction] = useState<Prediction | null>(null);
  const [predictionStats, setPredictionStats] = useState<MatchPredictionStats | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  
  // Create predictions service as a ref to avoid recreating it
  const predictionsServiceRef = useRef<PredictionsService | null>(null);
  if (!predictionsServiceRef.current) {
    predictionsServiceRef.current = new PredictionsService();
  }
  const predictionsService = predictionsServiceRef.current;

  useEffect(() => {
    const loadPredictionsData = async (matchId: string) => {
      if (!FEATURES.USE_BACKEND_PREDICTIONS) return;
      
      try {
        console.log('🔄 Loading predictions data for match:', matchId);
        
        // Load user prediction
        const userPred = await predictionsService.getUserPrediction(matchId);
        console.log('📊 User prediction loaded:', userPred ? 'Found prediction' : 'No prediction');
        setUserPrediction(userPred);
        
        // Load prediction stats
        const stats = await predictionsService.getMatchPredictionStats(matchId);
        console.log('📈 Prediction stats loaded:', stats);
        setPredictionStats(stats);
      } catch (error) {
        console.warn('Failed to load predictions data:', error);
        // Clear any incorrect data
        setUserPrediction(null);
        setPredictionStats(null);
      }
    };

    if (matchId) {
      loadMatchData(matchId);
      loadPredictionsData(matchId);
    } else {
      setError('ID de partido no proporcionado');
      setIsLoading(false);
    }
  }, [matchId, predictionsService]); // Now predictionsService is stable through useRef

  const loadMatchData = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Load match data
      const matchData = await getMatchDetails(id);
      if (!matchData) {
        throw new Error('Partido no encontrado');
      }

      setMatch(matchData);

      // Load team data
      const teams = await getTeams();
      
      // Debug logging to understand the data structure
      console.log('🔍 Match data received from backend:', {
        id: matchData.id,
        homeTeamId: matchData.homeTeamId,
        awayTeamId: matchData.awayTeamId,
        localId: matchData.localId,
        visitanteId: matchData.visitanteId,
        status: matchData.status,
        fullMatchData: matchData
      });
      console.log('🔍 Available teams:', teams.map(t => ({ id: t.id, name: t.name })));
      
      // Helper function to find team by various matching criteria
      const findTeam = (teamIdentifier: string) => {
        if (!teamIdentifier) return null;
        
        // Try exact ID match first
        let team = teams.find(t => t.id === teamIdentifier);
        if (team) return team;
        
        // Try exact name match
        team = teams.find(t => t.name === teamIdentifier);
        if (team) return team;
        
        // Try case-insensitive ID match
        team = teams.find(t => t.id.toLowerCase() === teamIdentifier.toLowerCase());
        if (team) return team;
        
        // Try case-insensitive name match
        team = teams.find(t => t.name.toLowerCase() === teamIdentifier.toLowerCase());
        if (team) return team;
        
        // Try partial match (contains)
        team = teams.find(t => 
          t.name.toLowerCase().includes(teamIdentifier.toLowerCase()) ||
          t.id.toLowerCase().includes(teamIdentifier.toLowerCase())
        );
        if (team) return team;
        
        // Try mapping common backend IDs to frontend IDs
        const idMappings: { [key: string]: string } = {
          '1': 'gryffindor',
          '2': 'slytherin', 
          '3': 'ravenclaw',
          '4': 'hufflepuff',
          '5': 'chudley-cannons',
          '6': 'holyhead-harpies'
        };
        
        if (idMappings[teamIdentifier]) {
          team = teams.find(t => t.id === idMappings[teamIdentifier]);
          if (team) return team;
        }
        
        return null;
      };
      
      const homeTeam = findTeam(matchData.homeTeamId);
      const awayTeam = findTeam(matchData.awayTeamId);

      console.log('🔍 Team matching results:', { 
        homeTeamId: matchData.homeTeamId,
        homeTeamFound: homeTeam?.name || 'NOT FOUND',
        awayTeamId: matchData.awayTeamId,
        awayTeamFound: awayTeam?.name || 'NOT FOUND'
      });

      let finalHomeTeam = homeTeam;
      let finalAwayTeam = awayTeam;

      if (!finalHomeTeam || !finalAwayTeam) {
        console.error('❌ Team matching failed:', {
          requestedHome: matchData.homeTeamId,
          foundHome: finalHomeTeam?.name,
          requestedAway: matchData.awayTeamId,
          foundAway: finalAwayTeam?.name,
          availableTeams: teams.map(t => ({ id: t.id, name: t.name }))
        });
        
        // Instead of failing, create placeholder teams for development
        if (!finalHomeTeam) {
          console.warn('⚠️ Creating placeholder home team for:', matchData.homeTeamId);
          finalHomeTeam = {
            id: matchData.homeTeamId,
            name: matchData.homeTeamId || 'Equipo Local',
            house: 'Unknown',
            fuerzaAtaque: 50,
            fuerzaDefensa: 50,
            attackStrength: 50,
            defenseStrength: 50,
            seekerSkill: 50,
            chaserSkill: 50,
            keeperSkill: 50,
            beaterSkill: 50,
            logo: '/images/default-team.png',
            colors: { primary: '#000000', secondary: '#ffffff' },
            venue: 'Estadio Desconocido',
            founded: 1000,
            slogan: 'Equipo en desarrollo'
          };
        }
        
        if (!finalAwayTeam) {
          console.warn('⚠️ Creating placeholder away team for:', matchData.awayTeamId);
          finalAwayTeam = {
            id: matchData.awayTeamId,
            name: matchData.awayTeamId || 'Equipo Visitante',
            house: 'Unknown',
            fuerzaAtaque: 50,
            fuerzaDefensa: 50,
            attackStrength: 50,
            defenseStrength: 50,
            seekerSkill: 50,
            chaserSkill: 50,
            keeperSkill: 50,
            beaterSkill: 50,
            logo: '/images/default-team.png',
            colors: { primary: '#000000', secondary: '#ffffff' },
            venue: 'Estadio Desconocido',
            founded: 1000,
            slogan: 'Equipo en desarrollo'
          };
        }
        
        console.log('⚠️ Using placeholder teams to continue loading the match');
      }

      setHomeTeam(finalHomeTeam);
      setAwayTeam(finalAwayTeam);

      // Load related matches
      if (finalHomeTeam && finalAwayTeam) {
        try {
          const related = await getRelatedMatches(finalHomeTeam.id, finalAwayTeam.id);
          setRelatedMatches(related);
        } catch (relatedError) {
          console.warn('Failed to load related matches:', relatedError);
          setRelatedMatches([]);
        }
      }

      // Check if match is live to show simulation
      if (matchData.status === 'live') {
        setShowLiveSimulation(true);
      }

    } catch (err) {
      console.error('Error loading match data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error cargando datos del partido';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle making a prediction
  const handlePrediction = async (winner: 'home' | 'away' | 'draw') => {
    if (!match || isPredicting) return;
    
    // Only allow predictions on scheduled matches
    if (match.status !== 'scheduled') {
      console.warn('Cannot predict on non-scheduled match:', match.status);
      return;
    }
    
    try {
      setIsPredicting(true);
      
      console.log('🎯 Submitting prediction for match:', {
        matchId: match.id,
        matchStatus: match.status,
        prediction: winner,
        confidence: 3
      });
      
      // For now, use a default confidence of 3/5
      const success = await predictionsService.submitPrediction(match.id, winner, 3);
      
      if (success) {
        console.log('✅ Prediction submitted successfully, reloading data...');
        // Reload predictions data
        const userPred = await predictionsService.getUserPrediction(match.id);
        setUserPrediction(userPred);
        
        const stats = await predictionsService.getMatchPredictionStats(match.id);
        setPredictionStats(stats);
      } else {
        console.error('❌ Prediction submission failed');
      }
    } catch (error) {
      console.error('Failed to submit prediction:', error);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleStartMatch = async () => {
    if (!match) return;

    try {
      setIsStartingMatch(true);
      setError(null);
      
      // TODO: Integrate with backend API to mark match as live
      // For now, just show the simulation interface
      console.log('Starting live simulation for match:', match.id);
      
      // Simulate marking match as live
      setShowLiveSimulation(true);
      
      // You can add API call here when backend is ready
      // await apiClient.patch(`/matches/${match.id}/start-live`);
      
    } catch (err) {
      console.error('Error starting match:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error iniciando la simulación del partido';
      setError(errorMessage);
    } finally {
      setIsStartingMatch(false);
    }
  };

  const handleMatchEnd = (endedMatchState: unknown) => {
    console.log('Match ended:', endedMatchState);
    setShowLiveSimulation(false);
    // Refresh match data to show final results
    if (matchId) {
      loadMatchData(matchId);
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
      }
      return dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Fecha inválida';
    }
  };

  const formatTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return 'Hora inválida';
      }
      return dateObj.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting time:', err);
      return 'Hora inválida';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'scheduled': { text: 'Programado', class: styles.scheduled },
      'live': { text: 'En Vivo', class: styles.live },
      'finished': { text: 'Finalizado', class: styles.finished },
      'postponed': { text: 'Pospuesto', class: styles.postponed }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { text: status || 'Estado desconocido', class: styles.unknown };
    
    return (
      <span className={`${styles.statusBadge} ${config.class}`}>
        {config.text}
      </span>
    );
  };

  // Debug function - make available globally for testing
  if (typeof window !== 'undefined') {
    (window as typeof window & { clearAllPredictions?: () => void }).clearAllPredictions = () => {
      // Clear all prediction-related localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('prediction') || key.includes('quidditch'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('🧹 Removed:', key);
      });
      
      // Clear service cache
      predictionsService.clearAllLocalPredictions();
      
      // Reset component state
      setUserPrediction(null);
      setPredictionStats(null);
      
      console.log('🧹 All predictions and related data cleared - refresh page to reload');
    };
    
    // Also add a function to check current predictions
    (window as typeof window & { checkPredictions?: () => void }).checkPredictions = () => {
      console.log('📊 Current userPrediction:', userPrediction);
      console.log('📈 Current predictionStats:', predictionStats);
      console.log('💾 LocalStorage predictions:', localStorage.getItem('quidditch_user_predictions'));
    };
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p>Cargando detalles del partido...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <Card className={styles.errorCard}>
          <h2>Error al Cargar el Partido</h2>
          <p>{error}</p>
          <div className={styles.errorActions}>
            <Button onClick={() => navigate('/matches')} variant="primary">
              Volver a Partidos
            </Button>
            <Button onClick={() => matchId && loadMatchData(matchId)} variant="outline">
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!match || !homeTeam || !awayTeam) {
    return (
      <div className={styles.errorContainer}>
        <Card className={styles.errorCard}>
          <h2>Partido No Encontrado</h2>
          <p>No se pudo encontrar la información del partido solicitado.</p>
          <Button onClick={() => navigate('/matches')} variant="primary">
            Volver a Partidos
          </Button>
        </Card>
      </div>
    );
  }

  // Transform match data for compatibility with components
  const transformedMatch = {
    id: match.id,
    homeTeam: homeTeam?.name || 'Equipo Local',
    awayTeam: awayTeam?.name || 'Equipo Visitante',
    homeScore: match.homeScore || 0,
    awayScore: match.awayScore || 0,
    status: match.status === 'scheduled' ? 'upcoming' : match.status as 'live' | 'upcoming' | 'finished',
    minute: match.currentMinute ? `${match.currentMinute}'` : undefined,
    date: formatDate(match.date),
    time: formatTime(match.date),
    location: match.venue || 'Estadio de Quidditch'
  };

  // Debug logging
  console.log('🔍 MatchDetailPage Debug Info:', {
    match,
    homeTeam,
    awayTeam,
    transformedMatch,
    showLiveSimulation,
    FEATURES_BACKEND: FEATURES.USE_BACKEND_MATCHES
  });

  return (
    <MatchDetailErrorBoundary>
      <div className={styles.matchDetailContainer}>
        {/* Magical floating particles */}
        <div className={styles.floatingParticle}></div>
        <div className={styles.floatingParticle}></div>
        <div className={styles.floatingParticle}></div>
        
        {/* Header */}
        <div className={styles.header}>
          <Button 
            onClick={() => navigate('/matches')} 
            variant="outline" 
            className={styles.backButton}
          >
            ← Volver a Partidos
          </Button>
          
          <div className={styles.matchTitle}>
            <h1>Detalles del Partido</h1>
            <div className={styles.matchInfo}>
              <span className={styles.matchDate}>{transformedMatch.date}</span>
              <span className={styles.matchTime}>{transformedMatch.time}</span>
              {getStatusBadge(match.status)}
            </div>
          </div>
        </div>

        {/* Main Match Card */}
        <Card className={styles.mainMatchCard}>
          <div className={styles.matchHeader}>
            <div className={styles.teamSection}>
              <div className={styles.team}>
                <TeamLogo teamName={homeTeam.name} size="xl" />
                <h2 className={styles.teamName}>{homeTeam.name}</h2>
              </div>
              
              <div className={styles.scoreSection}>
                <div className={styles.score}>
                  <span className={styles.homeScore}>{transformedMatch.homeScore}</span>
                  <span className={styles.scoreSeparator}>-</span>
                  <span className={styles.awayScore}>{transformedMatch.awayScore}</span>
                </div>
                {transformedMatch.minute && (
                  <div className={styles.minute}>
                    {transformedMatch.minute}
                  </div>
                )}
              </div>
              
              <div className={styles.team}>
                <TeamLogo teamName={awayTeam.name} size="xl" />
                <h2 className={styles.teamName}>{awayTeam.name}</h2>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs Navigation */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabsHeader}>
            <button
              className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Resumen
            </button>
            {FEATURES.USE_BACKEND_PREDICTIONS && (
              <button
                className={`${styles.tab} ${activeTab === 'predictions' ? styles.active : ''}`}
                onClick={() => setActiveTab('predictions')}
              >
                Predicciones
              </button>
            )}
            <button
              className={`${styles.tab} ${activeTab === 'stats' ? styles.active : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              Estadísticas
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'lineups' ? styles.active : ''}`}
              onClick={() => setActiveTab('lineups')}
            >
              Alineaciones
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'head-to-head' ? styles.active : ''}`}
              onClick={() => setActiveTab('head-to-head')}
            >
              Historial
            </button>
            {FEATURES.USE_BACKEND_BETS && (
              <button
                className={`${styles.tab} ${activeTab === 'betting' ? styles.active : ''}`}
                onClick={() => setActiveTab('betting')}
              >
                Apuestas
              </button>
            )}
            <button
              className={`${styles.tab} ${activeTab === 'analysis' ? styles.active : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              Análisis
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'related' ? styles.active : ''}`}
              onClick={() => setActiveTab('related')}
            >
              Relacionados
            </button>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === 'overview' && (
              <MatchOverview
                match={transformedMatch}
                realMatch={match}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                showLiveSimulation={showLiveSimulation}
                isStartingMatch={isStartingMatch}
                userPrediction={null}
                finishedMatchData={null}
                onStartMatch={handleStartMatch}
                onMatchEnd={handleMatchEnd}
              />
            )}
            
            {activeTab === 'predictions' && FEATURES.USE_BACKEND_PREDICTIONS && (
              <MatchPredictions
                match={transformedMatch}
                userPrediction={userPrediction}
                predictionStats={predictionStats}
                isAuthenticated={true} // For now, assume authenticated
                isPredicting={isPredicting}
                canPredict={match?.status === 'scheduled'}
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
              />
            )}
            
            {activeTab === 'head-to-head' && (
              <MatchHeadToHead
                homeTeam={homeTeam}
                awayTeam={awayTeam}
              />
            )}
            
            {activeTab === 'betting' && FEATURES.USE_BACKEND_BETS && (
              <Card className={styles.tabCard}>
                <h3>Apuestas del Partido</h3>
                <p>Sistema de apuestas en desarrollo...</p>
              </Card>
            )}
            
            {activeTab === 'analysis' && (
              <MatchDetailedAnalysis 
                match={{
                  id: match.id,
                  homeTeam: match.homeTeamId || '',
                  awayTeam: match.awayTeamId || '',
                  homeScore: match.homeScore,
                  awayScore: match.awayScore,
                  status: match.status,
                  date: match.date,
                  location: match.venue
                }} 
                isLoading={isLoading} 
              />
            )}
            
            {activeTab === 'related' && (
              <MatchRelatedMatches
                relatedMatches={relatedMatches}
              />
            )}
          </div>
        </div>
      </div>
    </MatchDetailErrorBoundary>
  );
};

export default MatchDetailPage;