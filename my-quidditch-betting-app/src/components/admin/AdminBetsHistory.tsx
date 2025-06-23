import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import styles from './AdminBetsHistory.module.css';

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
  minAmount: string;
  maxAmount: string;
  username: string;
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
    minAmount: '',
    maxAmount: '',
    username: '',
  });

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  useEffect(() => {
    loadBetsData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bets, filters]);

  const loadBetsData = async () => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Mock data
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
        placedAt: '2025-06-20 13:15:00',
        resolvedAt: '2025-06-20 15:30:00',
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
        placedAt: '2025-06-20 14:00:00',
        resolvedAt: '2025-06-20 16:45:00',
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
        status: 'pending',
        placedAt: '2025-06-21 09:30:00',
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
        placedAt: '2025-06-20 12:45:00',
        resolvedAt: '2025-06-20 15:30:00',
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
        placedAt: '2025-06-19 16:20:00',
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
        placedAt: '2025-06-19 11:15:00',
        resolvedAt: '2025-06-19 14:00:00',
      },
    ];

    setBets(mockBets);
    setIsLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...bets];

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

    // Amount range filter
    if (filters.minAmount) {
      filtered = filtered.filter(bet => bet.amount >= Number(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(bet => bet.amount <= Number(filters.maxAmount));
    }

    // Username filter
    if (filters.username) {
      filtered = filtered.filter(bet => 
        bet.username.toLowerCase().includes(filters.username.toLowerCase())
      );
    }

    setFilteredBets(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      username: '',
    });
  };

  const handleExport = () => {
    // Simulate export functionality
    console.log(`Exporting ${filteredBets.length} records as ${exportFormat}`);
    
    if (exportFormat === 'csv') {
      const headers = ['ID', 'Usuario', 'Partido', 'Predicción', 'Monto', 'Cuotas', 'Estado', 'Fecha'];
      const csvContent = [
        headers.join(','),
        ...filteredBets.map(bet => [
          bet.id,
          bet.username,
          bet.matchName,
          bet.prediction,
          bet.amount,
          bet.odds,
          bet.status,
          bet.placedAt
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historial_apuestas_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
    
    setShowExportModal(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', className: styles.statusPending },
      won: { label: 'Ganada', className: styles.statusWon },
      lost: { label: 'Perdida', className: styles.statusLost },
      cancelled: { label: 'Cancelada', className: styles.statusCancelled },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`${styles.statusBadge} ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredBets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBets = filteredBets.slice(startIndex, endIndex);

  // Statistics
  const stats = {
    total: filteredBets.length,
    totalAmount: filteredBets.reduce((sum, bet) => sum + bet.amount, 0),
    wonCount: filteredBets.filter(bet => bet.status === 'won').length,
    lostCount: filteredBets.filter(bet => bet.status === 'lost').length,
    pendingCount: filteredBets.filter(bet => bet.status === 'pending').length,
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando historial de apuestas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleIcon}>📊</span>
          Historial Global de Apuestas
        </h1>
        <p className={styles.subtitle}>Gestión y análisis detallado de todas las apuestas del sistema con filtros en tiempo real</p>
        <div className={styles.headerActions}>
          <Link to="/account/bets-statistics">
            <Button variant="primary">
              📈 Ver Estadísticas Avanzadas
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <Card className={`${styles.statCard} ${styles.total}`}>
          <div className={styles.statIcon}>📈</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Apuestas</div>
          </div>
        </Card>
        <Card className={`${styles.statCard} ${styles.amount}`}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{formatCurrency(stats.totalAmount)}</div>
            <div className={styles.statLabel}>Monto Total</div>
          </div>
        </Card>
        <Card className={`${styles.statCard} ${styles.won}`}>
          <div className={styles.statIcon}>🏆</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.wonCount}</div>
            <div className={styles.statLabel}>Apuestas Ganadas</div>
          </div>
        </Card>
        <Card className={`${styles.statCard} ${styles.pending}`}>
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.pendingCount}</div>
            <div className={styles.statLabel}>Pendientes</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <h3 className={styles.filtersTitle}>
          <span className={styles.filterIcon}>🔍</span>
          Filtros de Búsqueda
        </h3>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Estado:</label>
            <select
              className={styles.filterSelect}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="won">Ganada</option>
              <option value="lost">Perdida</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Desde:</label>
            <input
              type="date"
              className={styles.filterInput}
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Hasta:</label>
            <input
              type="date"
              className={styles.filterInput}
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Monto mínimo:</label>
            <input
              type="number"
              className={styles.filterInput}
              placeholder="0"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Monto máximo:</label>
            <input
              type="number"
              className={styles.filterInput}
              placeholder="Sin límite"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Usuario:</label>
            <input
              type="text"
              className={styles.filterInput}
              placeholder="Buscar por nombre..."
              value={filters.username}
              onChange={(e) => handleFilterChange('username', e.target.value)}
            />
          </div>
        </div>
        
        <div className={styles.filtersActions}>
          <Button variant="outline" onClick={resetFilters}>
            Limpiar Filtros
          </Button>
          <Button onClick={() => setShowExportModal(true)}>
            📥 Exportar Datos
          </Button>
        </div>
      </Card>

      {/* Bets Table */}
      <Card className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>
            Registro de Apuestas ({filteredBets.length} resultados)
          </h3>
        </div>
        
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Partido</th>
                <th>Predicción</th>
                <th>Monto</th>
                <th>Cuotas</th>
                <th>Ganancia Potencial</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {currentBets.map((bet) => (
                <tr key={bet.id} className={styles.tableRow}>
                  <td className={styles.cellId}>#{bet.id}</td>
                  <td className={styles.cellUser}>{bet.username}</td>
                  <td className={styles.cellMatch}>{bet.matchName}</td>
                  <td className={styles.cellPrediction}>{bet.prediction}</td>
                  <td className={styles.cellAmount}>{formatCurrency(bet.amount)}</td>
                  <td className={styles.cellOdds}>{bet.odds}x</td>
                  <td className={styles.cellPotential}>{formatCurrency(bet.potentialWin)}</td>
                  <td className={styles.cellStatus}>{getStatusBadge(bet.status)}</td>
                  <td className={styles.cellDate}>{formatDate(bet.placedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Mostrando {startIndex + 1}-{Math.min(endIndex, filteredBets.length)} de {filteredBets.length} resultados
          </div>
          <div className={styles.paginationControls}>
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              ← Anterior
            </Button>
            <span className={styles.pageNumbers}>
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Siguiente →
            </Button>
          </div>
        </div>
      </Card>

      {/* Export Modal */}
      {showExportModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Exportar Datos</h3>
            <p className={styles.modalDescription}>
              Se exportarán {filteredBets.length} registros de apuestas.
            </p>
            
            <div className={styles.exportOptions}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="exportFormat"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value)}
                />
                <span className={styles.radioText}>CSV (Excel)</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="exportFormat"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={(e) => setExportFormat(e.target.value)}
                />
                <span className={styles.radioText}>JSON</span>
              </label>
            </div>
            
            <div className={styles.modalActions}>
              <Button variant="outline" onClick={() => setShowExportModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleExport}>
                Exportar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBetsHistory;
