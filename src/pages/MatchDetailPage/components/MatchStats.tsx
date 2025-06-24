import React from 'react';
import TeamLogo from '@/components/teams/TeamLogo';
import { Team } from '@/types/league';
import styles from '../MatchDetailPage.module.css';

interface MatchStatsProps {
  homeTeam: Team | null;
  awayTeam: Team | null;
}

const MatchStats: React.FC<MatchStatsProps> = ({ homeTeam, awayTeam }) => {
  return (
    <div className={styles.statsTab}>
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>⚡</span>
          Análisis Místico de Rendimiento
        </h2>
        <div className={styles.statsContainer}>
          {homeTeam && awayTeam ? (
            <div className={styles.teamsComparison}>
              <div className={styles.comparisonGrid}>
                <div className={styles.teamStats}>
                  <div className={styles.teamStatsHeader}>
                    <TeamLogo teamName={homeTeam.name} size="md" />
                    <h3>{homeTeam.name}</h3>
                  </div>
                  <div className={styles.statsList}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Fuerza de Ataque</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${homeTeam.attackStrength}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{homeTeam.attackStrength}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Fuerza Defensiva</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${homeTeam.defenseStrength}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{homeTeam.defenseStrength}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Habilidad Buscador</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${homeTeam.seekerSkill}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{homeTeam.seekerSkill}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Habilidad Cazadores</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${homeTeam.chaserSkill}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{homeTeam.chaserSkill}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Habilidad Guardián</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${homeTeam.keeperSkill}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{homeTeam.keeperSkill}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Habilidad Golpeadores</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${homeTeam.beaterSkill}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{homeTeam.beaterSkill}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.vsStatsCenter}>
                  <div className={styles.comparisonTitle}>
                    <span className={styles.magicalVs}>⚡ VS ⚡</span>
                  </div>
                  <div className={styles.overallComparison}>
                    <div className={styles.powerMeter}>
                      <div className={styles.powerLabel}>Poder Mágico Total</div>
                      <div className={styles.powerBars}>
                        <div className={styles.homePowerBar}>
                          <span>{Math.round((homeTeam.attackStrength + homeTeam.defenseStrength + homeTeam.seekerSkill) / 3)}</span>
                        </div>
                        <div className={styles.awayPowerBar}>
                          <span>{Math.round((awayTeam.attackStrength + awayTeam.defenseStrength + awayTeam.seekerSkill) / 3)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.teamStats}>
                  <div className={styles.teamStatsHeader}>
                    <TeamLogo teamName={awayTeam.name} size="md" />
                    <h3>{awayTeam.name}</h3>
                  </div>
                  <div className={styles.statsList}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Fuerza de Ataque</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${awayTeam.attackStrength}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{awayTeam.attackStrength}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Fuerza Defensiva</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${awayTeam.defenseStrength}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{awayTeam.defenseStrength}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Habilidad Buscador</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${awayTeam.seekerSkill}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{awayTeam.seekerSkill}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Habilidad Cazadores</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${awayTeam.chaserSkill}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{awayTeam.chaserSkill}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Habilidad Guardián</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${awayTeam.keeperSkill}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{awayTeam.keeperSkill}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Habilidad Golpeadores</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${awayTeam.beaterSkill}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{awayTeam.beaterSkill}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.comingSoon}>
              <div className={styles.comingSoonIcon}>⚡</div>
              <h3>Cargando Análisis Mágico</h3>
              <p>Los pergaminos con las estadísticas detalladas están siendo preparados por nuestros escribas mágicos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchStats;
