import React, { useState, useEffect } from 'react';
import TeamLogo from '@/components/teams/TeamLogo';
import { Team } from '@/types/league';
import { getHeadToHeadData, HeadToHeadData } from '../../../services/teamsService';
import styles from './MatchHeadToHead.module.css';

interface MatchHeadToHeadProps {
  homeTeam: Team | null;
  awayTeam: Team | null;
}

const MatchHeadToHead: React.FC<MatchHeadToHeadProps> = ({ homeTeam, awayTeam }) => {
  const [headToHeadData, setHeadToHeadData] = useState<HeadToHeadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHeadToHeadData = async () => {
      if (!homeTeam || !awayTeam) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const data = await getHeadToHeadData(homeTeam.id, awayTeam.id);
        setHeadToHeadData(data);
      } catch (err) {
        setError('Error cargando historial de enfrentamientos');
        console.error('Error loading head-to-head data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHeadToHeadData();
  }, [homeTeam, awayTeam]);
  return (
    <div className={styles.headToHeadTab}>
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🔥</span>
          Historial de Duelos Épicos
        </h2>
        <div className={styles.h2hContainer}>
          {loading ? (
            <div className={styles.comingSoon}>
              <div className={styles.comingSoonIcon}>🔥</div>
              <h3>Cargando Historial</h3>
              <p>Los archivos de la historia están siendo consultados para revelar los encuentros legendarios.</p>
            </div>
          ) : error ? (
            <div className={styles.comingSoon}>
              <div className={styles.comingSoonIcon}>❌</div>
              <h3>Error al cargar Historial</h3>
              <p>{error}</p>
            </div>
          ) : homeTeam && awayTeam && headToHeadData ? (
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
                          <span className={styles.recordNumber}>{headToHeadData.teamWins}</span>
                          <span className={styles.recordLabel}>Victorias</span>
                        </div>
                        <div className={styles.recordSeparator}>-</div>
                        <div className={styles.recordStat}>
                          <span className={styles.recordNumber}>{headToHeadData.draws}</span>
                          <span className={styles.recordLabel}>Empates</span>
                        </div>
                        <div className={styles.recordSeparator}>-</div>
                        <div className={styles.recordStat}>
                          <span className={styles.recordNumber}>{headToHeadData.opponentWins}</span>
                          <span className={styles.recordLabel}>Victorias</span>
                        </div>
                      </div>
                      <div className={styles.totalMatches}>
                        {headToHeadData.totalMatches} encuentros disputados
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
                    {headToHeadData.recentMatches.map((match, index) => (
                      <div key={index} className={styles.recentMatch}>
                        <div className={`${styles.matchResultBadge} ${match.result === 'W' ? styles.win : match.result === 'L' ? styles.loss : styles.draw}`}>
                          {match.result}
                        </div>
                        <div className={styles.matchDetails}>
                          <span className={styles.matchScore}>{match.teamScore}-{match.opponentScore}</span>
                          <span className={styles.matchDate}>{new Date(match.date).toLocaleDateString('es-ES')}</span>
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
                      <span className={styles.statName}>Promedio de Puntos</span>
                      <div className={styles.statComparison}>
                        <div className={styles.statBar}>
                          <div className={styles.homeStatBar} style={{width: `${Math.min(headToHeadData.statistics.teamAvgPoints / 2, 100)}%`}}>
                            {headToHeadData.statistics.teamAvgPoints}
                          </div>
                          <div className={styles.awayStatBar} style={{width: `${Math.min(headToHeadData.statistics.opponentAvgPoints / 2, 100)}%`}}>
                            {headToHeadData.statistics.opponentAvgPoints}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={styles.comparisonStat}>
                      <span className={styles.statName}>Capturas de Snitch</span>
                      <div className={styles.statComparison}>
                        <div className={styles.statBar}>
                          <div className={styles.homeStatBar} style={{width: `${(headToHeadData.statistics.teamSnitchCatches / (headToHeadData.statistics.teamSnitchCatches + headToHeadData.statistics.opponentSnitchCatches)) * 100}%`}}>
                            {headToHeadData.statistics.teamSnitchCatches}
                          </div>
                          <div className={styles.awayStatBar} style={{width: `${(headToHeadData.statistics.opponentSnitchCatches / (headToHeadData.statistics.teamSnitchCatches + headToHeadData.statistics.opponentSnitchCatches)) * 100}%`}}>
                            {headToHeadData.statistics.opponentSnitchCatches}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={styles.comparisonStat}>
                      <span className={styles.statName}>Partidos de más de 200 pts</span>
                      <div className={styles.statComparison}>
                        <div className={styles.statBar}>
                          <div className={styles.homeStatBar} style={{width: `${headToHeadData.statistics.teamHighScoring > 0 ? (headToHeadData.statistics.teamHighScoring / (headToHeadData.statistics.teamHighScoring + headToHeadData.statistics.opponentHighScoring)) * 100 : 50}%`}}>
                            {headToHeadData.statistics.teamHighScoring}
                          </div>
                          <div className={styles.awayStatBar} style={{width: `${headToHeadData.statistics.opponentHighScoring > 0 ? (headToHeadData.statistics.opponentHighScoring / (headToHeadData.statistics.teamHighScoring + headToHeadData.statistics.opponentHighScoring)) * 100 : 50}%`}}>
                            {headToHeadData.statistics.opponentHighScoring}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.legendaryMatches}>
                <h4>Encuentros Legendarios</h4>
                <div className={styles.legendaryMatchesList}>
                  {headToHeadData.legendaryMatches.map((match, index) => (
                    <div key={index} className={styles.legendaryMatch}>
                      <div className={styles.legendaryMatchHeader}>
                        <span className={styles.legendaryIcon}>🏆</span>
                        <span className={styles.legendaryTitle}>{match.title}</span>
                        <span className={styles.legendaryDate}>{new Date(match.date).toLocaleDateString('es-ES')}</span>
                      </div>
                      <div className={styles.legendaryMatchDetails}>
                        <span className={styles.legendaryScore}>{match.teamScore} - {match.opponentScore}</span>
                        <p className={styles.legendaryDescription}>
                          {match.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.comingSoon}>
              <div className={styles.comingSoonIcon}>🔥</div>
              <h3>Equipos no encontrados</h3>
              <p>No se pudieron cargar los datos de los equipos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchHeadToHead;
