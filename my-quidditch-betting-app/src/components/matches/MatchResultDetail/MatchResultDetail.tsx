/**
 * Match Result Detail Component
 * Displays comprehensive match result information including chronology
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DetailedMatchResult, matchResultsService } from '@/services/matchResultsService';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import TeamLogo from '@/components/teams/TeamLogo';
import styles from './MatchResultDetail.module.css';

interface MatchResultDetailProps {
  matchId?: string;
}

const MatchResultDetail: React.FC<MatchResultDetailProps> = ({ matchId: propMatchId }) => {
  const { matchId: paramMatchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<DetailedMatchResult | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'chronology' | 'statistics'>('summary');
  const [isLoading, setIsLoading] = useState(true);
  // Use prop matchId if provided, otherwise use param
  const effectiveMatchId = propMatchId || paramMatchId;

  useEffect(() => {
    if (effectiveMatchId) {
      loadMatchResult(effectiveMatchId);
    }
  }, [effectiveMatchId]);

  const loadMatchResult = async (id: string) => {
    try {
      setIsLoading(true);
      const matchResult = matchResultsService.getMatchResult(id);
      
      if (matchResult) {
        setResult(matchResult);
      } else {
        console.warn(`No detailed result found for match ${id}`);
      }
    } catch (error) {
      console.error('Error loading match result:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getEventIcon = (eventType: string): string => {
    switch (eventType) {
      case 'QUAFFLE_GOAL':
        return '⚽';
      case 'SNITCH_CAUGHT':
        return '✨';
      case 'BLUDGER_HIT':
        return '💥';
      case 'FOUL_BLAGGING':
      case 'FOUL_COBBING':
      case 'FOUL_BLATCHING':
        return '⚠️';
      case 'QUAFFLE_SAVE':
        return '🛡️';
      case 'SNITCH_SPOTTED':
        return '👁️';
      default:
        return '📝';
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p>Loading match details...</p>
        </div>
      </div>
    );
  }
  if (!result) {
    return (
      <div className={styles.errorContainer}>
        <Card className={styles.errorCard}>
          <h2>Match Result Not Found</h2>
          <p>The detailed result for this match could not be found.</p>
          {!propMatchId && (
            <Button onClick={() => navigate('/results')} variant="primary">
              Back to Results
            </Button>
          )}
        </Card>
      </div>
    );
  }
  return (
    <div className={styles.resultDetailContainer}>
      {/* Header */}
      <div className={styles.header}>
        {!propMatchId && (
          <Button 
            onClick={() => navigate('/results')} 
            variant="outline" 
            className={styles.backButton}
          >
            ← Back to Results
          </Button>
        )}
        
        <div className={styles.matchTitle}>
          <h1>Match Details</h1>
          <p className={styles.matchDate}>
            {new Date(result.completedAt).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Main Match Card */}
      <Card className={styles.mainMatchCard}>
        <div className={styles.matchHeader}>
          <div className={styles.teamSection}>
            <div className={styles.team}>
              <TeamLogo teamName={result.homeTeam.name} size="xl" />
              <h2 className={styles.teamName}>{result.homeTeam.name}</h2>
            </div>
            
            <div className={styles.scoreSection}>
              <div className={styles.finalScore}>
                <span className={styles.homeScore}>{result.finalScore.home}</span>
                <span className={styles.scoreSeparator}>-</span>
                <span className={styles.awayScore}>{result.finalScore.away}</span>
              </div>
              <div className={styles.matchInfo}>
                <span className={styles.duration}>
                  Duration: {formatDuration(result.matchDuration)}
                </span>
                {result.snitchCaught && (
                  <span className={styles.snitchInfo}>
                    ✨ Snitch caught at minute {result.snitchCaughtAtMinute}
                  </span>
                )}
              </div>
            </div>
            
            <div className={styles.team}>
              <TeamLogo teamName={result.awayTeam.name} size="xl" />
              <h2 className={styles.teamName}>{result.awayTeam.name}</h2>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsHeader}>
          <button
            className={`${styles.tab} ${activeTab === 'summary' ? styles.active : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'chronology' ? styles.active : ''}`}
            onClick={() => setActiveTab('chronology')}
          >
            Chronology
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'statistics' ? styles.active : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            Statistics
          </button>
        </div>

        <div className={styles.tabContent}>
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <Card className={styles.summaryCard}>
              <h3>Match Summary</h3>
              
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <h4>Key Moments</h4>
                  <div className={styles.keyMoments}>
                    {result.chronology.keyMoments.slice(0, 5).map((moment, index) => (
                      <div key={index} className={styles.keyMoment}>
                        <span className={styles.minute}>Min {moment.minute}</span>
                        <span className={styles.description}>{moment.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className={styles.summaryItem}>
                  <h4>Quick Stats</h4>
                  <div className={styles.quickStats}>
                    <div className={styles.stat}>
                      <span>Total Events:</span>
                      <span>{result.statistics.totalEvents}</span>
                    </div>
                    <div className={styles.stat}>
                      <span>Quaffle Goals:</span>
                      <span>{result.statistics.quaffleGoals.home + result.statistics.quaffleGoals.away}</span>
                    </div>
                    <div className={styles.stat}>
                      <span>Fouls:</span>
                      <span>{result.statistics.fouls.home + result.statistics.fouls.away}</span>
                    </div>
                    <div className={styles.stat}>
                      <span>Bludger Hits:</span>
                      <span>{result.statistics.bludgerHits.home + result.statistics.bludgerHits.away}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Chronology Tab */}
          {activeTab === 'chronology' && (
            <Card className={styles.chronologyCard}>
              <h3>Complete Match Chronology</h3>
              
              <div className={styles.chronologyContainer}>
                <div className={styles.timeline}>
                  {result.chronology.minuteByMinute
                    .filter(minute => minute.events.length > 0)
                    .map((minute, index) => (
                    <div key={index} className={styles.timelineItem}>
                      <div className={styles.timelineDot}>
                        <span className={styles.minuteNumber}>{minute.minute}'</span>
                      </div>
                      
                      <div className={styles.timelineContent}>
                        <div className={styles.scoreAtTime}>
                          {minute.homeScore} - {minute.awayScore}
                        </div>
                        
                        <div className={styles.events}>
                          {minute.events.map((event, eventIndex) => (
                            <div key={eventIndex} className={styles.event}>
                              <span className={styles.eventIcon}>
                                {getEventIcon(event.type)}
                              </span>
                              <span className={styles.eventDescription}>
                                {event.description}
                              </span>
                              {event.points && event.points > 0 && (
                                <span className={styles.eventPoints}>
                                  +{event.points}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Statistics Tab */}
          {activeTab === 'statistics' && (
            <Card className={styles.statisticsCard}>
              <h3>Detailed Statistics</h3>
              
              <div className={styles.statsGrid}>
                <div className={styles.statCategory}>
                  <h4>Scoring Breakdown</h4>
                  <div className={styles.statComparison}>
                    <div className={styles.teamStats}>
                      <h5>{result.homeTeam.name}</h5>
                      <div className={styles.statLine}>
                        <span>Quaffle Goals:</span>
                        <span>{result.statistics.quaffleGoals.home}</span>
                      </div>
                      <div className={styles.statLine}>
                        <span>Snitch Points:</span>
                        <span>{result.statistics.snitchPoints.home}</span>
                      </div>
                      <div className={styles.statLine}>
                        <span>Total Score:</span>
                        <span className={styles.totalScore}>{result.finalScore.home}</span>
                      </div>
                    </div>
                    
                    <div className={styles.teamStats}>
                      <h5>{result.awayTeam.name}</h5>
                      <div className={styles.statLine}>
                        <span>Quaffle Goals:</span>
                        <span>{result.statistics.quaffleGoals.away}</span>
                      </div>
                      <div className={styles.statLine}>
                        <span>Snitch Points:</span>
                        <span>{result.statistics.snitchPoints.away}</span>
                      </div>
                      <div className={styles.statLine}>
                        <span>Total Score:</span>
                        <span className={styles.totalScore}>{result.finalScore.away}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.statCategory}>
                  <h4>Game Flow</h4>
                  <div className={styles.statComparison}>
                    <div className={styles.teamStats}>
                      <h5>{result.homeTeam.name}</h5>
                      <div className={styles.statLine}>
                        <span>Fouls:</span>
                        <span>{result.statistics.fouls.home}</span>
                      </div>
                      <div className={styles.statLine}>
                        <span>Bludger Hits:</span>
                        <span>{result.statistics.bludgerHits.home}</span>
                      </div>
                    </div>
                    
                    <div className={styles.teamStats}>
                      <h5>{result.awayTeam.name}</h5>
                      <div className={styles.statLine}>
                        <span>Fouls:</span>
                        <span>{result.statistics.fouls.away}</span>
                      </div>
                      <div className={styles.statLine}>
                        <span>Bludger Hits:</span>
                        <span>{result.statistics.bludgerHits.away}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.statCategory}>
                  <h4>Period Dominance</h4>
                  <div className={styles.dominanceStats}>
                    <div className={styles.periodStat}>
                      <span>First Period:</span>
                      <span className={styles.dominance}>
                        {result.statistics.dominanceByPeriod.first15 === 'home' ? result.homeTeam.name :
                         result.statistics.dominanceByPeriod.first15 === 'away' ? result.awayTeam.name : 'Even'}
                      </span>
                    </div>
                    <div className={styles.periodStat}>
                      <span>Middle Period:</span>
                      <span className={styles.dominance}>
                        {result.statistics.dominanceByPeriod.middle === 'home' ? result.homeTeam.name :
                         result.statistics.dominanceByPeriod.middle === 'away' ? result.awayTeam.name : 'Even'}
                      </span>
                    </div>
                    <div className={styles.periodStat}>
                      <span>Final Period:</span>
                      <span className={styles.dominance}>
                        {result.statistics.dominanceByPeriod.final === 'home' ? result.homeTeam.name :
                         result.statistics.dominanceByPeriod.final === 'away' ? result.awayTeam.name : 'Even'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchResultDetail;
