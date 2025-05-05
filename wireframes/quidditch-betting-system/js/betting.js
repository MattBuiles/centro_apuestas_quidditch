// Este archivo gestiona la funcionalidad de apuestas, incluyendo la colocación de apuestas,
// la validación de entradas y la actualización de la interfaz de usuario.

document.addEventListener('DOMContentLoaded', function() {
    // Elementos de la interfaz para las pestañas
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Formularios de apuestas
    const winnerForm = document.getElementById('winner-betting-form');
    const snitchForm = document.getElementById('snitch-betting-form');
    const scoreForm = document.getElementById('score-betting-form');
    const timeForm = document.getElementById('time-betting-form');
    const specialForm = document.getElementById('special-betting-form');
    
    // Modal de resultado
    const bettingResultModal = document.getElementById('betting-result');
    const closeModal = document.querySelector('.close-modal');
    
    // Gestión de pestañas
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Eliminar clase activa de todas las pestañas
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activar la pestaña seleccionada
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Función para actualizar el resumen de apuesta y ganancia potencial
    function updateBettingSummary(type, selection, quota, amount) {
        const betSummary = document.getElementById(`${type}-bet-summary`);
        const quotaSummary = document.getElementById(`${type}-quota-summary`);
        const potentialWin = document.getElementById(`${type}-potential-win`);
        
        if (betSummary) betSummary.textContent = selection;
        if (quotaSummary) quotaSummary.textContent = quota;
        
        // Calcular ganancia potencial
        const potentialGain = (parseFloat(amount) * parseFloat(quota)).toFixed(2);
        if (potentialWin) potentialWin.textContent = `${potentialGain} G`;
    }
    
    // Gestión de cambio en apuestas de ganador
    if (winnerForm) {
        const teamOptions = winnerForm.querySelectorAll('input[name="winner-team"]');
        const amountInput = winnerForm.querySelector('#winner-amount');
        
        teamOptions.forEach(option => {
            option.addEventListener('change', updateWinnerBet);
        });
        
        amountInput.addEventListener('input', updateWinnerBet);
        
        function updateWinnerBet() {
            const selectedTeam = winnerForm.querySelector('input[name="winner-team"]:checked');
            if (!selectedTeam) return;
            
            const teamOption = selectedTeam.closest('.team-option');
            const teamName = teamOption.querySelector('.team-name').textContent;
            const quota = teamOption.querySelector('.quota').textContent;
            const amount = amountInput.value;
            
            updateBettingSummary('winner', teamName, quota, amount);
        }
        
        // Inicializar el resumen con los valores predeterminados
        updateWinnerBet();
        
        // Procesar el envío del formulario
        winnerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            processFormSubmission('winner');
        });
    }
    
    // Gestión de cambio en apuestas de Snitch
    if (snitchForm) {
        const teamOptions = snitchForm.querySelectorAll('input[name="snitch-team"]');
        const amountInput = snitchForm.querySelector('#snitch-amount');
        
        teamOptions.forEach(option => {
            option.addEventListener('change', updateSnitchBet);
        });
        
        amountInput.addEventListener('input', updateSnitchBet);
        
        function updateSnitchBet() {
            const selectedTeam = snitchForm.querySelector('input[name="snitch-team"]:checked');
            if (!selectedTeam) return;
            
            const teamOption = selectedTeam.closest('.team-option');
            const teamName = teamOption.querySelector('.team-name').textContent.split('(')[0].trim();
            const quota = teamOption.querySelector('.quota').textContent;
            const amount = amountInput.value;
            
            updateBettingSummary('snitch', `${teamName} captura la Snitch`, quota, amount);
        }
        
        // Inicializar el resumen con los valores predeterminados
        updateSnitchBet();
        
        // Procesar el envío del formulario
        snitchForm.addEventListener('submit', function(event) {
            event.preventDefault();
            processFormSubmission('snitch');
        });
    }
    
    // Gestión de cambio en apuestas de puntuación
    if (scoreForm) {
        const homeScoreInput = scoreForm.querySelector('#score-home');
        const awayScoreInput = scoreForm.querySelector('#score-away');
        const amountInput = scoreForm.querySelector('#score-amount');
        
        [homeScoreInput, awayScoreInput, amountInput].forEach(input => {
            input.addEventListener('input', updateScoreBet);
        });
        
        function updateScoreBet() {
            const homeScore = homeScoreInput.value;
            const awayScore = awayScoreInput.value;
            const homeTeam = 'Gryffindor'; // En una aplicación real, estos valores vendrían del backend
            const awayTeam = 'Slytherin';
            const quota = document.querySelector('#score-bet .quota-info strong').textContent;
            const amount = amountInput.value;
            
            updateBettingSummary('score', `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`, quota, amount);
        }
        
        // Inicializar el resumen con los valores predeterminados
        updateScoreBet();
        
        // Procesar el envío del formulario
        scoreForm.addEventListener('submit', function(event) {
            event.preventDefault();
            processFormSubmission('score');
        });
    }
    
    // Gestión de cambio en apuestas de tiempo
    if (timeForm) {
        const timeOptions = timeForm.querySelectorAll('input[name="time-range"]');
        const amountInput = timeForm.querySelector('#time-amount');
        
        timeOptions.forEach(option => {
            option.addEventListener('change', updateTimeBet);
        });
        
        amountInput.addEventListener('input', updateTimeBet);
        
        function updateTimeBet() {
            const selectedTime = timeForm.querySelector('input[name="time-range"]:checked');
            if (!selectedTime) return;
            
            const timeOption = selectedTime.closest('.time-option');
            const timeRange = timeOption.querySelector('span').textContent;
            const quota = timeOption.querySelector('.quota').textContent;
            const amount = amountInput.value;
            
            updateBettingSummary('time', timeRange, quota, amount);
        }
        
        // Inicializar el resumen con los valores predeterminados
        updateTimeBet();
        
        // Procesar el envío del formulario
        timeForm.addEventListener('submit', function(event) {
            event.preventDefault();
            processFormSubmission('time');
        });
    }
    
    // Gestión de cambio en apuestas especiales
    if (specialForm) {
        const specialOptions = specialForm.querySelectorAll('input[name="special-event"]');
        const amountInput = specialForm.querySelector('#special-amount');
        
        specialOptions.forEach(option => {
            option.addEventListener('change', updateSpecialBet);
        });
        
        amountInput.addEventListener('input', updateSpecialBet);
        
        function updateSpecialBet() {
            const selectedSpecial = specialForm.querySelector('input[name="special-event"]:checked');
            if (!selectedSpecial) return;
            
            const specialOption = selectedSpecial.closest('.special-option');
            const specialEvent = specialOption.querySelector('span').textContent;
            const quota = specialOption.querySelector('.quota').textContent;
            const amount = amountInput.value;
            
            updateBettingSummary('special', specialEvent, quota, amount);
        }
        
        // Inicializar el resumen con los valores predeterminados
        updateSpecialBet();
        
        // Procesar el envío del formulario
        specialForm.addEventListener('submit', function(event) {
            event.preventDefault();
            processFormSubmission('special');
        });
    }
    
    // Función para procesar el envío de cualquier formulario de apuesta
    function processFormSubmission(betType) {
        // Obtener los valores del resumen
        const selection = document.getElementById(`${betType}-bet-summary`).textContent;
        const amount = document.querySelector(`#${betType}-amount`).value;
        const quota = document.getElementById(`${betType}-quota-summary`).textContent;
        const potentialWin = document.getElementById(`${betType}-potential-win`).textContent;
        
        // En una aplicación real, aquí se enviarían los datos al servidor
        console.log(`Procesando apuesta de tipo ${betType}`);
        console.log(`Selección: ${selection}, Monto: ${amount}, Cuota: ${quota}, Ganancia potencial: ${potentialWin}`);
        
        // Actualizar el modal con los valores de la apuesta
        document.getElementById('result-bet-type').textContent = getBetTypeName(betType);
        document.getElementById('result-bet-selection').textContent = selection;
        document.getElementById('result-bet-amount').textContent = `${amount} G`;
        document.getElementById('result-potential-win').textContent = potentialWin;
        
        // Mostrar el modal
        bettingResultModal.classList.remove('hidden');
    }
    
    // Función para obtener el nombre amigable del tipo de apuesta
    function getBetTypeName(betType) {
        const betTypes = {
            'winner': 'Ganador',
            'snitch': 'Captura de Snitch',
            'score': 'Puntuación',
            'time': 'Tiempo',
            'special': 'Especial'
        };
        
        return betTypes[betType] || betType;
    }
    
    // Cerrar el modal al hacer clic en X
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            bettingResultModal.classList.add('hidden');
        });
    }
    
    // Cerrar el modal al hacer clic fuera de él
    window.addEventListener('click', (event) => {
        if (event.target === bettingResultModal) {
            bettingResultModal.classList.add('hidden');
        }
    });
});