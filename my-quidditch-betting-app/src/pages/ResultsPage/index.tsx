import React from 'react';
import MatchResultCard from '../../components/matches/MatchResultCard';
import './ResultsPage.module.css';

const ResultsPage: React.FC = () => {
  // Dummy data for demonstration
  const dummyResults = [
    { id: 1, team1: 'Gryffindor', team2: 'Slytherin', score1: 150, score2: 90, team1Logo: '/path/to/gryffindor-logo.png', team2Logo: '/path/to/slytherin-logo.png' },
    { id: 2, team1: 'Hufflepuff', team2: 'Ravenclaw', score1: 70, score2: 120, team1Logo: '/path/to/hufflepuff-logo.png', team2Logo: '/path/to/ravenclaw-logo.png' },
    { id: 3, team1: 'Gryffindor', team2: 'Hufflepuff', score1: 200, score2: 60, team1Logo: '/path/to/gryffindor-logo.png', team2Logo: '/path/to/hufflepuff-logo.png' },
  ];

  return (
    <div className="results-page-container">
      <h1>Match Results</h1>
      <div className="results-list">
        {dummyResults.map(result => (
          <MatchResultCard
            key={result.id}
            team1={result.team1}
            team2={result.team2}
            score1={result.score1}
            score2={result.score2}
            team1Logo={result.team1Logo}
            team2Logo={result.team2Logo}
          />
        ))}
      </div>
      <div className="pagination-container">
        {/* Basic pagination structure */}
        <p>Pagination controls here</p>
      </div>
    </div>
  );
};

export default ResultsPage;