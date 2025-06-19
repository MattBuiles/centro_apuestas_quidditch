import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import TeamLogo from '@/components/teams/TeamLogo';
import './ResultsPage.module.css';

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
  { id: 'r2', date: 'Hace una semana', homeTeam: 'Holyhead Harpies', awayTeam: 'Chudley Cannons', homeScore: 210, awayScore: 180, league: 'Liga Británica' },
  { id: 'r3', date: 'Hace dos semanas', homeTeam: 'Hufflepuff', awayTeam: 'Ravenclaw', homeScore: 130, awayScore: 165, league: 'Liga de Hogwarts' },
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
    <div className="results-page-container">
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

      <section className="results-list space-y-6">
        {results.length > 0 ? (
          results.map(result => (
            <Card key={result.id} className="result-card p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">{result.date} - {result.league}</span>
                <Link to={`/matches/${result.id}`} className="text-sm text-primary hover:underline">Ver detalles</Link>
              </div>              <div className="flex items-center justify-around text-center">
                <div className="team-result flex-1 flex flex-col items-center">
                  <TeamLogo teamName={result.homeTeam} size="md" />
                  <h3 className="text-lg font-semibold text-primary mt-2">{result.homeTeam}</h3>
                  <p className="text-2xl font-bold">{result.homeScore}</p>
                </div>
                <span className="text-xl font-bold text-gray-400 mx-4">VS</span>
                <div className="team-result flex-1 flex flex-col items-center">
                  <TeamLogo teamName={result.awayTeam} size="md" />
                  <h3 className="text-lg font-semibold text-primary mt-2">{result.awayTeam}</h3>
                  <p className="text-2xl font-bold">{result.awayScore}</p>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="text-center p-6">
            <p className="text-gray-600">No hay resultados para mostrar según los filtros actuales.</p>
          </Card>
        )}
      </section>
      {/* Pagination can be added here */}
    </div>
  );
};

export default ResultsPage;