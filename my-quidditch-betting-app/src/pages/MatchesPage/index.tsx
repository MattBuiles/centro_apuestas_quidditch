// filepath: d:\Coding\Projects\centro_apuestas_quidditch\my-quidditch-betting-app\src\pages\MatchesPage\index.tsx
import { useState } from 'react'
import MatchCard from '@/components/matches/MatchCard' // Ensure this path is correct
import Button from '@/components/common/Button'

// Mock data for matches - replace with actual data fetching
const mockMatches = [
  { id: '1', homeTeam: 'Gryffindor', awayTeam: 'Slytherin', date: 'Hoy', time: '19:00', league: 'Liga de Hogwarts', status: 'upcoming' as const },
  { id: '2', homeTeam: 'Hufflepuff', awayTeam: 'Ravenclaw', date: 'Mañana', time: '17:30', league: 'Liga de Hogwarts', status: 'upcoming' as const },
  { id: '3', homeTeam: 'Chudley Cannons', awayTeam: 'Holyhead Harpies', date: 'Domingo', time: '15:00', league: 'Liga Británica', status: 'upcoming' as const },
  { id: '4', homeTeam: 'Tutshill Tornados', awayTeam: 'Montrose Magpies', date: 'En Curso', time: '35\'', homeScore: 50, awayScore: 70, league: 'Liga Británica', status: 'live' as const, minute: '35' },
];

const MatchesPage = () => {
  const [activeTab, setActiveTab] = useState('upcoming') // upcoming, live, finished
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('all');

  // Filter logic (basic example)
  const filteredMatches = mockMatches.filter(match => {
    const matchesSearch = searchTerm === '' || 
                          match.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = selectedLeague === 'all' || match.league === selectedLeague;
    const matchesStatus = activeTab === 'all' || match.status === activeTab;
    return matchesSearch && matchesLeague && matchesStatus;
  });

  return (
    <div className="matches-page-container">
      <section className="hero-section text-center p-8 mb-8 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(75, 0, 130, 0.7), rgba(106, 90, 205, 0.4))', color: 'white' }}>
        <h1 className="text-3xl font-bold mb-2">Partidos de Quidditch</h1>
        <p>Explora todos los partidos, apuesta y sigue la acción en directo</p>
      </section>

      <section className="matches-container-main"> {/* From wireframe matches.html */}
        <div className="filters-section card mb-8 p-4"> {/* Using card class */}
          <div className="search-filter flex items-center gap-2 mb-4 md:mb-0">
            <input 
              type="text" 
              id="match-search" 
              placeholder="Buscar partidos, equipos..." 
              className="form-input flex-grow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button size="sm" className="search-button">⌕</Button>
          </div>
          <div className="filter-options flex gap-2 mb-4 md:mb-0">
            <Button variant={selectedLeague === 'all' ? 'primary' : 'outline'} size="sm" onClick={() => setSelectedLeague('all')}>Todos</Button>
            <Button variant={selectedLeague === 'Liga de Hogwarts' ? 'primary' : 'outline'} size="sm" onClick={() => setSelectedLeague('Liga de Hogwarts')}>Liga de Hogwarts</Button>
            <Button variant={selectedLeague === 'Liga Británica' ? 'primary' : 'outline'} size="sm" onClick={() => setSelectedLeague('Liga Británica')}>Liga Británica</Button>
          </div>
          {/* View options can be added here if needed */}
        </div>

        <div className="matches-tabs flex justify-center gap-1 mb-8 p-2 bg-gray-100 rounded-md">
          <Button variant={activeTab === 'upcoming' ? 'primary' : 'outline'} onClick={() => setActiveTab('upcoming')}>Próximos</Button>
          <Button variant={activeTab === 'live' ? 'primary' : 'outline'} onClick={() => setActiveTab('live')}>En Vivo</Button>
          <Button variant={activeTab === 'finished' ? 'primary' : 'outline'} onClick={() => setActiveTab('finished')}>Finalizados</Button>
        </div>

        {/* Grid for matches */}
        <div className="upcoming-matches-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.length > 0 ? (
            filteredMatches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))
          ) : (
            <p className="text-gray-600 col-span-full text-center">No hay partidos que coincidan con los filtros seleccionados.</p>
          )}
        </div>
        {/* Pagination can be added here */}
      </section>
    </div>
  )
}

export default MatchesPage