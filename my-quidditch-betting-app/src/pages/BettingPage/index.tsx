import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './BettingPage.module.css';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';

// Mock data
const mockMatchesForBetting = [
  { id: '1', name: 'Gryffindor vs Slytherin', date: 'Hoy 19:00' },
  { id: '2', name: 'Hufflepuff vs Ravenclaw', date: 'Mañana 17:30' },
  { id: '3', name: 'Chudley Cannons vs Holyhead Harpies', date: 'Domingo 15:00' },
];

const BettingPage: React.FC = () => {
  const { matchId: paramMatchId } = useParams<{ matchId?: string }>();
  // const { user } = useAuth(); // Get user for balance

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMatch, setSelectedMatch] = useState<string | undefined>(paramMatchId || '');
  const [betType, setBetType] = useState(''); // e.g., 'match_winner', 'score_prediction'
  const [betSelection, setBetSelection] = useState<any>(null); // Could be team ID, score, etc.
  const [betAmount, setBetAmount] = useState(0);

  const totalSteps = 3; // Example: 1. Select Match & Type, 2. Make Selection, 3. Confirm & Amount

  useEffect(() => {
    if (paramMatchId) {
        setSelectedMatch(paramMatchId);
        // Potentially skip to step 2 if match is pre-selected
        // setCurrentStep(2); 
    }
  }, [paramMatchId]);


  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Handle bet submission
      console.log('Bet submitted:', { selectedMatch, betType, betSelection, betAmount });
      alert('¡Apuesta realizada con éxito! (simulado)');
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const getMatchNameById = (id: string) => mockMatchesForBetting.find(m => m.id === id)?.name || 'Partido Desconocido';
  return (
    <div className={styles.bettingPageContainer}>
      {/* Hero Header Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            <span className={styles.titleIcon}>🏆</span>
            Realizar Apuesta Mágica
          </h1>
          <p className={styles.heroDescription}>
            Coloca tu apuesta en los emocionantes partidos de Quidditch y gana Galeones
          </p>
          <div className={styles.userBalance}>
            <span className={styles.balanceLabel}>Saldo disponible:</span>
            <span className={styles.balanceAmount}>150 Galeones</span>
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
        </div>        {/* Step 1: Select Match and Bet Type */}
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
                  >
                    <option value="" disabled>Elige un partido...</option>
                    {mockMatchesForBetting.map(match => (
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
              <label className={styles.formLabel}>
                <span className={styles.labelIcon}>🎯</span>
                Tipo de Apuesta:
              </label>
              <div className={styles.betTypeGrid}>
                <div className={styles.betTypeCard}>
                  <input 
                    type="radio" 
                    id="type_winner" 
                    name="betType" 
                    value="match_winner" 
                    onChange={(e) => setBetType(e.target.value)} 
                    checked={betType === 'match_winner'}
                    className={styles.radioInput}
                  />
                  <label htmlFor="type_winner" className={styles.betTypeLabel}>
                    <div className={styles.betTypeIcon}>🥇</div>
                    <div className={styles.betTypeInfo}>
                      <div className={styles.betTypeName}>Ganador del Partido</div>
                      <div className={styles.betTypeDescription}>Predice qué equipo ganará</div>
                    </div>
                  </label>
                </div>
                
                <div className={styles.betTypeCard}>
                  <input 
                    type="radio" 
                    id="type_score" 
                    name="betType" 
                    value="exact_score" 
                    onChange={(e) => setBetType(e.target.value)} 
                    checked={betType === 'exact_score'}
                    className={styles.radioInput}
                  />
                  <label htmlFor="type_score" className={styles.betTypeLabel}>
                    <div className={styles.betTypeIcon}>📊</div>
                    <div className={styles.betTypeInfo}>
                      <div className={styles.betTypeName}>Marcador Exacto</div>
                      <div className={styles.betTypeDescription}>Adivina el marcador final</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}        {/* Step 2: Make Selection based on Bet Type */}
        {currentStep === 2 && (
          <div className={styles.formStep}>
            <div className={styles.selectionHeader}>
              <h4 className={styles.selectionTitle}>
                <span className={styles.titleIcon}>🎮</span>
                Tu Selección para {getMatchNameById(selectedMatch || '')}
              </h4>
            </div>
            
            {betType === 'match_winner' && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span className={styles.labelIcon}>👑</span>
                  ¿Quién ganará?
                </label>
                <div className={styles.teamSelectionGrid}>
                  <button
                    type="button"
                    className={`${styles.teamButton} ${betSelection === 'home' ? styles.teamButtonActive : ''}`}
                    onClick={() => setBetSelection('home')}
                  >
                    <div className={styles.teamButtonIcon}>🏠</div>
                    <div className={styles.teamButtonText}>
                      <span className={styles.teamName}>Equipo Local</span>
                      <span className={styles.teamOdds}>2.1x</span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    className={`${styles.teamButton} ${betSelection === 'away' ? styles.teamButtonActive : ''}`}
                    onClick={() => setBetSelection('away')}
                  >
                    <div className={styles.teamButtonIcon}>✈️</div>
                    <div className={styles.teamButtonText}>
                      <span className={styles.teamName}>Equipo Visitante</span>
                      <span className={styles.teamOdds}>1.8x</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
            
            {betType === 'exact_score' && (
              <div className={styles.formGroup}>
                <label htmlFor="score-input" className={styles.formLabel}>
                  <span className={styles.labelIcon}>🎯</span>
                  Introduce el marcador (Ej: 150-70):
                </label>
                <div className={styles.inputWrapper}>
                  <input 
                    type="text" 
                    id="score-input" 
                    className={styles.formInput} 
                    placeholder="150-70"
                    onChange={(e) => setBetSelection(e.target.value)} 
                  />
                </div>
              </div>
            )}
            
            {!betType && (
              <div className={styles.errorMessage}>
                <span className={styles.errorIcon}>⚠️</span>
                Por favor, selecciona un tipo de apuesta en el paso anterior.
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
                  <h4 className={styles.summaryTitle}>Resumen de tu Apuesta</h4>
                </div>
                <div className={styles.summaryContent}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Partido:</span>
                    <span className={styles.summaryValue}>{getMatchNameById(selectedMatch || '')}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Tipo de Apuesta:</span>
                    <span className={styles.summaryValue}>
                      {betType === 'match_winner' ? 'Ganador del Partido' : 
                       betType === 'exact_score' ? 'Marcador Exacto' : betType}
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Tu Selección:</span>
                    <span className={styles.summaryValue}>{String(betSelection)}</span>
                  </div>
                  {betAmount > 0 && (
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>Ganancia Potencial:</span>
                      <span className={styles.summaryValueHighlight}>
                        {(betAmount * 2.1).toFixed(0)} Galeones
                      </span>
                    </div>
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
                    className={styles.formInput}
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    min="1"
                    max="150"
                    placeholder="Ingresa el monto"
                  />
                  <span className={styles.inputSuffix}>G</span>
                </div>
                <div className={styles.quickAmountButtons}>
                  <span className={styles.quickAmountLabel}>Montos rápidos:</span>
                  <div className={styles.quickAmountGrid}>
                    {[5, 10, 25, 50].map(amount => (
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
            </Button>
            <Button 
              onClick={handleNextStep} 
              disabled={!selectedMatch || (currentStep === 1 && !betType) || (currentStep === 2 && !betSelection) || (currentStep === 3 && betAmount <= 0)}
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

export default BettingPage;