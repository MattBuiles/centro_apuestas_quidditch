import React, { useState, useEffect } from 'react';
import styles from './MatchDetailedAnalysis.module.css';
import teamAnalysisService, { TeamAnalysisData } from '../../../services/teamAnalysisService';

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

const MatchDetailedAnalysis: React.FC<MatchDetailedAnalysisProps> = ({ match, isLoading = false }) => {
  const [homeAnalysis, setHomeAnalysis] = useState<TeamAnalysisData | null>(null);
  const [awayAnalysis, setAwayAnalysis] = useState<TeamAnalysisData | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);

  // Cargar análisis de equipos cuando el componente se monta
  useEffect(() => {
    const loadTeamAnalysis = async () => {
      setAnalysisLoading(true);
      
      try {
        console.log('🔍 Loading team analysis for:', match.homeTeam, 'vs', match.awayTeam);
        
        // Cargar análisis de ambos equipos en paralelo
        const [homeData, awayData] = await Promise.all([
          teamAnalysisService.analyzeTeam(match.homeTeam, true), // Equipo local tiene ventaja
          teamAnalysisService.analyzeTeam(match.awayTeam, false)
        ]);

        // Calcular probabilidades de victoria
        const probabilities = teamAnalysisService.calculateWinProbabilities(homeData, awayData);
        homeData.winProbability = probabilities.homeWinProbability;
        awayData.winProbability = probabilities.awayWinProbability;

        setHomeAnalysis(homeData);
        setAwayAnalysis(awayData);
        
        console.log('✅ Team analysis loaded:', {
          home: { name: homeData.name, rating: homeData.formRating, probability: homeData.winProbability },
          away: { name: awayData.name, rating: awayData.formRating, probability: awayData.winProbability }
        });
        
      } catch (error) {
        console.error('❌ Error loading team analysis:', error);
        
        // Fallback a análisis mock en caso de error
        const mockHome = generateMockTeamAnalysis(match.homeTeam, true);
        const mockAway = generateMockTeamAnalysis(match.awayTeam, false);
        
        // Calcular probabilidades para mock data
        const totalRating = mockHome.formRating + mockAway.formRating;
        mockHome.winProbability = Math.round((mockHome.formRating / totalRating) * 100);
        mockAway.winProbability = Math.round((mockAway.formRating / totalRating) * 100);
        
        setHomeAnalysis(mockHome);
        setAwayAnalysis(mockAway);
      } finally {
        setAnalysisLoading(false);
      }
    };

    loadTeamAnalysis();
  }, [match.homeTeam, match.awayTeam]);

  // Función auxiliar para generar análisis mock (fallback)
  const generateMockTeamAnalysis = (teamName: string, isHome: boolean): TeamAnalysisData => {
    // Mapear IDs de equipos a nombres más amigables
    const teamNameMap: { [key: string]: string } = {
      'gryffindor': 'Gryffindor',
      'slytherin': 'Slytherin', 
      'ravenclaw': 'Ravenclaw',
      'hufflepuff': 'Hufflepuff',
      'chudley-cannons': 'Chudley Cannons',
      'holyhead-harpies': 'Holyhead Harpies'
    };

    const displayName = teamNameMap[teamName] || teamName;
    
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

    // Mock recent form
    const recentForm = Array.from({ length: 5 }, () => {
      const results = ['W', 'D', 'L'] as const;
      return {
        result: results[Math.floor(Math.random() * results.length)],
        confidence: Math.floor(Math.random() * 40) + 60
      };
    });

    // Mock statistics
    const mockStats = {
      id: teamName,
      name: displayName,
      matches_played: 10,
      wins: Math.floor(formRating / 10),
      losses: 10 - Math.floor(formRating / 10),
      draws: 0,
      points_for: formRating * 15,
      points_against: (100 - formRating) * 12,
      snitch_catches: Math.floor(formRating / 20),
      attack_strength: formRating + Math.floor(Math.random() * 20) - 10,
      defense_strength: formRating + Math.floor(Math.random() * 20) - 10,
      seeker_skill: formRating + Math.floor(Math.random() * 15) - 7,
      keeper_skill: formRating + Math.floor(Math.random() * 15) - 7,
      chaser_skill: formRating + Math.floor(Math.random() * 15) - 7,
      beater_skill: formRating + Math.floor(Math.random() * 15) - 7,
      win_percentage: formRating,
      point_difference: (formRating - 50) * 5
    };
    
    return {
      name: displayName,
      formRating,
      strengths,
      weaknesses,
      momentum,
      winProbability: 0,
      recentForm,
      statistics: mockStats
    };
  };

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

  // Mostrar loading si está cargando o no hay datos de análisis
  if (isLoading || analysisLoading || !homeAnalysis || !awayAnalysis) {
    return (
      <div className={styles.detailedAnalysisTab}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}>
            <div className={styles.magicalOrb}></div>
          </div>
          <p className={styles.loadingText}>
            {isLoading ? '🔮 Analizando las energías mágicas...' : '⚗️ Consultando los archivos del backend...'}
          </p>
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
          {[homeAnalysis, awayAnalysis].map((teamAnalysis, index) => {
            if (!teamAnalysis) return null;
            
            return (
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
                    {teamAnalysis.recentForm.slice(0, 5).map((form, i) => (
                      <div
                        key={i}
                        className={`${styles.formCrystal} ${styles[form.result === 'W' ? 'victory' : form.result === 'L' ? 'defeat' : 'draw']}`}
                      >
                        <span className={styles.resultLetter}>{form.result}</span>
                        <div className={styles.crystalGlow}></div>
                      </div>
                    ))}
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
                      teamAnalysis.strengths.map((strength: string, i: number) => (
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
                      teamAnalysis.weaknesses.map((weakness: string, i: number) => (
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
            );
          })}
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
                {homeAnalysis?.winProbability || 0}%
              </div>
              <div className={styles.predictionTeamName}>{homeAnalysis?.name || 'Equipo Local'}</div>
              <div className={styles.magicalAura}></div>
            </div>
            
            <div className={styles.versusSection}>
              <div className={styles.versusText}>VS</div>
              <div className={styles.mysticSymbol}>⚔️</div>
              <div className={styles.probabilityLabel}>Energía de Victoria</div>
            </div>
            
            <div className={styles.teamPrediction}>
              <div className={styles.predictionPercentage}>
                {awayAnalysis?.winProbability || 0}%
              </div>
              <div className={styles.predictionTeamName}>{awayAnalysis?.name || 'Equipo Visitante'}</div>
              <div className={styles.magicalAura}></div>
            </div>
          </div>

          <div className={styles.oracleInsight}>
            <div className={styles.insightIcon}>🌟</div>
            <p className={styles.insightText}>
              <span className={styles.insightLabel}>Visión del Oráculo:</span> 
              {homeAnalysis && awayAnalysis ? (
                homeAnalysis.formRating > awayAnalysis.formRating 
                  ? ` ${homeAnalysis.name} posee una aura más poderosa, pero ${awayAnalysis.name} podría invocar la magia de la sorpresa.`
                  : awayAnalysis.formRating > homeAnalysis.formRating
                  ? ` ${awayAnalysis.name} irradia mayor energía mágica, aunque ${homeAnalysis.name} cuenta con el poder del territorio sagrado.`
                  : ' Las fuerzas místicas están equilibradas, será un duelo de titanes mágicos.'
              ) : ' Las energías místicas están siendo analizadas...'}
            </p>
          </div>
        </div>

        {/* Factores místicos actualizados con datos del backend */}
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
                  <span>Apoyo de {homeAnalysis?.statistics.wins || 0} victorias en casa</span>
                </div>
                <div className={styles.factorItem}>
                  <span className={styles.factorBullet}>🌟</span>
                  <span>Fuerza de ataque: {homeAnalysis?.statistics.attack_strength || 75}/100</span>
                </div>
              </div>
            </div>
            
            <div className={styles.factorCard}>
              <h4 className={styles.factorTitle}>
                <span className={styles.statsIcon}>📜</span>
                Pergaminos de Estadísticas Reales
              </h4>
              <div className={styles.factorList}>
                <div className={styles.factorItem}>
                  <span className={styles.factorBullet}>⚡</span>
                  <span>Promedio de puntos: {Math.round((homeAnalysis?.statistics.points_for || 0) / Math.max(homeAnalysis?.statistics.matches_played || 1, 1))}-{Math.round((awayAnalysis?.statistics.points_for || 0) / Math.max(awayAnalysis?.statistics.matches_played || 1, 1))}</span>
                </div>
                <div className={styles.factorItem}>
                  <span className={styles.factorBullet}>🪄</span>
                  <span>Capturas de Snitch: {(homeAnalysis?.statistics.snitch_catches || 0)} vs {(awayAnalysis?.statistics.snitch_catches || 0)}</span>
                </div>
                <div className={styles.factorItem}>
                  <span className={styles.factorBullet}>⏳</span>
                  <span>Partidos jugados: {(homeAnalysis?.statistics.matches_played || 0)} vs {(awayAnalysis?.statistics.matches_played || 0)}</span>
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
