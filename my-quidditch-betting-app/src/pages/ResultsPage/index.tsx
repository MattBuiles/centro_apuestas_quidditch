import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import TeamLogo from '@/components/teams/TeamLogo';
import styles from './ResultsPage.module.css';

interface Result {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  league: string;
}

const mockResults: Result[] = [
  { id: 'r1', date: 'Ayer', homeTeam: 'Gryffindor', awayTeam: 'Slytherin', homeScore: 150, awayScore: 40, league: 'Liga de Hogwarts' },
  { id: 'r2', date: 'Hace 2 días', homeTeam: 'Hufflepuff', awayTeam: 'Ravenclaw', homeScore: 130, awayScore: 165, league: 'Liga de Hogwarts' },
  { id: 'r3', date: 'Hace 3 días', homeTeam: 'Ravenclaw', awayTeam: 'Slytherin', homeScore: 180, awayScore: 160, league: 'Liga de Hogwarts' },
  { id: 'r4', date: 'Hace una semana', homeTeam: 'Slytherin', awayTeam: 'Hufflepuff', homeScore: 140, awayScore: 90, league: 'Liga de Hogwarts' },
  { id: 'r5', date: 'Hace una semana', homeTeam: 'Gryffindor', awayTeam: 'Ravenclaw', homeScore: 200, awayScore: 170, league: 'Liga de Hogwarts' },
  { id: 'r6', date: 'Hace 10 días', homeTeam: 'Hufflepuff', awayTeam: 'Gryffindor', homeScore: 110, awayScore: 190, league: 'Liga de Hogwarts' },
  { id: 'r7', date: 'Hace 2 semanas', homeTeam: 'Slytherin', awayTeam: 'Ravenclaw', homeScore: 155, awayScore: 120, league: 'Liga de Hogwarts' },
  { id: 'r8', date: 'Hace 2 semanas', homeTeam: 'Gryffindor', awayTeam: 'Hufflepuff', homeScore: 175, awayScore: 145, league: 'Liga de Hogwarts' },
  { id: 'r9', date: 'Hace 3 semanas', homeTeam: 'Ravenclaw', awayTeam: 'Gryffindor', homeScore: 130, awayScore: 210, league: 'Liga de Hogwarts' },
  { id: 'r10', date: 'Hace 3 semanas', homeTeam: 'Hufflepuff', awayTeam: 'Slytherin', homeScore: 95, awayScore: 185, league: 'Liga de Hogwarts' },
];

const ResultsPage: React.FC = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setResults(mockResults);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica de filtrado
    console.log('Aplicando filtros:', { dateFrom, dateTo, teamFilter });
  };

  const handleFilterReset = () => {
    setDateFrom('');
    setDateTo('');
    setTeamFilter('');
    setResults(mockResults);
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
        </h1>
        <p className={styles.heroDescription}>
          Consulta los marcadores finales y revive la emoción de los partidos más épicos del mundo mágico del Quidditch
        </p>
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