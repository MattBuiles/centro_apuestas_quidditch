import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
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
  // Add filter states here if needed: dateFrom, dateTo, teamFilter

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setResults(mockResults);
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) return <LoadingSpinner />;
  return (
    <div className={styles.resultsPageContainer}>
      <section className="hero-section text-center p-8 mb-8 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(75, 0, 130, 0.5), rgba(106, 90, 205, 0.2))', color: 'white' }}>
        <h1 className="text-3xl font-bold mb-2 text-white">Resultados de Partidos</h1>
        <p>Consulta los marcadores finales de los partidos ya concluidos.</p>
      </section>

      <Card className="filters-section mb-8 p-4">
        <h2 className="text-xl font-semibold text-primary mb-4">Filtrar Resultados</h2>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="form-group">
            <label htmlFor="date-from" className="form-label">Desde:</label>
            <input type="date" id="date-from" className="form-input" />
          </div>
          <div className="form-group">
            <label htmlFor="date-to" className="form-label">Hasta:</label>
            <input type="date" id="date-to" className="form-input" />
          </div>
          <div className="form-group">
            <label htmlFor="team-filter" className="form-label">Equipo:</label>
            <select id="team-filter" className="form-input">
              <option value="">Todos los equipos</option>
              {/* Populate with team names */}
            </select>
          </div>
          <div className="md:col-span-3 flex justify-end gap-2 mt-2">
            <Button type="reset" variant="outline">Limpiar</Button>
            <Button type="submit">Aplicar Filtros</Button>
          </div>
        </form>
      </Card>

      <section className={styles.resultsGrid}>
        {results.length > 0 ? (
          results.map(result => (
            <div key={result.id} className={styles.resultCard}>
              <div className={styles.matchMeta}>
                <span className={styles.matchDate}>{result.date} - {result.league}</span>
                <Link to={`/matches/${result.id}`} className="text-sm text-primary hover:underline">Ver detalles</Link>
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
                  <p className={styles.teamScore}>{result.awayScore}</p>                </div>
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
      {/* Pagination can be added here */}
    </div>
  );
};

export default ResultsPage;