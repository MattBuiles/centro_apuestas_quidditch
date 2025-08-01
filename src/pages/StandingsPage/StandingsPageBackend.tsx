import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import TeamLogo from '../../components/teams/TeamLogo';
import { SeasonsService } from '../../services/seasonsService';
import { HistoricalSeasonsService, HistoricalStanding } from '../../services/historicalSeasonsService';
import { leagueTimeService, LeagueTimeInfo } from '../../services/leagueTimeService';
import { FEATURES } from '../../config/features';
import { Season, Standing } from '../../types/league';
import styles from './StandingsPage.module.css';

const StandingsPage = () => {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [viewMode, setViewMode] = useState<'current' | 'allTime'>('current');
  const [historicalStandings, setHistoricalStandings] = useState<HistoricalStanding[]>([]);
  const [leagueTimeInfo, setLeagueTimeInfo] = useState<LeagueTimeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seasonsService = new SeasonsService();
  const historicalSeasonsService = new HistoricalSeasonsService();

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load league time info if backend is enabled
      if (FEATURES.USE_BACKEND_LEAGUE_TIME) {
        try {
          const timeInfo = await leagueTimeService.getLeagueTimeInfo();
          setLeagueTimeInfo(timeInfo);
          
          if (timeInfo.activeSeason) {
            setSeason(timeInfo.activeSeason);
            // Calculate standings from the active season
            const seasonStandings = calculateStandingsFromSeason(timeInfo.activeSeason);
            setStandings(seasonStandings);
          }
        } catch (timeError) {
          console.warn('Failed to load league time info, falling back to seasons service:', timeError);
        }
      }

      // If we don't have an active season from league time, try to get the latest from seasons
      if (!season) {
        try {
          const seasons = await seasonsService.getAllSeasons();
          if (seasons.length > 0) {
            const activeSeason = seasons.find(s => s.status === 'active') || seasons[0];
            if (activeSeason) {
              const fullSeason = await seasonsService.getSeasonById(activeSeason.id);
              if (fullSeason) {
                setSeason(fullSeason);
                const seasonStandings = calculateStandingsFromSeason(fullSeason);
                setStandings(seasonStandings);
              }
            }
          }
        } catch (seasonError) {
          console.warn('Failed to load seasons:', seasonError);
        }
      }

    } catch (error) {
      console.error('Error loading standings data:', error);
      setError('Error cargando los datos de la clasificación');
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistoricalData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔄 Cargando datos históricos acumulativos...');
      const historicalStandingsData = await historicalSeasonsService.getCumulativeHistoricalStandings();
      console.log('✅ Datos históricos cargados:', historicalStandingsData);
      setHistoricalStandings(historicalStandingsData);
    } catch (error) {
      console.error('Error loading historical data:', error);
      setError('Error cargando los datos históricos');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStandingsFromSeason = (season: Season): Standing[] => {
    if (!season.teams || !season.matches) {
      return [];
    }

    const finishedMatches = season.matches.filter(match => match.status === 'finished');
    
    // Initialize standings for each team
    const standingsMap = new Map<string, Standing>();
    
    season.teams.forEach(team => {
      standingsMap.set(team.id, {
        position: 0,
        teamId: team.id,
        team: team,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        form: [],
        snitchesCaught: 0,
        averageMatchDuration: 0
      });
    });

    // Process finished matches
    finishedMatches.forEach(match => {
      const homeStanding = standingsMap.get(match.homeTeamId);
      const awayStanding = standingsMap.get(match.awayTeamId);
      
      if (!homeStanding || !awayStanding || match.homeScore === undefined || match.awayScore === undefined) {
        return;
      }

      homeStanding.matchesPlayed++;
      awayStanding.matchesPlayed++;
      homeStanding.goalsFor += match.homeScore;
      homeStanding.goalsAgainst += match.awayScore;
      awayStanding.goalsFor += match.awayScore;
      awayStanding.goalsAgainst += match.homeScore;

      if (match.homeScore > match.awayScore) {
        homeStanding.wins++;
        homeStanding.points += 3;
        awayStanding.losses++;
        homeStanding.form.push('W');
        awayStanding.form.push('L');
      } else if (match.homeScore < match.awayScore) {
        awayStanding.wins++;
        awayStanding.points += 3;
        homeStanding.losses++;
        homeStanding.form.push('L');
        awayStanding.form.push('W');
      } else {
        homeStanding.draws++;
        awayStanding.draws++;
        homeStanding.points += 1;
        awayStanding.points += 1;
        homeStanding.form.push('D');
        awayStanding.form.push('D');
      }

      // Keep only last 5 matches in form
      if (homeStanding.form.length > 5) homeStanding.form.shift();
      if (awayStanding.form.length > 5) awayStanding.form.shift();
    });

    // Calculate goal difference and sort
    const standings = Array.from(standingsMap.values()).map(standing => ({
      ...standing,
      goalDifference: standing.goalsFor - standing.goalsAgainst
    }));

    // Sort by points, then goal difference, then goals for
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    // Assign positions
    standings.forEach((standing, index) => {
      standing.position = index + 1;
    });

    return standings;
  };

  const handleViewModeChange = (mode: 'current' | 'allTime') => {
    setViewMode(mode);
    if (mode === 'allTime') {
      loadHistoricalData();
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando clasificación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>❌ {error}</p>
          <Button onClick={loadData}>
            🔄 Intentar de nuevo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🏆 Clasificación de la Liga</h1>
        
        {leagueTimeInfo && (
          <div className={styles.leagueInfo}>
            <p>📅 Fecha actual: {new Date(leagueTimeInfo.currentDate).toLocaleDateString('es-ES')}</p>
            {leagueTimeInfo.activeSeason && (
              <p>⚡ Temporada activa: {leagueTimeInfo.activeSeason.name}</p>
            )}
          </div>
        )}

        <div className={styles.viewToggle}>
          <Button
            variant={viewMode === 'current' ? 'primary' : 'outline'}
            onClick={() => handleViewModeChange('current')}
          >
            Temporada Actual
          </Button>
          <Button
            variant={viewMode === 'allTime' ? 'primary' : 'outline'}
            onClick={() => handleViewModeChange('allTime')}
          >
            Histórico Total
          </Button>
        </div>
      </div>

      {viewMode === 'current' && (
        <div className={styles.content}>
          {season && (
            <div className={styles.seasonInfo}>
              <h2>{season.name}</h2>
              <p>Jornada {season.currentMatchday} de {season.totalMatchdays}</p>
              <p>Partidos jugados: {season.matches?.filter(m => m.status === 'finished').length || 0}</p>
            </div>
          )}

          {standings.length > 0 ? (
            <Card>
              <div className={styles.standingsTable}>
                <div className={styles.tableHeader}>
                  <span className={styles.position}>Pos</span>
                  <span className={styles.team}>Equipo</span>
                  <span className={styles.stat}>PJ</span>
                  <span className={styles.stat}>G</span>
                  <span className={styles.stat}>E</span>
                  <span className={styles.stat}>P</span>
                  <span className={styles.stat}>GF</span>
                  <span className={styles.stat}>GC</span>
                  <span className={styles.stat}>DG</span>
                  <span className={styles.stat}>Pts</span>
                  <span className={styles.form}>Últimos 5</span>
                </div>

                {standings.map((standing) => (
                  <div key={standing.teamId} className={`${styles.tableRow} ${styles[`position${standing.position}`]}`}>
                    <span className={styles.position}>{standing.position}</span>
                    <Link to={`/teams/${standing.teamId}`} className={styles.team}>
                      <TeamLogo teamName={standing.team.name} size="sm" />
                      <span>{standing.team.name}</span>
                    </Link>
                    <span className={styles.stat}>{standing.matchesPlayed}</span>
                    <span className={styles.stat}>{standing.wins}</span>
                    <span className={styles.stat}>{standing.draws}</span>
                    <span className={styles.stat}>{standing.losses}</span>
                    <span className={styles.stat}>{standing.goalsFor}</span>
                    <span className={styles.stat}>{standing.goalsAgainst}</span>
                    <span className={`${styles.stat} ${standing.goalDifference >= 0 ? styles.positive : styles.negative}`}>
                      {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                    </span>
                    <span className={styles.stat}>{standing.points}</span>
                    <div className={styles.form}>
                      {standing.form.map((result, index) => (
                        <span key={index} className={`${styles.formResult} ${styles[result.toLowerCase()]}`}>
                          {result}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <div className={styles.noData}>
                <p>No hay datos de clasificación disponibles</p>
                <p>Los equipos aparecerán aquí una vez que se jueguen los primeros partidos.</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {viewMode === 'allTime' && (
        <div className={styles.content}>
          <Card>
            <h2>🏆 Clasificación Histórica Acumulativa</h2>
            <p className={styles.description}>
              Ranking basado en el rendimiento acumulado de todas las temporadas completadas
            </p>
            
            {historicalStandings.length > 0 ? (
              <div className={styles.standingsTable}>
                <div className={styles.tableHeader}>
                  <span className={styles.position}>Pos</span>
                  <span className={styles.team}>Equipo</span>
                  <span className={styles.stat}>Temp</span>
                  <span className={styles.stat}>🏆</span>
                  <span className={styles.stat}>PJ</span>
                  <span className={styles.stat}>G</span>
                  <span className={styles.stat}>E</span>
                  <span className={styles.stat}>P</span>
                  <span className={styles.stat}>GF</span>
                  <span className={styles.stat}>GC</span>
                  <span className={styles.stat}>DG</span>
                  <span className={styles.stat}>Pts</span>
                  <span className={styles.stat}>%G</span>
                </div>

                {historicalStandings.map((standing) => (
                  <div key={standing.teamId} className={`${styles.tableRow} ${styles[`position${standing.position}`]}`}>
                    <span className={styles.position}>{standing.position}</span>
                    <div className={styles.team}>
                      <TeamLogo teamName={standing.teamName} size="sm" />
                      <span>{standing.teamName}</span>
                    </div>
                    <span className={styles.stat}>{standing.totalSeasons}</span>
                    <span className={styles.stat}>{standing.championships}</span>
                    <span className={styles.stat}>{standing.totalMatches}</span>
                    <span className={styles.stat}>{standing.totalWins}</span>
                    <span className={styles.stat}>{standing.totalDraws}</span>
                    <span className={styles.stat}>{standing.totalLosses}</span>
                    <span className={styles.stat}>{standing.totalGoalsFor}</span>
                    <span className={styles.stat}>{standing.totalGoalsAgainst}</span>
                    <span className={`${styles.stat} ${standing.totalGoalDifference >= 0 ? styles.positive : styles.negative}`}>
                      {standing.totalGoalDifference > 0 ? '+' : ''}{standing.totalGoalDifference}
                    </span>
                    <span className={styles.stat}>{standing.totalPoints}</span>
                    <span className={styles.stat}>{standing.winPercentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noData}>
                <p>No hay datos históricos disponibles</p>
                <p>Los datos aparecerán una vez que se completen y archiven las temporadas.</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default StandingsPage;
