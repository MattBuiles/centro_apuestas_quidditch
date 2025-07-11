import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Season } from '@/types/league';
import { leagueTimeService, LeagueTimeInfo } from '@/services/leagueTimeService';
import { FEATURES } from '@/config/features';
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

const ResultsPageBackend: React.FC = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [leagueTimeInfo, setLeagueTimeInfo] = useState<LeagueTimeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    if (!FEATURES.USE_BACKEND_LEAGUE_TIME) {
      setError('Backend de tiempo de liga no está habilitado');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get league time info and active season
      const timeInfo = await leagueTimeService.getLeagueTimeInfo();
      setLeagueTimeInfo(timeInfo);

      if (timeInfo.activeSeason) {
        setSeason(timeInfo.activeSeason);
        
        // Get finished matches from the active season
        const finishedMatches = timeInfo.activeSeason.matches
          ?.filter(match => match.status === 'finished')
          .sort((a, b) => new Date(b.fecha || b.date || '').getTime() - new Date(a.fecha || a.date || '').getTime()) || [];

        const formattedResults: Result[] = finishedMatches.map(match => ({
          id: match.id,
          date: (match.fecha || match.date) ? new Date(match.fecha || match.date || '').toISOString() : '',
          homeTeam: timeInfo.activeSeason!.teams?.find(t => t.id === match.homeTeamId)?.name || 'Team',
          awayTeam: timeInfo.activeSeason!.teams?.find(t => t.id === match.awayTeamId)?.name || 'Team',
          homeScore: match.homeScore || 0,
          awayScore: match.awayScore || 0,
          league: timeInfo.activeSeason!.name,
          snitchCaught: match.snitchCaught || false,
          events: match.events?.length || 0,
          duration: match.duration || 0
        }));

        setResults(formattedResults);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error loading results:', error);
      setError('Error cargando los resultados');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (results: Result[]) => {
    return results.filter(result => {
      if (dateFrom && new Date(result.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(result.date) > new Date(dateTo)) return false;
      if (teamFilter && !result.homeTeam.toLowerCase().includes(teamFilter.toLowerCase()) &&
          !result.awayTeam.toLowerCase().includes(teamFilter.toLowerCase())) return false;
      return true;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const filteredResults = applyFilters(results);
  const totalMatches = filteredResults.length;
  const totalGoals = filteredResults.reduce((acc, result) => acc + result.homeScore + result.awayScore, 0);
  const averageGoals = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(1) : '0';

  if (!FEATURES.USE_BACKEND_LEAGUE_TIME) {
    return (
      <div className={styles.container}>
        <div className={styles.notice}>
          ⚠️ Resultados del backend no están habilitados
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner />
        <p>Cargando resultados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>❌ {error}</p>
          <Button onClick={loadResults}>
            🔄 Intentar de nuevo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📊 Resultados</h1>
        
        {leagueTimeInfo && (
          <div className={styles.leagueInfo}>
            <p>📅 Fecha de liga: {new Date(leagueTimeInfo.currentDate).toLocaleDateString('es-ES')}</p>
            {season && <p>🏆 {season.name}</p>}
          </div>
        )}

        <Button variant="outline" onClick={loadResults}>
          🔄 Actualizar
        </Button>
      </div>

      <div className={styles.filters}>
        <Card>
          <div className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label htmlFor="dateFrom">Desde:</label>
              <input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <label htmlFor="dateTo">Hasta:</label>
              <input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <label htmlFor="teamFilter">Equipo:</label>
              <input
                id="teamFilter"
                type="text"
                placeholder="Buscar equipo..."
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            
            <div className={styles.filterActions}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setTeamFilter('');
                }}
              >
                Limpiar
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.stats}>
        <Card>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{totalMatches}</span>
              <span className={styles.statLabel}>Partidos</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{totalGoals}</span>
              <span className={styles.statLabel}>Goles totales</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{averageGoals}</span>
              <span className={styles.statLabel}>Goles promedio</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {filteredResults.filter(r => r.snitchCaught).length}
              </span>
              <span className={styles.statLabel}>Snitches atrapadas</span>
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.content}>
        {filteredResults.length > 0 ? (
          <div className={styles.resultsList}>
            {filteredResults.map((result) => (
              <Card key={result.id} className={styles.resultCard}>
                <div className={styles.resultHeader}>
                  <div className={styles.resultDate}>
                    {formatDate(result.date)}
                  </div>
                  <div className={styles.resultLeague}>
                    {result.league}
                  </div>
                </div>

                <div className={styles.resultMain}>
                  <div className={styles.teamSection}>
                    <TeamLogo teamName={result.homeTeam} size="sm" />
                    <span className={styles.teamName}>{result.homeTeam}</span>
                  </div>

                  <div className={styles.scoreSection}>
                    <div className={styles.score}>
                      <span className={styles.homeScore}>{result.homeScore}</span>
                      <span className={styles.scoreDivider}>-</span>
                      <span className={styles.awayScore}>{result.awayScore}</span>
                    </div>
                    {result.snitchCaught && (
                      <div className={styles.snitchBadge}>
                        ⚡ Snitch atrapada
                      </div>
                    )}
                  </div>

                  <div className={styles.teamSection}>
                    <TeamLogo teamName={result.awayTeam} size="sm" />
                    <span className={styles.teamName}>{result.awayTeam}</span>
                  </div>
                </div>

                <div className={styles.resultFooter}>
                  <div className={styles.resultStats}>
                    {result.duration > 0 && (
                      <span className={styles.duration}>
                        ⏱️ {formatDuration(result.duration)}
                      </span>
                    )}
                    {result.events > 0 && (
                      <span className={styles.events}>
                        📝 {result.events} eventos
                      </span>
                    )}
                  </div>
                  
                  <Link to={`/matches/${result.id}`} className={styles.detailsLink}>
                    <Button variant="outline" size="sm">
                      Ver detalles
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className={styles.noResults}>
              <h3>🔍 No hay resultados</h3>
              <p>
                {results.length === 0 
                  ? 'Aún no se han jugado partidos en la temporada actual.'
                  : 'No se encontraron resultados con los filtros aplicados.'
                }
              </p>
              {results.length === 0 && season && (
                <p>La temporada "{season.name}" comenzará pronto.</p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResultsPageBackend;
