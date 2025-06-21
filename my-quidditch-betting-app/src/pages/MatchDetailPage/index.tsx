import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import TeamLogo from '@/components/teams/TeamLogo';
import LiveMatchViewer from '@/components/matches/LiveMatchViewer';
import { Team, Match } from '@/types/league';
import { virtualTimeManager } from '@/services/virtualTimeManager';
import styles from './MatchDetailPage.module.css';
// import { useAuth } from '@/context/AuthContext'; // If needed for predictions

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
  const [match, setMatch] = useState<MatchDetails | null>(null);  const [realMatch, setRealMatch] = useState<Match | null>(null);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live'); // live, stats, lineups, h2h, betting, predictions
  const [showLiveSimulation, setShowLiveSimulation] = useState(false);
  // const [matchState, setMatchState] = useState<MatchState | null>(null); // Reserved for future use
  const [isStartingMatch, setIsStartingMatch] = useState(false);
  // const { isAuthenticated } = useAuth(); // If needed for predictions
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
          // Check if match is already in live simulation
        if (foundMatch.status === 'live') {
          const liveState = virtualTimeManager.getEstadoPartidoEnVivo(foundMatch.id);
          if (liveState) {
            // setMatchState(liveState); // Reserved for future use
            setShowLiveSimulation(true);
          }
        }
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
  }, [matchId]);
  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
  };

  const handleStartMatch = async () => {
    if (!realMatch || realMatch.status !== 'live') return;
    
    setIsStartingMatch(true);    try {
      const liveState = await virtualTimeManager.comenzarPartidoEnVivo(realMatch.id);
      if (liveState) {
        // setMatchState(liveState); // Reserved for future use
        setShowLiveSimulation(true);
      }
    } catch (error) {
      console.error('Error starting match:', error);
    } finally {
      setIsStartingMatch(false);
    }
  };

  const toggleLiveSimulation = () => {
    setShowLiveSimulation(prev => !prev);
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
        </div>
      </div>      
      {/* Inline Prediction Section (Simplified) */}
      <div className={`${styles.predictionSection} ${styles.card}`}>
        <h3 className={styles.predictionTitle}>¿Quién ganará este partido?</h3>
        <div className={styles.predictionOptions}>
          <Button variant="outline" size="sm">{match.homeTeam} Gana</Button>
          <Button variant="outline" size="sm">Empate</Button>
          <Button variant="outline" size="sm">{match.awayTeam} Gana</Button>
        </div>
        <div className={styles.predictionActions}>
          <Button size="sm">Confirmar Predicción</Button>
        </div>
      </div>

      <div className={styles.actions}>
        <Link to={`/betting/${match.id}`}>
          <Button className={styles.ctaButton}>Apostar en este Partido</Button>
        </Link>
        <Button variant="secondary">Ver Estadísticas Avanzadas</Button>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tabButton} ${activeTab === 'live' ? styles.active : ''}`} onClick={() => handleTabClick('live')}>En Vivo</button>
        <button className={`${styles.tabButton} ${activeTab === 'stats' ? styles.active : ''}`} onClick={() => handleTabClick('stats')}>Estadísticas</button>
        <button className={`${styles.tabButton} ${activeTab === 'lineups' ? styles.active : ''}`} onClick={() => handleTabClick('lineups')}>Alineaciones</button>
        <button className={`${styles.tabButton} ${activeTab === 'h2h' ? styles.active : ''}`} onClick={() => handleTabClick('h2h')}>Cara a Cara</button>
        <button className={`${styles.tabButton} ${activeTab === 'betting' ? styles.active : ''}`} onClick={() => handleTabClick('betting')}>Mercados</button>
        <button className={`${styles.tabButton} ${activeTab === 'predictions' ? styles.active : ''}`} onClick={() => handleTabClick('predictions')}>Predicciones</button>
      </div>      <div className={`${styles.tabContent} ${activeTab === 'live' ? '' : styles.hidden}`}>
        <h2 className={styles.tabTitle}>Comentarios en Vivo</h2>
        
        {/* Partido listo para comenzar */}
        {realMatch && realMatch.status === 'live' && !showLiveSimulation && (
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
        {realMatch && homeTeam && awayTeam && showLiveSimulation ? (
          <div className="mb-4">
            <LiveMatchViewer 
              match={realMatch} 
              homeTeam={homeTeam} 
              awayTeam={awayTeam}              onMatchEnd={(endedMatchState) => {
                console.log('Match ended:', endedMatchState);
                virtualTimeManager.finalizarPartidoEnVivo(realMatch.id);
                setShowLiveSimulation(false);
                // setMatchState(null); // Reserved for future use
                // Reload match data
                window.location.reload();
              }}
            />
          </div>
        ) : null}
          {/* Estado por defecto */}
        {(!realMatch || realMatch.status === 'scheduled') && (
          <p>Los comentarios en vivo aparecerán cuando el partido comience...</p>
        )}
        
        {realMatch && realMatch.status === 'finished' && (
          <p>Este partido ha finalizado. Puedes ver el resumen de eventos en la pestaña de Estadísticas.</p>
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

      <div className={`${styles.tabContent} ${activeTab === 'betting' ? '' : styles.hidden}`}>
        <h2 className={styles.tabTitle}>Mercados de Apuestas</h2>
        <p>Los diferentes mercados de apuestas para este partido aparecerán aquí...</p>
      </div>

      <div className={`${styles.tabContent} ${activeTab === 'predictions' ? '' : styles.hidden}`}>
        <h2 className={styles.tabTitle}>Predicciones de la Comunidad</h2>
        <p>Las predicciones de otros usuarios aparecerán aquí...</p>
      </div>      {/* Live Simulation Section */}
      {realMatch && (
        <div className={styles.liveSimulationSection}>
          <h2 className={styles.tabTitle}>Simulación en Vivo</h2>
          <Button onClick={toggleLiveSimulation} className="mb-4">
            {showLiveSimulation ? 'Ocultar Simulación' : 'Ver Simulación en Vivo'}
          </Button>
          {showLiveSimulation && (
            <LiveMatchViewer 
              match={realMatch} 
              homeTeam={mockHomeTeam} 
              awayTeam={mockAwayTeam}
              onMatchEnd={(matchState) => {
                console.log('Match ended:', matchState);
                setShowLiveSimulation(false);
              }}
            />
          )}
        </div>
      )}

      {/* Related Matches Section (Simplified) */}
      <section className={`${styles.relatedMatches} ${styles.card}`}>
        <h2 className={styles.tabTitle}>Otros partidos que te pueden interesar</h2>
        <div className={styles.relatedMatchesGrid}>
          {/* Placeholder for related match cards */}
          <div className={styles.relatedMatchCard}>Partido Relacionado 1</div>
          <div className={styles.relatedMatchCard}>Partido Relacionado 2</div>
        </div>
      </section>
    </div>
  );
};

export default MatchDetailPage;