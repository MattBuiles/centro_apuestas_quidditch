import React from 'react';
import TeamLogo from '@/components/teams/TeamLogo';
import { Team } from '@/types/league';
import styles from './MatchLineups.module.css';

interface MatchLineupsProps {
  homeTeam: Team | null;
  awayTeam: Team | null;
  getTeamRosterData: (teamName: string) => { roster: { id: string; name: string; position: string; number: number; yearsActive: number; achievements: string[] }[] };
}

const MatchLineups: React.FC<MatchLineupsProps> = ({ homeTeam, awayTeam, getTeamRosterData }) => {
  return (
    <div className={styles.lineupsTab}>
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🏆</span>
          Formaciones Mágicas
        </h2>
        <div className={styles.lineupsContainer}>
          {homeTeam && awayTeam ? (
            <div className={styles.lineupsGrid}>
              <div className={styles.teamLineup}>
                <div className={styles.lineupHeader}>
                  <TeamLogo teamName={homeTeam.name} size="lg" />
                  <h3>{homeTeam.name}</h3>
                  <span className={styles.teamType}>Equipo Local</span>
                </div>
                <div className={styles.positionsList}>
                  {(() => {
                    const rosterData = getTeamRosterData(homeTeam.name);
                    const roster = rosterData.roster;
                    
                    return (
                      <>
                        {/* Guardián */}
                        <div className={styles.positionGroup}>
                          <h4 className={styles.positionTitle}>
                            <span className={styles.positionIcon}>🥅</span>
                            Guardián
                          </h4>
                          {roster.filter(player => player.position === 'Guardián').map(player => (
                            <div key={player.id} className={styles.playerCard}>
                              <div className={styles.playerHeader}>
                                <div className={styles.playerName}>{player.name}</div>
                                <div className={styles.playerNumber}>#{player.number}</div>
                              </div>
                              <div className={styles.playerStats}>
                                <span className={styles.playerStat}>Habilidad: {homeTeam.keeperSkill}</span>
                                <span className={styles.playerStat}>Años activo: {player.yearsActive}</span>
                                <span className={styles.playerStat}>Especialidad: Paradas Mágicas</span>
                              </div>
                              {player.achievements.length > 0 && (
                                <div className={styles.playerAchievements}>
                                  <span className={styles.achievementLabel}>🏆 {player.achievements[0]}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Cazadores */}
                        <div className={styles.positionGroup}>
                          <h4 className={styles.positionTitle}>
                            <span className={styles.positionIcon}>⚡</span>
                            Cazadores
                          </h4>
                          {roster.filter(player => player.position === 'Cazador' || player.position === 'Cazadora').map(player => (
                            <div key={player.id} className={styles.playerCard}>
                              <div className={styles.playerHeader}>
                                <div className={styles.playerName}>{player.name}</div>
                                <div className={styles.playerNumber}>#{player.number}</div>
                              </div>
                              <div className={styles.playerStats}>
                                <span className={styles.playerStat}>Habilidad: {homeTeam.chaserSkill}</span>
                                <span className={styles.playerStat}>Años activo: {player.yearsActive}</span>
                                <span className={styles.playerStat}>Especialidad: Anotación</span>
                              </div>
                              {player.achievements.length > 0 && (
                                <div className={styles.playerAchievements}>
                                  <span className={styles.achievementLabel}>🏆 {player.achievements[0]}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Golpeadores */}
                        <div className={styles.positionGroup}>
                          <h4 className={styles.positionTitle}>
                            <span className={styles.positionIcon}>🏏</span>
                            Golpeadores
                          </h4>
                          {roster.filter(player => player.position === 'Golpeador').map(player => (
                            <div key={player.id} className={styles.playerCard}>
                              <div className={styles.playerHeader}>
                                <div className={styles.playerName}>{player.name}</div>
                                <div className={styles.playerNumber}>#{player.number}</div>
                              </div>
                              <div className={styles.playerStats}>
                                <span className={styles.playerStat}>Habilidad: {homeTeam.beaterSkill}</span>
                                <span className={styles.playerStat}>Años activo: {player.yearsActive}</span>
                                <span className={styles.playerStat}>Especialidad: Defensa</span>
                              </div>
                              {player.achievements.length > 0 && (
                                <div className={styles.playerAchievements}>
                                  <span className={styles.achievementLabel}>🏆 {player.achievements[0]}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Buscador */}
                        <div className={styles.positionGroup}>
                          <h4 className={styles.positionTitle}>
                            <span className={styles.positionIcon}>🟡</span>
                            Buscador
                          </h4>
                          {roster.filter(player => player.position === 'Buscador' || player.position === 'Buscadora').map(player => (
                            <div key={player.id} className={styles.playerCard}>
                              <div className={styles.playerHeader}>
                                <div className={styles.playerName}>{player.name}</div>
                                <div className={styles.playerNumber}>#{player.number}</div>
                              </div>
                              <div className={styles.playerStats}>
                                <span className={styles.playerStat}>Habilidad: {homeTeam.seekerSkill}</span>
                                <span className={styles.playerStat}>Años activo: {player.yearsActive}</span>
                                <span className={styles.playerStat}>Especialidad: Captura de Snitch</span>
                              </div>
                              {player.achievements.length > 0 && (
                                <div className={styles.playerAchievements}>
                                  <span className={styles.achievementLabel}>🏆 {player.achievements[0]}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
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
                  {(() => {
                    const rosterData = getTeamRosterData(awayTeam.name);
                    const roster = rosterData.roster;
                    
                    return (
                      <>
                        {/* Guardián */}
                        <div className={styles.positionGroup}>
                          <h4 className={styles.positionTitle}>
                            <span className={styles.positionIcon}>🥅</span>
                            Guardián
                          </h4>
                          {roster.filter(player => player.position === 'Guardián').map(player => (
                            <div key={player.id} className={styles.playerCard}>
                              <div className={styles.playerHeader}>
                                <div className={styles.playerName}>{player.name}</div>
                                <div className={styles.playerNumber}>#{player.number}</div>
                              </div>
                              <div className={styles.playerStats}>
                                <span className={styles.playerStat}>Habilidad: {awayTeam.keeperSkill}</span>
                                <span className={styles.playerStat}>Años activo: {player.yearsActive}</span>
                                <span className={styles.playerStat}>Especialidad: Paradas Mágicas</span>
                              </div>
                              {player.achievements.length > 0 && (
                                <div className={styles.playerAchievements}>
                                  <span className={styles.achievementLabel}>🏆 {player.achievements[0]}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Cazadores */}
                        <div className={styles.positionGroup}>
                          <h4 className={styles.positionTitle}>
                            <span className={styles.positionIcon}>⚡</span>
                            Cazadores
                          </h4>
                          {roster.filter(player => player.position === 'Cazador' || player.position === 'Cazadora').map(player => (
                            <div key={player.id} className={styles.playerCard}>
                              <div className={styles.playerHeader}>
                                <div className={styles.playerName}>{player.name}</div>
                                <div className={styles.playerNumber}>#{player.number}</div>
                              </div>
                              <div className={styles.playerStats}>
                                <span className={styles.playerStat}>Habilidad: {awayTeam.chaserSkill}</span>
                                <span className={styles.playerStat}>Años activo: {player.yearsActive}</span>
                                <span className={styles.playerStat}>Especialidad: Anotación</span>
                              </div>
                              {player.achievements.length > 0 && (
                                <div className={styles.playerAchievements}>
                                  <span className={styles.achievementLabel}>🏆 {player.achievements[0]}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Golpeadores */}
                        <div className={styles.positionGroup}>
                          <h4 className={styles.positionTitle}>
                            <span className={styles.positionIcon}>🏏</span>
                            Golpeadores
                          </h4>
                          {roster.filter(player => player.position === 'Golpeador').map(player => (
                            <div key={player.id} className={styles.playerCard}>
                              <div className={styles.playerHeader}>
                                <div className={styles.playerName}>{player.name}</div>
                                <div className={styles.playerNumber}>#{player.number}</div>
                              </div>
                              <div className={styles.playerStats}>
                                <span className={styles.playerStat}>Habilidad: {awayTeam.beaterSkill}</span>
                                <span className={styles.playerStat}>Años activo: {player.yearsActive}</span>
                                <span className={styles.playerStat}>Especialidad: Defensa</span>
                              </div>
                              {player.achievements.length > 0 && (
                                <div className={styles.playerAchievements}>
                                  <span className={styles.achievementLabel}>🏆 {player.achievements[0]}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Buscador */}
                        <div className={styles.positionGroup}>
                          <h4 className={styles.positionTitle}>
                            <span className={styles.positionIcon}>🟡</span>
                            Buscador
                          </h4>
                          {roster.filter(player => player.position === 'Buscador' || player.position === 'Buscadora').map(player => (
                            <div key={player.id} className={styles.playerCard}>
                              <div className={styles.playerHeader}>
                                <div className={styles.playerName}>{player.name}</div>
                                <div className={styles.playerNumber}>#{player.number}</div>
                              </div>
                              <div className={styles.playerStats}>
                                <span className={styles.playerStat}>Habilidad: {awayTeam.seekerSkill}</span>
                                <span className={styles.playerStat}>Años activo: {player.yearsActive}</span>
                                <span className={styles.playerStat}>Especialidad: Captura de Snitch</span>
                              </div>
                              {player.achievements.length > 0 && (
                                <div className={styles.playerAchievements}>
                                  <span className={styles.achievementLabel}>🏆 {player.achievements[0]}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.comingSoon}>
              <div className={styles.comingSoonIcon}>🏆</div>
              <h3>Cargando Alineaciones</h3>
              <p>Los entrenadores están finalizando sus estrategias. Las formaciones estarán disponibles pronto.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchLineups;
