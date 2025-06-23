import React from 'react';
import styles from './BetSummary.module.css';

interface SelectedBet {
  matchId: number;
  matchDetails: string; // e.g., "Gryffindor vs Slytherin"
  selectedOption: string; // e.g., "team1_win", "draw", "team2_win"
  amount: number;
}

interface BetSummaryProps {
  selectedBets: SelectedBet[];
}

const BetSummary: React.FC<BetSummaryProps> = ({ selectedBets }) => {
  const handleConfirmBets = () => {
    console.log('Confirming Bets:', selectedBets);
    // Here you would typically send the selectedBets to a backend service
  };

  if (selectedBets.length === 0) {
    return null; // Don't render if no bets are selected
  }

  return (
    <div className={styles.betSummaryContainer}>
      <h2>Bet Summary</h2>
      <ul className={styles.betList}>
        {selectedBets.map((bet, index) => (
          <li key={index} className={styles.betItem}>
            <p>
              <strong>Match:</strong> {bet.matchDetails}
            </p>
            <p>
              <strong>Your Bet:</strong> {bet.selectedOption}
            </p>
            <p>
              <strong>Amount:</strong> {bet.amount} Galleons
            </p>
          </li>
        ))}
      </ul>
      <button className={styles.confirmButton} onClick={handleConfirmBets}>
        Confirm Bets
      </button>
    </div>
  );
};

export default BetSummary;