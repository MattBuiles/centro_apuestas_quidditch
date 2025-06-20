import { useState } from 'react'
import MatchCard from '@/components/matches/MatchCard'
import Button from '@/components/common/Button'
import styles from './MatchesPage.module.css'

// Mock data for matches - replace with actual data fetching
const mockMatches = [
  // Próximos partidos
  { id: '1', homeTeam: 'Gryffindor', awayTeam: 'Slytherin', date: 'Hoy', time: '19:00', league: 'Liga de Hogwarts', status: 'upcoming' as const },
  { id: '2', homeTeam: 'Hufflepuff', awayTeam: 'Ravenclaw', date: 'Mañana', time: '17:30', league: 'Liga de Hogwarts', status: 'upcoming' as const },
  { id: '3', homeTeam: 'Ravenclaw', awayTeam: 'Gryffindor', date: 'Mañana', time: '20:00', league: 'Liga de Hogwarts', status: 'upcoming' as const },
  { id: '4', homeTeam: 'Slytherin', awayTeam: 'Hufflepuff', date: 'Pasado mañana', time: '16:00', league: 'Liga de Hogwarts', status: 'upcoming' as const },
  { id: '5', homeTeam: 'Gryffindor', awayTeam: 'Hufflepuff', date: 'Viernes', time: '18:30', league: 'Liga de Hogwarts', status: 'upcoming' as const },
  { id: '6', homeTeam: 'Ravenclaw', awayTeam: 'Slytherin', date: 'Sábado', time: '15:00', league: 'Liga de Hogwarts', status: 'upcoming' as const },
  
  // Partidos en vivo
  { id: '7', homeTeam: 'Hufflepuff', awayTeam: 'Gryffindor', date: 'En Curso', time: '45\'', homeScore: 70, awayScore: 120, league: 'Liga de Hogwarts', status: 'live' as const, minute: '45' },
  { id: '8', homeTeam: 'Slytherin', awayTeam: 'Ravenclaw', date: 'En Curso', time: '62\'', homeScore: 140, awayScore: 110, league: 'Liga de Hogwarts', status: 'live' as const, minute: '62' },
];

const MatchesPage = () => {
  const [activeTab, setActiveTab] = useState('upcoming') // upcoming, live
  const [searchTerm, setSearchTerm] = useState('');

  // Filter logic (basic example)
  const filteredMatches = mockMatches.filter(match => {
    const matchesSearch = searchTerm === '' || 
                          match.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = activeTab === 'all' || match.status === activeTab;
    return matchesSearch && matchesStatus;
  });
  return (
    <div className={styles.matchesPageContainer}>      <section className={styles.heroSection}>
        <h1 className={styles.heroTitle}>Partidos de la Liga de Hogwarts</h1>
        <p className={styles.heroSubtitle}>Descubre todos los enfrentamientos entre las casas de Hogwarts y sigue la acción en tiempo real</p>
      </section><section className={styles.matchesContainerMain}>
        <div className={styles.filtersSection}>
          <div className={styles.searchFilter}>
            <input 
              type="text" 
              id="match-search" 
              placeholder="Buscar equipos..." 
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="magical" size="sm">⌕</Button>
          </div>
          <div className={styles.filterOptions}>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/80 px-4 py-2 rounded-lg border border-gray-200">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span className="font-medium">Liga de Hogwarts</span>
            </div>
          </div>
        </div>

        <div className={styles.matchesTabs}>
          <Button 
            variant={activeTab === 'upcoming' ? 'primary' : 'outline'} 
            onClick={() => setActiveTab('upcoming')}
            fullWidth
          >
            📅 Próximos Partidos
          </Button>
          <Button 
            variant={activeTab === 'live' ? 'primary' : 'outline'} 
            onClick={() => setActiveTab('live')}
            fullWidth
          >
            🔴 En Vivo
          </Button>
        </div>

        {/* Grid for matches */}
        <div className={styles.upcomingMatchesGrid}>
          {filteredMatches.length > 0 ? (
            filteredMatches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))
          ) : (
            <p className={styles.noMatchesMessage}>No hay partidos que coincidan con los filtros seleccionados.</p>
          )}
        </div>
      </section>
    </div>
  )
}

export default MatchesPage;