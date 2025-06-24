import React from 'react';
import TeamLogo from '@/components/teams/TeamLogo';
import { Team } from '@/types/league';
import styles from './MatchHeadToHead.module.css';

interface MatchHeadToHeadProps {
  homeTeam: Team | null;
  awayTeam: Team | null;
}

const MatchHeadToHead: React.FC<MatchHeadToHeadProps> = ({ homeTeam, awayTeam }) => {
  return (
    <div className={styles.headToHeadTab}>
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🔥</span>
          Historial de Duelos Épicos
        </h2>
        <div className={styles.h2hContainer}>
          {homeTeam && awayTeam ? (
            <div className={styles.historyContent}>
              <div className={styles.historyHeader}>
                <div className={styles.historyTeams}>
                  <div className={styles.historyTeam}>
                    <TeamLogo teamName={homeTeam.name} size="lg" />
                    <span className={styles.historyTeamName}>{homeTeam.name}</span>
                  </div>
                  <div className={styles.historyVs}>
                    <span className={styles.historyVsText}>HISTORIAL</span>
                    <div className={styles.historyRecord}>
                      <div className={styles.recordStats}>
                        <div className={styles.recordStat}>
                          <span className={styles.recordNumber}>7</span>
                          <span className={styles.recordLabel}>Victorias</span>
                        </div>
                        <div className={styles.recordSeparator}>-</div>
                        <div className={styles.recordStat}>
                          <span className={styles.recordNumber}>2</span>
                          <span className={styles.recordLabel}>Empates</span>
                        </div>
                        <div className={styles.recordSeparator}>-</div>
                        <div className={styles.recordStat}>
                          <span className={styles.recordNumber}>5</span>
                          <span className={styles.recordLabel}>Victorias</span>
                        </div>
                      </div>
                      <div className={styles.totalMatches}>
                        14 encuentros disputados
                      </div>
                    </div>
                  </div>
                  <div className={styles.historyTeam}>
                    <TeamLogo teamName={awayTeam.name} size="lg" />
                    <span className={styles.historyTeamName}>{awayTeam.name}</span>
                  </div>
                </div>
              </div>

              <div className={styles.historyStats}>
                <div className={styles.historyStatCard}>
                  <h4>Últimos 5 Encuentros</h4>
                  <div className={styles.recentMatches}>
                    {[
                      { result: 'W', score: '180-120', date: '2025-05-15', venue: 'Hogwarts' },
                      { result: 'L', score: '90-150', date: '2025-03-22', venue: 'Slytherin Dungeons' },
                      { result: 'W', score: '200-170', date: '2025-01-18', venue: 'Hogwarts' },
                      { result: 'W', score: '160-130', date: '2024-11-25', venue: 'Neutral' },
                      { result: 'L', score: '110-140', date: '2024-10-07', venue: 'Slytherin Dungeons' }
                    ].map((match, index) => (
                      <div key={index} className={styles.recentMatch}>
                        <div className={`${styles.matchResultBadge} ${match.result === 'W' ? styles.win : styles.loss}`}>
                          {match.result}
                        </div>
                        <div className={styles.matchDetails}>
                          <span className={styles.matchScore}>{match.score}</span>
                          <span className={styles.matchDate}>{match.date}</span>
                          <span className={styles.matchVenue}>{match.venue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.historyStatCard}>
                  <h4>Estadísticas de Enfrentamientos</h4>
                  <div className={styles.comparisonStats}>
                    <div className={styles.comparisonStat}>
                      <span className={styles.statName}>Promedio de Puntos (Local)</span>
                      <div className={styles.statComparison}>
                        <div className={styles.statBar}>
                          <div className={styles.homeStatBar} style={{width: '65%'}}>145</div>
                          <div className={styles.awayStatBar} style={{width: '55%'}}>125</div>
                        </div>
                      </div>
                    </div>
                    <div className={styles.comparisonStat}>
                      <span className={styles.statName}>Capturas de Snitch</span>
                      <div className={styles.statComparison}>
                        <div className={styles.statBar}>
                          <div className={styles.homeStatBar} style={{width: '60%'}}>8</div>
                          <div className={styles.awayStatBar} style={{width: '40%'}}>6</div>
                        </div>
                      </div>
                    </div>
                    <div className={styles.comparisonStat}>
                      <span className={styles.statName}>Partidos de más de 200 pts</span>
                      <div className={styles.statComparison}>
                        <div className={styles.statBar}>
                          <div className={styles.homeStatBar} style={{width: '50%'}}>3</div>
                          <div className={styles.awayStatBar} style={{width: '33%'}}>2</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.legendaryMatches}>
                <h4>Encuentros Legendarios</h4>
                <div className={styles.legendaryMatchesList}>
                  <div className={styles.legendaryMatch}>
                    <div className={styles.legendaryMatchHeader}>
                      <span className={styles.legendaryIcon}>🏆</span>
                      <span className={styles.legendaryTitle}>La Final de los Milenios</span>
                      <span className={styles.legendaryDate}>2024-06-15</span>
                    </div>
                    <div className={styles.legendaryMatchDetails}>
                      <span className={styles.legendaryScore}>230 - 220</span>
                      <p className={styles.legendaryDescription}>
                        Un enfrentamiento épico que duró 4 horas. La Snitch fue capturada en el último minuto 
                        tras una persecución que recorrió todo el estadio.
                      </p>
                    </div>
                  </div>
                  <div className={styles.legendaryMatch}>
                    <div className={styles.legendaryMatchHeader}>
                      <span className={styles.legendaryIcon}>⚡</span>
                      <span className={styles.legendaryTitle}>El Duelo de los Rayos</span>
                      <span className={styles.legendaryDate}>2023-12-03</span>
                    </div>
                    <div className={styles.legendaryMatchDetails}>
                      <span className={styles.legendaryScore}>180 - 30</span>
                      <p className={styles.legendaryDescription}>
                        Una demostración de dominación absoluta con 15 goles consecutivos 
                        antes de que la Snitch fuera capturada.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.comingSoon}>
              <div className={styles.comingSoonIcon}>🔥</div>
              <h3>Cargando Historial</h3>
              <p>Los archivos de la historia están siendo consultados para revelar los encuentros legendarios.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchHeadToHead;
