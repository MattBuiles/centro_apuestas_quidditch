import { useState, useEffect, useMemo } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { apiClient } from '@/utils/apiClient';
import styles from './AdminBetsStatistics.module.css';

interface BetRecord {
  id: string;
  userId: string;
  username: string;
  matchId: string;
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
    
    try {
      // Fetch betting statistics from backend
      const betsResponse = await apiClient.get('/bets?limit=1000');
      
      if (betsResponse.success) {
        // Transform backend data to match frontend interface
        const backendBets = betsResponse.data?.data || [];
        const transformedBets: BetRecord[] = backendBets.map((bet: any) => ({
          id: bet.id,
          userId: bet.user_id,
          username: bet.username,
          matchId: bet.match_id,
          matchName: `${bet.homeTeamName} vs ${bet.awayTeamName}`,
          prediction: bet.prediction,
          amount: bet.amount,
          odds: bet.odds,
          potentialWin: bet.potential_win,
          status: bet.status,
          placedAt: bet.placed_at,
          resolvedAt: bet.resolved_at,
        }));
        
        setBets(transformedBets);
      } else {
        console.error('Failed to load betting data');
        setBets([]);
      }
    } catch (error) {
      console.error('Error loading betting data:', error);
      setBets([]);
    }
    
    setIsLoading(false);
  };

  // Filter bets based on time range and filters
  const filteredBets = useMemo(() => {
    let filtered = [...bets];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(bet => bet.status === filters.status);
    }

    // Filter by user
    if (filters.user !== 'all') {
      filtered = filtered.filter(bet => bet.username.toLowerCase().includes(filters.user.toLowerCase()));
    }

    // Filter by date range
    const now = new Date();
    let startDate: Date;

    switch (selectedTimeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    filtered = filtered.filter(bet => new Date(bet.placedAt) >= startDate);

    // Custom date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(bet => new Date(bet.placedAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(bet => new Date(bet.placedAt) <= new Date(filters.dateTo));
    }

    return filtered;
  }, [bets, filters, selectedTimeRange]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalBets = filteredBets.length;
    const totalAmount = filteredBets.reduce((sum, bet) => sum + bet.amount, 0);
    const wonBets = filteredBets.filter(bet => bet.status === 'won').length;
    const lostBets = filteredBets.filter(bet => bet.status === 'lost').length;
    const pendingBets = filteredBets.filter(bet => bet.status === 'pending').length;
    const totalWinnings = filteredBets
      .filter(bet => bet.status === 'won')
      .reduce((sum, bet) => sum + (bet.potentialWin - bet.amount), 0);
    const totalLosses = filteredBets
      .filter(bet => bet.status === 'lost')
      .reduce((sum, bet) => sum + bet.amount, 0);

    const winRate = totalBets > 0 ? ((wonBets / (wonBets + lostBets)) * 100) : 0;
    const avgBetAmount = totalBets > 0 ? totalAmount / totalBets : 0;

    return {
      totalBets,
      totalAmount,
      wonBets,
      lostBets,
      pendingBets,
      totalWinnings,
      totalLosses,
      netProfit: totalWinnings - totalLosses,
      winRate,
      avgBetAmount
    };
  }, [filteredBets]);

  // Chart data for bet status distribution
  const statusChartData: ChartData[] = useMemo(() => {
    const total = statistics.totalBets;
    return [
      {
        label: 'Ganadas',
        value: statistics.wonBets,
        percentage: total > 0 ? (statistics.wonBets / total) * 100 : 0,
        color: '#10B981'
      },
      {
        label: 'Perdidas',
        value: statistics.lostBets,
        percentage: total > 0 ? (statistics.lostBets / total) * 100 : 0,
        color: '#EF4444'
      },
      {
        label: 'Pendientes',
        value: statistics.pendingBets,
        percentage: total > 0 ? (statistics.pendingBets / total) * 100 : 0,
        color: '#F59E0B'
      }
    ];
  }, [statistics]);

  // Top users by total bet amount
  const topUsers = useMemo(() => {
    const userStats = filteredBets.reduce((acc, bet) => {
      if (!acc[bet.username]) {
        acc[bet.username] = {
          username: bet.username,
          totalBets: 0,
          totalAmount: 0,
          wonBets: 0,
          lostBets: 0,
        };
      }
      acc[bet.username].totalBets++;
      acc[bet.username].totalAmount += bet.amount;
      if (bet.status === 'won') acc[bet.username].wonBets++;
      if (bet.status === 'lost') acc[bet.username].lostBets++;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(userStats)
      .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }, [filteredBets]);

  // Most popular predictions
  const popularPredictions = useMemo(() => {
    const predictionStats = filteredBets.reduce((acc, bet) => {
      if (!acc[bet.prediction]) {
        acc[bet.prediction] = { count: 0, amount: 0 };
      }
      acc[bet.prediction].count++;
      acc[bet.prediction].amount += bet.amount;
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(predictionStats)
      .map(([prediction, stats]: [string, any]) => ({
        prediction,
        count: stats.count,
        amount: stats.amount,
        percentage: (stats.count / filteredBets.length) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredBets]);

  // Daily statistics for chart
  const dailyStats: DailyStats[] = useMemo(() => {
    const dailyData = filteredBets.reduce((acc, bet) => {
      const date = new Date(bet.placedAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          totalBets: 0,
          totalAmount: 0,
          wonBets: 0,
          lostBets: 0
        };
      }
      acc[date].totalBets++;
      acc[date].totalAmount += bet.amount;
      if (bet.status === 'won') acc[date].wonBets++;
      if (bet.status === 'lost') acc[date].lostBets++;
      return acc;
    }, {} as Record<string, DailyStats>);

    return Object.values(dailyData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredBets]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando estadísticas de apuestas...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminBetsStats}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.icon}>📊</span>
          Estadísticas de Apuestas
        </h1>
        <p className={styles.subtitle}>
          Análisis detallado del comportamiento de apuestas en la plataforma
        </p>
      </div>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <div className={styles.filtersHeader}>
          <h3>Filtros y Período</h3>
        </div>
        <div className={styles.filtersContent}>
          <div className={styles.timeRangeButtons}>
            {['7d', '30d', '90d', 'all'].map((range) => (
              <Button
                key={range}
                variant={selectedTimeRange === range ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedTimeRange(range as typeof selectedTimeRange)}
              >
                {range === '7d' ? '7 días' : range === '30d' ? '30 días' : range === '90d' ? '90 días' : 'Todo'}
              </Button>
            ))}
          </div>
          
          <div className={styles.filterInputs}>
            <div className={styles.filterGroup}>
              <label>Estado:</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className={styles.filterSelect}
              >
                <option value="all">Todos</option>
                <option value="won">Ganadas</option>
                <option value="lost">Perdidas</option>
                <option value="pending">Pendientes</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <label>Usuario:</label>
              <input
                type="text"
                placeholder="Buscar por usuario..."
                value={filters.user}
                onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Desde:</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Hasta:</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className={styles.filterInput}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Overview Statistics */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statContent}>
            <h3>{statistics.totalBets}</h3>
            <p>Total Apuestas</p>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statContent}>
            <h3>{formatCurrency(statistics.totalAmount)}</h3>
            <p>Volumen Total</p>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <h3>{statistics.winRate.toFixed(1)}%</h3>
            <p>Tasa de Acierto</p>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon}>📈</div>
          <div className={styles.statContent}>
            <h3>{formatCurrency(statistics.avgBetAmount)}</h3>
            <p>Apuesta Promedio</p>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon}>🏆</div>
          <div className={styles.statContent}>
            <h3>{formatCurrency(statistics.totalWinnings)}</h3>
            <p>Ganancias Totales</p>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon}>📉</div>
          <div className={styles.statContent}>
            <h3>{formatCurrency(statistics.totalLosses)}</h3>
            <p>Pérdidas Totales</p>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsSection}>
        {/* Status Distribution Chart */}
        <Card className={styles.chartCard}>
          <h3>Distribución por Estado</h3>
          <div className={styles.pieChart}>
            {statusChartData.map((item, index) => (
              <div key={index} className={styles.chartItem}>
                <div 
                  className={styles.chartBar}
                  style={{ 
                    width: `${item.percentage}%`,
                    backgroundColor: item.color 
                  }}
                ></div>
                <div className={styles.chartLabel}>
                  <span className={styles.chartLegend} style={{ backgroundColor: item.color }}></span>
                  {item.label}: {item.value} ({item.percentage.toFixed(1)}%)
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Daily Activity Chart */}
        <Card className={styles.chartCard}>
          <h3>Actividad Diaria</h3>
          <div className={styles.lineChart}>
            {dailyStats.slice(-7).map((day, index) => (
              <div key={index} className={styles.chartDay}>
                <div className={styles.chartColumn}>
                  <div 
                    className={styles.chartColumnBar}
                    style={{ 
                      height: `${Math.max(5, (day.totalBets / Math.max(...dailyStats.map(d => d.totalBets))) * 100)}%`
                    }}
                  ></div>
                </div>
                <div className={styles.chartDayLabel}>
                  {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short' })}
                </div>
                <div className={styles.chartDayValue}>{day.totalBets}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Users Table */}
      <Card className={styles.tableCard}>
        <h3>Top Usuarios por Volumen de Apuestas</h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Total Apuestas</th>
                <th>Volumen</th>
                <th>Ganadas</th>
                <th>Perdidas</th>
                <th>Tasa Éxito</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((user: any, index) => (
                <tr key={index}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.userAvatar}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      {user.username}
                    </div>
                  </td>
                  <td>{user.totalBets}</td>
                  <td>{formatCurrency(user.totalAmount)}</td>
                  <td className={styles.successText}>{user.wonBets}</td>
                  <td className={styles.errorText}>{user.lostBets}</td>
                  <td>
                    {user.totalBets > 0 
                      ? `${((user.wonBets / (user.wonBets + user.lostBets)) * 100).toFixed(1)}%`
                      : 'N/A'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Popular Predictions */}
      <Card className={styles.tableCard}>
        <h3>Predicciones Más Populares</h3>
        <div className={styles.predictionsGrid}>
          {popularPredictions.map((pred, index) => (
            <div key={index} className={styles.predictionCard}>
              <div className={styles.predictionHeader}>
                <h4>{pred.prediction}</h4>
                <span className={styles.predictionPercentage}>
                  {pred.percentage.toFixed(1)}%
                </span>
              </div>
              <div className={styles.predictionStats}>
                <span>{pred.count} apuestas</span>
                <span>{formatCurrency(pred.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Bets Table */}
      <Card className={styles.tableCard}>
        <h3>Apuestas Recientes ({filteredBets.length})</h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Partido</th>
                <th>Predicción</th>
                <th>Cantidad</th>
                <th>Cuota</th>
                <th>Ganancia Potencial</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredBets.slice(0, 50).map((bet) => (
                <tr key={bet.id}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.userAvatar}>
                        {bet.username.charAt(0).toUpperCase()}
                      </div>
                      {bet.username}
                    </div>
                  </td>
                  <td>{bet.matchName}</td>
                  <td>
                    <span className={styles.predictionBadge}>
                      {bet.prediction}
                    </span>
                  </td>
                  <td>{formatCurrency(bet.amount)}</td>
                  <td>{bet.odds.toFixed(2)}</td>
                  <td>{formatCurrency(bet.potentialWin)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[bet.status]}`}>
                      {bet.status === 'won' ? 'Ganada' : 
                       bet.status === 'lost' ? 'Perdida' :
                       bet.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                    </span>
                  </td>
                  <td>{formatDate(bet.placedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminBetsStatistics;
