import { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { apiClient } from '@/utils/apiClient';
import { leagueTimeService } from '@/services/leagueTimeService';
import styles from './AdminBetsHistory.module.css';

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
  period: '7' | '30' | '90' | 'all';
}

interface ApiResponse<T> {
  success: boolean;
  data?: {
    data: T[];
  };
}

const AdminBetsHistory = () => {
  const [bets, setBets] = useState<BetRecord[]>([]);
  const [filteredBets, setFilteredBets] = useState<BetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [virtualTime, setVirtualTime] = useState<Date | null>(null);
  
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    user: '',
    period: '30'
  });

  useEffect(() => {
    loadBetsData();
    loadVirtualTime();
  }, []);

  const loadVirtualTime = async () => {
    try {
      const timeInfo = await leagueTimeService.getLeagueTimeInfo();
      setVirtualTime(new Date(timeInfo.currentDate));
    } catch (error) {
      console.error('Error loading virtual time:', error);
      // Fallback to real time if virtual time is not available
      setVirtualTime(new Date());
    }
  };

  const loadBetsData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch betting history from backend
      const response = await apiClient.get('/bets?limit=1000') as ApiResponse<any>;
      
      if (response.success) {
        // Transform backend data to match frontend interface
        const backendBets = response.data?.data || [];
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
        console.error('Failed to load betting history');
        setBets([]);
      }
    } catch (error) {
      console.error('Error loading betting history:', error);
      setBets([]);
    }
    
    setIsLoading(false);
  };

  // Auto-apply filters when they change
  useEffect(() => {
    let filtered = [...bets];

    console.log('🔍 Aplicando filtros:', {
      totalBets: bets.length,
      period: filters.period,
      status: filters.status,
      virtualTime: virtualTime?.toISOString(),
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo
    });

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(bet => bet.status === filters.status);
    }

    // Period filter (only apply if no custom date range is set)
    if (filters.period !== 'all' && !filters.dateFrom && !filters.dateTo && virtualTime) {
      const periodDays = parseInt(filters.period);
      const cutoffDate = new Date(virtualTime.getTime() - periodDays * 24 * 60 * 60 * 1000);
      console.log('📅 Filtro de período:', {
        periodDays,
        cutoffDate: cutoffDate.toISOString(),
        virtualTime: virtualTime.toISOString()
      });
      filtered = filtered.filter(bet => new Date(bet.placedAt) >= cutoffDate);
    }

    // User filter
    if (filters.user) {
      const searchTerm = filters.user.toLowerCase();
      filtered = filtered.filter(bet => 
        bet.username.toLowerCase().includes(searchTerm) ||
        bet.userId.toLowerCase().includes(searchTerm)
      );
    }

    // Date range filters
    if (filters.dateFrom) {
      filtered = filtered.filter(bet => new Date(bet.placedAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(bet => new Date(bet.placedAt) <= new Date(filters.dateTo + 'T23:59:59'));
    }

    setFilteredBets(filtered);
    setCurrentPage(1); // Reset to first page when filters change
    
    console.log('✅ Resultado del filtrado:', {
      betsOriginales: bets.length,
      betsFiltradas: filtered.length,
      fechasDeApuestas: filtered.slice(0, 5).map(bet => bet.placedAt)
    });
  }, [bets, filters, virtualTime]);

  // Handle period filter changes
  const handlePeriodChange = (period: '7' | '30' | '90' | 'all') => {
    setFilters(prev => ({
      ...prev,
      period,
      // Clear custom date range when selecting a predefined period
      dateFrom: period !== 'all' ? '' : prev.dateFrom,
      dateTo: period !== 'all' ? '' : prev.dateTo
    }));
  };

  // Pagination
  const totalPages = Math.ceil(filteredBets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBets = filteredBets.slice(startIndex, endIndex);

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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'won': return styles.statusWon;
      case 'lost': return styles.statusLost;
      case 'pending': return styles.statusPending;
      case 'cancelled': return styles.statusCancelled;
      default: return '';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'won': return 'Ganada';
      case 'lost': return 'Perdida';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando historial de apuestas...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminBetsHistory}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.icon}>📜</span>
          Historial de Apuestas
        </h1>
        <p className={styles.subtitle}>
          Registro completo de todas las apuestas realizadas en la plataforma
        </p>
      </div>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statContent}>
            <h3>{bets.length}</h3>
            <p>Total Apuestas</p>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <h3>{bets.filter(bet => bet.status === 'won').length}</h3>
            <p>Apuestas Ganadas</p>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>❌</div>
          <div className={styles.statContent}>
            <h3>{bets.filter(bet => bet.status === 'lost').length}</h3>
            <p>Apuestas Perdidas</p>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statContent}>
            <h3>{bets.filter(bet => bet.status === 'pending').length}</h3>
            <p>Apuestas Pendientes</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <div className={styles.filtersHeader}>
          <h3 className={styles.filtersTitle}>
            <span className={styles.filterIcon}>🔍</span>
            Filtros de Búsqueda
          </h3>
          <div className={styles.filtersToggle}>
            <span className={styles.filtersCount}>
              {Object.entries(filters).filter(([key, value]) => 
                value && value !== 'all' && (key !== 'period' || value !== '30')
              ).length} activos
            </span>
          </div>
        </div>
        
        <div className={styles.filtersContent}>
          {/* Period Section */}
          <div className={styles.periodSection}>
            <label>Período:</label>
            <div className={styles.periodButtons}>
              {[
                { value: '7', label: '7 días' },
                { value: '30', label: '30 días' },
                { value: '90', label: '90 días' },
                { value: 'all', label: 'Todo' }
              ].map((period) => (
                <Button
                  key={period.value}
                  variant={filters.period === period.value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handlePeriodChange(period.value as '7' | '30' | '90' | 'all')}
                  className={filters.period === period.value ? styles.activeButton : ''}
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>

          <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <span className={styles.labelIcon}>📊</span>
              Estado:
            </label>
            <div className={styles.selectWrapper}>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className={styles.filterSelect}
              >
                <option value="all">🏆 Todos los estados</option>
                <option value="won">✅ Ganadas</option>
                <option value="lost">❌ Perdidas</option>
                <option value="pending">⏳ Pendientes</option>
                <option value="cancelled">🚫 Canceladas</option>
              </select>
              <span className={styles.selectArrow}>⌄</span>
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <span className={styles.labelIcon}>👤</span>
              Usuario:
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                placeholder="Buscar por nombre o ID..."
                value={filters.user}
                onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
                className={styles.filterInput}
              />
              <span className={styles.inputIcon}>🔎</span>
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <span className={styles.labelIcon}>📅</span>
              Fecha Desde:
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className={styles.filterInput}
              />
              <span className={styles.inputIcon}>📆</span>
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <span className={styles.labelIcon}>📅</span>
              Fecha Hasta:
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className={styles.filterInput}
              />
              <span className={styles.inputIcon}>📆</span>
            </div>
          </div>
          </div>
        </div>

        <div className={styles.filtersActions}>
          <Button
            variant="secondary"
            onClick={() => {
              setFilters({
                status: 'all',
                dateFrom: '',
                dateTo: '',
                user: '',
                period: '30'
              });
            }}
            className={styles.clearFiltersButton}
          >
            <span className={styles.buttonIcon}>🧹</span>
            Limpiar Filtros
          </Button>
        </div>
      </Card>

      {/* Bets Table */}
      <Card className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3>Historial de Apuestas ({filteredBets.length})</h3>
          <div className={styles.tableActions}>
            <Button
              variant="secondary"
              onClick={loadBetsData}
              className={styles.refreshButton}
            >
              🔄 Actualizar
            </Button>
          </div>
        </div>
        
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Partido</th>
                <th>Predicción</th>
                <th>Cantidad</th>
                <th>Cuota</th>
                <th>Ganancia Potencial</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Resuelto</th>
              </tr>
            </thead>
            <tbody>
              {currentBets.map((bet) => (
                <tr key={bet.id}>
                  <td className={styles.betId}>#{bet.id.slice(0, 8)}</td>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.userAvatar}>
                        {bet.username.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.userInfo}>
                        <div className={styles.username}>{bet.username}</div>
                        <div className={styles.userId}>ID: {bet.userId.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.matchCell}>
                      <div className={styles.matchName}>{bet.matchName}</div>
                      <div className={styles.matchId}>Match: {bet.matchId.slice(0, 8)}</div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.predictionBadge}>
                      {bet.prediction}
                    </span>
                  </td>
                  <td className={styles.amount}>{formatCurrency(bet.amount)}</td>
                  <td className={styles.odds}>{bet.odds.toFixed(2)}</td>
                  <td className={styles.potentialWin}>{formatCurrency(bet.potentialWin)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(bet.status)}`}>
                      {getStatusText(bet.status)}
                    </span>
                  </td>
                  <td className={styles.date}>{formatDate(bet.placedAt)}</td>
                  <td className={styles.resolvedDate}>
                    {bet.resolvedAt ? formatDate(bet.resolvedAt) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Button
              variant="secondary"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={styles.paginationButton}
            >
              ← Anterior
            </Button>
            
            <div className={styles.pageInfo}>
              <span>Página {currentPage} de {totalPages}</span>
              <span className={styles.resultsInfo}>
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredBets.length)} de {filteredBets.length} apuestas
              </span>
            </div>
            
            <Button
              variant="secondary"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={styles.paginationButton}
            >
              Siguiente →
            </Button>
          </div>
        )}
      </Card>

      {/* Summary Section */}
      <Card className={styles.summaryCard}>
        <h3>Resumen de Resultados Filtrados</h3>
        <div className={styles.summaryContent}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total de apuestas:</span>
            <span className={styles.summaryValue}>{filteredBets.length}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Volumen total:</span>
            <span className={styles.summaryValue}>
              {formatCurrency(filteredBets.reduce((sum, bet) => sum + bet.amount, 0))}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Ganancias potenciales:</span>
            <span className={styles.summaryValue}>
              {formatCurrency(filteredBets.reduce((sum, bet) => sum + bet.potentialWin, 0))}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Tasa de éxito:</span>
            <span className={styles.summaryValue}>
              {filteredBets.length > 0 
                ? `${((filteredBets.filter(bet => bet.status === 'won').length / filteredBets.filter(bet => bet.status !== 'pending').length) * 100).toFixed(1)}%`
                : 'N/A'
              }
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminBetsHistory;
