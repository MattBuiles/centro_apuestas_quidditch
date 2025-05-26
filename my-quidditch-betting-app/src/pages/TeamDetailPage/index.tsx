import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './TeamDetailPage.module.css';
import { getTeamDetails } from '../../services/teamsService'; // Adjust path if necessary
import ItemList from '../../components/common/ItemList'; // Assuming ItemList is here

const TeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<any>(null); // Use a proper type later
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (!teamId) return; // Don't fetch if teamId is not available

      try {
        setLoading(true);
        setError(null);
        const data = await getTeamDetails(teamId); // Call the API service
        setTeam(data);
      } catch (err) {
        setError('Failed to fetch team details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamDetails();
  }, [teamId]); // Re-run effect if teamId changes

  if (loading) {
    return <div className={styles.teamDetailPageContainer}><p>Loading team details...</p></div>;
  }

  if (error) {
    return <div className={styles.teamDetailPageContainer}><p style={{ color: 'red' }}>{error}</p></div>;
  }

  return (
    <div className={styles.teamDetailPageContainer}>
      <h1 className={styles.teamDetailPageTitle}>{team?.name} Details</h1> {/* Display team name */}
      <div className={styles.teamPlayersMatchesSection}>
        {/* Team players or matches will go here */}
        <ItemList
          title="Players"
          items={[]} // Placeholder for players
          renderItem={(player) => <div>{player.name}</div>} // Basic render for placeholder
        />
        <ItemList
          title="Recent Matches"
          items={[]} // Placeholder for matches
          renderItem={(match: any) => <div key={match.id}>{match.team1} vs {match.team2}</div>} // Basic render for placeholder
        />
      </div>
    </div>
  );
};

export default TeamDetailPage;