import { useState } from 'react'
import MatchCard from '@/components/matches/MatchCard'
import Button from '@/components/common/Button'
import styles from './MatchesPage.module.css'

// Mock data for matches - replace with actual data fetching
const mockMatches = [
  { id: '1', homeTeam: 'Gryffindor', awayTeam: 'Slytherin', date: 'Hoy', time: '19:00', league: 'Liga de Hogwarts', status: 'upcoming' as const },
  { id: '2', homeTeam: 'Hufflepuff', awayTeam: 'Ravenclaw', date: 'Mañana', time: '17:30', league: 'Liga de Hogwarts', status: 'upcoming' as const },
  { id: '3', homeTeam: 'Chudley Cannons', awayTeam: 'Holyhead Harpies', date: 'Domingo', time: '15:00', league: 'Liga Británica', status: 'upcoming' as const },
  { id: '4', homeTeam: 'Gryffindor', awayTeam: 'Hufflepuff', date: 'En Curso', time: '35\'', homeScore: 50, awayScore: 70, league: 'Liga de Hogwarts', status: 'live' as const, minute: '35' },
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
    <div className={styles.matchesPageContainer}>
      <section className={styles.heroSection}>
        <h1 className={styles.heroTitle}>Partidos de Quidditch</h1>
        <p className={styles.heroSubtitle}>Explora todos los partidos, apuesta y sigue la acción en directo</p>
      </section>

      <section className={styles.matchesContainerMain}>
        <div className={styles.filtersSection}>
          <div className={styles.searchFilter}>
            <input 
              type="text" 
              id="match-search" 
              placeholder="Buscar partidos, equipos..." 
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="magical" size="sm">⌕</Button>
          </div>
          <div className={styles.filterOptions}>
            <Button 
              variant={selectedLeague === 'all' ? 'primary' : 'outline'} 
              size="sm" 
              onClick={() => setSelectedLeague('all')}
            >
              Todos
            </Button>
            <Button 
              variant={selectedLeague === 'Liga de Hogwarts' ? 'primary' : 'outline'} 
              size="sm" 
              onClick={() => setSelectedLeague('Liga de Hogwarts')}
            >
              <span className="hidden sm:inline">Liga de</span> Hogwarts
            </Button>
            <Button 
              variant={selectedLeague === 'Liga Británica' ? 'primary' : 'outline'} 
              size="sm" 
              onClick={() => setSelectedLeague('Liga Británica')}
            >
              <span className="hidden sm:inline">Liga</span> Británica
            </Button>
          </div>
        </div>

        <div className={styles.matchesTabs}>
          <Button 
            variant={activeTab === 'upcoming' ? 'primary' : 'outline'} 
            onClick={() => setActiveTab('upcoming')}
            fullWidth
          >
            Próximos
          </Button>
          <Button 
            variant={activeTab === 'live' ? 'primary' : 'outline'} 
            onClick={() => setActiveTab('live')}
            fullWidth
          >
            En Vivo
          </Button>
          <Button 
            variant={activeTab === 'finished' ? 'primary' : 'outline'} 
            onClick={() => setActiveTab('finished')}
            fullWidth
          >
            Finalizados
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