import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import TeamLogo from '@/components/teams/TeamLogo';
import { virtualTimeManager } from '@/services/virtualTimeManager';
import { Season } from '@/types/league';
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
}

const ResultsPage: React.FC = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  useEffect(() => {
    loadResultsFromSimulation();
  }, []);

  const loadResultsFromSimulation = () => {
    setIsLoading(true);
    
    const timeState = virtualTimeManager.getState();
    if (timeState.temporadaActiva) {
      setSeason(timeState.temporadaActiva);
      
      // Get finished matches from simulation
      const finishedMatches = virtualTimeManager.getResultadosRecientes(20);
      
      const simulationResults: Result[] = finishedMatches.map(match => {
        const homeTeam = timeState.temporadaActiva!.equipos.find(t => t.id === match.localId);
        const awayTeam = timeState.temporadaActiva!.equipos.find(t => t.id === match.visitanteId);
        
        return {
          id: match.id,
          date: new Date(match.fecha).toLocaleDateString('es-ES', {
            month: 'short',
            day: 'numeric'
          }),
          homeTeam: homeTeam?.name || match.localId,
          awayTeam: awayTeam?.name || match.visitanteId,
          homeScore: match.homeScore || 0,
          awayScore: match.awayScore || 0,
          league: timeState.temporadaActiva?.name || 'Liga Profesional Quidditch',
          snitchCaught: match.snitchCaught || false,
          events: match.events?.length || 0
        };
      });
      
      setResults(simulationResults);
    } else {
      // No simulation data, use empty array
      setResults([]);
    }
    
    setIsLoading(false);
  };
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Recargar datos con filtros aplicados
    loadResultsFromSimulation();
    console.log('Aplicando filtros:', { dateFrom, dateTo, teamFilter });
  };
  const handleFilterReset = () => {
    setDateFrom('');
    setDateTo('');
    setTeamFilter('');
    loadResultsFromSimulation();
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
      </div>

      {/* Results Grid */}
      <section className={styles.resultsGrid}>
        {results.length > 0 ? (
          results.map(result => (
            <div key={result.id} className={styles.resultCard}>
              <div className={styles.matchMeta}>
                <span className={styles.matchDate}>
                  {result.date} - {result.league}
                </span>
                <Link to={`/matches/${result.id}`} className={styles.matchDetailsLink}>
                  Ver detalles
                </Link>
              </div>
                <div className={styles.matchResult}>
                <div className={styles.teamResult}>
                  <TeamLogo teamName={result.homeTeam} size="md" />
                  <h3 className={styles.teamName}>{result.homeTeam}</h3>
                  <p className={styles.teamScore}>{result.homeScore}</p>
                </div>
                
                <div className={styles.scoreVs}>VS</div>
                
                <div className={styles.teamResult}>
                  <TeamLogo teamName={result.awayTeam} size="md" />
                  <h3 className={styles.teamName}>{result.awayTeam}</h3>
                  <p className={styles.teamScore}>{result.awayScore}</p>
                </div>
              </div>
              
              <div className={styles.matchDetails}>
                {result.snitchCaught && (
                  <span className={styles.snitchBadge}>✨ Snitch Atrapada</span>
                )}
                <span className={styles.eventsBadge}>📊 {result.events} eventos</span>
              </div>
              
              <div className={`${styles.matchStatus} ${styles.finished}`}>
                Finalizado
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noResults}>
            <p>No hay resultados para mostrar según los filtros actuales.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ResultsPage;