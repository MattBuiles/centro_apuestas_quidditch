import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './BettingPage.module.css';
import BettingMatchCard from '../../components/betting/BettingMatchCard';
import BetSummary from '../../components/betting/BetSummary';
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
      <Card className="mb-8">
        <div className="page-header text-center">
          <h1 className="text-3xl font-bold text-primary">Realizar Apuesta</h1>
          <p className="text-gray-600 mt-2">Sigue los pasos para colocar tu apuesta mágica.</p>
          {/* {user && <p className="text-sm text-secondary mt-1">Saldo: {user.balance} Galeones</p>} */}
        </div>
      </Card>

      <Card className="betting-form-steps">
        {/* Step Indicator (Optional) */}
        <div className="step-indicator mb-6 pb-2 border-b border-dashed border-gray-300">
            <span className="step-number">{currentStep}</span>
            <h3 className="inline text-xl font-semibold text-primary ml-2">
                Paso {currentStep} de {totalSteps}: 
                {currentStep === 1 && " Seleccionar Partido y Tipo de Apuesta"}
                {currentStep === 2 && " Realizar Selección"}
                {currentStep === 3 && " Confirmar Monto y Apuesta"}
            </h3>
        </div>

        {/* Step 1: Select Match and Bet Type */}
        {currentStep === 1 && (
          <div className="form-step">
            {!paramMatchId && (
                <div className="form-group mb-6">
                    <label htmlFor="match-select" className="form-label">Selecciona un Partido:</label>
                    <select
                        id="match-select"
                        className="form-input"
                        value={selectedMatch}
                        onChange={(e) => setSelectedMatch(e.target.value)}
                    >
                        <option value="" disabled>Elige un partido...</option>
                        {mockMatchesForBetting.map(match => (
                        <option key={match.id} value={match.id}>{match.name} ({match.date})</option>
                        ))}
                    </select>
                </div>
            )}
            {paramMatchId && selectedMatch && (
                <div className="mb-6 p-3 bg-primary/10 rounded-md">
                    <p className="form-label">Partido Seleccionado:</p>
                    <p className="font-semibold text-primary">{getMatchNameById(selectedMatch)}</p>
                </div>
            )}

            <div className="form-group">
              <label className="form-label">Tipo de Apuesta:</label>
              <div className="bet-type-options">
                <div className="bet-type-option">
                  <input type="radio" id="type_winner" name="betType" value="match_winner" onChange={(e) => setBetType(e.target.value)} checked={betType === 'match_winner'} />
                  <label htmlFor="type_winner" className="card p-4"> {/* Re-using card for clickable area */}
                    <div className="option-name">Ganador del Partido</div>
                    <div className="option-description">Predice qué equipo ganará.</div>
                  </label>
                </div>
                <div className="bet-type-option">
                  <input type="radio" id="type_score" name="betType" value="exact_score" onChange={(e) => setBetType(e.target.value)} checked={betType === 'exact_score'} />
                  <label htmlFor="type_score" className="card p-4">
                    <div className="option-name">Marcador Exacto</div>
                    <div className="option-description">Adivina el marcador final.</div>
                  </label>
                </div>
                 {/* Add more bet types */}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Make Selection based on Bet Type */}
        {currentStep === 2 && (
          <div className="form-step">
            <h4 className="text-lg font-semibold text-primary mb-4">Tu Selección para {getMatchNameById(selectedMatch || '')}</h4>
            {betType === 'match_winner' && (
              <div className="form-group">
                <label className="form-label">¿Quién ganará?</label>
                {/* Simplified selection - replace with actual team names */}
                <Button variant={betSelection === 'home' ? 'primary' : 'outline'} onClick={() => setBetSelection('home')} className="mr-2">Equipo Local Gana</Button>
                <Button variant={betSelection === 'away' ? 'primary' : 'outline'} onClick={() => setBetSelection('away')}>Equipo Visitante Gana</Button>
              </div>
            )}
            {betType === 'exact_score' && (
              <div className="form-group">
                <label htmlFor="score-input" className="form-label">Introduce el marcador (Ej: 150-70):</label>
                <input type="text" id="score-input" className="form-input" onChange={(e) => setBetSelection(e.target.value)} />
              </div>
            )}
            {!betType && <p className="text-gray-600">Por favor, selecciona un tipo de apuesta en el paso anterior.</p>}
          </div>
        )}

        {/* Step 3: Amount and Confirmation */}
        {currentStep === 3 && (
          <div className="form-step">
            <div className="betting-summary card mb-6">
                <h4 className="text-lg font-bold text-primary mb-3">Resumen de tu Apuesta</h4>
                <div className="summary-row">
                    <span className="summary-label">Partido:</span>
                    <span className="summary-value">{getMatchNameById(selectedMatch || '')}</span>
                </div>
                <div className="summary-row">
                    <span className="summary-label">Tipo de Apuesta:</span>
                    <span className="summary-value">{betType === 'match_winner' ? 'Ganador del Partido' : betType === 'exact_score' ? 'Marcador Exacto' : betType}</span>
                </div>
                <div className="summary-row">
                    <span className="summary-label">Tu Selección:</span>
                    <span className="summary-value">{String(betSelection)}</span>
                </div>
                {/* Add potential winnings display here */}
            </div>
            <div className="form-group">
              <label htmlFor="amount-input" className="form-label">Monto a Apostar (Galeones):</label>
              <input
                type="number"
                id="amount-input"
                className="form-input"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min="1"
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="navigation-buttons mt-8 flex justify-between">
          <Button variant="outline" onClick={handlePrevStep} disabled={currentStep === 1}>
            Anterior
          </Button>
          <Button onClick={handleNextStep} disabled={!selectedMatch || (currentStep ===1 && !betType) || (currentStep ===2 && !betSelection) || (currentStep ===3 && betAmount <=0) }>
            {currentStep === totalSteps ? 'Confirmar Apuesta' : 'Siguiente'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default BettingPage;