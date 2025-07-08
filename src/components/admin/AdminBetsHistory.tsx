import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { apiClient } from '@/utils/apiClient';
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
}

const AdminBetsHistory = () => {
  const [bets, setBets] = useState<BetRecord[]>([]);
  const [filteredBets, setFilteredBets] = useState<BetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    user: ''
  });

  useEffect(() => {
    loadBetsData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bets, filters]);

  const loadBetsData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch betting history from backend
      const response = await apiClient.get('/bets?limit=1000');
      
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

  const applyFilters = () => {
    let filtered = [...bets];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(bet => bet.status === filters.status);
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
          <h3>Filtros de Búsqueda</h3>
        </div>
        <div className={styles.filtersContent}>
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

          <Button
            variant="secondary"
            onClick={() => {
              setFilters({
                status: 'all',
                dateFrom: '',
                dateTo: '',
                user: ''
              });
            }}
            className={styles.clearFiltersButton}
          >
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
                <th>Acciones</th>
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
                  <td>
                    <div className={styles.actionButtons}>
                      <Link
                        to={`/admin/bets/${bet.id}`}
                        className={styles.viewButton}
                      >
                        👁️
                      </Link>
                      <Link
                        to={`/admin/users/${bet.userId}`}
                        className={styles.userButton}
                      >
                        👤
                      </Link>
                      <Link
                        to={`/match/${bet.matchId}`}
                        className={styles.matchButton}
                      >
                        ⚽
                      </Link>
                    </div>
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
