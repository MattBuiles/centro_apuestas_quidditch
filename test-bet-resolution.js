/**
 * Test script para verificar la resolución de apuestas
 */

// Simular datos de prueba
const testMatchResult = {
  matchId: 'test-match-1',
  homeTeamId: 'gryffindor',
  awayTeamId: 'slytherin',
  homeTeamName: 'Gryffindor',
  awayTeamName: 'Slytherin',
  homeScore: 180,
  awayScore: 170,
  winner: 'home',
  snitchCaught: true,
  snitchCaughtBy: 'gryffindor',
  duration: 75,
  finalScore: {
    home: 180,
    away: 170
  }
};

const testBets = [
  {
    id: 'bet-1',
    userId: 'user1',
    matchId: 'test-match-1',
    matchName: 'Gryffindor vs Slytherin',
    options: [
      {
        id: 'winner-gryffindor',
        type: 'winner',
        selection: 'home',
        odds: 2.15,
        description: 'Gryffindor gana',
        matchId: 'test-match-1'
      }
    ],
    amount: 10,
    combinedOdds: 2.15,
    potentialWin: 21.5,
    date: '2025-06-23',
    status: 'active'
  },
  {
    id: 'bet-2',
    userId: 'user1',
    matchId: 'test-match-1',
    matchName: 'Gryffindor vs Slytherin',
    options: [
      {
        id: 'snitch-slytherin',
        type: 'snitch',
        selection: 'away',
        odds: 2.35,
        description: 'Slytherin captura la Snitch',
        matchId: 'test-match-1'
      }
    ],
    amount: 5,
    combinedOdds: 2.35,
    potentialWin: 11.75,
    date: '2025-06-23',
    status: 'active'
  }
];

console.log('🧪 Iniciando pruebas de resolución de apuestas...\n');

// Función para probar resolución individual
function testBetResolution(bet, matchResult) {
  console.log(`🎯 Probando apuesta: ${bet.options[0].description}`);
  console.log(`📊 Resultado del partido: ${matchResult.homeTeamName} ${matchResult.homeScore} - ${matchResult.awayScore} ${matchResult.awayTeamName}`);
  console.log(`🏆 Ganador: ${matchResult.winner === 'home' ? matchResult.homeTeamName : matchResult.awayTeamName}`);
  console.log(`✨ Snitch capturada por: ${matchResult.snitchCaughtBy === matchResult.homeTeamId ? matchResult.homeTeamName : matchResult.awayTeamName}`);
  
  const option = bet.options[0];
  let won = false;
  let reason = '';
  
  switch (option.type) {
    case 'winner':
      if (option.selection === 'home' && matchResult.winner === 'home') {
        won = true;
        reason = `✅ Correcto: ${matchResult.homeTeamName} ganó como predijiste`;
      } else if (option.selection === 'away' && matchResult.winner === 'away') {
        won = true;
        reason = `✅ Correcto: ${matchResult.awayTeamName} ganó como predijiste`;
      } else {
        won = false;
        reason = `❌ Incorrecto: Predijiste ${option.selection === 'home' ? matchResult.homeTeamName : matchResult.awayTeamName}, pero ganó ${matchResult.winner === 'home' ? matchResult.homeTeamName : matchResult.awayTeamName}`;
      }
      break;
      
    case 'snitch':
      const snitchWinner = matchResult.snitchCaughtBy === matchResult.homeTeamId ? 'home' : 'away';
      if (option.selection === snitchWinner) {
        won = true;
        reason = `✅ Correcto: ${snitchWinner === 'home' ? matchResult.homeTeamName : matchResult.awayTeamName} capturó la Snitch como predijiste`;
      } else {
        won = false;
        reason = `❌ Incorrecto: Predijiste que ${option.selection === 'home' ? matchResult.homeTeamName : matchResult.awayTeamName} capturaría la Snitch, pero la capturó ${snitchWinner === 'home' ? matchResult.homeTeamName : matchResult.awayTeamName}`;
      }
      break;
  }
  
  console.log(`🎲 Resultado: ${won ? 'GANASTE' : 'PERDISTE'}`);
  console.log(`💬 ${reason}`);
  if (won) {
    console.log(`💰 Ganancia: ${bet.potentialWin} Galeones`);
  }
  console.log('---');
  
  return { won, reason, winAmount: won ? bet.potentialWin : 0 };
}

// Ejecutar pruebas
testBets.forEach(bet => {
  testBetResolution(bet, testMatchResult);
});

console.log('✅ Pruebas completadas. Verifica que los resultados sean correctos.');
