import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { apiClient } from '@/utils/apiClient';
import styles from './AdminUsersManagement.module.css';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'inactive';
  balance: number;
  registrationDate: string;
  lastLogin: string;
  totalBets: number;
  totalWinnings: number;
  totalLosses?: number;
  correctPredictions?: number;
  incorrectPredictions?: number;
  totalPredictions?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

interface UsersResponse {
  data: any[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RegisterResponse {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

interface FilterOptions {
  role: string;
  status: string;
  search: string;
}

interface UserFormData {
  username: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'inactive';
  balance: string;
}

const AdminUsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  
  const [filters, setFilters] = useState<FilterOptions>({
    role: 'all',
    status: 'all',
    search: '',
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    role: 'user',
    status: 'active',
    balance: '150',
  });

  useEffect(() => {
    loadUsersData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, filters]);

  const loadUsersData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch users from backend
      const response = await apiClient.get('/users?limit=1000') as ApiResponse<UsersResponse>;
      
      if (response.success && response.data) {
        // Transform backend data to match frontend interface
        const backendUsers = response.data.data || [];
        const transformedUsers: User[] = backendUsers.map((user: any) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: 'active', // Backend doesn't have status field yet, default to active
          balance: user.balance,
          registrationDate: user.created_at,
          lastLogin: user.last_bet_date || user.created_at,
          totalBets: user.total_bets || 0,
          totalWinnings: user.total_winnings || 0,
          totalLosses: user.total_losses || 0,
          correctPredictions: user.correct_predictions || 0,
          incorrectPredictions: user.incorrect_predictions || 0,
          totalPredictions: user.total_predictions || 0,
        }));
        
        setUsers(transformedUsers);
      } else {
        console.error('Failed to load users data');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users data:', error);
      setUsers([]);
    }
    
    setIsLoading(false);
  };

  const applyFilters = useCallback(() => {
    let filtered = [...users];

    // Role filter
    if (filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(user => user.status === filters.status);
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handleCreateUser = async () => {
    try {
      const response = await apiClient.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: 'defaultPassword123', // You might want to generate a random password
        role: formData.role
      }) as ApiResponse<RegisterResponse>;

      if (response.success && response.data) {
        // If balance adjustment is needed
        if (parseFloat(formData.balance) !== 1000) {
          await apiClient.post(`/users/${response.data.user.id}/adjust-balance`, {
            amount: parseFloat(formData.balance) - 1000,
            reason: 'Initial balance adjustment by admin'
          });
        }

        await loadUsersData(); // Reload users
        setShowCreateModal(false);
        resetForm();
      } else {
        alert('Error creating user: ' + response.error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user');
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      // Update user balance if changed
      const balanceChange = parseFloat(formData.balance) - selectedUser.balance;
      if (balanceChange !== 0) {
        await apiClient.post(`/users/${selectedUser.id}/adjust-balance`, {
          amount: balanceChange,
          reason: 'Balance adjustment by admin'
        });
      }

      await loadUsersData(); // Reload users
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await apiClient.delete(`/users/${selectedUser.id}`);
      
      if (response.success) {
        await loadUsersData(); // Reload users
        setShowDeleteModal(false);
        setSelectedUser(null);
      } else {
        alert('Error deleting user: ' + response.error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      role: 'user',
      status: 'active',
      balance: '150',
    });
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      balance: user.balance.toString(),
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return styles.statusActive;
      case 'suspended': return styles.statusSuspended;
      case 'inactive': return styles.statusInactive;
      default: return '';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'suspended': return 'Suspendido';
      case 'inactive': return 'Inactivo';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminUsersManagement}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.icon}>👥</span>
          Gestión de Usuarios
        </h1>
        <p className={styles.subtitle}>
          Administrar usuarios registrados en la plataforma
        </p>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className={styles.createButton}
        >
          <span className={styles.buttonIcon}>➕</span>
          Nuevo Usuario
        </Button>
      </div>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <div className={styles.filtersHeader}>
          <h3>Filtros</h3>
        </div>
        <div className={styles.filtersContent}>
          <div className={styles.filterGroup}>
            <label>Rol:</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className={styles.filterSelect}
            >
              <option value="all">Todos</option>
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Estado:</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className={styles.filterSelect}
            >
              <option value="all">Todos</option>
              <option value="active">Activo</option>
              <option value="suspended">Suspendido</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Buscar:</label>
            <input
              type="text"
              placeholder="Usuario o email..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className={styles.filterInput}
            />
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>👤</div>
          <div className={styles.statContent}>
            <h3>{users.length}</h3>
            <p>Total Usuarios</p>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <h3>{users.filter(u => u.status === 'active').length}</h3>
            <p>Usuarios Activos</p>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statContent}>
            <h3>{users.reduce((sum, u) => sum + u.totalBets, 0)}</h3>
            <p>Total Apuestas</p>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statContent}>
            <h3>{formatCurrency(users.reduce((sum, u) => sum + u.balance, 0))}</h3>
            <p>Balance Total</p>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3>Usuarios ({filteredUsers.length})</h3>
        </div>
        
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Balance</th>
                <th>Apuestas</th>
                <th>Ganancias</th>
                <th>Predicciones</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.userAvatar}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.userInfo}>
                        <div className={styles.username}>{user.username}</div>
                        <div className={styles.userId}>ID: {user.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles.roleBadge} ${user.role === 'admin' ? styles.adminRole : styles.userRole}`}>
                      {user.role === 'admin' ? 'Admin' : 'Usuario'}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(user.status)}`}>
                      {getStatusText(user.status)}
                    </span>
                  </td>
                  <td>{formatCurrency(user.balance)}</td>
                  <td>{user.totalBets}</td>
                  <td className={styles.successText}>{formatCurrency(user.totalWinnings)}</td>
                  <td>
                    {(user.totalPredictions || 0) > 0 
                      ? `${user.correctPredictions || 0}/${user.totalPredictions || 0} (${(((user.correctPredictions || 0) / (user.totalPredictions || 1)) * 100).toFixed(1)}%)`
                      : 'N/A'
                    }
                  </td>
                  <td>{formatDate(user.registrationDate)}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(user)}
                        className={styles.editButton}
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openDeleteModal(user)}
                        className={styles.deleteButton}
                      >
                        🗑️
                      </Button>
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
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              ← Anterior
            </Button>
            
            <div className={styles.pageInfo}>
              Página {currentPage} de {totalPages}
            </div>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente →
            </Button>
          </div>
        )}
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Crear Nuevo Usuario</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Nombre de Usuario:</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Rol:</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' }))}
                  className={styles.formSelect}
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>Balance Inicial:</label>
                <input
                  type="number"
                  value={formData.balance}
                  onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
                  className={styles.formInput}
                  min="0"
                  step="10"
                />
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <Button
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateUser}
                disabled={!formData.username || !formData.email}
              >
                Crear Usuario
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Editar Usuario</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Nombre de Usuario:</label>
                <input
                  type="text"
                  value={formData.username}
                  disabled
                  className={`${styles.formInput} ${styles.disabled}`}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className={`${styles.formInput} ${styles.disabled}`}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Rol:</label>
                <select
                  value={formData.role}
                  disabled
                  className={`${styles.formSelect} ${styles.disabled}`}
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>Balance:</label>
                <input
                  type="number"
                  value={formData.balance}
                  onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
                  className={styles.formInput}
                  min="0"
                  step="10"
                />
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <Button
                variant="secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleEditUser}
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Eliminar Usuario</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowDeleteModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <p>¿Estás seguro de que quieres eliminar al usuario <strong>{selectedUser.username}</strong>?</p>
              <p className={styles.warningText}>Esta acción no se puede deshacer.</p>
            </div>
            
            <div className={styles.modalActions}>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="secondary"
                onClick={handleDeleteUser}
                className={styles.deleteButton}
              >
                Eliminar Usuario
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersManagement;
