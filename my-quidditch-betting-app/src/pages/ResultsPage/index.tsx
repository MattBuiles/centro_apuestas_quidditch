import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Season } from '@/types/league';
import { virtualTimeManager } from '@/services/virtualTimeManager';
import { DetailedMatchResult, matchResultsService } from '@/services/matchResultsService';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import TeamLogo from '@/components/teams/TeamLogo';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import styles from './ResultsPage.module.css';

interface Result {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  league: string;
  snitchCaught: boolean;
  events: number;
  duration: number;
}

const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<Result[]>([]);
  const [detailedResults, setDetailedResults] = useState<DetailedMatchResult[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [isLoading, setIsLoading] = useState(true);  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  useEffect(() => {
    loadResults();
    loadDetailedResults();
  }, []);

  const loadResults = async () => {
    try {
      setIsLoading(true);
      const state = virtualTimeManager.getState();
      
      if (state.temporadaActiva) {
        setSeason(state.temporadaActiva);
        
        // Get finished matches from the current season
        const finishedMatches = state.temporadaActiva.partidos
          .filter(match => match.status === 'finished')
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());        const formattedResults: Result[] = finishedMatches.map(match => {
          // Check if detailed results are available for more accurate scores
          const detailedResult = matchResultsService.getMatchResult(match.id);
          
          let finalHomeScore = match.homeScore || 0;
          let finalAwayScore = match.awayScore || 0;
          
          // Use detailed results scores if available (more accurate from simulation)
          if (detailedResult) {
            finalHomeScore = detailedResult.finalScore.home;
            finalAwayScore = detailedResult.finalScore.away;
          }
          
          return {
            id: match.id,
            date: new Date(match.fecha).toISOString(),
            homeTeam: state.temporadaActiva!.equipos.find(t => t.id === match.localId)?.name || 'Unknown',
            awayTeam: state.temporadaActiva!.equipos.find(t => t.id === match.visitanteId)?.name || 'Unknown',
            homeScore: finalHomeScore,
            awayScore: finalAwayScore,
            league: 'Liga Profesional Quidditch',
            snitchCaught: detailedResult?.snitchCaught || match.events?.some(e => e.type === 'SNITCH_CAUGHT') || false,
            events: detailedResult?.statistics.totalEvents || match.events?.length || 0,
            duration: detailedResult?.matchDuration || match.currentMinute || 0
          };
        });

        setResults(formattedResults);
      }
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDetailedResults = () => {
    try {
      const detailed = matchResultsService.getAllResults();
      setDetailedResults(detailed.sort((a, b) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading detailed results:', error);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Apply filters to results
    let filteredResults = [...results];
    
    if (dateFrom) {
      filteredResults = filteredResults.filter(result => 
        new Date(result.date) >= new Date(dateFrom)
      );
    }
    
    if (dateTo) {
      filteredResults = filteredResults.filter(result => 
        new Date(result.date) <= new Date(dateTo)
      );
    }
    
    if (teamFilter) {
      filteredResults = filteredResults.filter(result => 
        result.homeTeam === teamFilter || result.awayTeam === teamFilter
      );
    }
    
    setResults(filteredResults);
  };

  const handleFilterReset = () => {
    setDateFrom('');
    setDateTo('');
    setTeamFilter('');
    loadResults(); // Reset to all results
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getMatchDetailedResult = (matchId: string): DetailedMatchResult | undefined => {
    return detailedResults.find(dr => dr.matchId === matchId);
  };

  const handleViewDetailedResult = (matchId: string) => {
    navigate(`/matches/${matchId}/result`);
  };

  if (isLoading) {
    return (
      <div className={styles.resultsPageContainer}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.resultsPageContainer}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <h1 className={styles.heroTitle}>
          <span className={styles.titleIcon}>🏆</span>
          Resultados de Partidos
        </h1>        <p className={styles.heroDescription}>
          Consulta los marcadores finales y revive la emoción de los partidos más épicos del mundo mágico del Quidditch
        </p>
        {season && (
          <div className={styles.seasonInfo}>
            📅 {season.name} - {results.length} resultados disponibles
          </div>
        )}
      </section>

      {/* Filters Section */}
      <div className={styles.filtersCard}>
        <h2 className={styles.filtersTitle}>Filtrar Resultados</h2>
        <form onSubmit={handleFilterSubmit}>
          <div className={styles.filtersGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="date-from" className={styles.formLabel}>Desde</label>
              <input
                type="date"
                id="date-from"
                className={styles.formInput}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="date-to" className={styles.formLabel}>Hasta</label>
              <input
                type="date"
                id="date-to"
                className={styles.formInput}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="team-filter" className={styles.formLabel}>Equipo</label>
              <select
                id="team-filter"
                className={styles.formSelect}
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                <option value="">Todos los equipos</option>
                <option value="Gryffindor">Gryffindor</option>
                <option value="Slytherin">Slytherin</option>
                <option value="Hufflepuff">Hufflepuff</option>
                <option value="Ravenclaw">Ravenclaw</option>
              </select>
            </div>
          </div>
          <div className={styles.filtersActions}>
            <Button type="button" variant="outline" onClick={handleFilterReset}>
              Limpiar
            </Button>
            <Button type="submit">
              Aplicar Filtros
            </Button>
          </div>
        </form>
      </div>      {/* Results Grid */}
      <section className={styles.resultsGrid}>
        {results.length > 0 ? (
          results.map(result => {
            const detailedResult = getMatchDetailedResult(result.id);
            return (
              <Card key={result.id} className={styles.resultCard}>
                <div className={styles.matchMeta}>
                  <span className={styles.matchDate}>
                    {formatDate(result.date)} - {result.league}
                  </span>
                  <div className={styles.matchActions}>
                    <Link to={`/matches/${result.id}`} className={styles.matchDetailsLink}>
                      Ver partido
                    </Link>
                    {detailedResult && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewDetailedResult(result.id)}
                      >
                        Análisis completo
                      </Button>
                    )}
                  </div>
                </div>
                  <div className={styles.matchResult}>
                  <div className={styles.teamResult}>
                    <TeamLogo teamName={result.homeTeam} size="md" />
                    <h3 className={styles.teamName}>{result.homeTeam}</h3>
                    <p className={styles.teamScore}>
                      {result.homeScore}
                      {detailedResult && (
                        <span className={styles.realScoreIndicator} title="Marcador de simulación real">
                          ⚡
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className={styles.scoreVs}>VS</div>
                  
                  <div className={styles.teamResult}>
                    <TeamLogo teamName={result.awayTeam} size="md" />
                    <h3 className={styles.teamName}>{result.awayTeam}</h3>
                    <p className={styles.teamScore}>
                      {result.awayScore}
                      {detailedResult && (
                        <span className={styles.realScoreIndicator} title="Marcador de simulación real">
                          ⚡
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className={styles.matchDetails}>
                  {result.snitchCaught && (
                    <span className={styles.snitchBadge}>✨ Snitch Atrapada</span>
                  )}
                  <span className={styles.eventsBadge}>
                    📊 {result.events} eventos
                  </span>
                  <span className={styles.durationBadge}>
                    ⏱️ {formatDuration(result.duration)}
                  </span>
                  {detailedResult && (
                    <span className={styles.detailedBadge}>
                      📈 Análisis disponible
                    </span>
                  )}
                </div>
                
                <div className={`${styles.matchStatus} ${styles.finished}`}>
                  Finalizado
                </div>
              </Card>
            );
          })
        ) : (
          <Card className={styles.noResults}>
            <h3>No hay resultados disponibles</h3>
            <p>
              {teamFilter || dateFrom || dateTo 
                ? 'No hay resultados que coincidan con los filtros aplicados.'
                : 'Aún no hay partidos finalizados para mostrar.'
              }
            </p>
            <Button onClick={handleFilterReset} variant="primary">
              Ver todos los resultados
            </Button>
          </Card>
        )}
      </section>

      {/* Detailed Results Section */}
      {detailedResults.length > 0 && (
        <section className={styles.detailedResultsSection}>
          <Card className={styles.detailedResultsCard}>
            <h2 className={styles.sectionTitle}>
              📊 Análisis Detallados Disponibles
            </h2>
            <p className={styles.sectionDescription}>
              Resultados con cronología completa y estadísticas avanzadas
            </p>
            
            <div className={styles.detailedResultsGrid}>
              {detailedResults.slice(0, 6).map(detailedResult => (
                <div key={detailedResult.id} className={styles.detailedResultPreview}>
                  <div className={styles.previewHeader}>
                    <h4>
                      {detailedResult.homeTeam.name} vs {detailedResult.awayTeam.name}
                    </h4>
                    <span className={styles.previewScore}>
                      {detailedResult.finalScore.home} - {detailedResult.finalScore.away}
                    </span>
                  </div>
                  
                  <div className={styles.previewStats}>
                    <span>📊 {detailedResult.statistics.totalEvents} eventos</span>
                    <span>⏱️ {formatDuration(detailedResult.matchDuration)}</span>
                    {detailedResult.snitchCaught && <span>✨ Snitch</span>}
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="primary"
                    fullWidth
                    onClick={() => handleViewDetailedResult(detailedResult.matchId)}
                  >
                    Ver análisis completo
                  </Button>
                </div>
              ))}
            </div>
              {detailedResults.length > 6 && (
              <div className={styles.seeAllResults}>
                <p className={styles.moreResultsText}>
                  Y {detailedResults.length - 6} análisis más disponibles...
                </p>
              </div>
            )}
          </Card>
        </section>
      )}

      {/* Statistics Summary */}
      {results.length > 0 && (
        <section className={styles.statisticsSection}>
          <Card className={styles.statisticsCard}>
            <h2 className={styles.sectionTitle}>📈 Estadísticas de la Temporada</h2>
            
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <h3>{results.length}</h3>
                <p>Partidos jugados</p>
              </div>
              
              <div className={styles.statItem}>
                <h3>{results.filter(r => r.snitchCaught).length}</h3>
                <p>Snitches atrapadas</p>
              </div>
              
              <div className={styles.statItem}>
                <h3>{Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)}</h3>
                <p>Duración promedio (min)</p>
              </div>
              
              <div className={styles.statItem}>
                <h3>{Math.round(results.reduce((sum, r) => sum + r.events, 0) / results.length)}</h3>
                <p>Eventos promedio</p>
              </div>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
};

export default ResultsPage;