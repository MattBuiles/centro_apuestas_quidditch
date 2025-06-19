import React, { useState } from 'react';
import TeamCard from '@/components/teams/TeamCard';
import Button from '@/components/common/Button';

// Mock data for teams
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

const TeamsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('all');

  const filteredTeams = mockTeams.filter(team => {
    const matchesSearch = searchTerm === '' || team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = selectedLeague === 'all' || team.league === selectedLeague;
    return matchesSearch && matchesLeague;
  });

  return (
    <div className="teams-page-container space-y-6 md:space-y-8">
      {/* Hero Section */}
      <section className="hero-section text-center py-8 md:py-12 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">Equipos de Quidditch</h1>
        <p className="text-sm md:text-lg opacity-90">
          Descubre todos los equipos mágicos y sus estadísticas
        </p>
      </section>

      {/* Filters Section */}
      <section className="filters-section card p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="search-filter flex items-center gap-2 flex-grow md:max-w-md">
            <input
              type="text"
              placeholder="Buscar equipos..."
              className="form-input flex-grow px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[2.5rem]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button size="sm">🔍</Button>
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
        {filteredTeams.length > 0 ? (
          filteredTeams.map(team => (
            <TeamCard key={team.id} team={team} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-600 text-lg mb-4">
              No se encontraron equipos que coincidan con los filtros.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSelectedLeague('all');
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};

export default TeamsPage;
