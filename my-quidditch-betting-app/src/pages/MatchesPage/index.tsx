import { useState, useEffect } from 'react'
import MatchCard from '@/components/matches/MatchCard'
import VirtualTimeControl from '@/components/matches/VirtualTimeControl'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'
import { QuidditchSystem } from '@/services/quidditchSystem'
import { virtualTimeManager } from '@/services/virtualTimeManager'
import { Season, Match } from '@/types/league'
import styles from './MatchesPage.module.css'

const MatchesPage = () => {
  const [activeTab, setActiveTab] = useState('upcoming') // upcoming, live, results
  const [searchTerm, setSearchTerm] = useState('');
  const [season, setSeason] = useState<Season | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeSeason();
  }, []);

  const initializeSeason = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if there's an active season in virtual time manager
      const timeState = virtualTimeManager.getState();
      
      if (timeState.temporadaActiva) {
        setSeason(timeState.temporadaActiva);
      } else {
        // Create a new professional season
        const newSeason = QuidditchSystem.createProfessionalLeague();
        virtualTimeManager.setTemporadaActiva(newSeason);
        setSeason(newSeason);
      }
    } catch (err) {
      setError('Error inicializando la temporada: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };
  const handleTimeAdvanced = (_newDate: Date, simulatedMatches: Match[]) => {
    // Refresh season data when time advances
    const timeState = virtualTimeManager.getState();
    if (timeState.temporadaActiva) {
      setSeason({ ...timeState.temporadaActiva });
    }
    
    if (simulatedMatches.length > 0) {
      console.log(`✅ Se simularon ${simulatedMatches.length} partidos`);
    }
  };

  const handleSeasonReset = () => {
    // Reset season when virtual time is reset
    initializeSeason();
  };

  const getFilteredMatches = () => {
    if (!season) return [];

    const partidos = season.partidos || [];
    const fechaVirtual = virtualTimeManager.getFechaVirtualActual();

    let filteredMatches: Match[] = [];

    switch (activeTab) {
      case 'upcoming':
        filteredMatches = partidos.filter(match => {
          const matchDate = new Date(match.fecha);
          return matchDate > fechaVirtual && match.status === 'scheduled';
        });
        break;
      case 'live':
        filteredMatches = partidos.filter(match => match.status === 'live');
        break;
      case 'results':
        filteredMatches = partidos.filter(match => match.status === 'finished');
        break;      case 'today': {
        const today = new Date(fechaVirtual);
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        filteredMatches = partidos.filter(match => {
          const matchDate = new Date(match.fecha);
          return matchDate >= startOfDay && matchDate <= endOfDay;
        });
        break;
      }
      default:
        filteredMatches = partidos;
    }

    // Apply search filter
    if (searchTerm.trim()) {
      filteredMatches = filteredMatches.filter(match => {
        const homeTeam = season.equipos.find(t => t.id === match.localId)?.name || '';
        const awayTeam = season.equipos.find(t => t.id === match.visitanteId)?.name || '';
        return homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
               awayTeam.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Sort by date
    return filteredMatches.sort((a, b) => {
      const dateA = new Date(a.fecha);
      const dateB = new Date(b.fecha);
      return activeTab === 'results' 
        ? dateB.getTime() - dateA.getTime() // Recent first for results
        : dateA.getTime() - dateB.getTime(); // Chronological for upcoming
    });
  };
  const formatMatchForCard = (match: Match) => {
    const homeTeam = season?.equipos.find(t => t.id === match.localId);
    const awayTeam = season?.equipos.find(t => t.id === match.visitanteId);
    
    // Map status to MatchCard expected values
    const cardStatus = match.status === 'scheduled' ? 'upcoming' as const : 
                      match.status === 'live' ? 'live' as const :
                      match.status === 'finished' ? 'finished' as const : 'upcoming' as const;
    
    return {
      id: match.id,
      homeTeam: homeTeam?.name || match.localId,
      awayTeam: awayTeam?.name || match.visitanteId,
      date: new Date(match.fecha).toLocaleDateString('es-ES'),
      time: new Date(match.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      league: season?.name || 'Liga Quidditch',
      status: cardStatus,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      minute: match.currentMinute?.toString()
    };
  };

  const getTabCounts = () => {
    if (!season) return { upcoming: 0, live: 0, results: 0, today: 0 };

    const partidos = season.partidos || [];
    const fechaVirtual = virtualTimeManager.getFechaVirtualActual();
    
    const today = new Date(fechaVirtual);
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return {
      upcoming: partidos.filter(m => new Date(m.fecha) > fechaVirtual && m.status === 'scheduled').length,
      live: partidos.filter(m => m.status === 'live').length,
      results: partidos.filter(m => m.status === 'finished').length,
      today: partidos.filter(m => {
        const matchDate = new Date(m.fecha);
        return matchDate >= startOfDay && matchDate <= endOfDay;
      }).length
    };
  };

  if (isLoading) {
    return (
      <div className={styles.matchesPageContainer}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
            <p>Cargando sistema de simulación...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.matchesPageContainer}>
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error del Sistema</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={initializeSeason} variant="primary">
            Reintentar
          </Button>
        </Card>
      </div>
    );
  }

  const filteredMatches = getFilteredMatches();
  const tabCounts = getTabCounts();

  return (
    <div className={styles.matchesPageContainer}>
      <section className={styles.heroSection}>
        <h1 className={styles.heroTitle}>Centro de Control de Liga</h1>
        <p className={styles.heroSubtitle}>
          Gestiona el tiempo virtual, simula partidos y sigue la evolución de la liga
        </p>
      </section>

      {/* Virtual Time Control */}
      <VirtualTimeControl 
        onTimeAdvanced={handleTimeAdvanced}
        onSeasonReset={handleSeasonReset}
      />

      <section className={styles.matchesContainerMain}>
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
              <span className="font-medium">{season?.name || 'Liga Quidditch'}</span>
              <span className="text-xs text-gray-500">
                ({season?.equipos.length || 0} equipos, {season?.partidos.length || 0} partidos)
              </span>
            </div>
          </div>
        </div>

        <div className={styles.matchesTabs}>
          <Button 
            variant={activeTab === 'today' ? 'primary' : 'outline'} 
            onClick={() => setActiveTab('today')}
            size="sm"
          >
            📅 Hoy ({tabCounts.today})
          </Button>
          <Button 
            variant={activeTab === 'upcoming' ? 'primary' : 'outline'} 
            onClick={() => setActiveTab('upcoming')}
            size="sm"
          >
            ⏰ Próximos ({tabCounts.upcoming})
          </Button>
          <Button 
            variant={activeTab === 'live' ? 'primary' : 'outline'} 
            onClick={() => setActiveTab('live')}
            size="sm"
          >
            🔴 En Vivo ({tabCounts.live})
          </Button>
          <Button 
            variant={activeTab === 'results' ? 'primary' : 'outline'} 
            onClick={() => setActiveTab('results')}
            size="sm"
          >
            📊 Resultados ({tabCounts.results})
          </Button>        </div>

        {/* Grid for matches */}
        <div className={styles.upcomingMatchesGrid}>
          {filteredMatches.length > 0 ? (
            filteredMatches.map(match => (
              <MatchCard key={match.id} match={formatMatchForCard(match)} />
            ))
          ) : (
            <div className={styles.noMatchesContainer}>
              <Card className="p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">
                  {activeTab === 'upcoming' && 'No hay partidos próximos'}
                  {activeTab === 'live' && 'No hay partidos en vivo'}
                  {activeTab === 'results' && 'No hay resultados disponibles'}
                  {activeTab === 'today' && 'No hay partidos hoy'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {activeTab === 'upcoming' && 'Avanza el tiempo virtual para generar más partidos.'}
                  {activeTab === 'live' && 'Inicia la simulación de un partido para verlo en vivo.'}
                  {activeTab === 'results' && 'Simula algunos partidos para ver resultados.'}
                  {activeTab === 'today' && 'Avanza el tiempo hasta el día de un partido.'}
                </p>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSearchTerm('')}
                  >
                    Limpiar búsqueda
                  </Button>
                )}
              </Card>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default MatchesPage;