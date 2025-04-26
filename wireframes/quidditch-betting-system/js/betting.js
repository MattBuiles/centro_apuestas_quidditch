// This file manages the betting functionality, including placing bets and validating input.

document.addEventListener('DOMContentLoaded', function() {
    const betForm = document.getElementById('bet-form');
    const betAmountInput = document.getElementById('bet-amount');
    const predictionInput = document.getElementById('prediction');
    const resultMessage = document.getElementById('result-message');

    betForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const betAmount = parseFloat(betAmountInput.value);
        const prediction = predictionInput.value;

        if (validateBet(betAmount, prediction)) {
            placeBet(betAmount, prediction);
        } else {
            resultMessage.textContent = 'Please enter a valid bet amount and prediction.';
            resultMessage.style.color = 'red';
        }
    });

    function validateBet(amount, prediction) {
        return amount > 0 && prediction.trim() !== '';
    }

    function placeBet(amount, prediction) {
        // Simulate placing a bet (this would normally involve an API call)
        resultMessage.textContent = `Bet of ${amount} on ${prediction} placed successfully!`;
        resultMessage.style.color = 'green';

        // Clear the input fields
        betAmountInput.value = '';
        predictionInput.value = '';
    }
});