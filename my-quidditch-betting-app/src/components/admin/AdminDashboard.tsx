import { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import styles from './AdminDashboard.module.css';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalBets: number;
  totalRevenue: number;
  averageBetAmount: number;
  winRate: number;
}

interface RecentActivity {
  id: number;
  type: 'user_register' | 'bet_placed' | 'match_completed';
  user: string;
  description: string;
  timestamp: string;
  amount?: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalBets: 0,
    totalRevenue: 0,
    averageBetAmount: 0,
    winRate: 0,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setStats({
        totalUsers: 342,
        activeUsers: 127,
        totalBets: 1547,
        totalRevenue: 47250,
        averageBetAmount: 85,
        winRate: 42.3,
      });

      setRecentActivity([
        {
          id: 1,
          type: 'user_register',
          user: 'HermioneGranger91',
          description: 'Nuevo usuario registrado',
          timestamp: '2025-06-21 14:30',
        },
        {
          id: 2,
          type: 'bet_placed',
          user: 'RonWeasley22',
          description: 'Apuesta realizada en Gryffindor vs Slytherin',
          timestamp: '2025-06-21 14:15',
          amount: 150,
        },
        {
          id: 3,
          type: 'match_completed',
          user: 'Sistema',
          description: 'Partido Hufflepuff vs Ravenclaw finalizado',
          timestamp: '2025-06-21 13:45',
        },
        {
          id: 4,
          type: 'bet_placed',
          user: 'LunaLovegood',
          description: 'Apuesta realizada en Hufflepuff vs Ravenclaw',
          timestamp: '2025-06-21 13:20',
          amount: 75,
        },
        {
          id: 5,
          type: 'user_register',
          user: 'NevilleLongbottom',
          description: 'Nuevo usuario registrado',
          timestamp: '2025-06-21 12:55',
        },
      ]);

      setIsLoading(false);
    };

    loadDashboardData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_register':
        return '👤';
      case 'bet_placed':
        return '💰';
      case 'match_completed':
        return '⚡';
      default:
        return '📊';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleIcon}>🏰</span>
          Panel de Administración
        </h1>
        <p className={styles.subtitle}>Centro de Apuestas Quidditch - Dashboard</p>
      </div>

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <Card className={`${styles.statCard} ${styles.users}`}>
          <div className={styles.statContent}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.totalUsers.toLocaleString()}</div>
              <div className={styles.statLabel}>Usuarios Totales</div>
            </div>
          </div>
          <div className={styles.statChange}>
            <span className={styles.changePositive}>+12% este mes</span>
          </div>
        </Card>

        <Card className={`${styles.statCard} ${styles.active}`}>
          <div className={styles.statContent}>
            <div className={styles.statIcon}>⚡</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.activeUsers}</div>
              <div className={styles.statLabel}>Usuarios Activos</div>
            </div>
          </div>
          <div className={styles.statChange}>
            <span className={styles.changePositive}>+8% hoy</span>
          </div>
        </Card>

        <Card className={`${styles.statCard} ${styles.bets}`}>
          <div className={styles.statContent}>
            <div className={styles.statIcon}>🎯</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.totalBets.toLocaleString()}</div>
              <div className={styles.statLabel}>Apuestas Totales</div>
            </div>
          </div>
          <div className={styles.statChange}>
            <span className={styles.changePositive}>+156 hoy</span>
          </div>
        </Card>

        <Card className={`${styles.statCard} ${styles.revenue}`}>
          <div className={styles.statContent}>
            <div className={styles.statIcon}>💎</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{formatCurrency(stats.totalRevenue)}</div>
              <div className={styles.statLabel}>Ingresos Totales</div>
            </div>
          </div>
          <div className={styles.statChange}>
            <span className={styles.changePositive}>+23% este mes</span>
          </div>
        </Card>

        <Card className={`${styles.statCard} ${styles.average}`}>
          <div className={styles.statContent}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{formatCurrency(stats.averageBetAmount)}</div>
              <div className={styles.statLabel}>Apuesta Promedio</div>
            </div>
          </div>
          <div className={styles.statChange}>
            <span className={styles.changeNeutral}>Sin cambios</span>
          </div>
        </Card>

        <Card className={`${styles.statCard} ${styles.winRate}`}>
          <div className={styles.statContent}>
            <div className={styles.statIcon}>🏆</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.winRate}%</div>
              <div className={styles.statLabel}>Tasa de Ganancia</div>
            </div>
          </div>
          <div className={styles.statChange}>
            <span className={styles.changeNegative}>-2% este mes</span>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsSection}>
        <div className={styles.chartContainer}>
          <Card className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Apuestas por Día</h3>
            <div className={styles.chartPlaceholder}>
              <div className={styles.chartBars}>
                <div className={styles.bar} style={{ height: '60%' }}>
                  <span className={styles.barLabel}>L</span>
                  <span className={styles.barValue}>142</span>
                </div>
                <div className={styles.bar} style={{ height: '80%' }}>
                  <span className={styles.barLabel}>M</span>
                  <span className={styles.barValue}>189</span>
                </div>
                <div className={styles.bar} style={{ height: '45%' }}>
                  <span className={styles.barLabel}>M</span>
                  <span className={styles.barValue}>108</span>
                </div>
                <div className={styles.bar} style={{ height: '90%' }}>
                  <span className={styles.barLabel}>J</span>
                  <span className={styles.barValue}>215</span>
                </div>
                <div className={styles.bar} style={{ height: '70%' }}>
                  <span className={styles.barLabel}>V</span>
                  <span className={styles.barValue}>167</span>
                </div>
                <div className={styles.bar} style={{ height: '95%' }}>
                  <span className={styles.barLabel}>S</span>
                  <span className={styles.barValue}>228</span>
                </div>
                <div className={styles.bar} style={{ height: '85%' }}>
                  <span className={styles.barLabel}>D</span>
                  <span className={styles.barValue}>201</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className={styles.chartContainer}>
          <Card className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Equipos Más Populares</h3>
            <div className={styles.popularTeams}>
              <div className={styles.teamItem}>
                <span className={styles.teamName}>🦁 Gryffindor</span>
                <div className={styles.teamBar}>
                  <div className={styles.teamProgress} style={{ width: '95%' }}></div>
                </div>
                <span className={styles.teamPercentage}>95%</span>
              </div>
              <div className={styles.teamItem}>
                <span className={styles.teamName}>🐍 Slytherin</span>
                <div className={styles.teamBar}>
                  <div className={styles.teamProgress} style={{ width: '78%' }}></div>
                </div>
                <span className={styles.teamPercentage}>78%</span>
              </div>
              <div className={styles.teamItem}>
                <span className={styles.teamName}>🦅 Ravenclaw</span>
                <div className={styles.teamBar}>
                  <div className={styles.teamProgress} style={{ width: '65%' }}></div>
                </div>
                <span className={styles.teamPercentage}>65%</span>
              </div>
              <div className={styles.teamItem}>
                <span className={styles.teamName}>🦡 Hufflepuff</span>
                <div className={styles.teamBar}>
                  <div className={styles.teamProgress} style={{ width: '52%' }}></div>
                </div>
                <span className={styles.teamPercentage}>52%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className={styles.activityCard}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📈</span>
          Actividad Reciente
        </h3>
        <div className={styles.activityList}>
          {recentActivity.map((activity) => (
            <div key={activity.id} className={styles.activityItem}>
              <div className={styles.activityIcon}>
                {getActivityIcon(activity.type)}
              </div>
              <div className={styles.activityContent}>
                <div className={styles.activityUser}>{activity.user}</div>
                <div className={styles.activityDescription}>{activity.description}</div>
                {activity.amount && (
                  <div className={styles.activityAmount}>
                    {formatCurrency(activity.amount)}
                  </div>
                )}
              </div>
              <div className={styles.activityTime}>
                {activity.timestamp}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
