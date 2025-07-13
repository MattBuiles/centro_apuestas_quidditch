import React, { useState, useEffect } from 'react';
import TeamLogo from '@/components/teams/TeamLogo';
import { Team } from '@/types/league';
import { getTeamDetails, BackendTeamResponse } from '../../../services/teamsService';
import styles from './MatchStats.module.css';

interface MatchStatsProps {
  homeTeam: Team | null;
  awayTeam: Team | null;
}

const MatchStats: React.FC<MatchStatsProps> = ({ homeTeam, awayTeam }) => {
  const [homeTeamStats, setHomeTeamStats] = useState<BackendTeamResponse | null>(null);
  const [awayTeamStats, setAwayTeamStats] = useState<BackendTeamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTeamStats = async () => {
      if (!homeTeam || !awayTeam) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const [homeDetails, awayDetails] = await Promise.all([
          getTeamDetails(homeTeam.id),
          getTeamDetails(awayTeam.id)
        ]);
        
        // Usar fullStats si está disponible, de lo contrario crear objeto mínimo
        setHomeTeamStats(homeDetails?.fullStats || null);
        setAwayTeamStats(awayDetails?.fullStats || null);
      } catch (err) {
        setError('Error cargando estadísticas de los equipos');
        console.error('Error loading team stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTeamStats();
  }, [homeTeam, awayTeam]);
  return (
    <div className={styles.statsTab}>
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>⚡</span>
          Análisis Místico de Rendimiento
        </h2>
        <div className={styles.statsContainer}>
          {loading ? (
            <div className={styles.comingSoon}>
              <div className={styles.comingSoonIcon}>⚡</div>
              <h3>Cargando Análisis Mágico</h3>
              <p>Los pergaminos con las estadísticas detalladas están siendo preparados por nuestros escribas mágicos.</p>
            </div>
          ) : error ? (
            <div className={styles.comingSoon}>
              <div className={styles.comingSoonIcon}>❌</div>
              <h3>Error en el Análisis</h3>
              <p>{error}</p>
            </div>
          ) : homeTeamStats && awayTeamStats ? (
            <div className={styles.teamsComparison}>
              <div className={styles.comparisonGrid}>
                <div className={styles.teamStats}>
                  <div className={styles.teamStatsHeader}>
                    <TeamLogo teamName={homeTeamStats.name} size="md" />
                    <h3>{homeTeamStats.name}</h3>
                  </div>
                  <div className={styles.statsList}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Fuerza de Ataque</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${homeTeamStats.attack_strength}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{homeTeamStats.attack_strength}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Fuerza Defensiva</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${homeTeamStats.defense_strength}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{homeTeamStats.defense_strength}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Habilidad Buscador</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${homeTeamStats.seeker_skill}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{homeTeamStats.seeker_skill}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Habilidad Cazadores</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${homeTeamStats.chaser_skill}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{homeTeamStats.chaser_skill}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Habilidad Guardián</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${homeTeamStats.keeper_skill}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{homeTeamStats.keeper_skill}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Habilidad Golpeadores</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${homeTeamStats.beater_skill}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{homeTeamStats.beater_skill}</span>
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
                          <span>{Math.round((homeTeamStats.attack_strength + homeTeamStats.defense_strength + homeTeamStats.seeker_skill) / 3)}</span>
                        </div>
                        <div className={styles.awayPowerBar}>
                          <span>{Math.round((awayTeamStats.attack_strength + awayTeamStats.defense_strength + awayTeamStats.seeker_skill) / 3)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.teamStats}>
                  <div className={styles.teamStatsHeader}>
                    <TeamLogo teamName={awayTeamStats.name} size="md" />
                    <h3>{awayTeamStats.name}</h3>
                  </div>
                  <div className={styles.statsList}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Fuerza de Ataque</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${awayTeamStats.attack_strength}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{awayTeamStats.attack_strength}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Fuerza Defensiva</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${awayTeamStats.defense_strength}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{awayTeamStats.defense_strength}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Habilidad Buscador</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${awayTeamStats.seeker_skill}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{awayTeamStats.seeker_skill}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Habilidad Cazadores</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${awayTeamStats.chaser_skill}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{awayTeamStats.chaser_skill}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Habilidad Guardián</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${awayTeamStats.keeper_skill}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{awayTeamStats.keeper_skill}</span>
                      </div>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Habilidad Golpeadores</span>
                      <div className={styles.statBar}>
                        <div 
                          className={styles.statFill} 
                          style={{width: `${awayTeamStats.beater_skill}%`}}
                        ></div>
                        <span className={styles.statBarValue}>{awayTeamStats.beater_skill}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.comingSoon}>
              <div className={styles.comingSoonIcon}>⚡</div>
              <h3>Equipos no encontrados</h3>
              <p>No se pudieron cargar los datos de los equipos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchStats;
