import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { getTeamLogo, getTeamInitial } from '@/assets/teamLogos';
import styles from './TeamsPage.module.css';

// Mock data for teams
interface TeamData {
  id: string;
  name: string;
  league: string;
  logoChar?: string;
  stats?: {
    wins: number;
    losses: number;
    draws: number;
    points: number;
  };
}

const mockTeams: TeamData[] = [
  { 
    id: 'gryffindor', 
    name: 'Gryffindor', 
    league: 'Liga de Hogwarts',
    logoChar: 'G',
    stats: { wins: 12, losses: 3, draws: 2, points: 38 }
  },
  { 
    id: 'slytherin', 
    name: 'Slytherin', 
    league: 'Liga de Hogwarts',
    logoChar: 'S',
    stats: { wins: 11, losses: 4, draws: 2, points: 35 }
  },
  { 
    id: 'ravenclaw', 
    name: 'Ravenclaw', 
    league: 'Liga de Hogwarts',
    logoChar: 'R',
    stats: { wins: 9, losses: 6, draws: 2, points: 29 }
  },
  { 
    id: 'hufflepuff', 
    name: 'Hufflepuff', 
    league: 'Liga de Hogwarts',
    logoChar: 'H',
    stats: { wins: 8, losses: 7, draws: 2, points: 26 }
  },
  { 
    id: 'chudley_cannons', 
    name: 'Chudley Cannons', 
    league: 'Liga Británica e Irlandesa',
    logoChar: 'C',
    stats: { wins: 15, losses: 8, draws: 1, points: 46 }
  },
  { 
    id: 'holyhead_harpies', 
    name: 'Holyhead Harpies', 
    league: 'Liga Británica e Irlandesa',
    logoChar: 'H',
    stats: { wins: 13, losses: 9, draws: 2, points: 41 }
  },
];

const TeamsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('all');

  const filteredTeams = mockTeams.filter(team => {
    const matchesSearch = searchTerm === '' || team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = selectedLeague === 'all' || team.league === selectedLeague;
    return matchesSearch && matchesLeague;
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedLeague('all');
  };

  return (
    <div className={styles.teamsPageContainer}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <Card className={styles.heroCard}>
          <h1 className={styles.pageTitle}>
            <span className={styles.titleIcon}>⚡</span>
            Equipos de Quidditch
          </h1>
          <p className={styles.pageDescription}>
            Descubre todos los equipos mágicos, sus estadísticas y trayectorias legendarias
          </p>
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
                aria-label="Buscar"
              >
                🔍
              </Button>
            </div>
            
            <div className={styles.filterButtons}>
              <Button 
                variant={selectedLeague === 'all' ? 'primary' : 'outline'} 
                size="sm" 
                onClick={() => setSelectedLeague('all')}
                className={`${styles.filterButton} ${selectedLeague === 'all' ? styles.active : ''}`}
              >
                Todas las Ligas
              </Button>
              <Button 
                variant={selectedLeague === 'Liga de Hogwarts' ? 'primary' : 'outline'} 
                size="sm" 
                onClick={() => setSelectedLeague('Liga de Hogwarts')}
                className={`${styles.filterButton} ${selectedLeague === 'Liga de Hogwarts' ? styles.active : ''}`}
              >
                Liga de Hogwarts
              </Button>
              <Button 
                variant={selectedLeague === 'Liga Británica e Irlandesa' ? 'primary' : 'outline'} 
                size="sm" 
                onClick={() => setSelectedLeague('Liga Británica e Irlandesa')}
                className={`${styles.filterButton} ${selectedLeague === 'Liga Británica e Irlandesa' ? styles.active : ''}`}
              >
                Liga Británica
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Teams Grid */}
      <section className={styles.teamsSection}>
        <div className={styles.teamsGrid}>
          {filteredTeams.length > 0 ? (
            filteredTeams.map(team => (              <Link 
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
                  <div className={styles.teamLeague}>
                    <span className={styles.leagueIcon}>🏰</span>
                    {team.league}
                  </div>

                  {team.stats && (
                    <div className={styles.teamStats}>
                      <div className={styles.statItem}>
                        <div className={styles.statValue}>{team.stats.wins}</div>
                        <div className={styles.statLabel}>Victorias</div>
                      </div>
                      <div className={styles.statItem}>
                        <div className={styles.statValue}>{team.stats.losses}</div>
                        <div className={styles.statLabel}>Derrotas</div>
                      </div>
                      <div className={styles.statItem}>
                        <div className={styles.statValue}>{team.stats.draws}</div>
                        <div className={styles.statLabel}>Empates</div>
                      </div>
                      <div className={styles.statItem}>
                        <div className={styles.statValue}>{team.stats.points}</div>
                        <div className={styles.statLabel}>Puntos</div>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <div className={styles.emptyState}>
              <h3>🔍 No se encontraron equipos</h3>
              <p>
                No hay equipos que coincidan con los filtros aplicados. 
                Intenta con otros términos de búsqueda o liga.
              </p>              <Button 
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
