import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import TeamLogo from '../../components/teams/TeamLogo';
import { SeasonsService } from '../../services/seasonsService';
import { HistoricalSeasonsService, HistoricalSeasonData } from '../../services/historicalSeasonsService';
import { Season, Standing } from '../../types/league';
import styles from './HistoricalSeasonDetail.module.css';

const HistoricalSeasonDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [historicalSeason, setHistoricalSeason] = useState<HistoricalSeasonData | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const historicalSeasonsService = new HistoricalSeasonsService();
  const seasonsService = new SeasonsService();

  useEffect(() => {
    if (id) {
      loadHistoricalSeasonData(id);
    }
  }, [id]);

  const loadHistoricalSeasonData = async (historicalSeasonId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Cargar datos de la temporada histórica
      const historicalData = await historicalSeasonsService.getHistoricalSeasonById(historicalSeasonId);
      
      if (!historicalData) {
        setError('Temporada histórica no encontrada');
        return;
      }

      setHistoricalSeason(historicalData);

      // Intentar cargar la temporada original para obtener los standings finales
      try {
        const originalSeasonData = await seasonsService.getSeasonById(historicalData.originalSeasonId);
        if (originalSeasonData) {
          const finalStandings = calculateFinalStandings(originalSeasonData);
          setStandings(finalStandings);
        }
      } catch (originalSeasonError) {
        console.warn('No se pudo cargar la temporada original, mostrando solo datos históricos:', originalSeasonError);
      }

    } catch (error) {
      console.error('Error loading historical season data:', error);
      setError('Error cargando los datos de la temporada histórica');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFinalStandings = (season: Season): Standing[] => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando temporada histórica...</p>
        </div>
      </div>
    );
  }

  if (error || !historicalSeason) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>❌ {error || 'Temporada no encontrada'}</p>
          <Button onClick={() => navigate('/standings')}>
            ← Volver a Clasificaciones
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Button 
          variant="outline" 
          onClick={() => navigate('/standings')}
          className={styles.backButton}
        >
          ← Volver a Clasificaciones
        </Button>
        
        <div className={styles.titleSection}>
          <h1>📊 {historicalSeason.name}</h1>
          <p className={styles.subtitle}>Temporada Histórica - Datos Finales</p>
        </div>
      </div>

      {/* Season Summary */}
      <Card className={styles.summaryCard}>
        <h2>📈 Resumen de la Temporada</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>🏆 Campeón</span>
            <span className={styles.summaryValue}>
              {historicalSeason.championTeamName || 'No determinado'}
            </span>
          </div>
          
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>📅 Período</span>
            <span className={styles.summaryValue}>
              {formatDate(historicalSeason.startDate)} - {formatDate(historicalSeason.endDate)}
            </span>
          </div>
          
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>👥 Equipos</span>
            <span className={styles.summaryValue}>{historicalSeason.totalTeams}</span>
          </div>
          
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>⚽ Partidos</span>
            <span className={styles.summaryValue}>{historicalSeason.totalMatches}</span>
          </div>
          
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>🎯 Apuestas</span>
            <span className={styles.summaryValue}>{historicalSeason.totalBets}</span>
          </div>
          
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>🔮 Predicciones</span>
            <span className={styles.summaryValue}>{historicalSeason.totalPredictions}</span>
          </div>
          
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>💰 Ingresos Totales</span>
            <span className={styles.summaryValue}>
              {historicalSeason.totalRevenue.toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR'
              })}
            </span>
          </div>
          
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>📅 Archivada</span>
            <span className={styles.summaryValue}>
              {formatDate(historicalSeason.archivedAt)}
            </span>
          </div>
        </div>
      </Card>

      {/* Final Standings */}
      {standings.length > 0 && (
        <Card className={styles.standingsCard}>
          <h2>🏆 Clasificación Final</h2>
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
            </div>

            {standings.map((standing) => (
              <div 
                key={standing.teamId} 
                className={`${styles.tableRow} ${standing.position === 1 ? styles.champion : ''}`}
              >
                <span className={styles.position}>
                  {standing.position === 1 && '🏆'} {standing.position}
                </span>
                <div className={styles.team}>
                  <TeamLogo teamName={standing.team.name} size="sm" />
                  <span>{standing.team.name}</span>
                  {standing.position === 1 && <span className={styles.championBadge}>CAMPEÓN</span>}
                </div>
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
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* No standings available */}
      {standings.length === 0 && (
        <Card>
          <div className={styles.noData}>
            <p>📊 Los datos detallados de la clasificación final no están disponibles</p>
            <p>Solo se muestran los datos de resumen histórico de esta temporada.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default HistoricalSeasonDetail;
