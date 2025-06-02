import React, { useState, useEffect } from 'react';
import styles from './TeamsPage.module.css';
import { getTeams } from '../../services/teamsService'; // Adjust path as needed
import TeamCard from '@/components/teams/TeamCard';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Mock data
interface TeamData {
  id: string;
  name: string;
  logoChar: string;
  league: string;
}
const mockTeams: TeamData[] = [
  { id: 'gryffindor', name: 'Gryffindor', logoChar: 'G', league: 'Liga de Hogwarts' },
  { id: 'slytherin', name: 'Slytherin', logoChar: 'S', league: 'Liga de Hogwarts' },
  { id: 'ravenclaw', name: 'Ravenclaw', logoChar: 'R', league: 'Liga de Hogwarts' },
  { id: 'hufflepuff', name: 'Hufflepuff', logoChar: 'H', league: 'Liga de Hogwarts' },
  { id: 'chudley_cannons', name: 'Chudley Cannons', logoChar: 'C', league: 'Liga Británica e Irlandesa' },
  { id: 'holyhead_harpies', name: 'Holyhead Harpies', logoChar: 'H', league: 'Liga Británica e Irlandesa' },
];

interface Team {
  id: string;
  name: string;
  // Add other team properties if needed
}
const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('all');

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

  const filteredTeams = teams.filter(team => {
    const matchesSearch = searchTerm === '' || team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = selectedLeague === 'all' || team.league === selectedLeague;
    return matchesSearch && matchesLeague;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className={styles.teamsPageContainer}>
      <h1 className={styles.teamsPageTitle}>Teams</h1>
      {/* Placeholder for team list */}
      <div className={styles.teamListPlaceholder}>
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
      <section className="filters-section card mb-8 p-4">
        <div className="search-filter flex items-center gap-2 mb-4 md:mb-0 flex-grow">
          <input
            type="text"
            placeholder="Buscar equipos..."
            className="form-input flex-grow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button size="sm">Buscar</Button>
        </div>
        <div className="filter-options flex gap-2">
          <Button variant={selectedLeague === 'all' ? 'primary' : 'outline'} size="sm" onClick={() => setSelectedLeague('all')}>Todas las Ligas</Button>
          <Button variant={selectedLeague === 'Liga de Hogwarts' ? 'primary' : 'outline'} size="sm" onClick={() => setSelectedLeague('Liga de Hogwarts')}>Liga de Hogwarts</Button>
          <Button variant={selectedLeague === 'Liga Británica e Irlandesa' ? 'primary' : 'outline'} size="sm" onClick={() => setSelectedLeague('Liga Británica e Irlandesa')}>Liga Británica</Button>
        </div>
      </section>

      <section className="teams-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTeams.length > 0 ? (
          filteredTeams.map(team => (
            <TeamCard key={team.id} team={team} />
          ))
        ) : (
          <p className="text-gray-600 col-span-full text-center">No se encontraron equipos.</p>
        )}
      </section>
    </div>
  );
};

export default TeamsPage;