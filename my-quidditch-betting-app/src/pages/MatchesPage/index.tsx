import React, { useState, useEffect } from 'react';
import BettingMatchCard from '../../components/betting/BettingMatchCard'; // Assuming the correct path
import MatchResultCard from '../../components/matches/MatchResultCard'; // Assuming the correct path
// Assuming matchesService.ts exists and has a getMatches function
import { getMatches } from '../../services/matchesService'; // Adjust the path as needed

interface Match {
  id: string;
  date: string; // Assuming date exists for checking upcoming/recent
  // Add other match properties expected by BettingMatchCard and MatchResultCard
}

const MatchesPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await getMatches(); // Call the API service
        setMatches(data);
      } catch (err) {
        setError('Failed to fetch matches.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div>
      <h1>Matches</h1>
      {loading && <p>Loading matches...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && matches.map(match => (
        // Simple check: if match date is in the future, use BettingMatchCard, otherwise MatchResultCard
        new Date(match.date) > new Date() ? (
          <BettingMatchCard key={match.id} match={match} /> // Assuming match prop is enough
        ) : (
          <MatchResultCard key={match.id} match={match} /> // Assuming match prop is enough
        )
      ))}
    </div>
  );
};

export default MatchesPage;