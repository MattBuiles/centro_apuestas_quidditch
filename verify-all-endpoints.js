#!/usr/bin/env node

// Verificación completa de todos los endpoints críticos
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function login() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Login successful');
    return data.token;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

async function testEndpoint(endpoint, method = 'GET', token = null, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`${endpoint} failed: ${error.message}`);
  }
}

async function main() {
  console.log('🔍 Verificando todos los endpoints críticos...\n');

  try {
    // 1. Login
    const token = await login();

    // 2. Health check
    try {
      const health = await testEndpoint('/health');
      console.log('✅ Health check OK');
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
    }

    // 3. Get league time status
    try {
      const status = await testEndpoint('/api/league-time/status', 'GET', token);
      console.log('✅ League time status OK');
      console.log(`   📅 Current date: ${status.currentDate}`);
      console.log(`   🏆 Active season: ${status.activeSeasonId}`);
    } catch (error) {
      console.error('❌ League time status failed:', error.message);
    }

    // 4. Get next match
    try {
      const nextMatch = await testEndpoint('/api/league-time/next-match', 'GET', token);
      console.log('✅ Next match endpoint OK');
      if (nextMatch.match) {
        console.log(`   ⚽ Next match: ${nextMatch.match.home_team} vs ${nextMatch.match.away_team}`);
        console.log(`   📅 Date: ${nextMatch.match.match_date}`);
      } else {
        console.log('   ℹ️  No next match found');
      }
    } catch (error) {
      console.error('❌ Next match endpoint failed:', error.message);
    }

    // 5. Get live matches
    try {
      const liveMatches = await testEndpoint('/api/league-time/live-matches', 'GET', token);
      console.log('✅ Live matches endpoint OK');
      console.log(`   🔴 Live matches count: ${liveMatches.matches ? liveMatches.matches.length : 0}`);
    } catch (error) {
      console.error('❌ Live matches endpoint failed:', error.message);
    }

    // 6. Get matches
    try {
      const matches = await testEndpoint('/api/matches', 'GET', token);
      console.log('✅ Matches endpoint OK');
      console.log(`   📊 Total matches: ${matches.length || 0}`);
    } catch (error) {
      console.error('❌ Matches endpoint failed:', error.message);
    }

    // 7. Get teams
    try {
      const teams = await testEndpoint('/api/teams', 'GET', token);
      console.log('✅ Teams endpoint OK');
      console.log(`   🏟️  Total teams: ${teams.length || 0}`);
    } catch (error) {
      console.error('❌ Teams endpoint failed:', error.message);
    }

    // 8. Get standings
    try {
      const standings = await testEndpoint('/api/standings', 'GET', token);
      console.log('✅ Standings endpoint OK');
      console.log(`   📈 Standings entries: ${standings.length || 0}`);
    } catch (error) {
      console.error('❌ Standings endpoint failed:', error.message);
    }

    console.log('\n🎉 Verificación completa terminada!');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    process.exit(1);
  }
}

main();
