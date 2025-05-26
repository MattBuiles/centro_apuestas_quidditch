import React from 'react';

interface PlayerCardProps {
  player: {
    name: string;
    position: string;
  };
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  return (
    <div className="playerCard">
      <h3>{player.name}</h3>
      <p>Position: {player.position}</p>
    </div>
  );
};

export default PlayerCard;