import { useState, useEffect, useCallback } from 'react'
import MatchCard from '@/components/matches/MatchCard'
import LeagueTimeControl from '@/components/matches/LeagueTimeControl'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'
import { useLeagueTime } from '@/hooks/useLeagueTime'
import { Season, Match } from '@/types/league'
import styles from './MatchesPage.module.css'

const MatchesPage = () => {
  const [activeTab, setActiveTab] = useState('upcoming') // upcoming, live, today
  const [searchTerm, setSearchTerm] = useState('');
  const [season, setSeason] = useState<Season | null>(null);
  
  // Usar el hook de tiempo de liga
  const { 
    leagueTimeInfo, 
    isLoading: isLoadingTime, 
    error: timeError, 
    getCurrentLeagueDate,
    hasActiveSeason,
    forceRefresh
  } = useLeagueTime();

  // Estado local para la carga de datos de partidos
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeSeason = useCallback(async () => {
    if (!leagueTimeInfo || !hasActiveSeason()) {
      setError('No hay temporada activa');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      setSeason(leagueTimeInfo.activeSeason);
    } catch (err) {
      setError('Error inicializando la temporada: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  }, [leagueTimeInfo, hasActiveSeason]);

  useEffect(() => {
    initializeSeason();
  }, [initializeSeason]); // Recargar cuando cambie la información de tiempo

  const handleTimeAdvanced = async (newDate: Date, simulatedMatches: Match[]) => {
    // Forzar actualización del tiempo de liga
    await forceRefresh();
    
    if (simulatedMatches.length > 0) {
      console.log(`✅ Se simularon ${simulatedMatches.length} partidos`);
    }
  };

  const handleSeasonReset = () => {
    // Reset season when virtual time is reset
    forceRefresh();
  };

  const getFilteredMatches = () => {
    if (!season) {
      return [];
    }

    const partidos = season.matches || []; // Use 'matches' from backend
    const fechaVirtual = getCurrentLeagueDate(); // Usar el tiempo de liga en lugar del tiempo real

    let filteredMatches: Match[] = [];

    switch (activeTab) {
      case 'upcoming':
        filteredMatches = partidos.filter(match => {
          const matchDate = new Date(match.date); // Use 'date' from backend
          return matchDate > fechaVirtual && match.status === 'scheduled';
        });
        // Sort by date first to get the closest matches
        filteredMatches.sort((a, b) => {
          const dateA = new Date(a.date); // Use 'date' from backend
          const dateB = new Date(b.date); // Use 'date' from backend
          return dateA.getTime() - dateB.getTime(); // Chronological order
        });
        // Limit to only 5 closest upcoming matches
        filteredMatches = filteredMatches.slice(0, 5);
        break;
      case 'live':
        filteredMatches = partidos.filter(match => match.status === 'live');
        break;
      case 'today': {
        const today = new Date(fechaVirtual);
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        filteredMatches = partidos.filter(match => {
          const matchDate = new Date(match.date); // Use 'date' from backend
          return matchDate >= startOfDay && matchDate <= endOfDay;
        });
        break;
      }
      default:
        filteredMatches = partidos;
    }

    // Apply search filter (except for upcoming tab since we already limited it)
    if (searchTerm.trim() && activeTab !== 'upcoming') {
      filteredMatches = filteredMatches.filter(match => {
        const homeTeam = season.teams?.find(t => t.id === match.localId)?.name || '';
        const awayTeam = season.teams?.find(t => t.id === match.visitanteId)?.name || '';
        return homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
               awayTeam.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Sort by date (except for upcoming since it's already sorted and limited)
    if (activeTab !== 'upcoming') {
      return filteredMatches.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime(); // Chronological order
      });
    }

    return filteredMatches;
  };

  const formatMatchForCard = (match: Match) => {
    const homeTeam = season?.teams?.find(t => t.id === match.localId);
    const awayTeam = season?.teams?.find(t => t.id === match.visitanteId);
    
    // Map status to MatchCard expected values
    const cardStatus = match.status === 'scheduled' ? 'upcoming' as const : 
                      match.status === 'live' ? 'live' as const :
                      match.status === 'finished' ? 'finished' as const : 'upcoming' as const;
      return {
      id: match.id,
      homeTeam: homeTeam?.name || match.localId,
      awayTeam: awayTeam?.name || match.visitanteId,
      date: new Date(match.date).toLocaleDateString('es-ES'),
      time: new Date(match.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      league: 'Liga Profesional Quidditch',
      status: cardStatus,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      minute: match.currentMinute?.toString()
    };
  };

  const getTabCounts = () => {
    if (!season) return { upcoming: 0, live: 0, today: 0 };

    const partidos = season.matches || []; // Use 'matches' from backend
    const fechaVirtual = getCurrentLeagueDate(); // Usar el tiempo de liga en lugar del tiempo real
    
    const today = new Date(fechaVirtual);
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // For upcoming matches, get all but limit the count to show only up to 5
    const upcomingMatches = partidos.filter(m => new Date(m.date) > fechaVirtual && m.status === 'scheduled');
    const upcomingCount = Math.min(upcomingMatches.length, 5);

    return {
      upcoming: upcomingCount,
      live: partidos.filter(m => m.status === 'live').length,
      today: partidos.filter(m => {
        const matchDate = new Date(m.date);
        return matchDate >= startOfDay && matchDate <= endOfDay;
      }).length
    };
  };

  // Mostrar error de tiempo si existe
  const displayError = error || timeError;
  const displayLoading = isLoading || isLoadingTime;

  if (displayLoading) {
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

  if (displayError) {
    return (
      <div className={styles.matchesPageContainer}>
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error del Sistema</h2>
          <p className="text-gray-600 mb-4">{displayError}</p>
          <Button onClick={() => forceRefresh()} variant="primary">
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

      {/* League Time Control */}
      <LeagueTimeControl 
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.tabsContainer}>
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
        </div>

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
                  {activeTab === 'today' && 'No hay partidos hoy'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {activeTab === 'upcoming' && 'Avanza el tiempo virtual para generar los próximos 5 partidos más cercanos.'}
                  {activeTab === 'live' && 'Inicia la simulación de un partido para verlo en vivo.'}
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
