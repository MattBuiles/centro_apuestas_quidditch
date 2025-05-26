import React from 'react';

interface Team {
  name: string;
  logo: string; // Assuming logo is a string path to an image
}

interface Match {
  id: string;
  team1: Team;
  team2: Team;
  date: string;
  time: string;
  // Add other match properties as needed
}

interface MatchCardProps {
  match: Match;
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  return (
    <div>
      <h3>{match.team1.name} vs {match.team2.name}</h3>
      <div>
        <img src={match.team1.logo} alt={`${match.team1.name} logo`} width="50" />
        <span> vs </span>
        <img src={match.team2.logo} alt={`${match.team2.name} logo`} width="50" />
      </div>
      <p>Date: {match.date}</p>
      <p>Time: {match.time}</p>
    </div>
  );
};

export default MatchCard;