// Test script to verify team performance data
const testTeamPerformance = () => {
  console.log('🏆 Testing Team Performance Logic');
  
  // Simulate team data
  const mockTeams = [
    { id: 1, name: 'Gryffindor', house_color: '#D2001F' },
    { id: 2, name: 'Slytherin', house_color: '#1F5F3F' },
    { id: 3, name: 'Ravenclaw', house_color: '#0D4F8C' },
    { id: 4, name: 'Hufflepuff', house_color: '#F0C75E' }
  ];

  // Simulate bet stats for each team
  const mockBetStats = [
    { teamId: 1, totalBets: 45, wonBets: 23, totalVolume: 1250 },
    { teamId: 2, totalBets: 38, wonBets: 22, totalVolume: 1100 },
    { teamId: 3, totalBets: 32, wonBets: 15, totalVolume: 890 },
    { teamId: 4, totalBets: 28, wonBets: 12, totalVolume: 750 }
  ];

  const teamPerformance = mockTeams.map(team => {
    const stats = mockBetStats.find(s => s.teamId === team.id) || { totalBets: 0, wonBets: 0, totalVolume: 0 };
    
    return {
      teamName: team.name,
      teamColor: team.house_color,
      totalBets: stats.totalBets,
      wonBets: stats.wonBets,
      winRate: stats.totalBets > 0 ? (stats.wonBets / stats.totalBets) * 100 : 0,
      totalVolume: stats.totalVolume
    };
  });

  console.log('📊 Team Performance Results:');
  teamPerformance.forEach(team => {
    console.log(`🏠 ${team.teamName}: ${team.winRate.toFixed(1)}% win rate, ${team.totalBets} bets, $${team.totalVolume}`);
  });

  return teamPerformance;
};

// Test user segmentation (without VIP)
const testUserSegmentation = () => {
  console.log('\n👥 Testing User Segmentation (No VIP)');
  
  // Simulate user data
  const mockUsers = [
    { id: 1, totalAmount: 250, avgAmount: 25 }, // Active
    { id: 2, totalAmount: 150, avgAmount: 15 }, // Active
    { id: 3, totalAmount: 75, avgAmount: 12 },  // Regular
    { id: 4, totalAmount: 45, avgAmount: 8 },   // Regular
    { id: 5, totalAmount: 15, avgAmount: 3 },   // Inactive
    { id: 6, totalAmount: 5, avgAmount: 1 }     // Inactive
  ];

  const activeUsers = mockUsers.filter(user => user.totalAmount >= 100);
  const regularUsers = mockUsers.filter(user => user.totalAmount >= 20 && user.totalAmount < 100);
  const inactiveUsers = mockUsers.filter(user => user.totalAmount < 20);

  const segments = [
    {
      segment: 'Activos',
      userCount: activeUsers.length,
      avgBetAmount: activeUsers.length > 0 ? activeUsers.reduce((sum, user) => sum + user.avgAmount, 0) / activeUsers.length : 0,
      totalVolume: activeUsers.reduce((sum, user) => sum + user.totalAmount, 0),
      color: '#10B981'
    },
    {
      segment: 'Regulares',
      userCount: regularUsers.length,
      avgBetAmount: regularUsers.length > 0 ? regularUsers.reduce((sum, user) => sum + user.avgAmount, 0) / regularUsers.length : 0,
      totalVolume: regularUsers.reduce((sum, user) => sum + user.totalAmount, 0),
      color: '#3B82F6'
    },
    {
      segment: 'Inactivos',
      userCount: inactiveUsers.length,
      avgBetAmount: inactiveUsers.length > 0 ? inactiveUsers.reduce((sum, user) => sum + user.avgAmount, 0) / inactiveUsers.length : 0,
      totalVolume: inactiveUsers.reduce((sum, user) => sum + user.totalAmount, 0),
      color: '#6B7280'
    }
  ];

  console.log('📊 User Segmentation Results:');
  segments.forEach(segment => {
    console.log(`👥 ${segment.segment}: ${segment.userCount} users, avg bet: $${segment.avgBetAmount.toFixed(2)}, total: $${segment.totalVolume}`);
  });

  return segments;
};

testTeamPerformance();
testUserSegmentation();
