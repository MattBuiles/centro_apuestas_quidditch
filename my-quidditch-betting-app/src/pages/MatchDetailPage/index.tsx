import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import TeamLogo from '@/components/teams/TeamLogo';
import LiveMatchViewer from '@/components/matches/LiveMatchViewer';
import { Team, Match } from '@/types/league';
import { virtualTimeManager } from '@/services/virtualTimeManager';
import { PredictionsService, MatchPredictionStats, Prediction } from '@/services/predictionsService';
import styles from './MatchDetailPage.module.css';
import { useAuth } from '@/context/AuthContext';

// Tab definitions with magical icons
type TabType = 'overview' | 'predictions' | 'stats' | 'lineups' | 'head-to-head' | 'betting';

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
    label: 'Resumen', 
    icon: '📊', 
    magicalIcon: '✨', 
    description: 'Vista general del encuentro mágico' 
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
  },
  { 
    id: 'betting', 
    label: 'Apuestas', 
    icon: '💰', 
    magicalIcon: '💎', 
    description: 'Mercados de apuestas disponibles' 
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
  const { isAuthenticated } = useAuth();
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
        
        // Load prediction data
        const stats = predictionsService.getMatchPredictionStats(foundMatch.id);
        setPredictionStats(stats);
        setUserPrediction(stats.userPrediction || null);
        
        // Set default tab based on match status
        if (foundMatch.status === 'scheduled') {
          setActiveTab('predictions'); // Show predictions for upcoming matches
        } else if (foundMatch.status === 'live') {
          setActiveTab('overview'); // Show overview with live content for live matches
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
  }, [matchId, predictionsService]);

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
  };

  const canBet = () => {
    return match && (match.status === 'upcoming' || match.status === 'live');
  };

  // Get available tabs based on match status and user permissions
  const availableTabs = tabs.filter(tab => {
    if (tab.id === 'betting' && !canBet()) return false;
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
      <main className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.overviewTab}>
            {match.status === 'upcoming' && (
              <div className={styles.upcomingContent}>
                <div className={styles.sectionCard}>
                  <h2 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>✨</span>
                    Próximo Encuentro Mágico
                  </h2>
                  <div className={styles.upcomingDetails}>
                    <p className={styles.upcomingDescription}>
                      Un emocionante duelo se avecina entre las casas de {match.homeTeam} y {match.awayTeam}. 
                      Las escobas están listas, la Snitch Dorada aguarda, y la gloria está al alcance.
                    </p>
                    <div className={styles.matchPreview}>
                      <div className={styles.previewStats}>
                        <h3>Vista Previa del Encuentro</h3>
                        <div className={styles.statsGrid}>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Encuentros Anteriores</span>
                            <span className={styles.statValue}>12</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Victorias Locales</span>
                            <span className={styles.statValue}>7</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Victorias Visitantes</span>
                            <span className={styles.statValue}>5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {match.status === 'live' && (
              <div className={styles.liveContent}>
                {!showLiveSimulation && realMatch && (
                  <div className={styles.liveReadyCard}>
                    <h2 className={styles.sectionTitle}>
                      <span className={styles.sectionIcon}>🔴</span>
                      Partido Listo para Comenzar
                    </h2>
                    <p>La magia está en el aire. Los equipos están listos. ¡Es hora de que comience el espectáculo!</p>
                    <Button 
                      onClick={handleStartMatch} 
                      className={styles.startMatchButton}
                      isLoading={isStartingMatch}
                      disabled={isStartingMatch}
                    >
                      <span className={styles.actionIcon}>🚀</span>
                      {isStartingMatch ? 'Invocando la Magia...' : 'Comenzar Duelo Mágico'}
                    </Button>
                  </div>
                )}

                {realMatch && homeTeam && awayTeam && showLiveSimulation && (
                  <div className={styles.liveSimulationContainer}>
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
              </div>
            )}

            {match.status === 'finished' && (
              <div className={styles.finishedContent}>
                <div className={styles.sectionCard}>
                  <h2 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>🏆</span>
                    Duelo Completado
                  </h2>
                  <div className={styles.matchResult}>
                    <div className={styles.finalScoreDisplay}>
                      <span className={styles.winner}>
                        {match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam}
                      </span>
                      <span className={styles.resultText}>ha triunfado en este épico encuentro</span>
                    </div>
                    <div className={styles.scoreBreakdown}>
                      <span>{match.homeTeam}: {match.homeScore} puntos</span>
                      <span>{match.awayTeam}: {match.awayScore} puntos</span>
                    </div>
                  </div>
                  
                  {userPrediction && (
                    <div className={styles.predictionResult}>
                      <h3>Tu Predicción</h3>
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
                </div>
              </div>
            )}
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
                              <span className={styles.statValue}>{homeTeam.attackStrength}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Fuerza Defensiva</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${homeTeam.defenseStrength}%`}}
                              ></div>
                              <span className={styles.statValue}>{homeTeam.defenseStrength}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Habilidad Buscador</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${homeTeam.seekerSkill}%`}}
                              ></div>
                              <span className={styles.statValue}>{homeTeam.seekerSkill}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Habilidad Cazadores</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${homeTeam.chaserSkill}%`}}
                              ></div>
                              <span className={styles.statValue}>{homeTeam.chaserSkill}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Habilidad Guardián</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${homeTeam.keeperSkill}%`}}
                              ></div>
                              <span className={styles.statValue}>{homeTeam.keeperSkill}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Habilidad Golpeadores</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${homeTeam.beaterSkill}%`}}
                              ></div>
                              <span className={styles.statValue}>{homeTeam.beaterSkill}</span>
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
                              ></div>
                              <span className={styles.statValue}>{awayTeam.attackStrength}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Fuerza Defensiva</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${awayTeam.defenseStrength}%`}}
                              ></div>
                              <span className={styles.statValue}>{awayTeam.defenseStrength}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Habilidad Buscador</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${awayTeam.seekerSkill}%`}}
                              ></div>
                              <span className={styles.statValue}>{awayTeam.seekerSkill}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Habilidad Cazadores</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${awayTeam.chaserSkill}%`}}
                              ></div>
                              <span className={styles.statValue}>{awayTeam.chaserSkill}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Habilidad Guardián</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${awayTeam.keeperSkill}%`}}
                              ></div>
                              <span className={styles.statValue}>{awayTeam.keeperSkill}</span>
                            </div>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Habilidad Golpeadores</span>
                            <div className={styles.statBar}>
                              <div 
                                className={styles.statFill} 
                                style={{width: `${awayTeam.beaterSkill}%`}}
                              ></div>
                              <span className={styles.statValue}>{awayTeam.beaterSkill}</span>
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
                        <div className={styles.positionGroup}>
                          <h4 className={styles.positionTitle}>
                            <span className={styles.positionIcon}>🥅</span>
                            Guardián
                          </h4>
                          <div className={styles.playerCard}>
                            <div className={styles.playerName}>Guardián de {homeTeam.name}</div>
                            <div className={styles.playerStats}>
                              <span className={styles.playerStat}>Habilidad: {homeTeam.keeperSkill}</span>
                              <span className={styles.playerStat}>Especialidad: Paradas Mágicas</span>
                            </div>
                          </div>
                        </div>

                        <div className={styles.positionGroup}>
                          <h4 className={styles.positionTitle}>
                            <span className={styles.positionIcon}>⚡</span>
                            Cazadores
                          </h4>
                          {[1, 2, 3].map(i => (
                            <div key={i} className={styles.playerCard}>
                              <div className={styles.playerName}>Cazador {i} de {homeTeam.name}</div>
                              <div className={styles.playerStats}>
                                <span className={styles.playerStat}>Habilidad: {homeTeam.chaserSkill}</span>
                                <span className={styles.playerStat}>Especialidad: Anotación</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className={styles.positionGroup}>
                          <h4 className={styles.positionTitle}>
                            <span className={styles.positionIcon}>🏏</span>
                            Golpeadores
                          </h4>
                          {[1, 2].map(i => (
                            <div key={i} className={styles.playerCard}>
                              <div className={styles.playerName}>Golpeador {i} de {homeTeam.name}</div>
                              <div className={styles.playerStats}>
                                <span className={styles.playerStat}>Habilidad: {homeTeam.beaterSkill}</span>
                                <span className={styles.playerStat}>Especialidad: Defensa</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className={styles.positionGroup}>
                          <h4 className={styles.positionTitle}>
                            <span className={styles.positionIcon}>🟡</span>
                            Buscador
                          </h4>
                          <div className={styles.playerCard}>
                            <div className={styles.playerName}>Buscador de {homeTeam.name}</div>
                            <div className={styles.playerStats}>
                              <span className={styles.playerStat}>Habilidad: {homeTeam.seekerSkill}</span>
                              <span className={styles.playerStat}>Especialidad: Captura de Snitch</span>
                            </div>
                          </div>
                        </div>
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
                        <div className={styles.positionGroup}>
                          <h4 className={styles.positionTitle}>
                            <span className={styles.positionIcon}>🥅</span>
                            Guardián
                          </h4>
                          <div className={styles.playerCard}>
                            <div className={styles.playerName}>Guardián de {awayTeam.name}</div>
                            <div className={styles.playerStats}>
                              <span className={styles.playerStat}>Habilidad: {awayTeam.keeperSkill}</span>
                              <span className={styles.playerStat}>Especialidad: Paradas Mágicas</span>
                            </div>
                          </div>
                        </div>

                        <div className={styles.positionGroup}>
                          <h4 className={styles.positionTitle}>
                            <span className={styles.positionIcon}>⚡</span>
                            Cazadores
                          </h4>
                          {[1, 2, 3].map(i => (
                            <div key={i} className={styles.playerCard}>
                              <div className={styles.playerName}>Cazador {i} de {awayTeam.name}</div>
                              <div className={styles.playerStats}>
                                <span className={styles.playerStat}>Habilidad: {awayTeam.chaserSkill}</span>
                                <span className={styles.playerStat}>Especialidad: Anotación</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className={styles.positionGroup}>
                          <h4 className={styles.positionTitle}>
                            <span className={styles.positionIcon}>🏏</span>
                            Golpeadores
                          </h4>
                          {[1, 2].map(i => (
                            <div key={i} className={styles.playerCard}>
                              <div className={styles.playerName}>Golpeador {i} de {awayTeam.name}</div>
                              <div className={styles.playerStats}>
                                <span className={styles.playerStat}>Habilidad: {awayTeam.beaterSkill}</span>
                                <span className={styles.playerStat}>Especialidad: Defensa</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className={styles.positionGroup}>
                          <h4 className={styles.positionTitle}>
                            <span className={styles.positionIcon}>🟡</span>
                            Buscador
                          </h4>
                          <div className={styles.playerCard}>
                            <div className={styles.playerName}>Buscador de {awayTeam.name}</div>
                            <div className={styles.playerStats}>
                              <span className={styles.playerStat}>Habilidad: {awayTeam.seekerSkill}</span>
                              <span className={styles.playerStat}>Especialidad: Captura de Snitch</span>
                            </div>
                          </div>
                        </div>
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
        )}        {activeTab === 'head-to-head' && (
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
        )}

        {activeTab === 'betting' && canBet() && (
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
      </main>

      {/* Related Matches */}
      {relatedMatches.length > 0 && (
        <section className={styles.relatedMatches}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>⚡</span>
            Próximos Duelos Mágicos
          </h2>
          <div className={styles.relatedMatchesGrid}>
            {relatedMatches.map((relatedMatch) => {
              const homeTeamName = homeTeam && relatedMatch.localId === homeTeam.id ? homeTeam.name : relatedMatch.localId;
              const awayTeamName = awayTeam && relatedMatch.visitanteId === awayTeam.id ? awayTeam.name : relatedMatch.visitanteId;
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