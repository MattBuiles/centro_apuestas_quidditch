import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { getTeamLogo, getTeamInitial } from '@/assets/teamLogos';
import { leagueTimeService } from '@/services/leagueTimeService';
import { standingsCalculator } from '@/services/standingsCalculator';
import { getTeams } from '@/services/teamsService';
import { Season } from '@/types/league';
import { apiClient } from '@/utils/apiClient';
import { FEATURES } from '@/config/features';
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
    console.log('🚀 TeamsPage montado, cargando equipos...');
    console.log('🔧 FEATURES.USE_BACKEND_LEAGUE_TIME:', FEATURES.USE_BACKEND_LEAGUE_TIME);
    loadTeamsFromSimulation();
  }, []);

  const loadTeamsFromSimulation = async () => {
    setIsLoading(true);
    console.log('🔍 Cargando equipos...');
    
    try {
      // First try to get teams from backend API
      console.log('📡 Intentando cargar desde backend API...');
      const response = await apiClient.get('/teams');
      console.log('📋 Respuesta del backend:', response);
      
      if (response.success && response.data && Array.isArray(response.data)) {
        const backendTeams = response.data.map((team: any) => ({
          id: String(team.id || team._id || ''),
          name: String(team.name || ''),
          logoChar: String(team.name || '').charAt(0).toUpperCase(),
          stats: {
            wins: Number(team.wins || team.victories || 0),
            losses: Number(team.losses || team.defeats || 0),
            draws: Number(team.draws || team.ties || 0),
            points: Number(team.points || team.totalPoints || 0),
            played: Number(team.matches_played || team.matchesPlayed || team.played || 0),
            goalsFor: Number(team.goals_for || team.goalsFor || team.points_for || 0),
            goalsAgainst: Number(team.goals_against || team.goalsAgainst || team.points_against || 0)
          }
        }));
        
        console.log('✅ Equipos cargados desde backend:', backendTeams);
        setTeams(backendTeams);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.warn('❌ Error al cargar desde backend, probando con teamsService:', error);
    }

    // Fallback to teamsService
    try {
      console.log('🔄 Intentando con teamsService...');
      const teamsServiceData = await getTeams();
      if (teamsServiceData && teamsServiceData.length > 0) {
        const serviceTeams = teamsServiceData.map((team: any) => ({
          id: String(team.id || ''),
          name: String(team.name || ''),
          logoChar: String(team.name || '').charAt(0).toUpperCase(),
          stats: {
            wins: Number(team.wins || 0),
            losses: Number(team.losses || 0),
            draws: Number(team.draws || 0),
            points: Number(team.points || 0),
            played: Number(team.played || 0),
            goalsFor: Number(team.goalsFor || 0),
            goalsAgainst: Number(team.goalsAgainst || 0)
          }
        }));
        
        console.log('✅ Equipos cargados desde teamsService:', serviceTeams);
        setTeams(serviceTeams);
        setIsLoading(false);
        return;
      }
    } catch (serviceError) {
      console.warn('❌ Error con teamsService:', serviceError);
    }

    // Fallback to league time service for team data
    if (FEATURES.USE_BACKEND_LEAGUE_TIME) {
      try {
        console.log('🔄 Intentando con league time service...');
        const leagueInfo = await leagueTimeService.getLeagueTimeInfo();
        if (leagueInfo.activeSeason && leagueInfo.activeSeason.teams) {
          setSeason(leagueInfo.activeSeason);
          
          // Calculate standings to get team stats
          const standings = standingsCalculator.calculateStandings(
            leagueInfo.activeSeason.teams,
            leagueInfo.activeSeason.matches.filter((match: any) => match.status === 'finished')
          );
          
          // Convert teams to TeamData format and sort alphabetically
          const teamsData: TeamData[] = leagueInfo.activeSeason.teams
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
            .map((team: any) => {
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
          
          console.log('✅ Equipos cargados desde league time service:', teamsData);
          setTeams(teamsData);
          setIsLoading(false);
          return;
        }
      } catch (leagueError) {
        console.warn('❌ Error con league time service:', leagueError);
      }
    }
    
    // Final fallback to mock data
    console.log('📋 Usando datos mock como fallback');
    setTeams(mockTeams);
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
              <Button 
                size="sm" 
                className={styles.searchButton}
                onClick={() => {}}
                aria-label="Buscar"
              >
                🔍
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Teams Grid */}
      <section className={styles.teamsSection}>
        <div className={styles.teamsGrid}>
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
                {!season && " Inicia una temporada en la página de Partidos para ver los equipos en acción."}
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
            filteredTeams.map(team => (
              <Link 
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
                </div>
                
                {/* Team Card Body */}
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
            ))
          ) : (
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
