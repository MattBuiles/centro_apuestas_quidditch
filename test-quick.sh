#!/bin/bash

echo "🚀 Testing Quidditch Backend - Teams & Players"
echo "=============================================="
echo ""

# Verificar si el servidor está corriendo
echo "📡 Checking if backend is running on port 3001..."
if curl -s http://localhost:3001/api/teams > /dev/null; then
    echo "✅ Backend is running!"
else
    echo "❌ Backend is not running. Please start it with:"
    echo "   cd backend && npm run dev"
    exit 1
fi

echo ""
echo "🧪 Running API Tests..."
echo "----------------------"

# Test 1: Get all teams
echo ""
echo "📋 Test 1: Getting all teams..."
curl -s http://localhost:3001/api/teams | jq '.data | length' | xargs echo "Found teams:"

# Test 2: Get Gryffindor details
echo ""
echo "🏠 Test 2: Getting Gryffindor details..."
curl -s http://localhost:3001/api/teams/gryffindor | jq '.data | "Team: " + .name + " | Players: " + (.players | length | tostring) + " | Starters: " + (.startingLineup | length | tostring)'

# Test 3: Get Gryffindor players
echo ""
echo "👥 Test 3: Gryffindor players by position..."
curl -s http://localhost:3001/api/teams/gryffindor/players | jq '.data | group_by(.position) | map({position: .[0].position, count: length, starters: [.[] | select(.is_starting) | .name]}) | .[]'

# Test 4: Get starting lineup
echo ""
echo "⚡ Test 4: Gryffindor starting lineup..."
curl -s http://localhost:3001/api/teams/gryffindor/lineup | jq '.data[] | .position + ": " + .name + " (Skill: " + (.skill_level | tostring) + ")"'

# Test 5: Get seekers
echo ""
echo "🎯 Test 5: Gryffindor seekers..."
curl -s http://localhost:3001/api/teams/gryffindor/players/seeker | jq '.data[] | .name + " - Skill: " + (.skill_level | tostring) + if .is_starting then " (STARTER)" else "" end'

# Test 6: Get matches
echo ""
echo "⚽ Test 6: Getting matches..."
MATCH_ID=$(curl -s http://localhost:3001/api/matches | jq -r '.data[0].id')
if [ "$MATCH_ID" != "null" ]; then
    echo "Testing lineups for match: $MATCH_ID"
    curl -s http://localhost:3001/api/matches/$MATCH_ID/lineups | jq '.data | "Home: " + (.homeTeam.lineup | length | tostring) + " players | Away: " + (.awayTeam.lineup | length | tostring) + " players"'
else
    echo "No matches found"
fi

echo ""
echo "🎉 All tests completed!"
echo ""
echo "📊 Quick Summary:"
echo "- Teams: Should have 6 teams"
echo "- Players: Each team should have 11 players"
echo "- Starters: Each team should have 7 starters"
echo "- Positions: 1 keeper, 1 seeker, 2 beaters, 3 chasers"
echo ""
echo "🎮 Ready for frontend integration!"
