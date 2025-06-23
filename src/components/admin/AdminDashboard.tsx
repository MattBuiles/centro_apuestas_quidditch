import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
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
  type: 'user_register' | 'bet_placed' | 'match_completed' | 'high_risk_bet' | 'irregular_activity';
  user: string;
  description: string;
  timestamp: string;
  amount?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

interface RiskAlert {
  id: number;
  type: 'high_amount' | 'suspicious_pattern' | 'rapid_betting' | 'unusual_timing';
  user: string;
  description: string;
  riskLevel: 'medium' | 'high' | 'critical';
  timestamp: string;
  amount?: number;
}

interface TopUser {
  username: string;
  betsThisWeek: number;
  totalAmount: number;
  winRate: number;
  riskScore: number;
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
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
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
        {
          id: 6,
          type: 'high_risk_bet',
          user: 'DracoMalfoy',
          description: 'Apuesta de alto riesgo detectada',
          timestamp: '2025-06-21 11:10',
          amount: 1000,
          riskLevel: 'high',
        },
        {
          id: 7,
          type: 'irregular_activity',
          user: 'SeverusSnape',
          description: 'Actividad irregular detectada en la cuenta',
          timestamp: '2025-06-21 10:05',
          amount: 500,
          riskLevel: 'critical',
        },
      ]);

      setRiskAlerts([
        {
          id: 1,
          type: 'high_amount',
          user: 'DracoMalfoy',
          description: 'Apuesta de alto monto detectada',
          riskLevel: 'high',
          timestamp: '2025-06-21 11:10',
          amount: 1000,
        },
        {
          id: 2,
          type: 'suspicious_pattern',
          user: 'SeverusSnape',
          description: 'Patrón de apuestas sospechoso detectado',
          riskLevel: 'critical',
          timestamp: '2025-06-21 10:05',
          amount: 500,
        },
      ]);

      setTopUsers([
        {
          username: 'HarryPotter',
          betsThisWeek: 25,
          totalAmount: 1500,
          winRate: 48.5,
          riskScore: 10,
        },
        {
          username: 'HermioneGranger',
          betsThisWeek: 20,
          totalAmount: 1200,
          winRate: 55.2,
          riskScore: 8,
        },
        {
          username: 'RonWeasley',
          betsThisWeek: 18,
          totalAmount: 900,
          winRate: 45.0,
          riskScore: 6,
        },
        {
          username: 'DracoMalfoy',
          betsThisWeek: 15,
          totalAmount: 3000,
          winRate: 40.0,
          riskScore: 9,
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
      case 'high_risk_bet':
        return '🚨';
      case 'irregular_activity':
        return '❗';
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
          </Card>        </div>
      </div>

      {/* Risk Analysis and Quick Links Section */}
      <div className={styles.analysisSection}>
        {/* Risk Analysis */}
        <Card className={styles.riskAnalysisCard}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🚨</span>
            Análisis de Riesgo
          </h3>
          <div className={styles.riskMetrics}>
            <div className={styles.riskMetric}>
              <div className={styles.riskIcon}>⚠️</div>
              <div className={styles.riskInfo}>
                <div className={styles.riskValue}>{riskAlerts.filter(alert => alert.riskLevel === 'high' || alert.riskLevel === 'critical').length}</div>
                <div className={styles.riskLabel}>Alertas Críticas</div>
              </div>
            </div>
            <div className={styles.riskMetric}>
              <div className={styles.riskIcon}>💰</div>
              <div className={styles.riskInfo}>
                <div className={styles.riskValue}>{recentActivity.filter(activity => activity.amount && activity.amount > 300).length}</div>
                <div className={styles.riskLabel}>Apuestas Alto Monto</div>
              </div>
            </div>
            <div className={styles.riskMetric}>
              <div className={styles.riskIcon}>🔍</div>
              <div className={styles.riskInfo}>
                <div className={styles.riskValue}>{topUsers.filter(user => user.riskScore > 7).length}</div>
                <div className={styles.riskLabel}>Usuarios de Riesgo</div>
              </div>
            </div>
          </div>
          <div className={styles.quickActionButtons}>
            <Link to="/account/bets-statistics">
              <Button variant="primary" size="sm">
                📊 Ver Estadísticas Completas
              </Button>
            </Link>
            <Link to="/account/bets-history">
              <Button variant="outline" size="sm">
                📋 Historial Detallado
              </Button>
            </Link>
          </div>
        </Card>

        {/* Top Users This Week */}
        <Card className={styles.topUsersCard}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>⏱️</span>
            Usuarios Más Activos (Semana)
          </h3>
          <div className={styles.topUsersList}>
            {topUsers.slice(0, 5).map((user, index) => (
              <div key={index} className={styles.topUserItem}>
                <div className={styles.topUserRank}>#{index + 1}</div>
                <div className={styles.topUserInfo}>
                  <div className={styles.topUserName}>{user.username}</div>
                  <div className={styles.topUserStats}>
                    {user.betsThisWeek} apuestas • {formatCurrency(user.totalAmount)}
                  </div>
                </div>
                <div className={styles.topUserMetrics}>
                  <div className={styles.topUserWinRate}>{user.winRate}% acierto</div>
                  <div className={`${styles.topUserRisk} ${user.riskScore > 7 ? styles.highRisk : user.riskScore > 5 ? styles.mediumRisk : styles.lowRisk}`}>
                    Riesgo: {user.riskScore}/10
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Platform Performance Metrics */}
      <Card className={styles.performanceCard}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🧾</span>
          Métricas de Rendimiento de la Plataforma
        </h3>
        <div className={styles.performanceGrid}>
          <div className={styles.performanceMetric}>
            <div className={styles.performanceIcon}>📈</div>
            <div className={styles.performanceInfo}>
              <div className={styles.performanceValue}>{((stats.totalRevenue / stats.totalBets) * 100).toFixed(1)}%</div>
              <div className={styles.performanceLabel}>Margen de Ganancia</div>
            </div>
          </div>
          <div className={styles.performanceMetric}>
            <div className={styles.performanceIcon}>💸</div>
            <div className={styles.performanceInfo}>
              <div className={styles.performanceValue}>{formatCurrency(topUsers.reduce((sum, user) => sum + user.totalAmount, 0) / topUsers.length)}</div>
              <div className={styles.performanceLabel}>Gasto Promedio por Usuario Activo</div>
            </div>
          </div>
          <div className={styles.performanceMetric}>
            <div className={styles.performanceIcon}>⏰</div>
            <div className={styles.performanceInfo}>
              <div className={styles.performanceValue}>{(recentActivity.filter(a => a.type === 'bet_placed').length / 24).toFixed(1)}</div>
              <div className={styles.performanceLabel}>Apuestas por Hora (Promedio)</div>
            </div>
          </div>
          <div className={styles.performanceMetric}>
            <div className={styles.performanceIcon}>🎯</div>
            <div className={styles.performanceInfo}>
              <div className={styles.performanceValue}>{((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%</div>
              <div className={styles.performanceLabel}>Tasa de Usuarios Activos</div>
            </div>
          </div>
        </div>
      </Card>

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

      {/* Risk Alerts */}
      <Card className={styles.riskAlertsCard}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>⚠️</span>
          Alertas de Riesgo
        </h3>
        <div className={styles.riskAlertsList}>
          {riskAlerts.map((alert) => (
            <div key={alert.id} className={styles.riskAlertItem}>
              <div className={styles.riskAlertIcon}>
                {alert.type === 'high_amount' && '💰'}
                {alert.type === 'suspicious_pattern' && '📉'}
                {alert.type === 'rapid_betting' && '⚡'}
                {alert.type === 'unusual_timing' && '🕒'}
              </div>
              <div className={styles.riskAlertContent}>
                <div className={styles.riskAlertUser}>{alert.user}</div>
                <div className={styles.riskAlertDescription}>{alert.description}</div>
                <div className={styles.riskAlertTimestamp}>{alert.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Users */}
      <Card className={styles.topUsersCard}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🌟</span>
          Usuarios Más Activos
        </h3>
        <div className={styles.topUsersList}>
          {topUsers.map((user) => (
            <div key={user.username} className={styles.topUserItem}>
              <div className={styles.topUserInfo}>
                <div className={styles.topUserName}>{user.username}</div>
                <div className={styles.topUserStats}>
                  <span className={styles.topUserBets}>{user.betsThisWeek} Apuestas</span>
                  <span className={styles.topUserAmount}>{formatCurrency(user.totalAmount)}</span>
                  <span className={styles.topUserWinRate}>{user.winRate}% Win Rate</span>
                </div>
              </div>
              <div className={styles.topUserRisk}>
                Riesgo: {user.riskScore}              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
