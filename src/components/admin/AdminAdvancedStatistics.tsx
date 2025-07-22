import { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { apiClient } from '@/utils/apiClient';
import styles from './AdminAdvancedStatistics.module.css';

interface FilterOptions {
  period: '7' | '30' | '90' | 'all';
  status: 'all' | 'won' | 'lost' | 'pending' | 'cancelled';
  userId: string;
  dateFrom: string;
  dateTo: string;
}

interface Indicator {
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface StatusDistribution {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

interface DailyVolumeData {
  date: string;
  betCount: number;
  volume: number;
}

interface ActiveUser {
  rank: number;
  username: string;
  betCount: number;
  totalAmount: number;
  winRate: number;
}

interface PopularMatch {
  rank: number;
  name: string;
  betCount: number;
  totalVolume: number;
  averageAmount: number;
}

interface RiskAnalysis {
  highRiskBets: number;
  hyperactiveUsers: number;
  profitLossRatio: number;
  netProfit: number;
}

interface BetDistribution {
  range: string;
  count: number;
  percentage: number;
  color: string;
}

interface UserSegment {
  segment: string;
  userCount: number;
  avgBetAmount: number;
  totalVolume: number;
  color: string;
}

interface TeamPerformance {
  teamName: string;
  teamColor: string;
  totalBets: number;
  wonBets: number;
  winRate: number;
  totalVolume: number;
}

interface AdvancedStatisticsData {
  indicators: {
    totalBets: Indicator;
    totalVolume: Indicator;
    winRate: Indicator;
    averageBet: Indicator;
  };
  statusDistribution: StatusDistribution[];
  betDistribution: BetDistribution[];
  userSegments: UserSegment[];
  teamPerformance: TeamPerformance[];
  dailyVolume: {
    data: DailyVolumeData[];
    maxDaily: number;
    avgDaily: number;
  };
  activeUsers: ActiveUser[];
  popularMatches: PopularMatch[];
  riskAnalysis: RiskAnalysis;
}

interface User {
  id: string;
  username: string;
  betCount: number;
}

interface VirtualTimeState {
  currentDate: string;
  timeSpeed: string;
  autoMode: boolean;
  lastUpdate: string;
  activeSeason: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
}

const AdminAdvancedStatistics = () => {
  const [data, setData] = useState<AdvancedStatisticsData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [virtualTime, setVirtualTime] = useState<VirtualTimeState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    period: '30',
    status: 'all',
    userId: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Debug initial state
  console.log('🚀 AdminAdvancedStatistics initialized with filters:', filters);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load users and virtual time in parallel
        const [usersResponse, virtualTimeResponse] = await Promise.all([
          apiClient.get('/admin/users/list'),
          apiClient.get('/admin/virtual-time')
        ]);
        
        if (usersResponse.success) {
          setUsers(usersResponse.data as User[]);
        }
        
        if (virtualTimeResponse.success) {
          setVirtualTime(virtualTimeResponse.data as VirtualTimeState);
          console.log('⏰ Loaded virtual time:', virtualTimeResponse.data);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const loadStatisticsData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        
        // Always send period parameter, including 'all'
        if (filters.dateFrom && filters.dateTo) {
          params.append('dateFrom', filters.dateFrom);
          params.append('dateTo', filters.dateTo);
          // When custom date range is set, don't send period
        } else {
          // Always send period, including 'all' to get all data
          params.append('period', filters.period);
        }
        
        if (filters.status !== 'all') {
          params.append('status', filters.status);
        }
        if (filters.userId !== 'all') {
          params.append('userId', filters.userId);
        }

        console.log('🔍 Sending request with params:', params.toString());
        console.log('🔍 Current filters state:', filters);
        
        const response = await apiClient.get(`/admin/statistics/advanced?${params.toString()}`);
        if (response.success) {
          console.log('✅ Received data:', response.data);
          const receivedData = response.data as AdvancedStatisticsData;
          
          // Log key indicators to understand what data we're getting
          console.log('📊 Data summary:', {
            totalBets: receivedData.indicators?.totalBets?.value || 0,
            totalVolume: receivedData.indicators?.totalVolume?.value || 0,
            statusDistribution: receivedData.statusDistribution?.length || 0,
            dailyVolumeData: receivedData.dailyVolume?.data?.length || 0,
            activeUsers: receivedData.activeUsers?.length || 0
          });
          
          setData(receivedData);
        } else {
          console.error('❌ API request failed:', response);
          // Try to show some error state or fallback data
        }
      } catch (error) {
        console.error('Error loading statistics data:', error);
        // Set some fallback empty data to prevent UI errors
        setData({
          indicators: {
            totalBets: { value: 0, change: 0, trend: 'stable' },
            totalVolume: { value: 0, change: 0, trend: 'stable' },
            winRate: { value: 0, change: 0, trend: 'stable' },
            averageBet: { value: 0, change: 0, trend: 'stable' }
          },
          statusDistribution: [],
          dailyVolume: {
            data: [],
            maxDaily: 0,
            avgDaily: 0
          },
          activeUsers: [],
          popularMatches: [],
          riskAnalysis: {
            highRiskBets: 0,
            hyperactiveUsers: 0,
            profitLossRatio: 0,
            netProfit: 0
          },
          betDistribution: [],
          userSegments: [],
          teamPerformance: []
        });
      }
      setIsLoading(false);
    };

    loadStatisticsData();
  }, [filters]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    console.log('🎯 Changing filter:', key, 'to:', value);
    
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // If user selects a predefined period, clear custom date range
      if (key === 'period' && value !== 'all') {
        newFilters.dateFrom = '';
        newFilters.dateTo = '';
        console.log('📅 Cleared custom date range for period:', value);
      }
      
      // If user sets custom date range, set period to 'all' to use custom range
      if ((key === 'dateFrom' || key === 'dateTo') && value) {
        newFilters.period = 'all';
        console.log('📅 Set period to "all" for custom date range');
      }
      
      console.log('✅ New filters state:', newFilters);
      return newFilters;
    });
  };

  const clearFilters = () => {
    console.log('🧹 Clearing all filters');
    setFilters({
      period: '30',
      status: 'all',
      userId: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando estadísticas avanzadas...</p>
      </div>
    );
  }

  return (
    <div className={styles.advancedStats}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.icon}>📊</span>
          Panel de Estadísticas de Apuestas
        </h1>
        <p className={styles.subtitle}>
          Análisis completo y visualización de datos en tiempo virtual
          {virtualTime && (
            <span className={styles.virtualTimeIndicator}>
              🕒 Tiempo virtual: {new Date(virtualTime.currentDate).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <div className={styles.filtersHeader}>
          <h3>
            <span className={styles.filterIcon}>🔍</span>
            Filtros y Período de Análisis
          </h3>
          {/* Filter Status Indicator */}
          <div className={styles.filterStatus}>
            {filters.dateFrom && filters.dateTo ? (
              <span className={styles.statusBadge}>
                📅 Rango personalizado: {filters.dateFrom} a {filters.dateTo}
              </span>
            ) : filters.period !== 'all' ? (
              <span className={styles.statusBadge}>
                ⏰ Últimos {filters.period} días
              </span>
            ) : (
              <span className={styles.statusBadge}>
                🌍 Todos los períodos
              </span>
            )}
          </div>
        </div>
        
        <div className={styles.filtersContent}>
          {/* Quick period buttons */}
          <div className={styles.periodSection}>
            <label>Período:</label>
            <div className={styles.periodButtons}>
              {[
                { value: '7', label: '7 días' },
                { value: '30', label: '30 días' },
                { value: '90', label: '90 días' },
                { value: 'all', label: 'Todo' }
              ].map((period) => {
                const isActive = filters.period === period.value;
                console.log(`Button ${period.label}: active=${isActive}, currentPeriod=${filters.period}`);
                
                return (
                  <Button
                    key={period.value}
                    variant={isActive ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => {
                      console.log(`🔘 Clicked period button: ${period.value}`);
                      handleFilterChange('period', period.value);
                    }}
                    className={`${isActive ? styles.activeButton : ''}`}
                  >
                    {period.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Filter inputs */}
          <div className={styles.filterInputs}>
            <div className={styles.filterGroup}>
              <label>Estado:</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Todos los estados</option>
                <option value="won">Ganadas</option>
                <option value="lost">Perdidas</option>
                <option value="pending">Pendientes</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Usuario:</label>
              <select
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Todos los usuarios</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.betCount} apuestas)
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Desde:</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className={styles.filterInput}
                max={filters.dateTo || (virtualTime ? virtualTime.currentDate.split('T')[0] : new Date().toISOString().split('T')[0])}
                title="Fecha de inicio del rango personalizado (basado en tiempo virtual)"
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Hasta:</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className={styles.filterInput}
                min={filters.dateFrom}
                max={virtualTime ? virtualTime.currentDate.split('T')[0] : new Date().toISOString().split('T')[0]}
                title="Fecha de fin del rango personalizado (basado en tiempo virtual)"
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className={styles.clearButton}
          >
            Limpiar Filtros
          </Button>
        </div>
      </Card>

      {data && (
        <>
          {/* Data availability check */}
          {data.indicators.totalBets.value === 0 && (
            <div style={{ marginBottom: '24px', padding: '20px', textAlign: 'center', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '12px' }}>
              <div style={{ color: '#856404', fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
                📊 No hay datos disponibles para el período seleccionado
              </div>
              <div style={{ color: '#856404', fontSize: '0.95rem' }}>
                {filters.period === 'all' 
                  ? 'No se encontraron apuestas en toda la base de datos. Asegúrate de que el backend esté ejecutándose y tenga datos.'
                  : `No se encontraron apuestas en los últimos ${filters.period} días. Prueba seleccionando "Todo" para ver todos los datos disponibles.`
                }
              </div>
              <div style={{ color: '#856404', fontSize: '0.85rem', marginTop: '8px', fontStyle: 'italic' }}>
                URL de API: {import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/admin/statistics/advanced
              </div>
            </div>
          )}

          {/* Main Indicators */}
          <div className={styles.indicatorsGrid}>
            <Card className={styles.indicatorCard}>
              <div className={styles.indicatorIcon}>📊</div>
              <div className={styles.indicatorContent}>
                <div className={styles.indicatorValue}>{data.indicators.totalBets.value}</div>
                <div className={styles.indicatorLabel}>TOTAL APUESTAS</div>
              </div>
            </Card>

            <Card className={styles.indicatorCard}>
              <div className={styles.indicatorIcon}>💰</div>
              <div className={styles.indicatorContent}>
                <div className={styles.indicatorValue}>{formatCurrency(data.indicators.totalVolume.value)}</div>
                <div className={styles.indicatorLabel}>VOLUMEN TOTAL</div>
              </div>
            </Card>

            <Card className={styles.indicatorCard}>
              <div className={styles.indicatorIcon}>🎯</div>
              <div className={styles.indicatorContent}>
                <div className={styles.indicatorValue}>{data.indicators.winRate.value.toFixed(1)}%</div>
                <div className={styles.indicatorLabel}>TASA DE ACIERTO</div>
              </div>
            </Card>

            <Card className={styles.indicatorCard}>
              <div className={styles.indicatorIcon}>📈</div>
              <div className={styles.indicatorContent}>
                <div className={styles.indicatorValue}>{formatCurrency(data.indicators.averageBet.value)}</div>
                <div className={styles.indicatorLabel}>APUESTA PROMEDIO</div>
              </div>
            </Card>
          </div>

          {/* Charts Row */}
          <div className={styles.chartsRow}>
            {/* Status Distribution */}
            <Card className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>
                  <span className={styles.chartIcon}>🟠</span>
                  Distribución por Estado
                </h3>
              </div>
              <div className={styles.pieChartContainer}>
                <div 
                  className={styles.pieChart}
                  style={{
                    '--pie-gradient': (() => {
                      const activeItems = data.statusDistribution.filter(item => item.value > 0);
                      
                      if (activeItems.length === 0) {
                        return '#f3f4f6';
                      }
                      
                      if (activeItems.length === 1) {
                        return activeItems[0].color;
                      }
                      
                      // Recalculate percentages for only active items
                      const total = activeItems.reduce((sum, item) => sum + item.value, 0);
                      let currentDegree = 0;
                      
                      const gradientParts = activeItems.map((item) => {
                        const percentage = (item.value / total) * 100;
                        const startDegree = currentDegree;
                        const endDegree = currentDegree + (percentage * 3.6);
                        currentDegree = endDegree;
                        
                        return `${item.color} ${startDegree.toFixed(1)}deg ${endDegree.toFixed(1)}deg`;
                      });
                      
                      return `conic-gradient(${gradientParts.join(', ')})`;
                    })()
                  } as React.CSSProperties}
                />
                <div className={styles.pieChartLegend}>
                  {data.statusDistribution.length > 0 ? (
                    data.statusDistribution.map((item) => (
                      <div key={item.label} className={styles.legendItem}>
                        <div 
                          className={styles.legendColor}
                          style={{ backgroundColor: item.color }}
                        />
                        <span className={styles.legendLabel}>
                          {item.label}: {item.value} ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '0.875rem' }}>
                      No hay apuestas en el período seleccionado
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Daily Volume Chart */}
            <Card className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>
                  <span className={styles.chartIcon}>📈</span>
                  Volumen Diario de Apuestas
                </h3>
              </div>
              <div className={styles.lineChartContainer}>
                <div className={styles.lineChart}>
                  <svg className={styles.lineChartSvg} viewBox="0 0 400 200">
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map(i => (
                      <line
                        key={`grid-${i}`}
                        x1="40"
                        y1={40 + (i * 32)}
                        x2="380"
                        y2={40 + (i * 32)}
                        className={styles.gridLine}
                      />
                    ))}
                    
                    {/* Y-axis labels */}
                    {[0, 1, 2, 3, 4].map(i => {
                      const value = data.dailyVolume.maxDaily * (4 - i) / 4;
                      return (
                        <text
                          key={`y-label-${i}`}
                          x="35"
                          y={44 + (i * 32)}
                          className={styles.axisLabel}
                          textAnchor="end"
                        >
                          {value > 1000 ? `${(value/1000).toFixed(0)}K` : value.toFixed(0)}
                        </text>
                      );
                    })}
                    
                    {/* Line and points */}
                    {data.dailyVolume.data.length > 0 && (
                      <>
                        {/* Line path */}
                        <path
                          d={data.dailyVolume.data.map((day, index) => {
                            const x = 50 + (index * (320 / Math.max(data.dailyVolume.data.length - 1, 1)));
                            const y = 168 - ((day.volume / data.dailyVolume.maxDaily) * 128);
                            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(' ')}
                          className={styles.trendLine}
                        />
                        
                        {/* Data points */}
                        {data.dailyVolume.data.map((day, index) => {
                          const x = 50 + (index * (320 / Math.max(data.dailyVolume.data.length - 1, 1)));
                          const y = 168 - ((day.volume / data.dailyVolume.maxDaily) * 128);
                          return (
                            <g key={day.date}>
                              <circle
                                cx={x}
                                cy={y}
                                r="4"
                                className={styles.dataPoint}
                              />
                              <circle
                                cx={x}
                                cy={y}
                                r="6"
                                className={styles.dataPointHover}
                              />
                              {/* Tooltip on hover */}
                              <text
                                x={x}
                                y={y - 10}
                                className={styles.tooltipText}
                                textAnchor="middle"
                              >
                                {formatCurrency(day.volume)}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    )}
                    
                    {/* X-axis labels */}
                    {data.dailyVolume.data.map((day, index) => {
                      const x = 50 + (index * (320 / Math.max(data.dailyVolume.data.length - 1, 1)));
                      const date = new Date(day.date);
                      const label = date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
                      return (
                        <text
                          key={`x-label-${day.date}`}
                          x={x}
                          y="190"
                          className={styles.axisLabel}
                          textAnchor="middle"
                        >
                          {label}
                        </text>
                      );
                    })}
                  </svg>
                </div>
                <div className={styles.chartStats}>
                  <div className={styles.chartStat}>
                    <span className={styles.statLabel}>MÁXIMO DIARIO:</span>
                    <span className={styles.statValue}>{formatCurrency(data.dailyVolume.maxDaily)}</span>
                  </div>
                  <div className={styles.chartStat}>
                    <span className={styles.statLabel}>PROMEDIO DIARIO:</span>
                    <span className={styles.statValue}>{formatCurrency(data.dailyVolume.avgDaily)}</span>
                  </div>
                  <div className={styles.chartStat}>
                    <span className={styles.statLabel}>TENDENCIA:</span>
                    <span className={`${styles.statValue} ${styles.trendUp}`}>
                      {data.dailyVolume.data.length > 1 && 
                       data.dailyVolume.data[data.dailyVolume.data.length - 1].volume > 
                       data.dailyVolume.data[0].volume ? '↗️ Creciente' : '↘️ Decreciente'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Advanced Charts Row */}
          <div className={styles.chartsRow}>
            {/* Bet Distribution by Amount */}
            <Card className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>
                  <span className={styles.chartIcon}>💰</span>
                  Distribución por Monto de Apuesta
                </h3>
              </div>
              <div className={styles.pieChartContainer}>
                <div 
                  className={styles.pieChart}
                  style={{
                    '--pie-gradient': (() => {
                      const activeItems = data.betDistribution?.filter(item => item.count > 0) || [];
                      
                      if (activeItems.length === 0) {
                        return '#f3f4f6';
                      }
                      
                      if (activeItems.length === 1) {
                        return activeItems[0].color;
                      }
                      
                      // Recalculate percentages for only active items
                      const total = activeItems.reduce((sum, item) => sum + item.count, 0);
                      let currentDegree = 0;
                      
                      const gradientParts = activeItems.map((item) => {
                        const percentage = (item.count / total) * 100;
                        const startDegree = currentDegree;
                        const endDegree = currentDegree + (percentage * 3.6);
                        currentDegree = endDegree;
                        
                        return `${item.color} ${startDegree.toFixed(1)}deg ${endDegree.toFixed(1)}deg`;
                      });
                      
                      return `conic-gradient(${gradientParts.join(', ')})`;
                    })()
                  } as React.CSSProperties}
                />
                <div className={styles.pieChartLegend}>
                  {data.betDistribution?.length > 0 ? (
                    data.betDistribution.map((item) => (
                      <div key={item.range} className={styles.legendItem}>
                        <div 
                          className={styles.legendColor}
                          style={{ backgroundColor: item.color }}
                        />
                        <span className={styles.legendLabel}>
                          {item.range}: {item.count} ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '0.875rem' }}>
                      No hay datos de distribución disponibles
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* User Segments */}
            <Card className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>
                  <span className={styles.chartIcon}>👥</span>
                  Segmentación de Usuarios
                </h3>
              </div>
              <div className={styles.segmentsList}>
                {data.userSegments?.length > 0 ? data.userSegments.map((segment) => (
                  <div key={segment.segment} className={styles.segmentItem}>
                    <div className={styles.segmentHeader}>
                      <div 
                        className={styles.segmentIcon}
                        style={{ backgroundColor: segment.color }}
                      >
                        {segment.segment === 'Activos' ? '⚡' :
                         segment.segment === 'Regulares' ? '👤' : '😴'}
                      </div>
                      <span className={styles.segmentName}>{segment.segment}</span>
                      <span className={styles.segmentCount}>{segment.userCount} usuarios</span>
                    </div>
                    <div className={styles.segmentProgress}>
                      <div 
                        className={styles.segmentBar}
                        style={{ 
                          width: `${segment.userCount > 0 ? Math.min(100, (segment.userCount / Math.max(...(data.userSegments?.map(s => s.userCount) || [1]))) * 100) : 0}%`,
                          backgroundColor: segment.color
                        }}
                      />
                    </div>
                    <div className={styles.segmentStats}>
                      <span>Promedio: {formatCurrency(segment.avgBetAmount)}</span>
                      <span>Volumen: {formatCurrency(segment.totalVolume)}</span>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    No hay datos de segmentación disponibles
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Team Performance Row */}
          <div className={styles.chartsRow}>
            <Card className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>
                  <span className={styles.chartIcon}>🏆</span>
                  Rendimiento por Equipo
                </h3>
              </div>
              <div className={styles.teamPerformanceList}>
                {data.teamPerformance?.length > 0 ? data.teamPerformance.map((team) => (
                  <div key={team.teamName} className={styles.teamPerformanceItem}>
                    <div className={styles.teamPerformanceHeader}>
                      <div 
                        className={styles.teamPerformanceIcon}
                        style={{ backgroundColor: team.teamColor }}
                      >
                        {team.teamName === 'Gryffindor' ? '🦁' : 
                         team.teamName === 'Slytherin' ? '🐍' :
                         team.teamName === 'Ravenclaw' ? '🦅' : '🦡'}
                      </div>
                      <div className={styles.teamPerformanceInfo}>
                        <span className={styles.teamPerformanceName}>{team.teamName}</span>
                        <span className={styles.teamPerformanceWinRate}>
                          {team.winRate.toFixed(1)}% tasa de acierto
                        </span>
                      </div>
                      <div className={styles.teamPerformanceMetrics}>
                        <span className={styles.teamPerformanceVolume}>
                          {formatCurrency(team.totalVolume)}
                        </span>
                        <span className={styles.teamPerformanceBets}>
                          {team.wonBets}/{team.totalBets} ganadas
                        </span>
                      </div>
                    </div>
                    <div className={styles.teamPerformanceProgress}>
                      <div 
                        className={styles.teamPerformanceBar}
                        style={{ 
                          width: `${team.winRate}%`,
                          backgroundColor: team.teamColor,
                          opacity: 0.8
                        }}
                      />
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    No hay datos de rendimiento por equipo disponibles
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Rankings Row */}
          <div className={styles.rankingsRow}>
            {/* Active Users */}
            <Card className={styles.rankingCard}>
              <div className={styles.rankingHeader}>
                <h3>
                  <span className={styles.rankingIcon}>👑</span>
                  Usuarios Más Activos
                </h3>
              </div>
              <div className={styles.rankingList}>
                {data.activeUsers.map((user) => (
                  <div key={user.username} className={styles.rankingItem}>
                    <div className={styles.rankNumber}>#{user.rank}</div>
                    <div className={styles.rankInfo}>
                      <div className={styles.rankName}>{user.username}</div>
                      <div className={styles.rankDetails}>
                        {user.betCount} apuestas • {formatCurrency(user.totalAmount)}
                      </div>
                    </div>
                    <div className={styles.rankMetric}>
                      {user.winRate.toFixed(1)}% acierto
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Popular Matches */}
            <Card className={styles.rankingCard}>
              <div className={styles.rankingHeader}>
                <h3>
                  <span className={styles.rankingIcon}>🏆</span>
                  Partidos Más Populares
                </h3>
              </div>
              <div className={styles.rankingList}>
                {data.popularMatches.map((match) => (
                  <div key={match.name} className={styles.rankingItem}>
                    <div className={styles.rankNumber}>#{match.rank}</div>
                    <div className={styles.rankInfo}>
                      <div className={styles.rankName}>{match.name}</div>
                      <div className={styles.rankDetails}>
                        {match.betCount} apuestas • {formatCurrency(match.totalVolume)}
                      </div>
                    </div>
                    <div className={styles.rankMetric}>
                      {formatCurrency(match.averageAmount)} promedio
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Risk Analysis */}
          <Card className={styles.riskCard}>
            <div className={styles.riskHeader}>
              <h3>
                <span className={styles.riskIcon}>⚠️</span>
                Análisis de Riesgo y Alertas
              </h3>
            </div>
            <div className={styles.riskGrid}>
              <div className={styles.riskMetric}>
                <div className={styles.riskValue}>{data.riskAnalysis.highRiskBets}</div>
                <div className={styles.riskLabel}>APUESTAS DE ALTO RIESGO</div>
                <div className={styles.riskDescription}>Apuestas &gt; $300,000</div>
              </div>
              
              <div className={styles.riskMetric}>
                <div className={styles.riskValue}>{data.riskAnalysis.hyperactiveUsers}</div>
                <div className={styles.riskLabel}>USUARIOS HIPERACTIVOS</div>
                <div className={styles.riskDescription}>Más de 5 apuestas</div>
              </div>
              
              <div className={styles.riskMetric}>
                <div className={styles.riskValue}>{data.riskAnalysis.profitLossRatio.toFixed(2)}</div>
                <div className={styles.riskLabel}>RATIO GANANCIA/PÉRDIDA</div>
                <div className={styles.riskDescription}>Índice de rentabilidad</div>
              </div>
              
              <div className={styles.riskMetric}>
                <div 
                  className={styles.riskValue}
                  style={{ color: data.riskAnalysis.netProfit >= 0 ? '#10B981' : '#EF4444' }}
                >
                  {formatCurrency(data.riskAnalysis.netProfit)}
                </div>
                <div className={styles.riskLabel}>BENEFICIO NETO</div>
                <div className={styles.riskDescription}>Ganancia - Pérdida</div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminAdvancedStatistics;