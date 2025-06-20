import React, { useState, useEffect, useCallback } from 'react';
import { UpcomingMatch } from '@/types/league';
import { Link } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import TeamLogo from '@/components/teams/TeamLogo';
import styles from './UpcomingMatches.module.css';

interface UpcomingMatchesProps {
  seasonId?: string;
  teamId?: string;
  limit?: number;
  showBettingButton?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

/**
 * Component for displaying upcoming matches
 * Following schema: "Vista 'Próximos partidos'"
 * Auto-updates when server clock changes
 */
const UpcomingMatches: React.FC<UpcomingMatchesProps> = ({
  teamId,
  limit = 5,
  showBettingButton = true,
  autoRefresh = true,
  refreshInterval = 60 // 1 minute
}) => {
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadUpcomingMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real app, you would fetch from your backend/context
      // For now, we'll simulate this with mock data
      const mockMatches: UpcomingMatch[] = [
        {
          id: '1',
          homeTeam: 'Gryffindor',
          awayTeam: 'Slytherin',
          date: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          time: '19:00',
          league: 'Liga de Hogwarts',
          venue: 'Campo de Quidditch de Hogwarts',
          canBet: true,
          odds: { home: 1.85, away: 2.10 }
        },
        {
          id: '2',
          homeTeam: 'Ravenclaw',
          awayTeam: 'Hufflepuff',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
          time: '16:30',
          league: 'Liga de Hogwarts',
          venue: 'Campo Norte',
          canBet: true,
          odds: { home: 1.95, away: 1.95 }
        },
        {
          id: '3',
          homeTeam: 'Chudley Cannons',
          awayTeam: 'Holyhead Harpies',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          time: '15:00',
          league: 'Liga Profesional',
          venue: 'Estadio Nacional de Quidditch',
          canBet: true,
          odds: { home: 2.25, away: 1.65 }
        }
      ];

      setUpcomingMatches(mockMatches.slice(0, limit));
      setLastUpdated(new Date());
    } catch (err) {
      setError('Error al cargar próximos partidos');
      console.error('Error loading upcoming matches:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadUpcomingMatches();
    
    // Auto-refresh setup
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadUpcomingMatches();
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [loadUpcomingMatches, autoRefresh, refreshInterval]);

  const getTimeUntilMatch = (matchDate: Date): string => {
    const now = new Date();
    const diff = matchDate.getTime() - now.getTime();

    if (diff < 0) return 'En curso';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `En ${days}d ${hours}h`;
    if (hours > 0) return `En ${hours}h ${minutes}m`;
    return `En ${minutes}m`;
  };

  const getMatchStatusClass = (match: UpcomingMatch): string => {
    const timeUntilMatch = match.date.getTime() - new Date().getTime();
    const oneHour = 60 * 60 * 1000;
    
    if (timeUntilMatch < oneHour) {
      return styles.matchSoon;
    }
    return styles.matchScheduled;
  };

  if (loading) {
    return (
      <Card className={styles.upcomingMatchesCard}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando próximos partidos...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={styles.upcomingMatchesCard}>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <Button onClick={loadUpcomingMatches} size="sm">
            Reintentar
          </Button>
        </div>
      </Card>
    );
  }

  if (upcomingMatches.length === 0) {
    return (
      <Card className={styles.upcomingMatchesCard}>
        <div className={styles.noMatchesContainer}>
          <p>No hay próximos partidos programados</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={styles.upcomingMatchesCard}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {teamId ? 'Próximos Partidos del Equipo' : 'Próximos Partidos'}
        </h3>
        <div className={styles.lastUpdated}>
          Actualizado: {lastUpdated.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>

      <div className={styles.matchesList}>
        {upcomingMatches.map((match) => (
          <div 
            key={match.id} 
            className={`${styles.matchItem} ${getMatchStatusClass(match)}`}
          >
            <div className={styles.matchInfo}>
              <div className={styles.teams}>
                <div className={styles.team}>
                  <TeamLogo teamName={match.homeTeam} size="sm" />
                  <span className={styles.teamName}>{match.homeTeam}</span>
                </div>
                
                <div className={styles.vs}>VS</div>
                
                <div className={styles.team}>
                  <TeamLogo teamName={match.awayTeam} size="sm" />
                  <span className={styles.teamName}>{match.awayTeam}</span>
                </div>
              </div>

              <div className={styles.matchDetails}>
                <div className={styles.dateTime}>
                  <span className={styles.time}>{match.time}</span>
                  <span className={styles.countdown}>
                    {getTimeUntilMatch(match.date)}
                  </span>
                </div>
                
                <div className={styles.venue}>
                  <span className={styles.leagueName}>{match.league}</span>
                  {match.venue && (
                    <span className={styles.venueName}> • {match.venue}</span>
                  )}
                </div>
              </div>

              {match.odds && (
                <div className={styles.odds}>
                  <div className={styles.oddItem}>
                    <span className={styles.oddLabel}>Local</span>
                    <span className={styles.oddValue}>{match.odds.home}</span>
                  </div>
                  <div className={styles.oddItem}>
                    <span className={styles.oddLabel}>Visitante</span>
                    <span className={styles.oddValue}>{match.odds.away}</span>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.actions}>
              <Link to={`/matches/${match.id}`}>
                <Button variant="outline" size="sm">
                  Ver Detalles
                </Button>
              </Link>
              
              {showBettingButton && match.canBet && (
                <Link to={`/betting/${match.id}`}>
                  <Button variant="primary" size="sm">
                    Apostar
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <Link to="/matches">
          <Button variant="outline" size="sm" fullWidth>
            Ver Todos los Partidos
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default UpcomingMatches;
