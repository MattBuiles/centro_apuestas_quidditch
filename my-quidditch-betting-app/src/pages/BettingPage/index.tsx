import React from 'react';
import styles from './BettingPage.module.css';
import BettingMatchCard from '../../components/betting/BettingMatchCard';

import BetSummary from '../../components/betting/BetSummary';
// Dummy data for demonstration
const dummyMatches = [
  {
    id: 'match-1',
    homeTeam: {
      id: 'gryffindor',
      name: 'Gryffindor',
      logo: '/path/to/gryffindor-logo.png'
    }, // Replace with actual paths
    awayTeam: {
      id: 'slytherin',
      name: 'Slytherin',
      logo: '/path/to/slytherin-logo.png'
    }, // Replace with actual paths
    date: '2023-10-27',
    time: '14:00',
    odds: { team1: 1.5, team2: 2.5 },
  },
  {
    id: 'match-2',
    homeTeam: { id: 'hufflepuff', name: 'Hufflepuff', logo: '/path/to/hufflepuff-logo.png' }, // Replace with actual paths
    awayTeam: { id: 'ravenclaw', name: 'Ravenclaw', logo: '/path/to/ravenclaw-logo.png' }, // Replace with actual paths
    date: '2023-10-28',
    time: '16:00',
    odds: { team1: 2.0, team2: 1.8 },
  },
  // Add more dummy matches as needed
];

// Dummy data for selected bets
const dummySelectedBets = [
  {
    matchId: 'match-1',
    selectedOption: 'team1_win',
    amount: 10,
  },
  {
    matchId: 'match-2',
    selectedOption: 'team2_win',
    amount: 5,
  },
];

const BettingPage: React.FC = () => {
  // Function to handle placing a bet (will be implemented later)
  const handlePlaceBet = (betDetails: any) => {
    console.log('Bet placed:', betDetails);
  };

  return (
    <div className={styles.bettingPageContainer}>
      <h1 className={styles.bettingPageTitle}>Place Your Bets</h1>
      {dummyMatches.map(match => (
        <BettingMatchCard key={match.id} match={match} onPlaceBet={handlePlaceBet} />
      ))}
      <BetSummary selectedBets={dummySelectedBets} />
    </div>
  );
};

export default BettingPage;