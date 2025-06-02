// filepath: d:\Coding\Projects\centro_apuestas_quidditch\my-quidditch-betting-app\src\components\matches\MatchCard.tsx
import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date?: string;
  time?: string;
  league?: string;
  location?: string; // Not in wireframe card, but good to have
  status?: 'live' | 'upcoming' | 'finished'; // For styling
  homeScore?: number; // For live/finished
  awayScore?: number; // For live/finished
  minute?: string; // For live
  // Add odds if they are part of the basic card display
}

interface MatchCardProps {
  match: Match;
}

const MatchCard = ({ match }: MatchCardProps) => {
  return (
    <div className={`match-card ${match.status === 'live' ? 'live' : ''}`}>
      {match.status === 'live' && (
        <div className="live-tag">
          <span className="live-indicator"></span>EN VIVO
        </div>
      )}
      <div className="match-details"> {/* From wireframe style for matches.html */}
        <div className="teams">
          <div className="team home-team">
            <div className="team-logo-placeholder small placeholder-x">
              {match.homeTeam.charAt(0)}
            </div>
            <span className="team-name">{match.homeTeam}</span>
            {typeof match.homeScore !== 'undefined' && <span className="score">{match.homeScore}</span>}
          </div>
          <div className="vs-indicator">VS</div>
          <div className="team away-team">
            <div className="team-logo-placeholder small placeholder-x">
              {match.awayTeam.charAt(0)}
            </div>
            <span className="team-name">{match.awayTeam}</span>
            {typeof match.awayScore !== 'undefined' && <span className="score">{match.awayScore}</span>}
          </div>
        </div>
        <div className="match-status">
          <span className="match-time">{match.date} • {match.time} {match.minute && `(${match.minute}')`}</span>
          {match.league && <span className="league-name">{match.league}</span>}
        </div>
        {/* Betting odds can be added here if needed on the card */}
      </div>
      <div className="match-actions">
        <Link to={`/matches/${match.id}`}>
          <Button variant="outline" size="sm">Ver Detalles</Button>
        </Link>
        <Link to={`/betting/${match.id}`}> {/* Or a general betting page if not match specific */}
          <Button size="sm" className="cta-button">Apostar</Button>
        </Link>
      </div>
    </div>
  );
};

export default MatchCard;