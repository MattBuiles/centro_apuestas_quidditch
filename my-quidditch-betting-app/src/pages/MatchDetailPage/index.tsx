import React, { useState, useEffect } from 'react';
import styles from './MatchDetailPage.module.css';
import { useParams } from 'react-router-dom';
import { getMatchDetails } from '../../services/matchesService'; // Adjust path if necessary

interface MatchDetails {
  id: string;
  team1: string;
  team2: string;
  date: string;
  location: string;
  // Add other detailed match properties as needed
}

const MatchDetailPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      if (!matchId) {
        setError('Match ID is missing.');
        setLoading(false);
        return;
      }
      try {
        const data = await getMatchDetails(matchId);
        setMatch(data);
      } catch (err) {
        setError('Failed to fetch match details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();
  }, [matchId]);

  return (
    <div className={styles.matchDetailPageContainer}>
      <h1 className={styles.matchDetailPageTitle}>Match Detail</h1>
      {loading && <p>Loading match details...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {match && (
        <div className={styles.matchDetails}>
          <p>Match ID: {match.id}</p>
          <p>Teams: {match.team1} vs {match.team2}</p>
          <p>Date: {match.date}</p>
          <p>Location: {match.location}</p>
          {/* Render other detailed match information here */}
        </div>
      )}
    </div>
  );
};

export default MatchDetailPage;