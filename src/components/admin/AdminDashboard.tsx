import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { apiClient } from '@/utils/apiClient';
import styles from './AdminDashboard.module.css';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalBets: number;
  totalRevenue: number;
  averageBetAmount: number;
  winRate: number;
  pendingBets: number;
  totalPredictions: number;
  totalMatches: number;
  recentUsers: number;
}

interface ActivityItem {
  id: string;
  type: 'user_register' | 'bet_placed' | 'bet_won' | 'bet_lost' | 'match_completed' | 'prediction_made';
  user: string;
  description: string;
  timestamp: string;
  amount?: number;
}

interface TopUser {
  username: string;
  totalBets: number;
  totalAmount: number;
  winRate: number;
}

interface RecentBet {
  id: string;
  username: string;
  matchName: string;
  amount: number;
  odds: number;
  status: string;
  placedAt: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalBets: 0,
    totalRevenue: 0,
    averageBetAmount: 0,
    winRate: 0,
    pendingBets: 0,
    totalPredictions: 0,
    totalMatches: 0,
    recentUsers: 0,
  });

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [recentBets, setRecentBets] = useState<RecentBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Load multiple data sources in parallel
      const [usersResponse, betsResponse, statisticsResponse, matchesResponse] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/bets?limit=50'),
        apiClient.get('/bets/statistics'),
        apiClient.get('/matches'),
      ]);

      // Process users data
      const users = usersResponse.data?.data || [];
      const totalUsers = users.length;
      const activeUsers = users.filter((user: any) => user.last_bet_date).length;
      const recentUsers = users.filter((user: any) => {
        const createdDate = new Date(user.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return createdDate > weekAgo;
      }).length;

      // Process bets data
      const bets = betsResponse.data?.data || [];
      const totalBets = bets.length;
      const pendingBets = bets.filter((bet: any) => bet.status === 'pending').length;
      const resolvedBets = bets.filter((bet: any) => bet.status !== 'pending');
      const wonBets = bets.filter((bet: any) => bet.status === 'won').length;
      const totalRevenue = bets.reduce((sum: number, bet: any) => sum + bet.amount, 0);
      const averageBetAmount = totalBets > 0 ? totalRevenue / totalBets : 0;
      const winRate = resolvedBets.length > 0 ? (wonBets / resolvedBets.length) * 100 : 0;

      // Process matches data
      const matches = matchesResponse.data || [];
      const totalMatches = matches.length;

      // Process statistics data
      const statistics = statisticsResponse.data || {};

      // Set dashboard stats
      setStats({
        totalUsers,
        activeUsers,
        totalBets,
        totalRevenue,
        averageBetAmount,
        winRate,
        pendingBets,
        totalPredictions: 0, // Would need separate predictions endpoint
        totalMatches,
        recentUsers,
      });

      // Create recent activity from bets data
      const recentActivityItems: ActivityItem[] = bets.slice(0, 10).map((bet: any, index: number) => ({
        id: `bet-${index}`,
        type: 'bet_placed' as const,
        user: bet.username,
        description: `Apuesta realizada en ${bet.homeTeamName} vs ${bet.awayTeamName}`,
        timestamp: bet.placed_at,
        amount: bet.amount,
      }));

      setRecentActivity(recentActivityItems);

      // Calculate top users
      const userStats = users.reduce((acc: Record<string, any>, user: any) => {
        if (!acc[user.username]) {
          acc[user.username] = {
            username: user.username,
            totalBets: user.total_bets || 0,
            totalAmount: 0,
            wonBets: 0,
          };
        }
        return acc;
      }, {});

      // Add bet data to user stats
      bets.forEach((bet: any) => {
        if (userStats[bet.username]) {
          userStats[bet.username].totalAmount += bet.amount;
          if (bet.status === 'won') {
            userStats[bet.username].wonBets++;
          }
        }
      });

      const topUsersList = Object.values(userStats)
        .map((user: any) => ({
          username: user.username,
          totalBets: user.totalBets,
          totalAmount: user.totalAmount,
          winRate: user.totalBets > 0 ? (user.wonBets / user.totalBets) * 100 : 0,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5);

      setTopUsers(topUsersList);

      // Set recent bets
      const recentBetsList: RecentBet[] = bets.slice(0, 10).map((bet: any) => ({
        id: bet.id,
        username: bet.username,
        matchName: `${bet.homeTeamName} vs ${bet.awayTeamName}`,
        amount: bet.amount,
        odds: bet.odds,
        status: bet.status,
        placedAt: bet.placed_at,
      }));

      setRecentBets(recentBetsList);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
    
    setIsLoading(false);
  };

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_register': return '👤';
      case 'bet_placed': return '🎯';
      case 'bet_won': return '✅';
      case 'bet_lost': return '❌';
      case 'match_completed': return '⚽';
      case 'prediction_made': return '🔮';
      default: return '📊';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'won': return styles.statusWon;
      case 'lost': return styles.statusLost;
      case 'pending': return styles.statusPending;
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando panel de administración...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminDashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.icon}>📊</span>
          Panel de Administración
        </h1>
        <p className={styles.subtitle}>
          Vista general del estado de la plataforma de apuestas
        </p>
        <Button
          variant="secondary"
          onClick={loadDashboardData}
          className={styles.refreshButton}
        >
          🔄 Actualizar
        </Button>
      </div>

      {/* Main Statistics Grid */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <h3>{stats.totalUsers}</h3>
            <p>Total Usuarios</p>
            <span className={styles.statSubtext}>+{stats.recentUsers} esta semana</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <h3>{stats.activeUsers}</h3>
            <p>Usuarios Activos</p>
            <span className={styles.statSubtext}>
              {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% del total
            </span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statContent}>
            <h3>{stats.totalBets}</h3>
            <p>Total Apuestas</p>
            <span className={styles.statSubtext}>{stats.pendingBets} pendientes</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statContent}>
            <h3>{formatCurrency(stats.totalRevenue)}</h3>
            <p>Volumen Total</p>
            <span className={styles.statSubtext}>
              {formatCurrency(stats.averageBetAmount)} promedio
            </span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon}>📈</div>
          <div className={styles.statContent}>
            <h3>{stats.winRate.toFixed(1)}%</h3>
            <p>Tasa de Acierto</p>
            <span className={styles.statSubtext}>Global de usuarios</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon}>⚽</div>
          <div className={styles.statContent}>
            <h3>{stats.totalMatches}</h3>
            <p>Total Partidos</p>
            <span className={styles.statSubtext}>En la base de datos</span>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Recent Activity */}
        <Card className={styles.activityCard}>
          <div className={styles.cardHeader}>
            <h3>Actividad Reciente</h3>
            <Link to="/admin/bets" className={styles.viewAllLink}>
              Ver todo →
            </Link>
          </div>
          <div className={styles.activityList}>
            {recentActivity.map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className={styles.activityContent}>
                  <div className={styles.activityDescription}>
                    <strong>{activity.user}</strong> - {activity.description}
                  </div>
                  <div className={styles.activityMeta}>
                    <span className={styles.activityTime}>
                      {formatDate(activity.timestamp)}
                    </span>
                    {activity.amount && (
                      <span className={styles.activityAmount}>
                        {formatCurrency(activity.amount)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Users */}
        <Card className={styles.topUsersCard}>
          <div className={styles.cardHeader}>
            <h3>Top Usuarios</h3>
            <Link to="/admin/users" className={styles.viewAllLink}>
              Ver todos →
            </Link>
          </div>
          <div className={styles.topUsersList}>
            {topUsers.map((user, index) => (
              <div key={user.username} className={styles.topUserItem}>
                <div className={styles.userRank}>#{index + 1}</div>
                <div className={styles.userAvatar}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className={styles.userInfo}>
                  <div className={styles.username}>{user.username}</div>
                  <div className={styles.userStats}>
                    {user.totalBets} apuestas • {formatCurrency(user.totalAmount)}
                  </div>
                </div>
                <div className={styles.userWinRate}>
                  {user.winRate.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Bets */}
        <Card className={styles.recentBetsCard}>
          <div className={styles.cardHeader}>
            <h3>Apuestas Recientes</h3>
            <Link to="/admin/bets/history" className={styles.viewAllLink}>
              Ver historial →
            </Link>
          </div>
          <div className={styles.recentBetsList}>
            {recentBets.map((bet) => (
              <div key={bet.id} className={styles.recentBetItem}>
                <div className={styles.betUser}>
                  <div className={styles.userAvatar}>
                    {bet.username.charAt(0).toUpperCase()}
                  </div>
                  <span>{bet.username}</span>
                </div>
                <div className={styles.betMatch}>{bet.matchName}</div>
                <div className={styles.betAmount}>{formatCurrency(bet.amount)}</div>
                <div className={styles.betOdds}>{bet.odds.toFixed(2)}</div>
                <div className={styles.betStatus}>
                  <span className={`${styles.statusBadge} ${getStatusBadgeClass(bet.status)}`}>
                    {bet.status === 'won' ? 'Ganada' : 
                     bet.status === 'lost' ? 'Perdida' :
                     bet.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                  </span>
                </div>
                <div className={styles.betTime}>{formatDate(bet.placedAt)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className={styles.quickActionsCard}>
        <h3>Acciones Rápidas</h3>
        <div className={styles.quickActions}>
          <Link to="/admin/users" className={styles.quickAction}>
            <div className={styles.actionIcon}>👥</div>
            <div className={styles.actionText}>
              <h4>Gestionar Usuarios</h4>
              <p>Ver y administrar cuentas de usuario</p>
            </div>
          </Link>
          
          <Link to="/admin/bets" className={styles.quickAction}>
            <div className={styles.actionIcon}>🎯</div>
            <div className={styles.actionText}>
              <h4>Ver Apuestas</h4>
              <p>Monitorear apuestas y estadísticas</p>
            </div>
          </Link>
          
          <Link to="/admin/matches" className={styles.quickAction}>
            <div className={styles.actionIcon}>⚽</div>
            <div className={styles.actionText}>
              <h4>Administrar Partidos</h4>
              <p>Gestionar partidos y resultados</p>
            </div>
          </Link>
          
          <Link to="/admin/reports" className={styles.quickAction}>
            <div className={styles.actionIcon}>📊</div>
            <div className={styles.actionText}>
              <h4>Informes</h4>
              <p>Generar reportes detallados</p>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
