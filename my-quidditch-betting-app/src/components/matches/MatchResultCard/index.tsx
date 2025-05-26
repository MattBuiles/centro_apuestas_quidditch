import React from 'react';

interface MatchResultCardProps {
  homeTeamName: string;
  homeTeamLogo: string; // Assuming logo is a string URL or path
  awayTeamName: string;
  awayTeamLogo: string; // Assuming logo is a string URL or path
  homeTeamScore: number;
  awayTeamScore: number;
  matchDate: string; // Or use a Date type if preferred
}

const MatchResultCard: React.FC<MatchResultCardProps> = ({
  homeTeamName,
  homeTeamLogo,
  awayTeamName,
  awayTeamLogo,
  homeTeamScore,
  awayTeamScore,
  matchDate,
}) => {
  return (
    <div className="matchResultCard">
      <div className="teamInfo">
        <img src={homeTeamLogo} alt={`${homeTeamName} Logo`} className="teamLogo" />
        <span className="teamName">{homeTeamName}</span>
      </div>
      <div className="score">
        <span className="homeScore">{homeTeamScore}</span> - <span className="awayScore">{awayTeamScore}</span>
      </div>
      <div className="teamInfo">
        <img src={awayTeamLogo} alt={`${awayTeamName} Logo`} className="teamLogo" />
        <span className="teamName">{awayTeamName}</span>
      </div>
      <div className="matchDate">{matchDate}</div>
    </div>
  );
};

export default MatchResultCard;