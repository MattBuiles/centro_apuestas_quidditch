import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import TeamLogo from '@/components/teams/TeamLogo';
import LiveMatchViewer from '@/components/matches/LiveMatchViewer';
import { Team, Match } from '@/types/league';
import { virtualTimeManager } from '@/services/virtualTimeManager';
import { PredictionsService, MatchPredictionStats, Prediction } from '@/services/predictionsService';
import styles from './MatchDetailPage.module.css';
import { useAuth } from '@/context/AuthContext';

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
  // Add more details like stats, lineups, commentary etc.
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
  const { isAuthenticated } = useAuth();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [realMatch, setRealMatch] = useState<Match | null>(null);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, stats, lineups, h2h, betting, predictions
  const [showLiveSimulation, setShowLiveSimulation] = useState(false);
  const [isStartingMatch, setIsStartingMatch] = useState(false);
    // Predictions state
  const [predictionsService] = useState(() => new PredictionsService());
  const [predictionStats, setPredictionStats] = useState<MatchPredictionStats | null>(null);
  const [userPrediction, setUserPrediction] = useState<Prediction | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  
  // Related matches state
  const [relatedMatches, setRelatedMatches] = useState<Match[]>([]);useEffect(() => {
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
        
        // Load prediction data
        const stats = predictionsService.getMatchPredictionStats(foundMatch.id);
        setPredictionStats(stats);
        setUserPrediction(stats.userPrediction || null);
        
        // Set default tab based on match status
        if (foundMatch.status === 'scheduled') {
          setActiveTab('overview'); // Show predictions and overview for upcoming matches
        } else if (foundMatch.status === 'live') {
          setActiveTab('live'); // Show live tab for live matches
        } else {
          setActiveTab('overview'); // Show overview with results for finished matches
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
  }, [matchId, predictionsService]);  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
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

  const canPredict = () => {
    return match && (match.status === 'upcoming' || (match.status === 'live' && !showLiveSimulation));
  };

  const canBet = () => {
    return match && (match.status === 'upcoming' || match.status === 'live');
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!match) {
    return <div className="text-center p-8">Partido no encontrado.</div>;
  }
  return (
    <div className={styles.container}>
      <div className={styles.breadcrumbs}>
        <Link to="/">Inicio</Link> <span>&gt;</span>
        <Link to="/matches">Partidos</Link> <span>&gt;</span>
        <span>{match.homeTeam} vs {match.awayTeam}</span>
      </div>

      <div className={styles.header}>
        {match.status === 'live' && <div className={`${styles.statusBadge} ${styles.live}`}>EN VIVO</div>}
        {match.status === 'finished' && <div className={styles.statusBadge}>FINALIZADO</div>}
        {match.status === 'upcoming' && <div className={styles.statusBadge}>PRÓXIMO</div>}
        <h1 className={styles.title}>{match.homeTeam} vs {match.awayTeam}</h1>
        <div className={styles.meta}>
          <span>{match.date}</span>
          <span>{match.time}</span>
          <span>{match.league}</span>
          <span>{match.location}</span>
        </div>
      </div>

      <div className={styles.scoreboard}>        <div className={`${styles.team} ${styles.homeTeam}`}>
          <TeamLogo teamName={match.homeTeam} size="lg" className={styles.teamLogo} />
          <div className={styles.teamName}>{match.homeTeam}</div>
        </div>
        <div className={styles.scoreDisplay}>
          <div className={styles.score}>{match.homeScore} - {match.awayScore}</div>
          {match.status === 'live' && match.minute && <div className={`${styles.timeDisplay} ${styles.live} ${styles.pulsing}`}>{match.minute}</div>}
          {match.status === 'finished' && <div className={styles.timeDisplay}>Finalizado</div>}
          {match.status === 'upcoming' && <div className={styles.timeDisplay}>Próximamente</div>}
        </div>        <div className={`${styles.team} ${styles.awayTeam}`}>
          <TeamLogo teamName={match.awayTeam} size="lg" className={styles.teamLogo} />
          <div className={styles.teamName}>{match.awayTeam}</div>
        </div>      </div>
      
      {/* Betting Actions */}
      {canBet() && (
        <div className={styles.actions}>
          <Link to={`/betting/${match.id}`}>
            <Button className={styles.ctaButton}>Apostar en este Partido</Button>
          </Link>
          <Button variant="secondary">Ver Estadísticas Avanzadas</Button>
        </div>
      )}<div className={styles.tabs}>
        <button className={`${styles.tabButton} ${activeTab === 'overview' ? styles.active : ''}`} onClick={() => handleTabClick('overview')}>
          {match.status === 'upcoming' ? 'Predicciones' : match.status === 'live' ? 'En Vivo' : 'Resumen'}
        </button>
        <button className={`${styles.tabButton} ${activeTab === 'stats' ? styles.active : ''}`} onClick={() => handleTabClick('stats')}>Estadísticas</button>
        <button className={`${styles.tabButton} ${activeTab === 'lineups' ? styles.active : ''}`} onClick={() => handleTabClick('lineups')}>Alineaciones</button>
        <button className={`${styles.tabButton} ${activeTab === 'h2h' ? styles.active : ''}`} onClick={() => handleTabClick('h2h')}>Cara a Cara</button>
        {canBet() && (
          <button className={`${styles.tabButton} ${activeTab === 'betting' ? styles.active : ''}`} onClick={() => handleTabClick('betting')}>Mercados</button>
        )}
      </div>      <div className={`${styles.tabContent} ${activeTab === 'overview' ? '' : styles.hidden}`}>
        {/* UPCOMING MATCHES: Show predictions */}
        {match.status === 'upcoming' && (
          <>
            <h2 className={styles.tabTitle}>Predicciones del Partido</h2>
            
            {/* User prediction section */}
            <div className={styles.predictionSection}>
              <h3>Tu Predicción</h3>
              {userPrediction ? (
                <div className={styles.userPredictionResult}>
                  <p>Has predicho que ganará: <strong>{
                    userPrediction.predictedWinner === 'home' ? match.homeTeam :
                    userPrediction.predictedWinner === 'away' ? match.awayTeam :
                    'Empate'
                  }</strong></p>
                  <p>Confianza: {userPrediction.confidence}/5</p>
                </div>
              ) : (
                <div className={styles.noPrediction}>
                  <p>No has hecho ninguna predicción para este partido.</p>
                  {isAuthenticated && canPredict() && (
                    <div className={styles.predictionOptions}>
                      <h4>¿Quién crees que ganará?</h4>
                      <div className={styles.predictionButtons}>
                        <Button 
                          variant="outline" 
                          onClick={() => handlePrediction('home')}
                          disabled={isPredicting}
                        >
                          {match.homeTeam}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handlePrediction('draw')}
                          disabled={isPredicting}
                        >
                          Empate
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handlePrediction('away')}
                          disabled={isPredicting}
                        >
                          {match.awayTeam}
                        </Button>
                      </div>
                    </div>
                  )}
                  {!isAuthenticated && (
                    <p><Link to="/login">Inicia sesión</Link> para hacer predicciones.</p>
                  )}
                </div>
              )}
            </div>

            {/* Community predictions */}
            {predictionStats && (
              <div className={styles.communityPredictions}>
                <h3>Predicciones de la Comunidad</h3>
                <div className={styles.predictionStats}>
                  <div className={styles.predictionBar}>
                    <div className={styles.predictionBarItem} style={{width: `${predictionStats.homeWinPercentage}%`}}>
                      {match.homeTeam}: {predictionStats.homeWinPercentage.toFixed(1)}%
                    </div>
                    <div className={styles.predictionBarItem} style={{width: `${predictionStats.drawPercentage}%`}}>
                      Empate: {predictionStats.drawPercentage.toFixed(1)}%
                    </div>
                    <div className={styles.predictionBarItem} style={{width: `${predictionStats.awayWinPercentage}%`}}>
                      {match.awayTeam}: {predictionStats.awayWinPercentage.toFixed(1)}%
                    </div>
                  </div>
                  <p>Total de predicciones: {predictionStats.totalPredictions}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* LIVE MATCHES: Show live action */}
        {match.status === 'live' && (
          <>
            <h2 className={styles.tabTitle}>Partido en Vivo</h2>
            
            {/* Prediction section for live matches (before simulation starts) */}
            {!showLiveSimulation && canPredict() && (
              <div className={styles.predictionSection}>
                <h3>Predicción Rápida</h3>
                <p>El partido está a punto de comenzar. ¡Haz tu predicción ahora!</p>
                {!userPrediction && isAuthenticated && (
                  <div className={styles.predictionButtons}>
                    <Button 
                      variant="outline" 
                      onClick={() => handlePrediction('home')}
                      disabled={isPredicting}
                      size="sm"
                    >
                      {match.homeTeam}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handlePrediction('away')}
                      disabled={isPredicting}
                      size="sm"
                    >
                      {match.awayTeam}
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Partido listo para comenzar */}
            {realMatch && !showLiveSimulation && (
              <div className={styles.matchReadyCard}>
                <h3>🔴 Partido Listo para Comenzar</h3>
                <p>Este partido está programado para comenzar ahora. Haz clic para iniciar la simulación en vivo.</p>
                <div className="mt-4">
                  <Button 
                    onClick={handleStartMatch} 
                    variant="primary" 
                    isLoading={isStartingMatch}
                    disabled={isStartingMatch}
                  >
                    {isStartingMatch ? 'Iniciando...' : '🚀 Comenzar Partido'}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Simulación en vivo activa */}
            {realMatch && homeTeam && awayTeam && showLiveSimulation && (
              <div className="mb-4">
                <LiveMatchViewer 
                  match={realMatch} 
                  homeTeam={homeTeam} 
                  awayTeam={awayTeam}
                  refreshInterval={3} // Slower refresh for better UX
                  onMatchEnd={(endedMatchState) => {
                    console.log('Match ended:', endedMatchState);
                    virtualTimeManager.finalizarPartidoEnVivo(realMatch.id);
                    setShowLiveSimulation(false);
                    // Reload match data
                    window.location.reload();
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* FINISHED MATCHES: Show results and commentary */}
        {match.status === 'finished' && (
          <>
            <h2 className={styles.tabTitle}>Resumen del Partido</h2>
            
            {/* Final result */}
            <div className={styles.matchResult}>
              <h3>Resultado Final</h3>
              <div className={styles.finalScore}>
                <span>{match.homeTeam} {match.homeScore} - {match.awayScore} {match.awayTeam}</span>
              </div>
            </div>

            {/* User prediction result */}
            {userPrediction && (
              <div className={styles.predictionResult}>
                <h3>Tu Predicción</h3>
                <p>Predijiste que ganaría: <strong>{
                  userPrediction.predictedWinner === 'home' ? match.homeTeam :
                  userPrediction.predictedWinner === 'away' ? match.awayTeam :
                  'Empate'
                }</strong></p>
                <p className={userPrediction.isCorrect ? styles.correctPrediction : styles.incorrectPrediction}>
                  {userPrediction.isCorrect ? '✅ ¡Predicción correcta!' : '❌ Predicción incorrecta'}
                </p>
              </div>
            )}
            {!userPrediction && (
              <div className={styles.noPredictionResult}>
                <p>No hiciste ninguna predicción para este partido.</p>
              </div>
            )}

            {/* Match commentary */}
            <div className={styles.matchCommentary}>
              <h3>Comentarios del Partido</h3>
              <p>El resumen y comentarios del partido aparecerán aquí...</p>
            </div>
          </>
        )}
      </div>

      <div className={`${styles.tabContent} ${activeTab === 'stats' ? '' : styles.hidden}`}>
        <h2 className={styles.tabTitle}>Estadísticas del Partido</h2>
        <p>Las estadísticas detalladas del partido aparecerán aquí...</p>
        {/* Placeholder for stats display */}
      </div>

      <div className={`${styles.tabContent} ${activeTab === 'lineups' ? '' : styles.hidden}`}>
        <h2 className={styles.tabTitle}>Alineaciones</h2>
        <p>Las alineaciones de los equipos aparecerán aquí...</p>
        {/* Placeholder for lineups display */}
      </div>
        <div className={`${styles.tabContent} ${activeTab === 'h2h' ? '' : styles.hidden}`}>
        <h2 className={styles.tabTitle}>Historial de Enfrentamientos</h2>
        <p>El historial cara a cara entre los equipos aparecerá aquí...</p>
      </div>

      {activeTab === 'betting' && canBet() && (
        <div className={styles.tabContent}>
          <h2 className={styles.tabTitle}>Mercados de Apuestas</h2>
          <p>Los diferentes mercados de apuestas para este partido aparecerán aquí...</p>
        </div>
      )}{/* Related Matches Section - Real upcoming matches */}
      <section className={`${styles.relatedMatches} ${styles.card}`}>
        <h2 className={styles.tabTitle}>Otros partidos que te pueden interesar</h2>
        <div className={styles.relatedMatchesGrid}>
          {relatedMatches.length > 0 ? relatedMatches.map((relatedMatch) => {
            const homeTeamName = homeTeam && relatedMatch.localId === homeTeam.id ? homeTeam.name : relatedMatch.localId;
            const awayTeamName = awayTeam && relatedMatch.visitanteId === awayTeam.id ? awayTeam.name : relatedMatch.visitanteId;
            return (
              <Link 
                key={relatedMatch.id} 
                to={`/matches/${relatedMatch.id}`} 
                className={styles.relatedMatchCard}
              >
                <div className={styles.relatedMatchTeams}>
                  <TeamLogo teamName={homeTeamName} size="sm" />
                  <span className={styles.relatedMatchVs}>vs</span>
                  <TeamLogo teamName={awayTeamName} size="sm" />
                </div>
                <div className={styles.relatedMatchInfo}>
                  <span className={styles.relatedMatchName}>{homeTeamName} vs {awayTeamName}</span>
                  <span className={styles.relatedMatchDate}>
                    {new Date(relatedMatch.fecha).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </Link>
            );
          }) : (
            <p>No hay más partidos próximos disponibles.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default MatchDetailPage;