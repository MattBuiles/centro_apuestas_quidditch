import React, { useState, useEffect } from 'react';
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
  league?: string;
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

    fetchTeams();  }, []); // Empty dependency array means this runs once on mount
  if (loading) return <LoadingSpinner />;

  return (
    <div className="teams-page-container space-y-6 md:space-y-8">
      {/* Hero Section */}
      <section className="hero-section text-center py-8 md:py-12 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">Equipos de Quidditch</h1>
        <p className="text-sm md:text-lg opacity-90">
          Descubre todos los equipos mágicos y sus estadísticas
        </p>
      </section>

      {error && <p className="text-red-600 text-center bg-red-50 p-4 rounded-lg">{error}</p>}

      {/* Filters Section */}
      <section className="filters-section card p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="search-filter flex items-center gap-2 flex-grow md:max-w-md">
            <input
              type="text"
              placeholder="Buscar equipos..."
              className="form-input flex-grow px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button size="sm">Buscar</Button>
          </div>
          
          <div className="filter-options flex flex-wrap gap-2 justify-center md:justify-end">
            <Button 
              variant={selectedLeague === 'all' ? 'primary' : 'outline'} 
              size="sm" 
              onClick={() => setSelectedLeague('all')}
            >
              Todas
            </Button>
            <Button 
              variant={selectedLeague === 'Liga de Hogwarts' ? 'primary' : 'outline'} 
              size="sm" 
              onClick={() => setSelectedLeague('Liga de Hogwarts')}
            >
              Hogwarts
            </Button>
            <Button 
              variant={selectedLeague === 'Liga Británica e Irlandesa' ? 'primary' : 'outline'} 
              size="sm" 
              onClick={() => setSelectedLeague('Liga Británica e Irlandesa')}
            >
              <span className="hidden sm:inline">Liga</span> Británica
            </Button>
          </div>
        </div>
      </section>

      {/* Teams Grid */}
      <section className="teams-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {mockTeams.length > 0 ? (
          mockTeams
            .filter(team => {
              const matchesSearch = searchTerm === '' || team.name.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesLeague = selectedLeague === 'all' || team.league === selectedLeague;
              return matchesSearch && matchesLeague;
            })
            .map(team => (
              <TeamCard key={team.id} team={team} />
            ))
        ) : (
          <p className="text-gray-600 col-span-full text-center py-8">
            No se encontraron equipos que coincidan con los filtros.
          </p>
        )}
      </section>
    </div>
  );
};

export default TeamsPage;