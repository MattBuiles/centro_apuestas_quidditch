import { useState, useEffect, useMemo } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { apiClient } from '@/utils/apiClient';
import styles from './AdminBetsStatistics.module.css';

interface BetRecord {
  id: number;
  userId: string;
  username: string;
  matchId: number;
  matchName: string;
  prediction: string;
  amount: number;
  odds: number;
  potentialWin: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  placedAt: string;
  resolvedAt?: string;
}

interface FilterOptions {
  status: string;
  dateFrom: string;
  dateTo: string;
  user: string;
}

interface ChartData {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

interface DailyStats {
  date: string;
  totalBets: number;
  totalAmount: number;
  wonBets: number;
  lostBets: number;
}

const AdminBetsStatistics = () => {
  const [bets, setBets] = useState<BetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    user: 'all'
  });

  useEffect(() => {
    loadBetsData();
  }, []);

  const loadBetsData = async () => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Extended mock data for better statistics
    const mockBets: BetRecord[] = [
      {
        id: 1,
        userId: 'user_001',
        username: 'HermioneGranger91',
        matchId: 101,
        matchName: 'Gryffindor vs Slytherin',
        prediction: 'Gryffindor',
        amount: 150,
        odds: 1.8,
        potentialWin: 270,
        status: 'won',
        placedAt: '2025-06-20 14:30:00',
        resolvedAt: '2025-06-20 16:45:00',
      },
      {
        id: 2,
        userId: 'user_002',
        username: 'RonWeasley22',
        matchId: 102,
        matchName: 'Hufflepuff vs Ravenclaw',
        prediction: 'Hufflepuff',
        amount: 75,
        odds: 2.1,
        potentialWin: 157.5,
        status: 'lost',
        placedAt: '2025-06-19 13:15:00',
        resolvedAt: '2025-06-19 15:30:00',
      },
      {
        id: 3,
        userId: 'user_003',
        username: 'LunaLovegood',
        matchId: 103,
        matchName: 'Gryffindor vs Hufflepuff',
        prediction: 'Empate',
        amount: 200,
        odds: 3.2,
        potentialWin: 640,
        status: 'pending',
        placedAt: '2025-06-21 10:00:00',
      },
      {
        id: 4,
        userId: 'user_004',
        username: 'NevilleLongbottom',
        matchId: 101,
        matchName: 'Gryffindor vs Slytherin',
        prediction: 'Slytherin',
        amount: 100,
        odds: 2.5,
        potentialWin: 250,
        status: 'lost',
        placedAt: '2025-06-18 14:00:00',
        resolvedAt: '2025-06-18 16:45:00',
      },
      {
        id: 5,
        userId: 'user_005',
        username: 'GinnyWeasley',
        matchId: 104,
        matchName: 'Ravenclaw vs Slytherin',
        prediction: 'Ravenclaw',
        amount: 125,
        odds: 1.9,
        potentialWin: 237.5,
        status: 'won',
        placedAt: '2025-06-17 09:30:00',
        resolvedAt: '2025-06-17 11:45:00',
      },
      {
        id: 6,
        userId: 'user_006',
        username: 'DracoMalfoy',
        matchId: 102,
        matchName: 'Hufflepuff vs Ravenclaw',
        prediction: 'Ravenclaw',
        amount: 300,
        odds: 1.7,
        potentialWin: 510,
        status: 'won',
        placedAt: '2025-06-16 12:45:00',
        resolvedAt: '2025-06-16 15:30:00',
      },
      {
        id: 7,
        userId: 'user_007',
        username: 'CedricDiggory',
        matchId: 105,
        matchName: 'Hufflepuff vs Gryffindor',
        prediction: 'Hufflepuff',
        amount: 180,
        odds: 2.3,
        potentialWin: 414,
        status: 'cancelled',
        placedAt: '2025-06-15 16:20:00',
      },
      {
        id: 8,
        userId: 'user_008',
        username: 'ChoChang',
        matchId: 106,
        matchName: 'Ravenclaw vs Gryffindor',
        prediction: 'Ravenclaw',
        amount: 95,
        odds: 2.8,
        potentialWin: 266,
        status: 'won',
        placedAt: '2025-06-14 11:15:00',
        resolvedAt: '2025-06-14 14:00:00',
      },
      {
        id: 9,
        userId: 'user_001',
        username: 'HermioneGranger91',
        matchId: 107,
        matchName: 'Slytherin vs Hufflepuff',
        prediction: 'Slytherin',
        amount: 225,
        odds: 1.6,
        potentialWin: 360,
        status: 'lost',
        placedAt: '2025-06-13 15:20:00',
        resolvedAt: '2025-06-13 17:30:00',
      },
      {
        id: 10,
        userId: 'user_009',
        username: 'SeamusFinigan',
        matchId: 108,
        matchName: 'Gryffindor vs Ravenclaw',
        prediction: 'Gryffindor',
        amount: 50,
        odds: 2.0,
        potentialWin: 100,
        status: 'won',
        placedAt: '2025-06-12 16:45:00',
        resolvedAt: '2025-06-12 19:00:00',
      },
      {
        id: 11,
        userId: 'user_010',
        username: 'DeanThomas',
        matchId: 109,
        matchName: 'Hufflepuff vs Slytherin',
        prediction: 'Empate',
        amount: 80,
        odds: 3.5,
        potentialWin: 280,
        status: 'lost',
        placedAt: '2025-06-11 14:30:00',
        resolvedAt: '2025-06-11 16:45:00',
      },
      {
        id: 12,
        userId: 'user_002',
        username: 'RonWeasley22',
        matchId: 110,
        matchName: 'Ravenclaw vs Hufflepuff',
        prediction: 'Hufflepuff',
        amount: 120,
        odds: 2.2,
        potentialWin: 264,
        status: 'won',
        placedAt: '2025-06-10 13:15:00',
        resolvedAt: '2025-06-10 15:30:00',
      },
      {
        id: 13,
        userId: 'user_006',
        username: 'DracoMalfoy',
        matchId: 111,
        matchName: 'Gryffindor vs Slytherin',
        prediction: 'Slytherin',
        amount: 400,
        odds: 1.9,
        potentialWin: 760,
        status: 'pending',
        placedAt: '2025-06-22 10:00:00',
      },
      {
        id: 14,
        userId: 'user_011',
        username: 'PadmaPatil',
        matchId: 112,
        matchName: 'Ravenclaw vs Gryffindor',
        prediction: 'Ravenclaw',
        amount: 65,
        odds: 2.4,
        potentialWin: 156,
        status: 'lost',
        placedAt: '2025-06-09 12:30:00',
        resolvedAt: '2025-06-09 14:45:00',
      },
      {
        id: 15,
        userId: 'user_012',
        username: 'ParvatiPatil',
        matchId: 113,
        matchName: 'Hufflepuff vs Gryffindor',
        prediction: 'Gryffindor',
        amount: 110,
        odds: 1.8,
        potentialWin: 198,
        status: 'won',
        placedAt: '2025-06-08 15:45:00',
        resolvedAt: '2025-06-08 18:00:00',
      }
    ];

    setBets(mockBets);
    setIsLoading(false);
  };

  // Filter bets based on time range and filters
  const filteredBets = useMemo(() => {
    let filtered = [...bets];
    
    // Time range filter
    const now = new Date();
    const timeRanges = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      'all': null
    };
    
    const daysBack = timeRanges[selectedTimeRange];
    if (daysBack) {
      const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(bet => new Date(bet.placedAt) >= cutoffDate);
    }
    
    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(bet => bet.status === filters.status);
    }
    
    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(bet => bet.placedAt >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(bet => bet.placedAt <= filters.dateTo + ' 23:59:59');
    }
    
    // User filter
    if (filters.user !== 'all') {
      filtered = filtered.filter(bet => bet.username === filters.user);
    }
    
    return filtered;
  }, [bets, selectedTimeRange, filters]);

  // Calculate comprehensive statistics
  const statistics = useMemo(() => {
    const resolvedBets = filteredBets.filter(bet => bet.status === 'won' || bet.status === 'lost');
    const wonBets = filteredBets.filter(bet => bet.status === 'won');
    const lostBets = filteredBets.filter(bet => bet.status === 'lost');
    const pendingBets = filteredBets.filter(bet => bet.status === 'pending');
    const cancelledBets = filteredBets.filter(bet => bet.status === 'cancelled');
    
    const totalAmount = filteredBets.reduce((sum, bet) => sum + bet.amount, 0);
    const wonAmount = wonBets.reduce((sum, bet) => sum + (bet.potentialWin - bet.amount), 0);
    const lostAmount = lostBets.reduce((sum, bet) => sum + bet.amount, 0);
    
    const winRate = resolvedBets.length > 0 ? (wonBets.length / resolvedBets.length) * 100 : 0;
    
    // User statistics
    const userStats = filteredBets.reduce((acc, bet) => {
      if (!acc[bet.username]) {
        acc[bet.username] = { count: 0, totalAmount: 0, won: 0, lost: 0 };
      }
      acc[bet.username].count++;
      acc[bet.username].totalAmount += bet.amount;
      if (bet.status === 'won') acc[bet.username].won++;
      if (bet.status === 'lost') acc[bet.username].lost++;
      return acc;
    }, {} as Record<string, any>);
    
    const topUsers = Object.entries(userStats)
      .map(([username, stats]) => ({ username, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Match statistics
    const matchStats = filteredBets.reduce((acc, bet) => {
      if (!acc[bet.matchName]) {
        acc[bet.matchName] = { count: 0, totalAmount: 0 };
      }
      acc[bet.matchName].count++;
      acc[bet.matchName].totalAmount += bet.amount;
      return acc;
    }, {} as Record<string, any>);
    
    const topMatches = Object.entries(matchStats)
      .map(([matchName, stats]) => ({ matchName, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Daily statistics for chart
    const dailyStats = filteredBets.reduce((acc, bet) => {
      const date = bet.placedAt.split(' ')[0];
      if (!acc[date]) {
        acc[date] = { date, totalBets: 0, totalAmount: 0, wonBets: 0, lostBets: 0 };
      }
      acc[date].totalBets++;
      acc[date].totalAmount += bet.amount;
      if (bet.status === 'won') acc[date].wonBets++;
      if (bet.status === 'lost') acc[date].lostBets++;
      return acc;
    }, {} as Record<string, DailyStats>);
    
    const dailyStatsArray = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      total: filteredBets.length,
      totalAmount,
      wonBets: wonBets.length,
      lostBets: lostBets.length,
      pendingBets: pendingBets.length,
      cancelledBets: cancelledBets.length,
      winRate,
      wonAmount,
      lostAmount,
      netProfit: wonAmount - lostAmount,
      averageBet: totalAmount / filteredBets.length || 0,
      topUsers,
      topMatches,
      dailyStats: dailyStatsArray
    };
  }, [filteredBets]);

  // Chart data for status distribution
  const statusChartData: ChartData[] = [
    {
      label: 'Ganadas',
      value: statistics.wonBets,
      percentage: statistics.total > 0 ? (statistics.wonBets / statistics.total) * 100 : 0,
      color: '#10b981'
    },
    {
      label: 'Perdidas',
      value: statistics.lostBets,
      percentage: statistics.total > 0 ? (statistics.lostBets / statistics.total) * 100 : 0,
      color: '#ef4444'
    },
    {
      label: 'Pendientes',
      value: statistics.pendingBets,
      percentage: statistics.total > 0 ? (statistics.pendingBets / statistics.total) * 100 : 0,
      color: '#f59e0b'
    },
    {
      label: 'Canceladas',
      value: statistics.cancelledBets,
      percentage: statistics.total > 0 ? (statistics.cancelledBets / statistics.total) * 100 : 0,
      color: '#6b7280'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getUniqueUsers = () => {
    const users = Array.from(new Set(bets.map(bet => bet.username))).sort();
    return users;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleIcon}>📊</span>
          Panel de Estadísticas de Apuestas
        </h1>
        <p className={styles.subtitle}>Análisis completo y visualización de datos en tiempo real</p>
      </div>

      {/* Time Range and Filters */}
      <Card className={styles.filtersCard}>
        <div className={styles.filtersHeader}>
          <h3 className={styles.filtersTitle}>
            <span className={styles.filterIcon}>🔍</span>
            Filtros y Período de Análisis
          </h3>
        </div>
        
        <div className={styles.filtersGrid}>
          <div className={styles.timeRangeGroup}>
            <label className={styles.filterLabel}>Período:</label>
            <div className={styles.timeRangeButtons}>
              {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  className={`${styles.timeRangeButton} ${selectedTimeRange === range ? styles.active : ''}`}
                  onClick={() => setSelectedTimeRange(range)}
                >
                  {range === '7d' && '7 días'}
                  {range === '30d' && '30 días'}
                  {range === '90d' && '90 días'}
                  {range === 'all' && 'Todo'}
                </button>
              ))}
            </div>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Estado:</label>
            <select
              className={styles.filterSelect}
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="won">Ganada</option>
              <option value="lost">Perdida</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Usuario:</label>
            <select
              className={styles.filterSelect}
              value={filters.user}
              onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
            >
              <option value="all">Todos los usuarios</option>
              {getUniqueUsers().map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Desde:</label>
            <input
              type="date"
              className={styles.filterInput}
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Hasta:</label>
            <input
              type="date"
              className={styles.filterInput}
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            />
          </div>
          
          <div className={styles.filterActions}>
            <Button 
              variant="outline" 
              onClick={() => setFilters({ status: 'all', dateFrom: '', dateTo: '', user: 'all' })}
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Statistics Cards */}
      <div className={styles.statsGrid}>
        <Card className={`${styles.statCard} ${styles.total}`}>
          <div className={styles.statIcon}>📈</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{statistics.total.toLocaleString()}</div>
            <div className={styles.statLabel}>Total Apuestas</div>
          </div>
          <div className={styles.statTrend}>+12% vs período anterior</div>
        </Card>
        
        <Card className={`${styles.statCard} ${styles.amount}`}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{formatCurrency(statistics.totalAmount)}</div>
            <div className={styles.statLabel}>Volumen Total</div>
          </div>
          <div className={styles.statTrend}>+8% vs período anterior</div>
        </Card>
        
        <Card className={`${styles.statCard} ${styles.winRate}`}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{formatPercentage(statistics.winRate)}</div>
            <div className={styles.statLabel}>Tasa de Acierto</div>
          </div>
          <div className={styles.statTrend}>+2.3% vs período anterior</div>
        </Card>
        
        <Card className={`${styles.statCard} ${styles.average}`}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{formatCurrency(statistics.averageBet)}</div>
            <div className={styles.statLabel}>Apuesta Promedio</div>
          </div>
          <div className={styles.statTrend}>-5% vs período anterior</div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsGrid}>
        {/* Status Distribution Chart */}
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            <span className={styles.chartIcon}>🥧</span>
            Distribución por Estado
          </h3>
          <div className={styles.pieChart}>
            <div className={styles.pieChartContainer}>
              <svg viewBox="0 0 200 200" className={styles.pieChartSvg}>
                {statusChartData.map((data, index) => {
                  const startAngle = statusChartData.slice(0, index).reduce((sum, d) => sum + (d.percentage * 360 / 100), 0);
                  const endAngle = startAngle + (data.percentage * 360 / 100);
                  const largeArcFlag = data.percentage > 50 ? 1 : 0;
                  
                  const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                  const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                  const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                  const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                  
                  const pathData = data.percentage > 0 
                    ? `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
                    : '';
                  
                  return (
                    <path
                      key={index}
                      d={pathData}
                      fill={data.color}
                      className={styles.pieSlice}
                    />
                  );
                })}
              </svg>
            </div>
            <div className={styles.chartLegend}>
              {statusChartData.map((data, index) => (
                <div key={index} className={styles.legendItem}>
                  <div 
                    className={styles.legendColor} 
                    style={{ backgroundColor: data.color }}
                  ></div>
                  <span className={styles.legendLabel}>
                    {data.label}: {data.value} ({formatPercentage(data.percentage)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Daily Volume Chart */}
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            <span className={styles.chartIcon}>📈</span>
            Volumen Diario de Apuestas
          </h3>
          <div className={styles.lineChart}>
            <div className={styles.chartContainer}>
              <svg viewBox="0 0 400 200" className={styles.chartSvg}>
                {/* Grid lines */}
                {[1, 2, 3, 4].map(i => (
                  <line
                    key={i}
                    x1="0"
                    y1={i * 40}
                    x2="400"
                    y2={i * 40}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                ))}
                
                {/* Chart line */}
                {statistics.dailyStats.length > 1 && (
                  <polyline
                    points={statistics.dailyStats.map((stat, index) => {
                      const x = (index / (statistics.dailyStats.length - 1)) * 380 + 10;
                      const maxAmount = Math.max(...statistics.dailyStats.map(s => s.totalAmount));
                      const y = 180 - (stat.totalAmount / maxAmount) * 160;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    className={styles.chartLine}
                  />
                )}
                
                {/* Data points */}
                {statistics.dailyStats.map((stat, index) => {
                  const x = (index / (statistics.dailyStats.length - 1)) * 380 + 10;
                  const maxAmount = Math.max(...statistics.dailyStats.map(s => s.totalAmount));
                  const y = 180 - (stat.totalAmount / maxAmount) * 160;
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#3b82f6"
                      className={styles.chartPoint}
                    />
                  );
                })}
              </svg>
            </div>
            <div className={styles.chartInfo}>
              <div className={styles.chartMetric}>
                <span className={styles.metricLabel}>Máximo diario:</span>
                <span className={styles.metricValue}>
                  {formatCurrency(Math.max(...statistics.dailyStats.map(s => s.totalAmount), 0))}
                </span>
              </div>
              <div className={styles.chartMetric}>
                <span className={styles.metricLabel}>Promedio diario:</span>
                <span className={styles.metricValue}>
                  {formatCurrency(statistics.dailyStats.reduce((sum, s) => sum + s.totalAmount, 0) / statistics.dailyStats.length || 0)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Users and Matches */}
      <div className={styles.topListsGrid}>
        <Card className={styles.topListCard}>
          <h3 className={styles.topListTitle}>
            <span className={styles.topListIcon}>👑</span>
            Usuarios Más Activos
          </h3>
          <div className={styles.topList}>
            {statistics.topUsers.map((user, index) => (
              <div key={index} className={styles.topListItem}>
                <div className={styles.topListRank}>#{index + 1}</div>
                <div className={styles.topListInfo}>
                  <div className={styles.topListName}>{user.username}</div>
                  <div className={styles.topListStats}>
                    {user.count} apuestas • {formatCurrency(user.totalAmount)}
                  </div>
                </div>
                <div className={styles.topListMetric}>
                  <div className={styles.topListWinRate}>
                    {user.won + user.lost > 0 ? formatPercentage((user.won / (user.won + user.lost)) * 100) : '0%'} acierto
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className={styles.topListCard}>
          <h3 className={styles.topListTitle}>
            <span className={styles.topListIcon}>🏟️</span>
            Partidos Más Populares
          </h3>
          <div className={styles.topList}>
            {statistics.topMatches.map((match, index) => (
              <div key={index} className={styles.topListItem}>
                <div className={styles.topListRank}>#{index + 1}</div>
                <div className={styles.topListInfo}>
                  <div className={styles.topListName}>{match.matchName}</div>
                  <div className={styles.topListStats}>
                    {match.count} apuestas • {formatCurrency(match.totalAmount)}
                  </div>
                </div>
                <div className={styles.topListMetric}>
                  <div className={styles.topListAverage}>
                    {formatCurrency(match.totalAmount / match.count)} promedio
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Risk Analysis */}
      <Card className={styles.riskCard}>
        <h3 className={styles.riskTitle}>
          <span className={styles.riskIcon}>🚨</span>
          Análisis de Riesgo y Alertas
        </h3>
        <div className={styles.riskGrid}>
          <div className={styles.riskItem}>
            <div className={styles.riskLabel}>Apuestas de Alto Riesgo</div>
            <div className={styles.riskValue}>
              {filteredBets.filter(bet => bet.amount > 300).length}
            </div>
            <div className={styles.riskDescription}>Apuestas &gt; $300.000</div>
          </div>
          <div className={styles.riskItem}>
            <div className={styles.riskLabel}>Usuarios Hiperactivos</div>
            <div className={styles.riskValue}>
              {statistics.topUsers.filter(user => user.count > 5).length}
            </div>
            <div className={styles.riskDescription}>Más de 5 apuestas</div>
          </div>
          <div className={styles.riskItem}>
            <div className={styles.riskLabel}>Ratio Ganancia/Pérdida</div>
            <div className={styles.riskValue}>
              {statistics.lostAmount > 0 ? (statistics.wonAmount / statistics.lostAmount).toFixed(2) : '∞'}
            </div>
            <div className={styles.riskDescription}>Índice de rentabilidad</div>
          </div>
          <div className={styles.riskItem}>
            <div className={styles.riskLabel}>Beneficio Neto</div>
            <div className={`${styles.riskValue} ${statistics.netProfit >= 0 ? styles.positive : styles.negative}`}>
              {formatCurrency(statistics.netProfit)}
            </div>
            <div className={styles.riskDescription}>Ganancia - Pérdida</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminBetsStatistics;
