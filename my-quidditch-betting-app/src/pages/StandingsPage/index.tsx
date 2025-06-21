import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import TeamLogo from '@/components/teams/TeamLogo';
import styles from './StandingsPage.module.css';

// Mock standings data - updated to match teams from TeamsPage
const mockStandings = [
  { 
    position: 1, 
    teamId: 'gryffindor',
    teamName: 'Gryffindor', 
    played: 12, 
    won: 10, 
    drawn: 1, 
    lost: 1, 
    points: 31, 
    goalsFor: 245,
    goalsAgainst: 156,
    league: 'Liga de Hogwarts'
  },
  { 
    position: 2, 
    teamId: 'ravenclaw',
    teamName: 'Ravenclaw', 
    played: 12, 
    won: 8, 
    drawn: 2, 
    lost: 2, 
    points: 26, 
    goalsFor: 198,
    goalsAgainst: 134,
    league: 'Liga de Hogwarts'
  },
  { 
    position: 3, 
    teamId: 'slytherin',
    teamName: 'Slytherin', 
    played: 12, 
    won: 7, 
    drawn: 2, 
    lost: 3, 
    points: 23, 
    goalsFor: 187,
    goalsAgainst: 145,
    league: 'Liga de Hogwarts'
  },
  { 
    position: 4, 
    teamId: 'hufflepuff',
    teamName: 'Hufflepuff', 
    played: 12, 
    won: 5, 
    drawn: 3, 
    lost: 4, 
    points: 18, 
    goalsFor: 156,
    goalsAgainst: 167,
    league: 'Liga de Hogwarts'
  },
  { 
    position: 5, 
    teamId: 'chudley_cannons',
    teamName: 'Chudley Cannons', 
    played: 12, 
    won: 3, 
    drawn: 2, 
    lost: 7, 
    points: 11, 
    goalsFor: 123,
    goalsAgainst: 198,
    league: 'Liga Británica e Irlandesa'
  },
  { 
    position: 6, 
    teamId: 'holyhead_harpies',
    teamName: 'Holyhead Harpies', 
    played: 12, 
    won: 2, 
    drawn: 1, 
    lost: 9, 
    points: 7, 
    goalsFor: 98,
    goalsAgainst: 207,
    league: 'Liga Británica e Irlandesa'
  },
];

const StandingsPage = () => {  const [filter, setFilter] = useState('all'); // 'all', 'hogwarts', 'british'

  const getPositionBadgeClass = (position: number) => {
    if (position === 1) return 'first';
    if (position === 2) return 'second';
    if (position === 3) return 'third';
    return 'default';
  };

  const filteredStandings = mockStandings.filter(team => {
    if (filter === 'all') return true;
    if (filter === 'hogwarts') return team.league === 'Liga de Hogwarts';
    if (filter === 'british') return team.league === 'Liga Británica e Irlandesa';
    return true;
  });
  return (
    <div className={styles.standingsPageContainer}>
      {/* Hero Header Section */}
      <section className={styles.pageHeader}>
        <Card className={styles.heroCard}>
          <h1 className={styles.pageTitle}>
            <span className={styles.titleIcon}>🏆</span>
            Clasificación de la Liga
          </h1>
          <p className={styles.pageDescription}>
            Consulta la tabla de posiciones actualizada con estadísticas detalladas de todos los equipos
          </p>
        </Card>
      </section>
      
      <section className={styles.standingsSection}>
        {/* Filters Section */}
        <Card className={styles.filtersCard}>
          <div className={styles.standingsFilters}>
            <Button 
              variant={filter === 'all' ? 'primary' : 'outline'} 
              onClick={() => setFilter('all')}
              className={styles.filterButton}
            >
              Todas las Ligas
            </Button>
            <Button 
              variant={filter === 'hogwarts' ? 'primary' : 'outline'} 
              onClick={() => setFilter('hogwarts')}
              className={styles.filterButton}
            >
              Liga de Hogwarts
            </Button>
            <Button 
              variant={filter === 'british' ? 'primary' : 'outline'} 
              onClick={() => setFilter('british')}
              className={styles.filterButton}
            >
              Liga Británica
            </Button>
          </div>
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
                      <th className={`${styles.tableHeaderCell} ${styles.center}`}>PJ</th>
                      <th className={`${styles.tableHeaderCell} ${styles.center}`}>PG</th>
                      <th className={`${styles.tableHeaderCell} ${styles.center}`}>PE</th>
                      <th className={`${styles.tableHeaderCell} ${styles.center}`}>PP</th>
                      <th className={`${styles.tableHeaderCell} ${styles.center}`}>GF</th>
                      <th className={`${styles.tableHeaderCell} ${styles.center}`}>GC</th>
                      <th className={`${styles.tableHeaderCell} ${styles.center}`}>Puntos</th>
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
                        <td className={`${styles.tableCell} ${styles.center}`}>{team.played}</td>
                        <td className={`${styles.tableCell} ${styles.center}`}>{team.won}</td>
                        <td className={`${styles.tableCell} ${styles.center}`}>{team.drawn}</td>
                        <td className={`${styles.tableCell} ${styles.center}`}>{team.lost}</td>
                        <td className={`${styles.tableCell} ${styles.center}`}>{team.goalsFor}</td>
                        <td className={`${styles.tableCell} ${styles.center}`}>{team.goalsAgainst}</td>
                        <td className={`${styles.tableCell} ${styles.center} ${styles.bold}`}>{team.points}</td>
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
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <h3>No hay equipos para mostrar</h3>
            <p>No se encontraron equipos que coincidan con el filtro seleccionado.</p>
            <Button 
              variant="outline" 
              onClick={() => setFilter('all')}
              style={{ marginTop: 'var(--spacing-4)' }}
            >
              Ver todos los equipos
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};

export default StandingsPage;