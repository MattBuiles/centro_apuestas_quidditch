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
    isLoading: isLoadingTime, 
    error: timeError, 
    getCurrentLeagueDate,
    forceRefresh
  } = useLeagueTime();

  // Estado local para la carga de datos de partidos
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeSeason = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First get league time info for season data
      const leagueTimeResponse = await fetch('http://localhost:3001/api/league-time');
      if (!leagueTimeResponse.ok) {
        throw new Error(`League time HTTP error! status: ${leagueTimeResponse.status}`);
      }
      
      const leagueTimeData = await leagueTimeResponse.json();

      if (!leagueTimeData.success || !leagueTimeData.data) {
        throw new Error('Invalid league time response format');
      }

      // Then get matches data separately
      const matchesResponse = await fetch('http://localhost:3001/api/matches');
      if (!matchesResponse.ok) {
        throw new Error(`Matches HTTP error! status: ${matchesResponse.status}`);
      }
      
      const matchesData = await matchesResponse.json();
      
      if (!matchesData.success || !matchesData.data) {
        throw new Error('Invalid matches response format');
      }

      // Combine the data
      const seasonData = leagueTimeData.data.activeSeason;
      if (seasonData) {
        // Transform matches to match expected structure
        const transformedMatches = matchesData.data.map((match: {
          id: string;
          season_id: string;
          home_team_id: string;
          away_team_id: string;
          date: string;
          status: string;
          home_score: number;
          away_score: number;
          duration: number | null;
          snitch_caught: number;
          snitch_caught_by: string | null;
        }) => ({
          id: match.id,
          seasonId: match.season_id,
          localId: match.home_team_id,
          visitanteId: match.away_team_id,
          date: match.date,
          status: match.status,
          homeScore: match.home_score,
          awayScore: match.away_score,
          currentMinute: match.duration,
          snitchCaught: match.snitch_caught,
          snitchCaughtBy: match.snitch_caught_by
        }));

        console.log('🎯 Transformed matches count:', transformedMatches.length);
        seasonData.matches = transformedMatches;
        setSeason(seasonData);
        setError(null);
      } else {
        throw new Error('No active season found');
      }

    } catch (error) {
      console.error('Error loading season data:', error);
      setError('No se pudo cargar la información de partidos. Verifica que el backend esté funcionando.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeSeason();
  }, [initializeSeason]); // Recargar cuando cambie la información de tiempo

  const handleTimeAdvanced = async (_newDate: Date, simulatedMatches: Match[]) => {
    // Forzar actualización del tiempo de liga
    await forceRefresh();
    
    // Recargar datos de la temporada para mostrar cambios inmediatamente
    await initializeSeason();
    
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

    const partidos = season.matches || [];
    
    // Usar tiempo virtual del backend exclusivamente
    let fechaVirtual: Date;
    try {
      fechaVirtual = getCurrentLeagueDate();
    } catch (error) {
      console.error('Error obteniendo fecha virtual del backend:', error);
      // En caso de error, usar una fecha por defecto pero registrar el error
      fechaVirtual = new Date('2024-01-01'); // Fecha de fallback consistente
      setError('No se pudo obtener el tiempo virtual. Usando fecha por defecto.');
    }

    let filteredMatches: Match[] = [];

    switch (activeTab) {
      case 'upcoming':
        filteredMatches = partidos.filter(match => {
          const matchDate = new Date(match.date);
          return matchDate > fechaVirtual && match.status === 'scheduled';
        });
        // Sort by date first to get the closest matches
        filteredMatches.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
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
          const matchDate = new Date(match.date);
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
        const homeTeamName = season.teams?.find(t => t.id === match.localId)?.name || match.localId;
        const awayTeamName = season.teams?.find(t => t.id === match.visitanteId)?.name || match.visitanteId;
        
        // Format names for better searching
        const formatName = (name: string) => name.replace(/[-_]/g, ' ').toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return formatName(homeTeamName).includes(searchLower) ||
               formatName(awayTeamName).includes(searchLower);
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
    
    // Function to format team names for display
    const formatTeamName = (teamName: string) => {
      return teamName
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };
    
    // Map status to MatchCard expected values
    const cardStatus = match.status === 'scheduled' ? 'upcoming' as const : 
                      match.status === 'live' ? 'live' as const :
                      match.status === 'finished' ? 'finished' as const : 'upcoming' as const;
      return {
      id: match.id,
      homeTeam: homeTeam?.name ? formatTeamName(homeTeam.name) : formatTeamName(match.localId),
      awayTeam: awayTeam?.name ? formatTeamName(awayTeam.name) : formatTeamName(match.visitanteId),
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

    const partidos = season.matches || [];
    
    // Usar tiempo virtual del backend exclusivamente
    let fechaVirtual: Date;
    try {
      fechaVirtual = getCurrentLeagueDate();
    } catch (error) {
      console.error('Error obteniendo fecha virtual para conteos:', error);
      // En caso de error, usar una fecha por defecto pero registrar el error
      fechaVirtual = new Date('2024-01-01');
    }
    
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
        <div className={styles.loadingContainer}>
          <div className={styles.loadingContent}>
            <div className={styles.magicalSpinner}></div>
            <h3 className={styles.loadingTitle}>⚡ Cargando sistema de simulación...</h3>
            <p className={styles.loadingText}>Preparando los partidos mágicos de Quidditch</p>
          </div>
        </div>
      </div>
    );
  }

  if (displayError) {
    return (
      <div className={styles.matchesPageContainer}>
        <div className={styles.errorContainer}>
          <Card className={styles.errorCard}>
            <div className={styles.errorContent}>
              <div className={styles.errorIcon}>⚠️</div>
              <h2 className={styles.errorTitle}>Error del Sistema Mágico</h2>
              <p className={styles.errorMessage}>{displayError}</p>
              <Button onClick={() => forceRefresh()} variant="primary" className={styles.retryButton}>
                🔄 Reintentar Hechizo
              </Button>
            </div>
          </Card>
        </div>
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
              <Card className={styles.noMatchesCard}>
                <div className={styles.noMatchesContent}>
                  <div className={styles.noMatchesIcon}>
                    {activeTab === 'upcoming' && '⏰'}
                    {activeTab === 'live' && '🔴'}
                    {activeTab === 'today' && '📅'}
                  </div>
                  <h3 className={styles.noMatchesTitle}>
                    {activeTab === 'upcoming' && 'No hay partidos próximos'}
                    {activeTab === 'live' && 'No hay partidos en vivo'}
                    {activeTab === 'today' && 'No hay partidos hoy'}
                  </h3>
                  <p className={styles.noMatchesText}>
                    {activeTab === 'upcoming' && 'Avanza el tiempo virtual para generar los próximos 5 partidos más cercanos.'}
                    {activeTab === 'live' && 'Inicia la simulación de un partido para verlo en vivo.'}
                    {activeTab === 'today' && 'Avanza el tiempo hasta el día de un partido.'}
                  </p>
                  {searchTerm && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSearchTerm('')}
                      className={styles.clearSearchButton}
                    >
                      🔍 Limpiar búsqueda
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default MatchesPage;
