// This file simulates API calls for fetching match data and user information.

const apiUrl = 'https://api.quidditch-betting-system.com';

// Fetch recent matches
async function fetchRecentMatches() {
    try {
        const response = await fetch(`${apiUrl}/matches/recent`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const matches = await response.json();
        return matches;
    } catch (error) {
        console.error('Error fetching recent matches:', error);
    }
}

// Fetch team information
async function fetchTeams() {
    try {
        const response = await fetch(`${apiUrl}/teams`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const teams = await response.json();
        return teams;
    } catch (error) {
        console.error('Error fetching teams:', error);
    }
}

// Fetch user information
async function fetchUserInfo(userId) {
    try {
        const response = await fetch(`${apiUrl}/users/${userId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const userInfo = await response.json();
        return userInfo;
    } catch (error) {
        console.error('Error fetching user information:', error);
    }
}

// Simulate placing a bet
async function placeBet(betDetails) {
    try {
        const response = await fetch(`${apiUrl}/bets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(betDetails),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error placing bet:', error);
    }
}