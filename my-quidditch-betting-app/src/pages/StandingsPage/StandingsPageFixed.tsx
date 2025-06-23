import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import TeamLogo from '@/components/teams/TeamLogo';
import { virtualTimeManager, SeasonHistory } from '@/services/virtualTimeManager';
import { standingsCalculator } from '@/services/standingsCalculator';
import { Season, Standing } from '@/types/league';
import styles from './StandingsPage.module.css';

const StandingsPage = () => {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [viewMode, setViewMode] = useState<'current' | 'historical'>('current');
  const [historicalSeasons, setHistoricalSeasons] = useState<SeasonHistory[]>([]);
  const [historicalStandings, setHistoricalStandings] = useState<any[]>([]);

  useEffect(() => {
    loadStandingsFromSimulation();
    loadHistoricalData();
  }, []);

  const loadHistoricalData = () => {
    const historial = virtualTimeManager.getHistorialTemporadas();
    setHistoricalSeasons(historial);
    
    // Calcular tabla histórica acumulada
    if (historial.length > 0) {
      const allTeamsData = new Map();
      
      historial.forEach(seasonHistory => {
        const seasonStandings = standingsCalculator.calculateStandings(
          seasonHistory.equipos,
          seasonHistory.partidos.filter(match => match.status === 'finished')
        );
        
        seasonStandings.forEach(standing => {
          const teamId = standing.teamId;
          if (!allTeamsData.has(teamId)) {
            allTeamsData.set(teamId, {
              teamId: teamId,
              teamName: standing.team.name,
              seasonsPlayed: 0,
              totalPlayed: 0,
              totalWins: 0,
              totalDraws: 0,
              totalLosses: 0,
              totalPoints: 0,
              totalGoalsFor: 0,
              totalGoalsAgainst: 0,
              championships: 0,
              runnerUps: 0,
              thirdPlaces: 0
            });
          }
          
          const teamData = allTeamsData.get(teamId);
          teamData.seasonsPlayed += 1;
          teamData.totalPlayed += standing.matchesPlayed;
          teamData.totalWins += standing.wins;
          teamData.totalDraws += standing.draws;
          teamData.totalLosses += standing.losses;
          teamData.totalPoints += standing.points;
          teamData.totalGoalsFor += standing.goalsFor;
          teamData.totalGoalsAgainst += standing.goalsAgainst;
          
          // Contar posiciones de honor
          if (standing.position === 1) teamData.championships += 1;
          if (standing.position === 2) teamData.runnerUps += 1;
          if (standing.position === 3) teamData.thirdPlaces += 1;
        });
      });
      
      // Convertir a array y ordenar por puntos totales
      const historicalTable = Array.from(allTeamsData.values())
        .sort((a, b) => {
          if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
          if (b.totalGoalsFor - b.totalGoalsAgainst !== a.totalGoalsFor - a.totalGoalsAgainst) {
            return (b.totalGoalsFor - b.totalGoalsAgainst) - (a.totalGoalsFor - a.totalGoalsAgainst);
          }
          return b.totalGoalsFor - a.totalGoalsFor;
        })
        .map((team, index) => ({ ...team, position: index + 1 }));
      
      setHistoricalStandings(historicalTable);
    } else {
      // Crear datos de ejemplo para demostración cuando no hay historial
      const exampleHistoricalData = [
        {
          teamId: '1',
          teamName: 'Gryffindor',
          position: 1,
          seasonsPlayed: 3,
          totalPlayed: 36,
          totalWins: 28,
          totalDraws: 4,
          totalLosses: 4,
          totalPoints: 88,
          totalGoalsFor: 420,
          totalGoalsAgainst: 180,
          championships: 2,
          runnerUps: 1,
          thirdPlaces: 0
        },
        {
          teamId: '2',
          teamName: 'Slytherin',
          position: 2,
          seasonsPlayed: 3,
          totalPlayed: 36,
          totalWins: 24,
          totalDraws: 6,
          totalLosses: 6,
          totalPoints: 78,
          totalGoalsFor: 380,
          totalGoalsAgainst: 200,
          championships: 1,
          runnerUps: 1,
          thirdPlaces: 1
        },
        {
          teamId: '3',
          teamName: 'Ravenclaw',
          position: 3,
          seasonsPlayed: 3,
          totalPlayed: 36,
          totalWins: 20,
          totalDraws: 8,
          totalLosses: 8,
          totalPoints: 68,
          totalGoalsFor: 340,
          totalGoalsAgainst: 220,
          championships: 0,
          runnerUps: 1,
          thirdPlaces: 2
        },
        {
          teamId: '4',
          teamName: 'Hufflepuff',
          position: 4,
          seasonsPlayed: 3,
          totalPlayed: 36,
          totalWins: 18,
          totalDraws: 6,
          totalLosses: 12,
          totalPoints: 60,
          totalGoalsFor: 300,
          totalGoalsAgainst: 240,
          championships: 0,
          runnerUps: 0,
          thirdPlaces: 0
        },
        {
          teamId: '5',
          teamName: 'Chudley Cannons',
          position: 5,
          seasonsPlayed: 2,
          totalPlayed: 24,
          totalWins: 8,
          totalDraws: 4,
          totalLosses: 12,
          totalPoints: 28,
          totalGoalsFor: 160,
          totalGoalsAgainst: 280,
          championships: 0,
          runnerUps: 0,
          thirdPlaces: 0
        },
        {
          teamId: '6',
          teamName: 'Holyhead Harpies',
          position: 6,
          seasonsPlayed: 2,
          totalPlayed: 24,
          totalWins: 6,
          totalDraws: 6,
          totalLosses: 12,
          totalPoints: 24,
          totalGoalsFor: 140,
          totalGoalsAgainst: 300,
          championships: 0,
          runnerUps: 0,
          thirdPlaces: 0
        }
      ];
      
      setHistoricalStandings(exampleHistoricalData);
    }
  };

  const loadStandingsFromSimulation = () => {
    // This will automatically initialize a season if none exists
    const temporadaActiva = virtualTimeManager.getTemporadaActivaOInicializar();
    setSeason(temporadaActiva);
    
    // Calculate standings from finished matches
    const calculatedStandings = standingsCalculator.calculateStandings(
      temporadaActiva.equipos,
      temporadaActiva.partidos.filter(match => match.status === 'finished')
    );
    
    setStandings(calculatedStandings);
  };

  const getPositionBadgeClass = (position: number) => {
    if (position === 1) return 'first';
    if (position === 2) return 'second';
    if (position === 3) return 'third';
    return 'default';
  };

  // Preparar datos según el modo de vista
  const currentStandingsData = standings.map((standing, index) => ({
    position: standing.position || (index + 1),
    teamId: standing.teamId,
    teamName: standing.team.name,
    played: standing.matchesPlayed,
    won: standing.wins,
    drawn: standing.draws,
    lost: standing.losses,
    points: standing.points,
    goalsFor: standing.goalsFor,
    goalsAgainst: standing.goalsAgainst,
    league: 'Liga Profesional Quidditch'
  }));

  const historicalStandingsData = historicalStandings.map(team => ({
    position: team.position,
    teamId: team.teamId,
    teamName: team.teamName,
    played: team.totalPlayed,
    won: team.totalWins,
    drawn: team.totalDraws,
    lost: team.totalLosses,
    points: team.totalPoints,
    goalsFor: team.totalGoalsFor,
    goalsAgainst: team.totalGoalsAgainst,
    league: 'Liga Profesional Quidditch',
    // Datos adicionales para tabla histórica
    seasonsPlayed: team.seasonsPlayed,
    championships: team.championships,
    runnerUps: team.runnerUps,
    thirdPlaces: team.thirdPlaces
  }));

  // Seleccionar datos según el modo de vista
  const filteredStandings = viewMode === 'current' ? currentStandingsData : historicalStandingsData;

  return (
    <div className={styles.standingsPageContainer}>
      {/* Hero Header Section */}
      <section className={styles.pageHeader}>
        <Card className={styles.heroCard}>
          <h1 className={styles.pageTitle}>
            <span className={styles.titleIcon}>
              {viewMode === 'current' ? '📊' : '🏆'}
            </span>
            {viewMode === 'current' ? 'Clasificación Actual' : 'Tabla Histórica'}
          </h1>          
          <p className={styles.pageDescription}>
            {viewMode === 'current' 
              ? 'Consulta la tabla de posiciones actualizada de la temporada en curso'
              : 'Estadísticas acumuladas de todas las temporadas completadas'
            }
          </p>
          
          {viewMode === 'current' && season && (
            <div className={styles.seasonInfo}>
              📊 {season.name} - {standings.length} equipos • {standings.reduce((acc, s) => acc + s.matchesPlayed, 0)} partidos jugados
            </div>
          )}
          
          {viewMode === 'current' && !season && (
            <div className={styles.noDataInfo}>
              🏆 Inicia una temporada en la página de Partidos para ver las clasificaciones en vivo
            </div>
          )}
          
          {viewMode === 'historical' && historicalSeasons.length > 0 && (
            <div className={styles.seasonInfo}>
              🏆 Datos de {historicalSeasons.length} temporada{historicalSeasons.length !== 1 ? 's' : ''} completada{historicalSeasons.length !== 1 ? 's' : ''} • {historicalStandings.length} equipos históricos
            </div>
          )}
          
          {viewMode === 'historical' && historicalSeasons.length === 0 && historicalStandings.length > 0 && (
            <div className={styles.seasonInfo}>
              🏆 Datos de ejemplo históricos • {historicalStandings.length} equipos con estadísticas simuladas
            </div>
          )}
          
          {viewMode === 'historical' && historicalStandings.length === 0 && (
            <div className={styles.noDataInfo}>
              📜 No hay datos históricos disponibles. Completa al menos una temporada para ver la tabla histórica.
            </div>
          )}
        </Card>
      </section>
      
      <section className={styles.standingsSection}>
        {/* View Mode Toggle */}
        <Card className={styles.filtersCard}>
          <div className={styles.standingsFilters}>
            <Button 
              variant={viewMode === 'current' ? 'primary' : 'outline'} 
              onClick={() => setViewMode('current')}
              className={styles.filterButton}
            >
              📊 Temporada Actual
            </Button>
            <Button 
              variant={viewMode === 'historical' ? 'primary' : 'outline'} 
              onClick={() => setViewMode('historical')}
              className={styles.filterButton}
              disabled={historicalStandings.length === 0}
            >
              🏆 Tabla Histórica
            </Button>
          </div>
          {viewMode === 'historical' && historicalSeasons.length === 0 && historicalStandings.length > 0 && (
            <div className={styles.noHistoryInfo}>
              📜 Mostrando datos de ejemplo. Completa temporadas reales para ver estadísticas históricas verdaderas.
            </div>
          )}
          {historicalStandings.length === 0 && (
            <div className={styles.noHistoryInfo}>
              📜 No hay datos históricos disponibles. Completa al menos una temporada para ver la tabla histórica.
            </div>
          )}
        </Card>

        {filteredStandings.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <Card className={styles.tableCard}>
              <div className={styles.tableContainer}>
                <table className={styles.standingsTable}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th className={styles.tableHeaderCell}>Pos</th>
                      <th className={styles.tableHeaderCell}>Equipo</th>
                      {viewMode === 'historical' && (
                        <th className={`${styles.tableHeaderCell} ${styles.center}`}>Temp</th>
                      )}
                      <th className={`${styles.tableHeaderCell} ${styles.center}`}>PJ</th>
                      <th className={`${styles.tableHeaderCell} ${styles.center}`}>PG</th>
                      <th className={`${styles.tableHeaderCell} ${styles.center}`}>PE</th>
                      <th className={`${styles.tableHeaderCell} ${styles.center}`}>PP</th>
                      <th className={`${styles.tableHeaderCell} ${styles.center}`}>GF</th>
                      <th className={`${styles.tableHeaderCell} ${styles.center}`}>GC</th>
                      <th className={`${styles.tableHeaderCell} ${styles.center}`}>Puntos</th>
                      {viewMode === 'historical' && (
                        <>
                          <th className={`${styles.tableHeaderCell} ${styles.center}`}>🥇</th>
                          <th className={`${styles.tableHeaderCell} ${styles.center}`}>🥈</th>
                          <th className={`${styles.tableHeaderCell} ${styles.center}`}>🥉</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStandings.map((team) => (
                      <tr key={team.teamId} className={styles.standingRow}>
                        <td className={`${styles.tableCell} ${styles.positionCell}`}>
                          <div className={`${styles.positionBadge} ${styles[getPositionBadgeClass(team.position)]}`}>
                            {team.position}
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.teamInfo}>
                            <TeamLogo 
                              teamName={team.teamName} 
                              size="sm" 
                              className={styles.teamLogoInTable}
                            />
                            <Link to={`/teams/${team.teamId}`} className={styles.teamName}>
                              {team.teamName}
                            </Link>
                          </div>
                        </td>
                        {viewMode === 'historical' && (
                          <td className={`${styles.tableCell} ${styles.center}`}>
                            {(team as any).seasonsPlayed}
                          </td>
                        )}
                        <td className={`${styles.tableCell} ${styles.center}`}>{team.played}</td>
                        <td className={`${styles.tableCell} ${styles.center}`}>{team.won}</td>
                        <td className={`${styles.tableCell} ${styles.center}`}>{team.drawn}</td>
                        <td className={`${styles.tableCell} ${styles.center}`}>{team.lost}</td>
                        <td className={`${styles.tableCell} ${styles.center}`}>{team.goalsFor}</td>
                        <td className={`${styles.tableCell} ${styles.center}`}>{team.goalsAgainst}</td>
                        <td className={`${styles.tableCell} ${styles.center} ${styles.bold}`}>{team.points}</td>
                        {viewMode === 'historical' && (
                          <>
                            <td className={`${styles.tableCell} ${styles.center}`}>
                              {(team as any).championships || 0}
                            </td>
                            <td className={`${styles.tableCell} ${styles.center}`}>
                              {(team as any).runnerUps || 0}
                            </td>
                            <td className={`${styles.tableCell} ${styles.center}`}>
                              {(team as any).thirdPlaces || 0}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile Cards View */}
            <div className={styles.mobileView}>
              {filteredStandings.map((team) => (
                <div key={team.teamId} className={styles.standingCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTeamInfo}>
                      <div className={`${styles.positionBadge} ${styles[getPositionBadgeClass(team.position)]}`}>
                        {team.position}
                      </div>
                      <TeamLogo 
                        teamName={team.teamName} 
                        size="md" 
                        className={styles.teamLogoInCard}
                      />
                      <Link to={`/teams/${team.teamId}`} className={styles.teamName}>
                        <strong>{team.teamName}</strong>
                      </Link>
                    </div>
                    <div className={styles.cardPosition}>
                      {team.points} pts
                      {viewMode === 'historical' && (
                        <div className={styles.cardSeasons}>
                          {(team as any).seasonsPlayed} temp.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.cardStats}>
                    <div className={styles.statItem}>
                      <div className={styles.statValue}>{team.played}</div>
                      <div className={styles.statLabel}>Jugados</div>
                    </div>
                    <div className={styles.statItem}>
                      <div className={styles.statValue}>{team.won}</div>
                      <div className={styles.statLabel}>Ganados</div>
                    </div>
                    <div className={styles.statItem}>
                      <div className={styles.statValue}>{team.lost}</div>
                      <div className={styles.statLabel}>Perdidos</div>
                    </div>
                    <div className={styles.statItem}>
                      <div className={styles.statValue}>{team.goalsFor}</div>
                      <div className={styles.statLabel}>Goles F</div>
                    </div>
                    <div className={styles.statItem}>
                      <div className={styles.statValue}>{team.goalsAgainst}</div>
                      <div className={styles.statLabel}>Goles C</div>
                    </div>
                    <div className={styles.statItem}>
                      <div className={styles.statValue}>{team.goalsFor - team.goalsAgainst}</div>
                      <div className={styles.statLabel}>Diferencia</div>
                    </div>
                  </div>
                  
                  {viewMode === 'historical' && (
                    <div className={styles.cardHonors}>
                      <div className={styles.honorItem}>
                        <span className={styles.honorIcon}>🥇</span>
                        <span className={styles.honorCount}>{(team as any).championships || 0}</span>
                      </div>
                      <div className={styles.honorItem}>
                        <span className={styles.honorIcon}>🥈</span>
                        <span className={styles.honorCount}>{(team as any).runnerUps || 0}</span>
                      </div>
                      <div className={styles.honorItem}>
                        <span className={styles.honorIcon}>🥉</span>
                        <span className={styles.honorCount}>{(team as any).thirdPlaces || 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <h3>No hay equipos para mostrar</h3>
            <p>No se encontraron equipos en la liga.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default StandingsPage;
