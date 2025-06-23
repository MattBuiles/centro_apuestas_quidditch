import React from 'react';
import TeamLogo from '@/components/teams/TeamLogo';

interface MatchResultCardProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamScore: number;
  awayTeamScore: number;
  matchDate: string; // Or use a Date type if preferred
}

const MatchResultCard: React.FC<MatchResultCardProps> = ({
  homeTeamName,
  awayTeamName,
  homeTeamScore,
  awayTeamScore,
  matchDate,
}) => {  return (
    <div className="matchResultCard">
      <div className="teamInfo">
        <TeamLogo teamName={homeTeamName} size="sm" className="teamLogo" />
        <span className="teamName">{homeTeamName}</span>
      </div>
      <div className="score">
        <span className="homeScore">{homeTeamScore}</span> - <span className="awayScore">{awayTeamScore}</span>
      </div>
      <div className="teamInfo">
        <TeamLogo teamName={awayTeamName} size="sm" className="teamLogo" />
        <span className="teamName">{awayTeamName}</span>
      </div>
      <div className="matchDate">{matchDate}</div>
    </div>
  );
};

export default MatchResultCard;