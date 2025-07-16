import { Router } from 'express';
import { Database } from '../database/Database';
import { SeasonController } from '../controllers/SeasonController';
import { TeamTitlesService } from '../services/TeamTitlesService';

interface TeamRow {
  colors?: string;
  achievements?: string;
  wins?: number;
  draws?: number;
  losses?: number;
  [key: string]: unknown;
}

interface PlayerRow {
  id: string;
  name: string;
  position: string;
  achievements?: string;
  skill_level: number;
  is_starting: boolean;
  number?: number;
  years_active?: number;
  [key: string]: unknown;
}

interface RivalryRow {
  opponent_id: string;
  opponent_name: string;
  total_matches: number;
  wins: number;
  losses: number;
  draws: number;
  win_percentage: number;
  last_match_date?: string;
  last_match_result?: string;
  last_match_team_score?: number;
  last_match_opponent_score?: number;
  [key: string]: unknown;
}

interface HistoricalIdolRow {
  id: string;
  name: string;
  position: string;
  period: string;
  achievements?: string;
  description: string;
  legendary_stats: string;
  [key: string]: unknown;
}

interface MatchRow {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score?: number;
  away_score?: number;
  date: string;
  status: string;
  location?: string;
  home_team_name?: string;
  away_team_name?: string;
  [key: string]: unknown;
}

const router = Router();
const seasonController = new SeasonController();
const teamTitlesService = new TeamTitlesService();

// Get all teams
router.get('/', async (req, res) => {
  try {
    const db = Database.getInstance();
    const teams = await db.all('SELECT * FROM teams ORDER BY name');
    
    // Calculate points for each team and add to response
    const teamsWithPoints = teams.map(team => ({
      ...(team as object),
      points: ((team as TeamRow).wins || 0) * 3 + ((team as TeamRow).draws || 0) * 1
    }));
    
    res.json({
      success: true,
      data: teamsWithPoints,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Teams fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teams',
      timestamp: new Date().toISOString()
    });
  }
});

// Get cumulative stats for all teams from standings table (debe ir antes de /:id)
router.get('/cumulative-stats', seasonController.getCumulativeTeamStats);

// Get historical stats for all teams (debe ir antes de /:id)
router.get('/historical-stats', seasonController.getHistoricalTeamStats);

// Get team by ID with complete information
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const db = Database.getInstance();
    const teamId = req.params.id;
    
    // Get complete team information using the new methods
    const team = await db.getTeamStatistics(teamId);
    
    if (!team) {
      res.status(404).json({
        success: false,
        error: 'Team not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get team players and lineup
    const players = await db.getTeamPlayers(teamId);
    const startingLineup = await db.getTeamStartingLineup(teamId);

    // Get upcoming matches for this team
    const upcomingMatches = await db.getTeamUpcomingMatches(teamId, 5);
    
    // Get recent matches for this team
    const recentMatches = await db.getTeamRecentMatches(teamId, 5);
    
    // Get rivalries data
    const rivalries = await db.getTeamRivalries(teamId);
    
    // Get historical idols
    const historicalIdols = await db.getTeamHistoricalIdols(teamId);
    
    // Get team achievements from database
    const teamAchievements = await db.getTeamAchievements(teamId);

    // Calculate current league points from wins/draws/losses
    const currentLeaguePoints = ((team as TeamRow).wins || 0) * 3 + ((team as TeamRow).draws || 0) * 1;
    
    // Combine achievements from teams table and team_achievements table
    const baseAchievements = (team as TeamRow).achievements ? JSON.parse((team as TeamRow).achievements as string) : [];
    const dbAchievements = (teamAchievements as Array<{ title: string; description?: string; year?: number }>).map(ach => 
      ach.year ? `${ach.title} (${ach.year})` : ach.title
    );
    const combinedAchievements = [...baseAchievements, ...dbAchievements];
    
    // Parse JSON fields and transform data
    const teamData = {
      ...(team as object),
      colors: JSON.parse((team as TeamRow).colors || '[]'),
      achievements: combinedAchievements,
      
      // Add calculated league points
      points: currentLeaguePoints,
      
      // Complete roster with achievements parsed
      roster: players.map(player => ({
        id: (player as PlayerRow).id,
        name: (player as PlayerRow).name,
        position: (player as PlayerRow).position,
        number: (player as PlayerRow).number,
        yearsActive: (player as PlayerRow).years_active,
        achievements: JSON.parse((player as PlayerRow).achievements || '[]'),
        skillLevel: (player as PlayerRow).skill_level,
        isStarting: (player as PlayerRow).is_starting
      })),
      
      // Starting lineup
      startingLineup: startingLineup.map(player => ({
        id: (player as PlayerRow).id,
        name: (player as PlayerRow).name,
        position: (player as PlayerRow).position,
        number: (player as PlayerRow).number,
        yearsActive: (player as PlayerRow).years_active,
        achievements: JSON.parse((player as PlayerRow).achievements || '[]'),
        skillLevel: (player as PlayerRow).skill_level
      })),
      
      // Upcoming matches
      upcomingMatches: upcomingMatches.map(match => ({
        id: (match as MatchRow).id,
        opponent: (match as MatchRow).home_team_id === teamId ? 
          (match as MatchRow).away_team_name : 
          (match as MatchRow).home_team_name,
        date: (match as MatchRow).date,
        venue: (match as MatchRow).home_team_id === teamId ? 'Home' : 'Away',
        status: (match as MatchRow).status
      })),
      
      // Recent matches with results
      recentMatches: recentMatches.map(match => {
        const isTeamHome = (match as MatchRow).home_team_id === teamId;
        const teamScore = isTeamHome ? 
          ((match as MatchRow).home_score || 0) : 
          ((match as MatchRow).away_score || 0);
        const opponentScore = isTeamHome ? 
          ((match as MatchRow).away_score || 0) : 
          ((match as MatchRow).home_score || 0);
        
        let result = 'draw';
        if (teamScore > opponentScore) result = 'win';
        else if (opponentScore > teamScore) result = 'loss';
        
        return {
          id: (match as MatchRow).id,
          opponent: isTeamHome ? 
            (match as MatchRow).away_team_name : 
            (match as MatchRow).home_team_name,
          date: (match as MatchRow).date,
          venue: isTeamHome ? 'Home' : 'Away',
          result: result as 'win' | 'loss' | 'draw',
          score: `${teamScore}-${opponentScore}`
        };
      }),
      
      // Rivalries data
      rivalries: rivalries.map(rivalry => {
        const rivalryData = rivalry as RivalryRow;
        return {
          opponentId: rivalryData.opponent_id,
          opponentName: rivalryData.opponent_name,
          totalMatches: rivalryData.total_matches,
          wins: rivalryData.wins,
          losses: rivalryData.losses,
          draws: rivalryData.draws,
          winPercentage: rivalryData.win_percentage,
          lastMatch: rivalryData.last_match_date ? {
            date: rivalryData.last_match_date,
            result: rivalryData.last_match_result,
            score: `${rivalryData.last_match_team_score}-${rivalryData.last_match_opponent_score}`
          } : null
        };
      }),
      
      // Historical idols
      historicalIdols: historicalIdols.map(idol => {
        const idolData = idol as HistoricalIdolRow;
        return {
          id: idolData.id,
          name: idolData.name,
          position: idolData.position,
          period: idolData.period,
          achievements: JSON.parse(idolData.achievements || '[]'),
          description: idolData.description,
          legendaryStats: idolData.legendary_stats
        };
      }),
      
      // Team titles (calculated dynamically)
      titles: await teamTitlesService.calculateTeamTitles(teamId)
    };

    res.json({
      success: true,
      data: teamData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Team fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team',
      timestamp: new Date().toISOString()
    });
  }
});

// Get team players
router.get('/:id/players', async (req, res): Promise<void> => {
  try {
    const db = Database.getInstance();
    const teamId = req.params.id;
    
    const players = await db.getTeamPlayers(teamId);
    
    // Parse JSON achievements for each player
    const playersData = players.map(player => ({
      ...(player as object),
      achievements: JSON.parse((player as PlayerRow).achievements || '[]')
    }));

    res.json({
      success: true,
      data: playersData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Team players fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team players',
      timestamp: new Date().toISOString()
    });
  }
});

// Get team starting lineup
router.get('/:id/lineup', async (req, res): Promise<void> => {
  try {
    const db = Database.getInstance();
    const teamId = req.params.id;
    
    const lineup = await db.getTeamStartingLineup(teamId);
    
    // Parse JSON achievements for each player
    const lineupData = lineup.map(player => ({
      ...(player as object),
      achievements: JSON.parse((player as PlayerRow).achievements || '[]')
    }));

    res.json({
      success: true,
      data: lineupData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Team lineup fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team lineup',
      timestamp: new Date().toISOString()
    });
  }
});

// Get players by position
router.get('/:id/players/:position', async (req, res): Promise<void> => {
  try {
    const db = Database.getInstance();
    const { id: teamId, position } = req.params;
    
    // Validate position
    const validPositions = ['keeper', 'seeker', 'beater', 'chaser'];
    if (!validPositions.includes(position)) {
      res.status(400).json({
        success: false,
        error: 'Invalid position. Must be one of: keeper, seeker, beater, chaser',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    const players = await db.getPlayersByPosition(teamId, position);
    
    // Parse JSON achievements for each player
    const playersData = players.map(player => ({
      ...(player as object),
      achievements: JSON.parse((player as PlayerRow).achievements || '[]')
    }));

    res.json({
      success: true,
      data: playersData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Team position players fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch players by position',
      timestamp: new Date().toISOString()
    });
  }
});

// Get historical stats for specific team
router.get('/:teamId/historical-stats', seasonController.getTeamHistoricalStats);

// Get head-to-head history between two teams
router.get('/:teamId/vs/:opponentId', async (req, res): Promise<void> => {
  try {
    const db = Database.getInstance();
    const { teamId, opponentId } = req.params;
    
    // Get all matches between the two teams
    const matches = await db.all(`
      SELECT 
        m.*,
        ht.name as home_team_name,
        at.name as away_team_name
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE 
        ((m.home_team_id = ? AND m.away_team_id = ?) OR
        (m.home_team_id = ? AND m.away_team_id = ?))
        AND m.status = 'finished'
      ORDER BY m.date DESC
    `, [teamId, opponentId, opponentId, teamId]) as MatchRow[];
    
    // Calculate head-to-head statistics
    let teamWins = 0;
    let opponentWins = 0;
    let draws = 0;
    let totalMatches = 0;
    let teamTotalPoints = 0;
    let opponentTotalPoints = 0;
    let teamSnitchCatches = 0;
    let opponentSnitchCatches = 0;
    
    const recentMatches = matches.slice(0, 5).map(match => {
      const isTeamHome = match.home_team_id === teamId;
      const teamScore = isTeamHome ? (match.home_score || 0) : (match.away_score || 0);
      const opponentScore = isTeamHome ? (match.away_score || 0) : (match.home_score || 0);
      
      // Update totals
      totalMatches++;
      teamTotalPoints += teamScore;
      opponentTotalPoints += opponentScore;
      
      // Determine winner
      let result = 'D'; // Draw
      if (teamScore > opponentScore) {
        teamWins++;
        result = 'W';
      } else if (opponentScore > teamScore) {
        opponentWins++;
        result = 'L';
      } else {
        draws++;
      }
      
      // Count snitch catches (games with scores >= 150 typically indicate snitch catch)
      if (teamScore >= 150) teamSnitchCatches++;
      if (opponentScore >= 150) opponentSnitchCatches++;
      
      return {
        id: match.id,
        result,
        teamScore,
        opponentScore,
        date: match.date,
        venue: isTeamHome ? 'Home' : 'Away',
        status: match.status
      };
    });
    
    // Calculate averages
    const teamAvgPoints = totalMatches > 0 ? Math.round(teamTotalPoints / totalMatches) : 0;
    const opponentAvgPoints = totalMatches > 0 ? Math.round(opponentTotalPoints / totalMatches) : 0;
    
    // Count high-scoring games (>200 points)
    const teamHighScoring = matches.filter(m => {
      const isTeamHome = m.home_team_id === teamId;
      const teamScore = isTeamHome ? (m.home_score || 0) : (m.away_score || 0);
      return teamScore > 200 && m.status === 'finished';
    }).length;
    
    const opponentHighScoring = matches.filter(m => {
      const isTeamHome = m.home_team_id === teamId;
      const opponentScore = isTeamHome ? (m.away_score || 0) : (m.home_score || 0);
      return opponentScore > 200 && m.status === 'finished';
    }).length;
    
    // Find legendary matches (highest scoring, closest games, etc.)
    const legendaryMatches = matches
      .filter(m => (m.home_score || 0) > 0 && (m.away_score || 0) > 0 && m.status === 'finished')
      .sort((a, b) => {
        const totalA = (a.home_score || 0) + (a.away_score || 0);
        const totalB = (b.home_score || 0) + (b.away_score || 0);
        return totalB - totalA;
      })
      .slice(0, 3)
      .map(match => {
        const isTeamHome = match.home_team_id === teamId;
        const teamScore = isTeamHome ? (match.home_score || 0) : (match.away_score || 0);
        const opponentScore = isTeamHome ? (match.away_score || 0) : (match.home_score || 0);
        const totalPoints = teamScore + opponentScore;
        
        return {
          id: match.id,
          date: match.date,
          teamScore,
          opponentScore,
          venue: match.location || 'Unknown',
          description: `Partido épico con ${totalPoints} puntos totales`,
          title: totalPoints > 400 ? 'La Final de los Milenios' : 
                 Math.abs(teamScore - opponentScore) <= 10 ? 'El Duelo de los Rayos' :
                 'Encuentro Legendario'
        };
      });
    
    const headToHeadData = {
      totalMatches,
      teamWins,
      opponentWins,
      draws,
      recentMatches,
      statistics: {
        teamAvgPoints,
        opponentAvgPoints,
        teamSnitchCatches,
        opponentSnitchCatches,
        teamHighScoring,
        opponentHighScoring
      },
      legendaryMatches
    };
    
    res.json({
      success: true,
      data: headToHeadData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Head-to-head fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch head-to-head data',
      timestamp: new Date().toISOString()
    });
  }
});

// Get recent matches for a specific team
router.get('/:id/recent-matches', async (req, res): Promise<void> => {
  try {
    const db = Database.getInstance();
    const teamId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 5;
    
    // Get recent matches for the team
    const matches = await db.all(`
      SELECT 
        m.*,
        ht.name as home_team_name,
        at.name as away_team_name
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE 
        (m.home_team_id = ? OR m.away_team_id = ?)
        AND m.status = 'finished'
        AND m.home_score IS NOT NULL 
        AND m.away_score IS NOT NULL
      ORDER BY m.date DESC
      LIMIT ?
    `, [teamId, teamId, limit]) as MatchRow[];
    
    // Transform matches to the expected format
    const recentMatches = matches.map(match => {
      const isTeamHome = match.home_team_id === teamId;
      const teamScore = isTeamHome ? (match.home_score || 0) : (match.away_score || 0);
      const opponentScore = isTeamHome ? (match.away_score || 0) : (match.home_score || 0);
      
      // Determine result
      let result = 'D'; // Draw
      if (teamScore > opponentScore) {
        result = 'W';
      } else if (opponentScore > teamScore) {
        result = 'L';
      }
      
      // Calculate confidence based on margin of victory
      const scoreDifference = Math.abs(teamScore - opponentScore);
      let confidence = 70; // Base confidence
      if (scoreDifference > 100) confidence = 90; // Dominant win/loss
      else if (scoreDifference > 50) confidence = 80; // Comfortable margin
      else if (scoreDifference < 10) confidence = 60; // Close game
      
      return {
        id: match.id,
        result,
        teamScore,
        opponentScore,
        opponent: isTeamHome ? match.away_team_name : match.home_team_name,
        date: match.date,
        venue: isTeamHome ? 'Home' : 'Away',
        confidence
      };
    });
    
    res.json({
      success: true,
      data: recentMatches,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Recent matches fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent matches',
      timestamp: new Date().toISOString()
    });
  }
});

// Get team titles ranking
router.get('/titles/ranking', async (req, res): Promise<void> => {
  try {
    const ranking = await teamTitlesService.getTeamTitlesRanking();
    
    res.json({
      success: true,
      data: ranking,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Team titles ranking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team titles ranking',
      timestamp: new Date().toISOString()
    });
  }
});

// Get detailed title history for a team
router.get('/:id/titles/details', async (req, res): Promise<void> => {
  try {
    const teamId = req.params.id;
    const titleDetails = await teamTitlesService.getTeamTitleDetails(teamId);
    
    res.json({
      success: true,
      data: titleDetails,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Team title details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team title details',
      timestamp: new Date().toISOString()
    });
  }
});

// Administrative endpoint to clear mock titles
router.post('/titles/clear-mock', async (req, res): Promise<void> => {
  try {
    await teamTitlesService.clearMockTitles();
    
    res.json({
      success: true,
      message: 'Mock titles cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear mock titles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear mock titles',
      timestamp: new Date().toISOString()
    });
  }
});

// Administrative endpoint to update titles in database
router.post('/titles/update-database', async (req, res): Promise<void> => {
  try {
    await teamTitlesService.updateTeamTitlesInDatabase();
    
    res.json({
      success: true,
      message: 'Team titles updated in database successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update titles in database error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update titles in database',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
