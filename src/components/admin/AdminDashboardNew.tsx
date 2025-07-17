import { useState, useEffect } from 'react';
import { apiClient } from '@/utils/apiClient';
import styles from './AdminDashboardNew.module.css';

// Interfaces
interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalBets: number;
  betsToday: number;
  totalRevenue: number;
  averageBet: number;
  winRate: number;
}

interface BetsByDay {
  day: string;
  count: number;
}

interface PopularTeam {
  name: string;
  house_color: string;
  betCount: number;
  percentage: number;
}

interface RiskAnalysis {
  criticalAlerts: number;
  highAmountBets: number;
  riskUsers: number;
}

interface ActiveUser {
  username: string;
  betCount: number;
  totalAmount: number;
  winRate: number;
  riskLevel: number;
}

interface PerformanceMetrics {
  profitMargin: number;
  avgSpendingPerUser: number;
  betsPerHour: number;
  activeUserRate: number;
}

interface ActivityItem {
  type: string;
  username: string;
  description: string;
  timestamp: string;
  amount?: number;
}

interface RiskAlert {
  type: string;
  username: string;
  description: string;
  amount: number;
  timestamp: string;
}

interface ApiResponseData<T> {
  data: T;
}

const AdminDashboardNew = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [betsByDay, setBetsByDay] = useState<BetsByDay[]>([]);
  const [popularTeams, setPopularTeams] = useState<PopularTeam[]>([]);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 2 minutes to reduce server load
    const interval = setInterval(loadDashboardData, 120000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load critical data first
      const statsRes = await apiClient.get('/admin/dashboard/stats');
      setStats((statsRes.data as ApiResponseData<DashboardStats>).data);

      // Load the rest in smaller batches with delays
      try {
        const [betsByDayRes, popularTeamsRes, riskAnalysisRes] = await Promise.all([
          apiClient.get('/admin/dashboard/bets-by-day'),
          apiClient.get('/admin/dashboard/popular-teams'),
          apiClient.get('/admin/dashboard/risk-analysis'),
        ]);

        setBetsByDay((betsByDayRes.data as ApiResponseData<BetsByDay[]>).data);
        setPopularTeams((popularTeamsRes.data as ApiResponseData<PopularTeam[]>).data);
        setRiskAnalysis((riskAnalysisRes.data as ApiResponseData<RiskAnalysis>).data);
      } catch (error) {
        console.warn('Error loading first batch:', error);
      }

      // Small delay before next batch
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const [activeUsersRes, performanceMetricsRes] = await Promise.all([
          apiClient.get('/admin/dashboard/active-users'),
          apiClient.get('/admin/dashboard/performance-metrics'),
        ]);

        setActiveUsers((activeUsersRes.data as ApiResponseData<ActiveUser[]>).data);
        setPerformanceMetrics((performanceMetricsRes.data as ApiResponseData<PerformanceMetrics>).data);
      } catch (error) {
        console.warn('Error loading second batch:', error);
      }

      // Small delay before final batch
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const [recentActivityRes, riskAlertsRes] = await Promise.all([
          apiClient.get('/admin/dashboard/recent-activity'),
          apiClient.get('/admin/dashboard/risk-alerts'),
        ]);

        setRecentActivity((recentActivityRes.data as ApiResponseData<ActivityItem[]>).data);
        setRiskAlerts((riskAlertsRes.data as ApiResponseData<RiskAlert[]>).data);
      } catch (error) {
        console.warn('Error loading third batch:', error);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setIsLoading(false);
    }
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
      default: return '📊';
    }
  };

  const getRiskLevelBadge = (level: number) => {
    if (level >= 9) return { text: 'Alto', class: styles.riskHigh };
    if (level >= 7) return { text: 'Medio', class: styles.riskMedium };
    return { text: 'Bajo', class: styles.riskLow };
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando panel de administración...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorIcon}>⚠️</span>
        <p>{error}</p>
        <button onClick={loadDashboardData} className={styles.retryButton}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.adminDashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            🏰 Panel de Administración
          </h1>
          <p className={styles.subtitle}>
            Centro de Apuestas Quidditch - Dashboard
          </p>
        </div>
        <button onClick={loadDashboardData} className={styles.refreshButton}>
          🔄 Actualizar
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.primary}`}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <h3>{stats?.totalUsers || 0}</h3>
            <p>Usuarios Totales</p>
            <span className={styles.statChange}>+12% este mes</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.success}`}>
          <div className={styles.statIcon}>⚡</div>
          <div className={styles.statContent}>
            <h3>{stats?.activeUsers || 0}</h3>
            <p>Usuarios Activos</p>
            <span className={styles.statChange}>+8% hoy</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.warning}`}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statContent}>
            <h3>{stats?.totalBets || 0}</h3>
            <p>Apuestas Totales</p>
            <span className={styles.statChange}>+{stats?.betsToday || 0} hoy</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.info}`}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statContent}>
            <h3>{formatCurrency(stats?.totalRevenue || 0)}</h3>
            <p>Ingresos Totales</p>
            <span className={styles.statChange}>+23% este mes</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.secondary}`}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <h3>{formatCurrency(stats?.averageBet || 0)}</h3>
            <p>Apuesta Promedio</p>
            <span className={styles.statChange}>Sin cambios</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.accent}`}>
          <div className={styles.statIcon}>🏆</div>
          <div className={styles.statContent}>
            <h3>{stats?.winRate || 0}%</h3>
            <p>Tasa de Ganancia</p>
            <span className={`${styles.statChange} ${styles.negative}`}>-2% este mes</span>
          </div>
        </div>
      </div>

      {/* Charts and Analysis Grid */}
      <div className={styles.chartsGrid}>
        {/* Bets by Day Chart */}
        <div className={styles.chartCard}>
          <h3>📊 Apuestas por Día</h3>
          <div className={styles.barChart}>
            {betsByDay && betsByDay.length > 0 ? betsByDay.map((day) => (
              <div key={day.day} className={styles.barItem}>
                <div 
                  className={styles.bar} 
                  style={{ 
                    height: `${Math.max((day.count / Math.max(...betsByDay.map(d => d.count))) * 100, 5)}%` 
                  }}
                >
                  <span className={styles.barValue}>{day.count}</span>
                </div>
                <span className={styles.barLabel}>{day.day}</span>
              </div>
            )) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No hay datos disponibles
              </div>
            )}
          </div>
        </div>

        {/* Popular Teams */}
        <div className={styles.chartCard}>
          <h3>🏆 Equipos Más Populares</h3>
          <div className={styles.teamsList}>
            {popularTeams && popularTeams.length > 0 ? popularTeams.map((team, index) => (
              <div key={team.name} className={styles.teamItem}>
                <div className={styles.teamIcon} style={{ backgroundColor: team.house_color }}>
                  {['🦁', '🐍', '🦅', '🦡'][index] || '⚡'}
                </div>
                <div className={styles.teamInfo}>
                  <span className={styles.teamName}>{team.name}</span>
                  <div className={styles.teamProgress}>
                    <div 
                      className={styles.teamProgressBar} 
                      style={{ width: `${team.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className={styles.teamPercentage}>{team.percentage}%</span>
              </div>
            )) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No hay datos disponibles
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Risk Analysis and Active Users */}
      <div className={styles.analysisGrid}>
        {/* Risk Analysis */}
        <div className={styles.riskCard}>
          <h3>⚠️ Análisis de Riesgo</h3>
          <div className={styles.riskMetrics}>
            <div className={styles.riskMetric}>
              <span className={styles.riskIcon}>⚠️</span>
              <div className={styles.riskContent}>
                <span className={styles.riskNumber}>{riskAnalysis?.criticalAlerts || 0}</span>
                <span className={styles.riskLabel}>ALERTAS CRÍTICAS</span>
              </div>
            </div>
            <div className={styles.riskMetric}>
              <span className={styles.riskIcon}>💰</span>
              <div className={styles.riskContent}>
                <span className={styles.riskNumber}>{riskAnalysis?.highAmountBets || 0}</span>
                <span className={styles.riskLabel}>APUESTAS ALTO MONTO</span>
              </div>
            </div>
            <div className={styles.riskMetric}>
              <span className={styles.riskIcon}>🛡️</span>
              <div className={styles.riskContent}>
                <span className={styles.riskNumber}>{riskAnalysis?.riskUsers || 0}</span>
                <span className={styles.riskLabel}>USUARIOS DE RIESGO</span>
              </div>
            </div>
          </div>
          <div className={styles.riskActions}>
            <button className={styles.viewStatsButton}>
              📊 Ver Estadísticas Completas
            </button>
            <button className={styles.viewHistoryButton}>
              📋 Historial Detallado
            </button>
          </div>
        </div>

        {/* Active Users */}
        <div className={styles.activeUsersCard}>
          <h3>⚡ Usuarios Más Activos (Semana)</h3>
          <div className={styles.usersList}>
            {activeUsers && activeUsers.length > 0 ? activeUsers.map((user, index) => (
              <div key={user.username} className={styles.userItem}>
                <div className={styles.userRank}>#{index + 1}</div>
                <div className={styles.userAvatar}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.username}</span>
                  <span className={styles.userStats}>
                    {user.betCount} apuestas • {formatCurrency(user.totalAmount)}
                  </span>
                </div>
                <div className={styles.userMetrics}>
                  <span className={styles.userWinRate}>{user.winRate}% acierto</span>
                  <span className={`${styles.userRisk} ${getRiskLevelBadge(user.riskLevel).class}`}>
                    Riesgo: {user.riskLevel}/10
                  </span>
                </div>
              </div>
            )) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No hay usuarios activos
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className={styles.performanceCard}>
        <h3>📈 Métricas de Rendimiento de la Plataforma</h3>
        <div className={styles.metricsGrid}>
          <div className={styles.metricItem}>
            <span className={styles.metricIcon}>📈</span>
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>{performanceMetrics?.profitMargin || 0}%</span>
              <span className={styles.metricLabel}>Margen de Ganancia</span>
            </div>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricIcon}>💰</span>
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>{formatCurrency(performanceMetrics?.avgSpendingPerUser || 0)}</span>
              <span className={styles.metricLabel}>Gasto Promedio por Usuario Activo</span>
            </div>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricIcon}>⏰</span>
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>{performanceMetrics?.betsPerHour || 0}</span>
              <span className={styles.metricLabel}>Apuestas por Hora (Promedio)</span>
            </div>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricIcon}>📊</span>
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>{performanceMetrics?.activeUserRate || 0}%</span>
              <span className={styles.metricLabel}>Tasa de Usuarios Activos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity and Risk Alerts */}
      <div className={styles.bottomGrid}>
        {/* Recent Activity */}
        <div className={styles.activityCard}>
          <h3>📝 Actividad Reciente</h3>
          <div className={styles.activityList}>
            {recentActivity && recentActivity.length > 0 ? recentActivity.slice(0, 8).map((activity, index) => (
              <div key={index} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className={styles.activityContent}>
                  <div className={styles.activityDescription}>
                    <strong>{activity.username}</strong> - {activity.description}
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
            )) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No hay actividad reciente
              </div>
            )}
          </div>
        </div>

        {/* Risk Alerts */}
        <div className={styles.alertsCard}>
          <h3>🚨 Alertas de Riesgo</h3>
          <div className={styles.alertsList}>
            {riskAlerts && riskAlerts.length > 0 ? (
              riskAlerts.map((alert, index) => (
                <div key={index} className={styles.alertItem}>
                  <div className={styles.alertIcon}>
                    {alert.type === 'high_amount' ? '💰' : '🔍'}
                  </div>
                  <div className={styles.alertContent}>
                    <div className={styles.alertDescription}>
                      <strong>{alert.username}</strong>
                    </div>
                    <div className={styles.alertDetails}>
                      {alert.description}
                    </div>
                    <div className={styles.alertMeta}>
                      <span className={styles.alertTime}>
                        {formatDate(alert.timestamp)}
                      </span>
                      <span className={styles.alertAmount}>
                        {formatCurrency(alert.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noAlerts}>
                <span className={styles.noAlertsIcon}>🛡️</span>
                <p>No hay alertas de riesgo activas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardNew;
