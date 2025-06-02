import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';

interface Team {
  id: string;
  name: string;
  logoChar: string; // For placeholder
  league: string;
  // Add more details like wins, losses if needed for card
}

interface TeamCardProps {
  team: Team;
}

const TeamCard = ({ team }: TeamCardProps) => {
  return (
    <div className="team-card card"> {/* Using .card for base styling */}
      <div className="team-logo-placeholder">
        {team.logoChar}
      </div>
      <h3 className="team-name">{team.name}</h3>
      <p className="team-league text-sm text-gray-500 mb-4">{team.league}</p>
      <Link to={`/teams/${team.id}`}>
        <Button variant="outline" size="sm" fullWidth>Ver Detalles</Button>
      </Link>
    </div>
  );
};

export default TeamCard;