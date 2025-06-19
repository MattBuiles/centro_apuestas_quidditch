import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import TeamLogo from '@/components/teams/TeamLogo';
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
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live'); // live, stats, lineups, h2h, betting, predictions
  // const { isAuthenticated } = useAuth(); // If needed for predictions

  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      // In a real app, fetch match details based on matchId
      if (matchId === mockMatchDetail.id) { // Simple check for mock
        setMatch(mockMatchDetail);
      } else {
        setMatch(null); // Or a different mock match
      }
      setIsLoading(false);
    }, 1000);
  }, [matchId]);

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!match) {
    return <div className="text-center p-8">Partido no encontrado.</div>;
  }

  return (
    <div className="match-detail-container">
      <div className="breadcrumbs">
        <Link to="/">Inicio</Link> <span>&gt;</span>
        <Link to="/matches">Partidos</Link> <span>&gt;</span>
        <span>{match.homeTeam} vs {match.awayTeam}</span>
      </div>

      <div className="match-header">
        {match.status === 'live' && <div className="status-badge live">EN VIVO</div>}
        {match.status === 'finished' && <div className="status-badge">FINALIZADO</div>}
        {match.status === 'upcoming' && <div className="status-badge">PRÓXIMO</div>}
        <h1 className="match-title">{match.homeTeam} vs {match.awayTeam}</h1>
        <div className="match-meta">
          <span>{match.date}</span>
          <span>{match.time}</span>
          <span>{match.league}</span>
          <span>{match.location}</span>
        </div>
      </div>

      <div className="match-scoreboard">        <div className="team home-team">
          <TeamLogo teamName={match.homeTeam} size="lg" className="match-detail-logo" />
          <div className="team-name">{match.homeTeam}</div>
        </div>
        <div className="score-display">
          <div className="current-score">{match.homeScore} - {match.awayScore}</div>
          {match.status === 'live' && match.minute && <div className="time-display status-indicator pulsing">{match.minute}</div>}
          {match.status === 'finished' && <div className="time-display">Finalizado</div>}
          {match.status === 'upcoming' && <div className="time-display">Próximamente</div>}
        </div>        <div className="team away-team">
          <TeamLogo teamName={match.awayTeam} size="lg" className="match-detail-logo" />
          <div className="team-name">{match.awayTeam}</div>
        </div>
      </div>
      
      {/* Inline Prediction Section (Simplified) */}
      <div id="prediction-section" className="prediction-inline card">
        <h3 className="prediction-title">¿Quién ganará este partido?</h3>
        <div className="prediction-options-inline">
          <Button variant="outline" size="sm">{match.homeTeam} Gana</Button>
          <Button variant="outline" size="sm">Empate</Button>
          <Button variant="outline" size="sm">{match.awayTeam} Gana</Button>
        </div>
        <div className="prediction-actions mt-2">
          <Button size="sm">Confirmar Predicción</Button>
        </div>
      </div>

      <div className="match-actions">
        <Link to={`/betting/${match.id}`}>
          <Button className="cta-button">Apostar en este Partido</Button>
        </Link>
        <Button variant="secondary">Ver Estadísticas Avanzadas</Button>
      </div>

      <div className="match-content-tabs">
        <button className={`tab-button ${activeTab === 'live' ? 'active' : ''}`} onClick={() => handleTabClick('live')}>En Vivo</button>
        <button className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => handleTabClick('stats')}>Estadísticas</button>
        <button className={`tab-button ${activeTab === 'lineups' ? 'active' : ''}`} onClick={() => handleTabClick('lineups')}>Alineaciones</button>
        <button className={`tab-button ${activeTab === 'h2h' ? 'active' : ''}`} onClick={() => handleTabClick('h2h')}>Cara a Cara</button>
        <button className={`tab-button ${activeTab === 'betting' ? 'active' : ''}`} onClick={() => handleTabClick('betting')}>Mercados</button>
        <button className={`tab-button ${activeTab === 'predictions' ? 'active' : ''}`} onClick={() => handleTabClick('predictions')}>Predicciones</button>
      </div>

      <div id="live-updates" className={`tab-content ${activeTab === 'live' ? '' : 'hidden'}`}>
        <h2 className="text-xl font-bold text-primary mb-4">Comentarios en Vivo</h2>
        <p>Los comentarios en vivo aparecerán aquí...</p>
        {/* Placeholder for live commentary feed */}
      </div>

      <div id="stats" className={`tab-content ${activeTab === 'stats' ? '' : 'hidden'}`}>
        <h2 className="text-xl font-bold text-primary mb-4">Estadísticas del Partido</h2>
        <p>Las estadísticas detalladas del partido aparecerán aquí...</p>
        {/* Placeholder for stats display */}
      </div>

      <div id="lineups" className={`tab-content ${activeTab === 'lineups' ? '' : 'hidden'}`}>
        <h2 className="text-xl font-bold text-primary mb-4">Alineaciones</h2>
        <p>Las alineaciones de los equipos aparecerán aquí...</p>
        {/* Placeholder for lineups display */}
      </div>
      
      <div id="head-to-head" className={`tab-content ${activeTab === 'h2h' ? '' : 'hidden'}`}>
        <h2 className="text-xl font-bold text-primary mb-4">Historial de Enfrentamientos</h2>
        <p>El historial cara a cara entre los equipos aparecerá aquí...</p>
      </div>

      <div id="betting-options" className={`tab-content ${activeTab === 'betting' ? '' : 'hidden'}`}>
        <h2 className="text-xl font-bold text-primary mb-4">Mercados de Apuestas</h2>
        <p>Los diferentes mercados de apuestas para este partido aparecerán aquí...</p>
      </div>

      <div id="predictions-tab" className={`tab-content ${activeTab === 'predictions' ? '' : 'hidden'}`}>
        <h2 className="text-xl font-bold text-primary mb-4">Predicciones de la Comunidad</h2>
        <p>Las predicciones de otros usuarios aparecerán aquí...</p>
      </div>

      {/* Related Matches Section (Simplified) */}
      <section className="related-matches mt-12 card">
        <h2 className="text-xl font-bold text-primary mb-4">Otros partidos que te pueden interesar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Placeholder for related match cards */}
          <div className="p-4 border rounded-md">Partido Relacionado 1</div>
          <div className="p-4 border rounded-md">Partido Relacionado 2</div>
        </div>
      </section>
    </div>
  );
};

export default MatchDetailPage;