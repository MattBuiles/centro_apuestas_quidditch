import React from 'react';
import styles from './MatchDetailedAnalysis.module.css';

interface MatchDetailedAnalysisProps {
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore?: number;
    awayScore?: number;
    status: 'live' | 'upcoming' | 'finished' | 'scheduled' | 'postponed' | 'cancelled';
    date: Date | string;
    location?: string;
  };
  isLoading?: boolean;
}

interface TeamAnalysis {
  name: string;
  formRating: number;
  strengths: string[];
  weaknesses: string[];
  momentum: 'up' | 'down' | 'stable';
  winProbability: number;
}

const MatchDetailedAnalysis: React.FC<MatchDetailedAnalysisProps> = ({ match, isLoading = false }) => {
  
  const generateTeamAnalysis = (teamName: string, isHome: boolean): TeamAnalysis => {
    // Simulación básica basada en el nombre del equipo
    const baseRating = 40 + Math.floor(Math.random() * 40);
    const homeAdvantage = isHome ? 5 : 0;
    const formRating = Math.min(90, baseRating + homeAdvantage);
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    if (formRating > 70) {
      strengths.push('Ofensiva potente', 'Buena defensa');
    } else if (formRating > 50) {
      strengths.push('Equilibrio táctico');
    }
    
    if (formRating < 50) {
      weaknesses.push('Inconsistencia', 'Problemas defensivos');
    } else if (formRating < 70) {
      weaknesses.push('Falta de profundidad en plantilla');
    }
    
    const momentum: 'up' | 'down' | 'stable' = 
      formRating > 65 ? 'up' : formRating < 45 ? 'down' : 'stable';
    
    return {
      name: teamName,
      formRating,
      strengths,
      weaknesses,
      momentum,
      winProbability: 0 // Se calculará después
    };
  };

  const homeAnalysis = generateTeamAnalysis(match.homeTeam, true);
  const awayAnalysis = generateTeamAnalysis(match.awayTeam, false);
  
  // Calcular probabilidades de victoria
  const totalRating = homeAnalysis.formRating + awayAnalysis.formRating;
  homeAnalysis.winProbability = Math.round((homeAnalysis.formRating / totalRating) * 100);
  awayAnalysis.winProbability = Math.round((awayAnalysis.formRating / totalRating) * 100);

  const getMomentumIcon = (momentum: 'up' | 'down' | 'stable') => {
    switch (momentum) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getFormColorClass = (rating: number) => {
    if (rating >= 70) return styles.highRating;
    if (rating >= 50) return styles.mediumRating;
    return styles.lowRating;
  };

  if (isLoading) {
    return (
      <div className={styles.detailedAnalysisTab}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}>
            <div className={styles.magicalOrb}></div>
          </div>
          <p className={styles.loadingText}>🔮 Analizando las energías mágicas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.detailedAnalysisTab}>
      <div className={styles.detailedAnalysisContainer}>
        
        {/* Header mágico */}
        <div className={styles.analysisHeader}>
          <h2 className={styles.analysisTitle}>✨ Análisis Mágico del Enfrentamiento ✨</h2>
          <div className={styles.magicalDivider}>
            <span className={styles.starIcon}>⭐</span>
            <span className={styles.wandIcon}>🪄</span>
            <span className={styles.starIcon}>⭐</span>
          </div>
        </div>

        {/* Análisis de equipos */}
        <div className={styles.teamsAnalysisGrid}>
          {[homeAnalysis, awayAnalysis].map((teamAnalysis, index) => (
            <div
              key={index}
              className={`${styles.teamAnalysisCard} ${index === 0 ? styles.homeTeam : styles.awayTeam}`}
            >
              <div className={styles.teamHeader}>
                <h3 className={styles.teamName}>{teamAnalysis.name}</h3>
                <div className={styles.teamMomentum}>
                  <span className={styles.momentumIcon}>{getMomentumIcon(teamAnalysis.momentum)}</span>
                  <span className={`${styles.formRating} ${getFormColorClass(teamAnalysis.formRating)}`}>
                    {teamAnalysis.formRating}%
                  </span>
                </div>
              </div>

              {/* Cristal de forma reciente */}
              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}>
                  <span className={styles.formIcon}>🔮</span>
                  Cristal de Forma
                </h4>
                <div className={styles.formCrystals}>
                  {Array.from({ length: 5 }, (_, i) => {
                    const results = ['V', 'D', 'E', 'V', 'D'];
                    const resultTypes = ['victory', 'defeat', 'draw', 'victory', 'defeat'];
                    return (
                      <div
                        key={i}
                        className={`${styles.formCrystal} ${styles[resultTypes[i]]}`}
                      >
                        <span className={styles.resultLetter}>{results[i]}</span>
                        <div className={styles.crystalGlow}></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Poderes mágicos (Fortalezas) */}
              <div className={styles.strengthsSection}>
                <h4 className={styles.sectionTitle}>
                  <span className={styles.strengthIcon}>⚡</span>
                  Poderes Mágicos
                </h4>
                <div className={styles.magicalList}>
                  {teamAnalysis.strengths.length > 0 ? (
                    teamAnalysis.strengths.map((strength, i) => (
                      <div key={i} className={styles.strengthItem}>
                        <span className={styles.magicalBullet}>✨</span>
                        <span className={styles.strengthText}>{strength}</span>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noStrengths}>
                      <span className={styles.neutralIcon}>🌟</span>
                      <span>Poderes en desarrollo...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hechizos a mejorar (Debilidades) */}
              <div className={styles.weaknessesSection}>
                <h4 className={styles.sectionTitle}>
                  <span className={styles.weaknessIcon}>🔮</span>
                  Hechizos a Perfeccionar
                </h4>
                <div className={styles.magicalList}>
                  {teamAnalysis.weaknesses.length > 0 ? (
                    teamAnalysis.weaknesses.map((weakness, i) => (
                      <div key={i} className={styles.weaknessItem}>
                        <span className={styles.magicalBullet}>🌙</span>
                        <span className={styles.weaknessText}>{weakness}</span>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noWeaknesses}>
                      <span className={styles.perfectIcon}>💫</span>
                      <span>Magia perfecta detectada</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Predicción del oráculo */}
        <div className={styles.oraclePrediction}>
          <h3 className={styles.oracleTitle}>
            <span className={styles.oracleIcon}>🔮</span>
            Predicción del Oráculo
            <span className={styles.oracleIcon}>🔮</span>
          </h3>
          
          <div className={styles.predictionGrid}>
            <div className={styles.teamPrediction}>
              <div className={styles.predictionPercentage}>
                {homeAnalysis.winProbability}%
              </div>
              <div className={styles.predictionTeamName}>{homeAnalysis.name}</div>
              <div className={styles.magicalAura}></div>
            </div>
            
            <div className={styles.versusSection}>
              <div className={styles.versusText}>VS</div>
              <div className={styles.mysticSymbol}>⚔️</div>
              <div className={styles.probabilityLabel}>Energía de Victoria</div>
            </div>
            
            <div className={styles.teamPrediction}>
              <div className={styles.predictionPercentage}>
                {awayAnalysis.winProbability}%
              </div>
              <div className={styles.predictionTeamName}>{awayAnalysis.name}</div>
              <div className={styles.magicalAura}></div>
            </div>
          </div>

          <div className={styles.oracleInsight}>
            <div className={styles.insightIcon}>🌟</div>
            <p className={styles.insightText}>
              <span className={styles.insightLabel}>Visión del Oráculo:</span> 
              {homeAnalysis.formRating > awayAnalysis.formRating 
                ? ` ${homeAnalysis.name} posee una aura más poderosa, pero ${awayAnalysis.name} podría invocar la magia de la sorpresa.`
                : awayAnalysis.formRating > homeAnalysis.formRating
                ? ` ${awayAnalysis.name} irradia mayor energía mágica, aunque ${homeAnalysis.name} cuenta con el poder del territorio sagrado.`
                : ' Las fuerzas místicas están equilibradas, será un duelo de titanes mágicos.'
              }
            </p>
          </div>
        </div>

        {/* Factores místicos */}
        <div className={styles.mysticFactors}>
          <h3 className={styles.factorsTitle}>
            <span className={styles.factorsIcon}>🌟</span>
            Factores Místicos del Enfrentamiento
          </h3>
          
          <div className={styles.factorsGrid}>
            <div className={styles.factorCard}>
              <h4 className={styles.factorTitle}>
                <span className={styles.homeIcon}>🏰</span>
                Ventajas del Territorio Sagrado
              </h4>
              <div className={styles.factorList}>
                <div className={styles.factorItem}>
                  <span className={styles.factorBullet}>🔮</span>
                  <span>Energía mágica del hogar</span>
                </div>
                <div className={styles.factorItem}>
                  <span className={styles.factorBullet}>⚡</span>
                  <span>Conocimiento de las corrientes místicas</span>
                </div>
                <div className={styles.factorItem}>
                  <span className={styles.factorBullet}>🌟</span>
                  <span>Apoyo de los guardianes locales</span>
                </div>
              </div>
            </div>
            
            <div className={styles.factorCard}>
              <h4 className={styles.factorTitle}>
                <span className={styles.statsIcon}>📜</span>
                Pergaminos de Estadísticas Antiguas
              </h4>
              <div className={styles.factorList}>
                <div className={styles.factorItem}>
                  <span className={styles.factorBullet}>⚡</span>
                  <span>Puntos de poder: 150-200 por ritual</span>
                </div>
                <div className={styles.factorItem}>
                  <span className={styles.factorBullet}>🪄</span>
                  <span>Capturas de Snitch dorada: 1-2</span>
                </div>
                <div className={styles.factorItem}>
                  <span className={styles.factorBullet}>⏳</span>
                  <span>Duración del hechizo: 90-120 minutos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchDetailedAnalysis;
