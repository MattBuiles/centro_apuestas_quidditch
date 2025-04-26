// This file handles the display of matches and updates the leaderboard.

document.addEventListener('DOMContentLoaded', function() {
    const matchesContainer = document.getElementById('matches-container');
    const leaderboardContainer = document.getElementById('leaderboard-container');

    // Sample data for matches and leaderboard
    const matches = [
        { id: 1, teamA: 'Gryffindor', teamB: 'Slytherin', scoreA: 150, scoreB: 130, date: '2023-10-01' },
        { id: 2, teamA: 'Hufflepuff', teamB: 'Ravenclaw', scoreA: 120, scoreB: 140, date: '2023-10-02' },
    ];

    const leaderboard = [
        { team: 'Gryffindor', points: 10 },
        { team: 'Slytherin', points: 8 },
        { team: 'Hufflepuff', points: 6 },
        { team: 'Ravenclaw', points: 4 },
    ];

    function displayMatches() {
        matches.forEach(match => {
            const matchElement = document.createElement('div');
            matchElement.classList.add('match');
            matchElement.innerHTML = `
                <h3>${match.teamA} vs ${match.teamB}</h3>
                <p>Score: ${match.scoreA} - ${match.scoreB}</p>
                <p>Date: ${match.date}</p>
            `;
            matchesContainer.appendChild(matchElement);
        });
    }

    function displayLeaderboard() {
        leaderboard.forEach(entry => {
            const entryElement = document.createElement('div');
            entryElement.classList.add('leaderboard-entry');
            entryElement.innerHTML = `
                <h4>${entry.team}</h4>
                <p>Points: ${entry.points}</p>
            `;
            leaderboardContainer.appendChild(entryElement);
        });
    }

    displayMatches();
    displayLeaderboard();
});