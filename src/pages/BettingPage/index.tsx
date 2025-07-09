import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './BettingPage.module.css';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import AdminMessage from '@/components/common/AdminMessage';
import { virtualTimeManager } from '@/services/virtualTimeManager';
import { Match, Season } from '@/types/league';
import { useAuth } from '@/context/AuthContext';

// Types for betting system
interface BetOption {
  id: string;
  type: string;
  selection: string;
  odds: number;
  description: string;
  matchId: string;
}

interface CombinedBet {
  options: BetOption[];
  amount: number;
  combinedOdds: number;
  potentialWin: number;
}

interface BettingMatch {
  id: string;
  name: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  status: 'upcoming' | 'live' | 'finished';
}

const BettingPage: React.FC = () => {
  const { matchId: paramMatchId } = useParams<{ matchId?: string }>();
  const { user, canBet, placeBet, getTodayBetsCount, canPlaceBet } = useAuth(); // Get user for balance and betting permissions
  // Show admin message if user cannot bet
  if (!canBet) {
    return (
      <AdminMessage 
        title="Funcionalidad Restringida"
        message="Los administradores no pueden realizar apuestas. Tu rol está destinado a la gestión y supervisión del sistema de apuestas de Quidditch."
        redirectTo="/account"
        redirectLabel="Ir al Panel de Administración"
        icon="⚡"
      />
    );
  }

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMatch, setSelectedMatch] = useState<string | undefined>(paramMatchId || '');
  const [selectedBets, setSelectedBets] = useState<BetOption[]>([]);
  const [betAmount, setBetAmount] = useState(0);
  const [scoreHome, setScoreHome] = useState(70);
  const [scoreAway, setScoreAway] = useState(60);
  const [matches, setMatches] = useState<BettingMatch[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const totalSteps = 3;

  useEffect(() => {
    if (paramMatchId) {
        setSelectedMatch(paramMatchId);
    }
    loadMatchesFromSimulation();
  }, [paramMatchId]);

  const loadMatchesFromSimulation = () => {
    setIsLoading(true);
    
    const timeState = virtualTimeManager.getState();
    if (timeState.temporadaActiva) {
      setSeason(timeState.temporadaActiva);
      
      // Get current date for filtering - use virtual time manager instead of real time
      const today = virtualTimeManager.getFechaVirtualActual();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Filter matches: only live, today, or the 5 closest upcoming matches
      let bettableMatches = timeState.temporadaActiva.partidos
        .filter(match => {
          // Exclude finished matches
          if (['finished', 'completed', 'ended'].includes(match.status)) {
            return false;
          }
          
          // Always include live matches
          if (match.status === 'live') {
            return true;
          }
          
          // Include matches from today onwards
          const matchDate = new Date(match.fecha);
          return matchDate >= startOfToday;
        });

      // Sort upcoming matches by date to get the closest ones first
      const upcomingMatches = bettableMatches
        .filter(match => match.status !== 'live')
        .sort((a, b) => {
          const dateA = new Date(a.fecha);
          const dateB = new Date(b.fecha);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 5); // Limit to 5 closest upcoming matches

      // Combine live matches with the 5 closest upcoming matches
      const liveMatches = bettableMatches.filter(match => match.status === 'live');
      bettableMatches = [...liveMatches, ...upcomingMatches];

      // Transform matches to BettingMatch format
      const formattedMatches = bettableMatches
        .map((match: Match) => {
          const homeTeam = timeState.temporadaActiva!.equipos.find(t => t.id === match.localId);
          const awayTeam = timeState.temporadaActiva!.equipos.find(t => t.id === match.visitanteId);
          
          return {
            id: match.id,
            name: `${homeTeam?.name || match.localId} vs ${awayTeam?.name || match.visitanteId}`,
            date: new Date(match.fecha).toLocaleDateString('es-ES', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            homeTeam: homeTeam?.name || match.localId,
            awayTeam: awayTeam?.name || match.visitanteId,
            status: match.status === 'live' ? 'live' : 'upcoming'
          } as BettingMatch;
        });
      
      setMatches(formattedMatches);
    } else {      // Fallback to mock data
      const mockAsBettingMatches: BettingMatch[] = mockMatchesForBetting.map(mock => ({
        ...mock,
        status: 'upcoming' as const
      }));
      setMatches(mockAsBettingMatches);
    }
    
    setIsLoading(false);
  };

  // Calculate combined odds and potential winnings
  const calculateCombinedOdds = () => {
    if (selectedBets.length === 0) return 1;
    return selectedBets.reduce((acc, bet) => acc * bet.odds, 1);
  };

  const calculatePotentialWin = () => {
    const combinedOdds = calculateCombinedOdds();
    return betAmount * combinedOdds;
  };
  // Handle bet selection (allow multiple selections for combined bets and deselection)
  const handleBetSelection = (option: BetOption) => {
    setSelectedBets(prev => {
      // Check if this exact bet is already selected
      const existingIndex = prev.findIndex(bet => bet.id === option.id);

      if (existingIndex >= 0) {
        // If already selected, remove it (deselect)
        return prev.filter(bet => bet.id !== option.id);
      } else {
        // Check if there's a conflicting bet of the same type for the same match
        const conflictingIndex = prev.findIndex(bet => 
          bet.matchId === option.matchId && bet.type === option.type
        );

        if (conflictingIndex >= 0) {
          // Replace conflicting bet with the new selection
          const newBets = [...prev];
          newBets[conflictingIndex] = option;
          return newBets;
        } else {
          // Add new bet
          return [...prev, option];
        }
      }
    });
  };

  // Remove a specific bet from selection
  const removeBet = (betId: string) => {
    setSelectedBets(prev => prev.filter(bet => bet.id !== betId));
  };

  // Handle exact score bet
  const handleScoreBet = () => {
    if (!selectedMatch) return;
    
    const scoreOption: BetOption = {
      id: `${selectedMatch}-score-exact`,
      type: 'score',
      selection: 'exact',
      odds: 8.50,
      description: `Puntuación exacta: ${scoreHome}-${scoreAway}`,
      matchId: selectedMatch
    };
    
    handleBetSelection(scoreOption);
  };  const handleNextStep = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Validate if user can place bet (balance, daily limit, etc.)
      const validation = canPlaceBet(betAmount);
      if (!validation.canBet) {
        alert(validation.reason || 'No se puede realizar la apuesta');
        return;
      }
      
      try {
        // Prepare bet data
        const betData = {
          matchId: selectedMatch!,
          matchName: getMatchNameById(selectedMatch!),
          options: selectedBets,
          amount: betAmount,
          combinedOdds: calculateCombinedOdds(),
          potentialWin: calculatePotentialWin()
        };

        // Place the bet using AuthContext
        const success = await placeBet(betData);
        
        if (success) {
          alert(`¡Apuesta realizada con éxito! ✨\n\nDetalles:\n- Apuestas: ${selectedBets.length}\n- Monto: ${betAmount} G\n- Cuota combinada: ${calculateCombinedOdds().toFixed(2)}\n- Ganancia potencial: ${calculatePotentialWin().toFixed(2)} G\n\nEl monto ha sido descontado de tu saldo.`);
          
          // Reset form
          setCurrentStep(1);
          setSelectedBets([]);
          setBetAmount(0);
          if (!paramMatchId) {
            setSelectedMatch('');
          }
        } else {
          alert('Error al realizar la apuesta. Intenta nuevamente.');
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Error al realizar la apuesta');
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  const getMatchNameById = (id: string) => matches.find(m => m.id === id)?.name || 'Partido Desconocido';
  return (
    <div className={styles.bettingPageContainer}>
      {/* Hero Header Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            <span className={styles.titleIcon}>🏆</span>
            Realizar Apuesta Mágica
          </h1>          <p className={styles.heroDescription}>
            Coloca tu apuesta en los emocionantes partidos de Quidditch y gana Galeones
          </p>
          {season && (
            <div className={styles.seasonInfo}>
              🏆 {season.name} - {matches.length} partidos disponibles para apuestas
            </div>
          )}
          {!season && !isLoading && (
            <div className={styles.noDataInfo}>
              ⚡ Inicia una temporada en la página de Partidos para apostar en partidos en vivo
            </div>
          )}          <div className={styles.userBalance}>
            <span className={styles.balanceLabel}>Saldo disponible:</span>
            <span className={styles.balanceAmount}>{user?.balance || 0} Galeones</span>
          </div>
          
          <div className={styles.dailyLimitsInfo}>
            <div className={styles.limitsRow}>
              <span className={styles.limitsLabel}>Apuestas realizadas hoy:</span>
              <span className={styles.limitsValue}>
                {getTodayBetsCount()}/3
                {getTodayBetsCount() >= 3 && <span className={styles.limitReached}> (Límite alcanzado)</span>}
              </span>
            </div>
            {getTodayBetsCount() >= 3 && (
              <div className={styles.limitWarning}>
                ⚠️ Has alcanzado el límite diario de apuestas. Intenta nuevamente mañana.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Progress Indicator */}
      <Card className={styles.progressCard}>
        <div className={styles.progressContainer}>
          <div className={styles.progressTrack}>
            {[1, 2, 3].map((step) => (
              <div 
                key={step}
                className={`${styles.progressStep} ${currentStep >= step ? styles.progressStepActive : ''} ${currentStep > step ? styles.progressStepCompleted : ''}`}
              >
                <div className={styles.stepNumber}>{step}</div>
                <div className={styles.stepLabel}>
                  {step === 1 && "Seleccionar"}
                  {step === 2 && "Apostar"}
                  {step === 3 && "Confirmar"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Betting Form */}
      <Card className={styles.bettingFormCard}>
        <div className={styles.formHeader}>
          <h2 className={styles.stepTitle}>
            {currentStep === 1 && "Seleccionar Partido y Tipo de Apuesta"}
            {currentStep === 2 && "Realizar tu Selección"}
            {currentStep === 3 && "Confirmar Monto y Apuesta"}
          </h2>
        </div>        {/* Step 1: Select Match */}
        {currentStep === 1 && (
          <div className={styles.formStep}>
            {!paramMatchId && (
              <div className={styles.formGroup}>
                <label htmlFor="match-select" className={styles.formLabel}>
                  <span className={styles.labelIcon}>⚡</span>
                  Selecciona un Partido:
                </label>
                <div className={styles.selectWrapper}>
                  <select
                    id="match-select"
                    className={styles.formSelect}
                    value={selectedMatch}
                    onChange={(e) => setSelectedMatch(e.target.value)}
                  >                    <option value="" disabled>Elige un partido...</option>
                    {matches.map(match => (
                      <option key={match.id} value={match.id}>
                        {match.name} ({match.date})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            {paramMatchId && selectedMatch && (
              <div className={styles.selectedMatchCard}>
                <div className={styles.selectedMatchHeader}>
                  <span className={styles.selectedMatchIcon}>🏆</span>
                  <div>
                    <p className={styles.selectedMatchLabel}>Partido Seleccionado:</p>
                    <p className={styles.selectedMatchName}>{getMatchNameById(selectedMatch)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>ℹ️</div>
                <div className={styles.infoContent}>
                  <h4>Apuestas Combinadas</h4>
                  <p>Puedes seleccionar múltiples opciones de apuesta para el mismo partido. Las cuotas se multiplicarán para aumentar tu ganancia potencial.</p>
                </div>
              </div>
            </div>
          </div>
        )}        {/* Step 2: Select Betting Options (Multiple Selection for Combined Bets) */}
        {currentStep === 2 && selectedMatch && (
          <div className={styles.formStep}>
            <div className={styles.selectionHeader}>
              <h4 className={styles.selectionTitle}>
                <span className={styles.titleIcon}>🎮</span>
                Opciones de Apuesta para {getMatchNameById(selectedMatch)}
              </h4>
              <p className={styles.selectionSubtitle}>
                Selecciona una o más opciones. Las cuotas se combinarán automáticamente.
              </p>
            </div>            {(() => {
              const match = matches.find(m => m.id === selectedMatch);
              if (!match) return null;

              return (
                <div className={styles.bettingOptionsContainer}>
                  {/* Winner Options */}
                  <div className={styles.betTypeSection}>
                    <h5 className={styles.betSectionTitle}>
                      <span className={styles.sectionIcon}>🏆</span>
                      Ganador del Partido
                    </h5>
                    <div className={styles.optionsGrid}>
                      {[
                        { id: `${selectedMatch}-winner-home`, selection: 'home', odds: 2.15, description: `${match.homeTeam} gana` },
                        { id: `${selectedMatch}-winner-draw`, selection: 'draw', odds: 3.50, description: 'Empate' },
                        { id: `${selectedMatch}-winner-away`, selection: 'away', odds: 1.90, description: `${match.awayTeam} gana` },
                      ].map(option => {
                        const betOption: BetOption = { ...option, type: 'winner', matchId: selectedMatch };
                        const isSelected = selectedBets.some(bet => bet.id === option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            className={`${styles.betOptionCard} ${isSelected ? styles.betOptionCardActive : ''}`}
                            onClick={() => handleBetSelection(betOption)}
                          >
                            <div className={styles.optionInfo}>
                              <span className={styles.optionName}>{option.description}</span>
                              <span className={styles.optionOdds}>{option.odds}x</span>
                            </div>
                            {isSelected && <div className={styles.selectedIndicator}>✓</div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Snitch Capture Options */}
                  <div className={styles.betTypeSection}>
                    <h5 className={styles.betSectionTitle}>
                      <span className={styles.sectionIcon}>✨</span>
                      Captura de la Snitch
                    </h5>
                    <div className={styles.optionsGrid}>
                      {[
                        { id: `${selectedMatch}-snitch-home`, selection: 'home', odds: 1.75, description: `${match.homeTeam} captura la Snitch` },
                        { id: `${selectedMatch}-snitch-away`, selection: 'away', odds: 2.35, description: `${match.awayTeam} captura la Snitch` },
                      ].map(option => {
                        const betOption: BetOption = { ...option, type: 'snitch', matchId: selectedMatch };
                        const isSelected = selectedBets.some(bet => bet.id === option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            className={`${styles.betOptionCard} ${isSelected ? styles.betOptionCardActive : ''}`}
                            onClick={() => handleBetSelection(betOption)}
                          >
                            <div className={styles.optionInfo}>
                              <span className={styles.optionName}>{option.description}</span>
                              <span className={styles.optionOdds}>{option.odds}x</span>
                            </div>
                            {isSelected && <div className={styles.selectedIndicator}>✓</div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Duration Options */}
                  <div className={styles.betTypeSection}>
                    <h5 className={styles.betSectionTitle}>
                      <span className={styles.sectionIcon}>⏱️</span>
                      Duración del Partido
                    </h5>
                    <div className={styles.optionsGrid}>
                      {[
                        { id: `${selectedMatch}-time-short`, selection: '0-30', odds: 7.50, description: 'Menos de 30 minutos' },
                        { id: `${selectedMatch}-time-medium`, selection: '30-60', odds: 3.25, description: 'Entre 30 y 60 minutos' },
                        { id: `${selectedMatch}-time-long`, selection: '60-120', odds: 2.10, description: 'Entre 1 y 2 horas' },
                        { id: `${selectedMatch}-time-very-long`, selection: '120+', odds: 4.75, description: 'Más de 2 horas' },
                      ].map(option => {
                        const betOption: BetOption = { ...option, type: 'time', matchId: selectedMatch };
                        const isSelected = selectedBets.some(bet => bet.id === option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            className={`${styles.betOptionCard} ${isSelected ? styles.betOptionCardActive : ''}`}
                            onClick={() => handleBetSelection(betOption)}
                          >
                            <div className={styles.optionInfo}>
                              <span className={styles.optionName}>{option.description}</span>
                              <span className={styles.optionOdds}>{option.odds}x</span>
                            </div>
                            {isSelected && <div className={styles.selectedIndicator}>✓</div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Score Prediction */}
                  <div className={styles.betTypeSection}>
                    <h5 className={styles.betSectionTitle}>
                      <span className={styles.sectionIcon}>🎯</span>
                      Puntuación Exacta
                    </h5>
                    <div className={styles.scoreSection}>
                      <div className={styles.scoreInputsContainer}>
                        <div className={styles.scoreInput}>
                          <label>{match.homeTeam}</label>
                          <input
                            type="number"
                            value={scoreHome}
                            onChange={(e) => setScoreHome(Number(e.target.value))}
                            min="10"
                            max="500"
                            step="10"
                            className={styles.scoreField}
                          />
                        </div>
                        <div className={styles.scoreDivider}>-</div>
                        <div className={styles.scoreInput}>
                          <label>{match.awayTeam}</label>
                          <input
                            type="number"
                            value={scoreAway}
                            onChange={(e) => setScoreAway(Number(e.target.value))}
                            min="10"
                            max="500"
                            step="10"
                            className={styles.scoreField}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`${styles.betOptionCard} ${selectedBets.some(bet => bet.type === 'score') ? styles.betOptionCardActive : ''}`}
                        onClick={handleScoreBet}
                      >
                        <div className={styles.optionInfo}>
                          <span className={styles.optionName}>Puntuación exacta: {scoreHome}-{scoreAway}</span>
                          <span className={styles.optionOdds}>8.50x</span>
                        </div>
                        {selectedBets.some(bet => bet.type === 'score') && <div className={styles.selectedIndicator}>✓</div>}
                      </button>
                    </div>
                  </div>

                  {/* Special Events */}
                  <div className={styles.betTypeSection}>
                    <h5 className={styles.betSectionTitle}>
                      <span className={styles.sectionIcon}>🔮</span>
                      Eventos Especiales
                    </h5>
                    <div className={styles.optionsGrid}>
                      {[
                        { id: `${selectedMatch}-special-expulsion`, selection: 'expulsion', odds: 5.25, description: 'Un jugador será expulsado' },
                        { id: `${selectedMatch}-special-broom`, selection: 'broom-break', odds: 4.50, description: 'Se romperá una escoba' },
                        { id: `${selectedMatch}-special-fall`, selection: 'seeker-fall', odds: 3.75, description: 'Un buscador caerá de su escoba' },
                        { id: `${selectedMatch}-special-bludger`, selection: 'bludger-referee', odds: 12.50, description: 'Una bludger golpeará al árbitro' },
                        { id: `${selectedMatch}-special-suspension`, selection: 'suspension', odds: 8.25, description: 'El partido será suspendido temporalmente' },
                      ].map(option => {
                        const betOption: BetOption = { ...option, type: 'special', matchId: selectedMatch };
                        const isSelected = selectedBets.some(bet => bet.id === option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            className={`${styles.betOptionCard} ${isSelected ? styles.betOptionCardActive : ''}`}
                            onClick={() => handleBetSelection(betOption)}
                          >
                            <div className={styles.optionInfo}>
                              <span className={styles.optionName}>{option.description}</span>
                              <span className={styles.optionOdds}>{option.odds}x</span>
                            </div>
                            {isSelected && <div className={styles.selectedIndicator}>✓</div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Selected Bets Summary */}
            {selectedBets.length > 0 && (
              <div className={styles.selectedBetsContainer}>
                <h5 className={styles.selectedBetsTitle}>
                  <span className={styles.titleIcon}>📋</span>
                  Apuestas Seleccionadas ({selectedBets.length})
                </h5>
                <div className={styles.selectedBetsList}>
                  {selectedBets.map((bet) => (
                    <div key={bet.id} className={styles.selectedBetItem}>
                      <div className={styles.selectedBetInfo}>
                        <span className={styles.selectedBetName}>{bet.description}</span>
                        <span className={styles.selectedBetOdds}>{bet.odds}x</span>
                      </div>
                      <button
                        type="button"
                        className={styles.removeBetBtn}
                        onClick={() => removeBet(bet.id)}
                        title="Eliminar apuesta"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className={styles.combinedOddsInfo}>
                  <span className={styles.combinedOddsLabel}>Cuota Combinada:</span>
                  <span className={styles.combinedOddsValue}>{calculateCombinedOdds().toFixed(2)}x</span>
                </div>
              </div>
            )}

            {selectedBets.length === 0 && (
              <div className={styles.noSelectionMessage}>
                <span className={styles.messageIcon}>💡</span>
                <span>Selecciona al menos una opción de apuesta para continuar</span>
              </div>
            )}
          </div>
        )}        {/* Step 3: Amount and Confirmation */}
        {currentStep === 3 && (
          <div className={styles.formStep}>
            <div className={styles.summarySection}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryHeader}>
                  <span className={styles.summaryIcon}>📋</span>
                  <h4 className={styles.summaryTitle}>Resumen de tu Apuesta Combinada</h4>
                </div>
                <div className={styles.summaryContent}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Partido:</span>
                    <span className={styles.summaryValue}>{getMatchNameById(selectedMatch || '')}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Apuestas Seleccionadas:</span>
                    <span className={styles.summaryValue}>{selectedBets.length}</span>
                  </div>
                  
                  {/* Individual bets list */}
                  <div className={styles.individualBetsSection}>
                    <h5 className={styles.individualBetsTitle}>Detalles de las Apuestas:</h5>
                    {selectedBets.map((bet) => (
                      <div key={bet.id} className={styles.individualBetRow}>
                        <span className={styles.betDescription}>{bet.description}</span>
                        <span className={styles.betOdds}>{bet.odds}x</span>
                      </div>
                    ))}
                  </div>

                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Cuota Combinada:</span>
                    <span className={styles.summaryValueHighlight}>{calculateCombinedOdds().toFixed(2)}x</span>
                  </div>
                  
                  {betAmount > 0 && (
                    <>
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Monto:</span>
                        <span className={styles.summaryValue}>{betAmount} Galeones</span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Ganancia Potencial:</span>
                        <span className={styles.summaryValueHighlight}>
                          {calculatePotentialWin().toFixed(2)} Galeones
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
                <div className={styles.formGroup}>
                <label htmlFor="amount-input" className={styles.formLabel}>
                  <span className={styles.labelIcon}>💰</span>
                  Monto a Apostar (Galeones):
                </label>
                <div className={styles.amountInputWrapper}>
                  <div className={styles.inputWrapper}>
                    <input
                      type="number"
                      id="amount-input"
                      className={`${styles.formInput} ${betAmount > (user?.balance || 0) ? styles.inputError : ''}`}
                      value={betAmount}
                      onChange={(e) => setBetAmount(Number(e.target.value))}
                      min="1"
                      max={user?.balance || 0}
                      placeholder="Ingresa el monto"
                    />
                    <span className={styles.inputSuffix}>G</span>
                  </div>
                  {betAmount > (user?.balance || 0) && (
                    <div className={styles.errorMessage}>
                      ⚠️ Saldo insuficiente. Tu saldo actual es {user?.balance || 0} Galeones.
                    </div>
                  )}                <div className={styles.quickAmountButtons}>
                  <span className={styles.quickAmountLabel}>Montos rápidos:</span>
                  <div className={styles.quickAmountGrid}>
                    {[5, 10, 25, 50].filter(amount => amount <= (user?.balance || 0)).map(amount => (
                      <button
                        key={amount}
                        type="button"
                        className={styles.quickAmountBtn}
                        onClick={() => setBetAmount(amount)}
                      >
                        {amount}G
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time calculation display */}
            {betAmount > 0 && (
              <div className={styles.realTimeCalculation}>
                <div className={styles.calculationCard}>
                  <div className={styles.calculationRow}>
                    <span>Tu apuesta:</span>
                    <span>{betAmount} G</span>
                  </div>
                  <div className={styles.calculationRow}>
                    <span>Cuota combinada:</span>
                    <span>{calculateCombinedOdds().toFixed(2)}x</span>
                  </div>
                  <div className={`${styles.calculationRow} ${styles.calculationTotal}`}>
                    <span>Ganancia potencial:</span>
                    <span>{calculatePotentialWin().toFixed(2)} G</span>
                  </div>
                  <div className={`${styles.calculationRow} ${styles.calculationProfit}`}>
                    <span>Beneficio neto:</span>
                    <span>{(calculatePotentialWin() - betAmount).toFixed(2)} G</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className={styles.navigationSection}>
          <div className={styles.navigationButtons}>
            <Button 
              variant="outline" 
              onClick={handlePrevStep} 
              disabled={currentStep === 1}
              className={styles.navButton}
            >
              <span className={styles.buttonIcon}>←</span>
              Anterior
            </Button>            <Button 
              onClick={handleNextStep} 
              disabled={
                !selectedMatch || 
                (currentStep === 2 && selectedBets.length === 0) || 
                (currentStep === 3 && (
                  betAmount <= 0 || 
                  !canPlaceBet(betAmount).canBet
                ))
              }
              className={styles.navButton}
            >
              {currentStep === totalSteps ? (
                <>
                  <span className={styles.buttonIcon}>✨</span>
                  Confirmar Apuesta
                </>
              ) : (
                <>
                  Siguiente
                  <span className={styles.buttonIcon}>→</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Mock data
const mockMatchesForBetting = [
  { id: '1', name: 'Gryffindor vs Slytherin', date: 'Hoy 19:00', homeTeam: 'Gryffindor', awayTeam: 'Slytherin' },
  { id: '2', name: 'Hufflepuff vs Ravenclaw', date: 'Mañana 17:30', homeTeam: 'Hufflepuff', awayTeam: 'Ravenclaw' },
  { id: '3', name: 'Chudley Cannons vs Holyhead Harpies', date: 'Domingo 15:00', homeTeam: 'Chudley Cannons', awayTeam: 'Holyhead Harpies' },
];

export default BettingPage;