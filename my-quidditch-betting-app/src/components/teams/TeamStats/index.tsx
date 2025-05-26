import React from 'react';

interface TeamStatsProps {
  stats: {
    wins: number;
    losses: number;
    ties: number;
    pointsScored: number;
    pointsAllowed: number;
    // Add other relevant stats based on mockups
  };
}

const TeamStats: React.FC<TeamStatsProps> = ({ stats }) => {
  return (
    <div>
      <h3>Team Statistics</h3>
      <ul>
        <li>Wins: {stats.wins}</li>
        <li>Losses: {stats.losses}</li>
        <li>Ties: {stats.ties}</li>
        <li>Points Scored: {stats.pointsScored}</li>
        <li>Points Allowed: {stats.pointsAllowed}</li>
        {/* Add other stats here */}
      </ul>
    </div>
  );
};

export default TeamStats;