import React, { useState, useEffect } from 'react';
import styles from './TeamsPage.module.css';
import { getTeams } from '../../services/teamsService'; // Adjust path as needed

interface Team {
  id: string;
  name: string;
  // Add other team properties if needed
}
const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await getTeams();
        setTeams(data);
      } catch (err) {
        setError('Failed to fetch teams.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className={styles.teamsPageContainer}>
      <h1 className={styles.teamsPageTitle}>Teams</h1>
      {/* Placeholder for team list */}
      <div className={styles.teamListPlaceholder}>
        {loading && <p>Loading teams...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && (
          <ul>
            {teams.map(team => (
              <li key={team.id} className={styles.teamItem}>
                {/* Placeholder for TeamListItem or simple team name display */}
                {team.name}
              </li>
            ))}
          </ul>
        )}
        {/* Example team item structure (to be replaced with actual data mapping) */}
        {/*
          <div className={styles.teamItem}>
            <img src="/path/to/team-logo.png" alt="Team Logo" className={styles.teamLogo} />
            <span className={styles.teamName}>Team Name</span>
          </div>
        */}
      </div>
    </div>
  );
};

export default TeamsPage;