import React, { useState, useEffect } from 'react';
import TeamLogo from '@/components/teams/TeamLogo';
import { Team } from '@/types/league';
import { getTeamPlayers, Player } from '../../../services/teamsService';
import styles from './MatchLineups.module.css';

interface MatchLineupsProps {
  homeTeam: Team | null;
  awayTeam: Team | null;
}

const MatchLineups: React.FC<MatchLineupsProps> = ({ homeTeam, awayTeam }) => {
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlayers = async () => {
      if (!homeTeam || !awayTeam) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const [homePlayersData, awayPlayersData] = await Promise.all([
          getTeamPlayers(homeTeam.id),
          getTeamPlayers(awayTeam.id)
        ]);
        
        setHomePlayers(homePlayersData);
        setAwayPlayers(awayPlayersData);
      } catch (err) {
        setError('Error cargando jugadores');
        console.error('Error loading players:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, [homeTeam, awayTeam]);

  const getPositionDisplayName = (position: string) => {
    const positionMap: Record<string, string> = {
      'keeper': 'Guardián',
      'seeker': 'Buscador',
      'chaser': 'Cazador',
      'beater': 'Golpeador'
    };
    return positionMap[position] || position;
  };

  const getPlayersByPosition = (players: Player[], position: string) => {
    return players.filter(player => player.position === position);
  };

  const renderPositionGroup = (players: Player[], position: string, positionIcon: string, speciality: string) => {
    const positionPlayers = getPlayersByPosition(players, position);
    const displayName = getPositionDisplayName(position);
    
    return (
      <div className={styles.positionGroup} key={position}>
        <h4 className={styles.positionTitle}>
          <span className={styles.positionIcon}>{positionIcon}</span>
          {displayName}
        </h4>
        {positionPlayers.map(player => (
          <div key={player.id} className={styles.playerCard}>
            <div className={styles.playerHeader}>
              <div className={styles.playerName}>{player.name}</div>
              <div className={styles.playerNumber}>#{player.number}</div>
            </div>
            <div className={styles.playerStats}>
              <span className={styles.playerStat}>Habilidad: {player.skill_level}</span>
              <span className={styles.playerStat}>Años activo: {player.years_active}</span>
              <span className={styles.playerStat}>Especialidad: {speciality}</span>
            </div>
            {player.achievements && player.achievements.length > 0 && (
              <div className={styles.playerAchievements}>
                <span className={styles.achievementLabel}>🏆 {player.achievements[0]}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  return (
    <div className={styles.lineupsTab}>
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🏆</span>
          Formaciones Mágicas
        </h2>
        <div className={styles.lineupsContainer}>
          {loading ? (
            <div className={styles.comingSoon}>
              <div className={styles.comingSoonIcon}>🏆</div>
              <h3>Cargando Alineaciones</h3>
              <p>Los entrenadores están finalizando sus estrategias. Las formaciones estarán disponibles pronto.</p>
            </div>
          ) : error ? (
            <div className={styles.comingSoon}>
              <div className={styles.comingSoonIcon}>❌</div>
              <h3>Error al cargar Alineaciones</h3>
              <p>{error}</p>
            </div>
          ) : homeTeam && awayTeam && homePlayers.length > 0 && awayPlayers.length > 0 ? (
            <div className={styles.lineupsGrid}>
              <div className={styles.teamLineup}>
                <div className={styles.lineupHeader}>
                  <TeamLogo teamName={homeTeam.name} size="lg" />
                  <h3>{homeTeam.name}</h3>
                  <span className={styles.teamType}>Equipo Local</span>
                </div>
                <div className={styles.positionsList}>
                  {renderPositionGroup(homePlayers, 'keeper', '🥅', 'Paradas Mágicas')}
                  {renderPositionGroup(homePlayers, 'chaser', '⚡', 'Anotación')}
                  {renderPositionGroup(homePlayers, 'beater', '🏏', 'Defensa')}
                  {renderPositionGroup(homePlayers, 'seeker', '🟡', 'Captura de Snitch')}
                </div>
              </div>

              <div className={styles.lineupVs}>
                <div className={styles.fieldVisualization}>
                  <div className={styles.quidditchField}>
                    <div className={styles.fieldCenter}>
                      <span className={styles.fieldIcon}>🏟️</span>
                      <span className={styles.fieldLabel}>Campo de Quidditch</span>
                    </div>
                    <div className={styles.fieldGoals}>
                      <div className={styles.goalLeft}>🥅</div>
                      <div className={styles.goalRight}>🥅</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.teamLineup}>
                <div className={styles.lineupHeader}>
                  <TeamLogo teamName={awayTeam.name} size="lg" />
                  <h3>{awayTeam.name}</h3>
                  <span className={styles.teamType}>Equipo Visitante</span>
                </div>
                <div className={styles.positionsList}>
                  {renderPositionGroup(awayPlayers, 'keeper', '🥅', 'Paradas Mágicas')}
                  {renderPositionGroup(awayPlayers, 'chaser', '⚡', 'Anotación')}
                  {renderPositionGroup(awayPlayers, 'beater', '🏏', 'Defensa')}
                  {renderPositionGroup(awayPlayers, 'seeker', '🟡', 'Captura de Snitch')}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.comingSoon}>
              <div className={styles.comingSoonIcon}>🏆</div>
              <h3>Equipos no encontrados</h3>
              <p>No se pudieron cargar los datos de los equipos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchLineups;
