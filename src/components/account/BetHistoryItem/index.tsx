import React from 'react';

interface BetHistoryItemProps {
  bet: {
    id: string;
    match: {
      team1: string;
      team2: string;
      date: string;
    };
    option: string;
    amount: number;
    result: 'win' | 'loss' | 'pending';
    payout?: number;
  };
}

const BetHistoryItem: React.FC<BetHistoryItemProps> = ({ bet }) => {
  const resultColor = bet.result === 'win' ? 'green' : bet.result === 'loss' ? 'red' : 'gray';

  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
      <h3>Bet ID: {bet.id}</h3>
      <p>Match: {bet.match.team1} vs {bet.match.team2} ({bet.match.date})</p>
      <p>Option: {bet.option}</p>
      <p>Amount: ${bet.amount.toFixed(2)}</p>
      <p>Result: <span style={{ color: resultColor }}>{bet.result.toUpperCase()}</span></p>
      {bet.result === 'win' && bet.payout !== undefined && (
        <p>Payout: ${bet.payout.toFixed(2)}</p>
      )}
    </div>
  );
};

export default BetHistoryItem;