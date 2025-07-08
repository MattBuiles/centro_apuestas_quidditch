import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { getTeamLogo, getTeamInitial } from '@/assets/teamLogos';
import { virtualTimeManager } from '@/services/virtualTimeManager';
import { standingsCalculator } from '@/services/standingsCalculator';
import { Season } from '@/types/league';
import { apiClient } from '@/utils/apiClient';
import styles from './TeamsPage.module.css';

// Team data interface
interface TeamData {
  id: string;
  name: string;
  logoChar?: string;
  stats?: {
    wins: number;
    losses: number;
    draws: number;
    points: number;
    played: number;
    goalsFor: number;
    goalsAgainst: number;
  };
}

// Fallback mock data for teams (only used when no simulation data available)
const mockTeams: TeamData[] = [
  { 
    id: 'gryffindor', 
    name: 'Gryffindor', 
    logoChar: 'G',
    stats: { wins: 12, losses: 3, draws: 2, points: 38, played: 17, goalsFor: 45, goalsAgainst: 25 }
  },
  { 
    id: 'slytherin', 
    name: 'Slytherin', 
    logoChar: 'S',
    stats: { wins: 11, losses: 4, draws: 2, points: 35, played: 17, goalsFor: 42, goalsAgainst: 28 }
  },
  { 
    id: 'ravenclaw', 
    name: 'Ravenclaw', 
    logoChar: 'R',
    stats: { wins: 9, losses: 6, draws: 2, points: 29, played: 17, goalsFor: 38, goalsAgainst: 35 }
  },
  { 
    id: 'hufflepuff', 
    name: 'Hufflepuff', 
    logoChar: 'H',
    stats: { wins: 8, losses: 7, draws: 2, points: 26, played: 17, goalsFor: 35, goalsAgainst: 38 }
  },
  { 
    id: 'chudley_cannons', 
    name: 'Chudley Cannons', 
    logoChar: 'C',
    stats: { wins: 15, losses: 8, draws: 1, points: 46, played: 24, goalsFor: 65, goalsAgainst: 45 }
  },
  { 
    id: 'holyhead_harpies', 
    name: 'Holyhead Harpies', 
    logoChar: 'H',
    stats: { wins: 13, losses: 9, draws: 2, points: 41, played: 24, goalsFor: 58, goalsAgainst: 52 }
  },
];

const TeamsPage: React.FC = () => {  const [teams, setTeams] = useState<TeamData[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTeamsFromSimulation();
  }, []);

  const loadTeamsFromSimulation = async () => {
    setIsLoading(true);
    
    try {
      // First try to get teams from backend
      const response = await apiClient.get('/teams') as { data?: { success?: boolean; data?: unknown[] } };
      if (response.data?.success && response.data?.data) {
        const backendTeams = response.data.data.map((team: unknown) => {
          const teamData = team as Record<string, unknown>;
          return {
            id: String(teamData.id || ''),
            name: String(teamData.name || ''),
            logoChar: String(teamData.name || '').charAt(0).toUpperCase(),
            stats: {
              wins: Number(teamData.wins) || 0,
              losses: Number(teamData.losses) || 0,
              draws: Number(teamData.draws) || 0,
              points: Number(teamData.points) || 0,
              played: Number(teamData.matches_played) || 0,
              goalsFor: Number(teamData.goals_for) || 0,
              goalsAgainst: Number(teamData.goals_against) || 0
            }
          };
        });
        setTeams(backendTeams);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.warn('Failed to load teams from backend, falling back to local data:', error);
    }

    // Fallback to local simulation data
    const timeState = virtualTimeManager.getState();
    if (timeState.temporadaActiva) {
      setSeason(timeState.temporadaActiva);
      
      // Calculate standings to get team stats
      const standings = standingsCalculator.calculateStandings(
        timeState.temporadaActiva.equipos,
        timeState.temporadaActiva.partidos.filter(match => match.status === 'finished')
      );      
      
      // Convert teams to TeamData format and sort alphabetically
      const teamsData: TeamData[] = timeState.temporadaActiva.equipos
        .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically by name
        .map(team => {
          const standing = standings.find(s => s.teamId === team.id);
        
        return {
          id: team.id,
          name: team.name,
          logoChar: team.name.charAt(0).toUpperCase(),
          stats: standing ? {
            wins: standing.wins,
            losses: standing.losses,
            draws: standing.draws,
            points: standing.points,
            played: standing.matchesPlayed,
            goalsFor: standing.goalsFor,
            goalsAgainst: standing.goalsAgainst
          } : {
            wins: 0,
            losses: 0,
            draws: 0,
            points: 0,
            played: 0,
            goalsFor: 0,
            goalsAgainst: 0
          }
        };
      });
      
      setTeams(teamsData);
    } else {
      // Final fallback to mock data if no simulation
      setTeams(mockTeams);
    }
    
    setIsLoading(false);
  };
  const filteredTeams = teams.filter(team => {
    const matchesSearch = searchTerm === '' || team.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleClearFilters = () => {
    setSearchTerm('');
  };

  return (
    <div className={styles.teamsPageContainer}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <Card className={styles.heroCard}>
          <h1 className={styles.pageTitle}>
            <span className={styles.titleIcon}>⚡</span>
            Equipos de Quidditch
          </h1>          <p className={styles.pageDescription}>
            Descubre todos los equipos mágicos, sus estadísticas y trayectorias legendarias
          </p>
          {season && (
            <div className={styles.seasonInfo}>
              📊 {season.name} - {teams.length} equipos participando
            </div>
          )}
          {!season && !isLoading && (
            <div className={styles.noDataInfo}>
              ⚡ Inicia una temporada en la página de Partidos para ver equipos en vivo
            </div>
          )}
        </Card>
      </section>

      {/* Filters Section */}
      <section className={styles.filtersSection}>
        <Card className={styles.filtersCard}>
          <div className={styles.filtersContent}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Buscar equipos mágicos..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button                size="sm" 
                className={styles.searchButton}
                aria-label="Buscar"
              >
                🔍
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Teams Grid */}
      <section className={styles.teamsSection}>        <div className={styles.teamsGrid}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <h3>⚡ Cargando equipos...</h3>
              <p>Consultando los datos mágicos de los equipos</p>
            </div>
          ) : teams.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>🏟️ No se encontraron equipos</h3>
              <p>
                Actualmente no hay equipos disponibles. 
                {!season && "Inicia una temporada en la página de Partidos para ver los equipos en acción."}
              </p>
              {!season && (
                <Link to="/matches">
                  <Button variant="primary">
                    Ir a Partidos
                  </Button>
                </Link>
              )}
            </div>
          ) : filteredTeams.length > 0 ? (
            filteredTeams.map(team => (<Link 
                key={team.id} 
                to={`/teams/${team.id}`}
                className={styles.teamCard}
                aria-label={`Ver detalles de ${team.name}`}
              >
                {/* Team Card Header */}
                <div className={styles.teamCardHeader}>
                  <div className={styles.teamLogo}>
                    {getTeamLogo(team.name) ? (
                      <img 
                        src={getTeamLogo(team.name)!} 
                        alt={`Logo de ${team.name}`}
                        className={styles.teamLogoImage}
                      />
                    ) : (
                      <span className={styles.teamLogoText}>
                        {getTeamInitial(team.name)}
                      </span>
                    )}
                  </div>
                  <h3 className={styles.teamName}>{team.name}</h3>
                </div>                {/* Team Card Body */}
                <div className={styles.teamCardBody}>
                  {team.stats && team.stats.played > 0 ? (
                    <div className={styles.teamStats}>
                      <div className={styles.statItem}>
                        <div className={styles.statValue}>{team.stats.played}</div>
                        <div className={styles.statLabel}>Jugados</div>
                      </div>
                      <div className={styles.statItem}>
                        <div className={styles.statValue}>{team.stats.wins}</div>
                        <div className={styles.statLabel}>Victorias</div>
                      </div>
                      <div className={styles.statItem}>
                        <div className={styles.statValue}>{team.stats.losses}</div>
                        <div className={styles.statLabel}>Derrotas</div>
                      </div>
                      <div className={styles.statItem}>
                        <div className={styles.statValue}>{team.stats.points}</div>
                        <div className={styles.statLabel}>Puntos</div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.noStatsMessage}>
                      <p>📊 La clasificación aún no está disponible</p>
                      <p>Vuelve más tarde para ver las estadísticas</p>
                    </div>
                  )}
                </div>
              </Link>
            ))          ) : (
            <div className={styles.emptyState}>
              <h3>🔍 No se encontraron equipos</h3>
              <p>
                No hay equipos que coincidan con el término de búsqueda "{searchTerm}". 
                Intenta con otros términos.
              </p>
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default TeamsPage;
