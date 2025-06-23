import React, { useState } from 'react';
import { Match } from '../../types/match.types'; // Assuming you have a Match type defined
import styles from './BettingMatchCard.module.css';
import MatchCard from '../../matches/MatchCard'; // Corrected import path
interface BettingMatchCardProps {
 match: Match;
}

const BettingMatchCard: React.FC<BettingMatchCardProps> = ({ match }) => {
 const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
 const [betAmount, setBetAmount] = useState<number>(0);

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeam(teamId);
  };

  const handleBetAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBetAmount(parseFloat(event.target.value) || 0);
  };

  const handlePlaceBet = () => {
 if (selectedTeam && betAmount > 0) {
 console.log(`Placing bet on Match ID: ${match.id}, Team ID: ${selectedTeam}, Amount: ${betAmount}`);
 // TODO: Implement actual API call to place bet
    } else {
      alert('Please select a team and enter a valid bet amount.');
    }
  };

  return (
    <div className={styles.bettingMatchCardContainer}>
      {/* Create a match object with team1 and team2 for MatchCard */}
      <MatchCard match={{
        id: match.id,
        team1: match.homeTeam,
        team2: match.awayTeam,
        date: match.date,
        time: match.time,
        // Assuming odds, score, and winner might also be part of the match object
        // Copy any other necessary properties from the original match prop
        odds: match.odds,
        // Add other properties as needed by MatchCard
      }} />

      <div className={styles.bettingControls}>
        <div className={styles.teamSelection}>
          <button
            className={`${styles.teamButton} ${selectedTeam === match.homeTeam.id ? styles.selected : ''}`}
            onClick={() => handleTeamSelect(match.homeTeam.id)}
          >
            {match.homeTeam.name}
          </button>
          <button
            className={`${styles.teamButton} ${selectedTeam === match.awayTeam.id ? styles.selected : ''}`}
            onClick={() => handleTeamSelect(match.awayTeam.id)}
          >
            {match.awayTeam.name}
          </button>
        </div>

        <div className={styles.betAmount}>
          <label htmlFor={`bet-amount-${match.id}`}>Bet Amount:</label>
          <input
            type="number"
            id={`bet-amount-${match.id}`}
            value={betAmount}
            onChange={handleBetAmountChange}
            min="0"
            step="0.01"
          />
        </div>

        <button className={styles.placeBetButton} onClick={handlePlaceBet} disabled={!selectedTeam || betAmount <= 0}>
          Place Bet
        </button>
      </div>
    </div>
  );
};

export default BettingMatchCard;