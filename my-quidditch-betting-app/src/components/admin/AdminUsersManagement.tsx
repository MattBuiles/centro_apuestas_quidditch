import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
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
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data
    const mockUsers: User[] = [
      {
        id: 'user_001',
        username: 'HermioneGranger91',
        email: 'hermione.granger@hogwarts.edu',
        role: 'user',
        status: 'active',
        balance: 1250,
        registrationDate: '2025-01-15',
        lastLogin: '2025-06-21',
        totalBets: 47,
        totalWinnings: 2150,
      },
      {
        id: 'user_002',
        username: 'RonWeasley22',
        email: 'ron.weasley@hogwarts.edu',
        role: 'user',
        status: 'active',
        balance: 890,
        registrationDate: '2025-01-18',
        lastLogin: '2025-06-20',
        totalBets: 32,
        totalWinnings: 1456,
      },
      {
        id: 'user_003',
        username: 'LunaLovegood',
        email: 'luna.lovegood@hogwarts.edu',
        role: 'user',
        status: 'active',
        balance: 2100,
        registrationDate: '2025-02-03',
        lastLogin: '2025-06-21',
        totalBets: 68,
        totalWinnings: 3890,
      },
      {
        id: 'user_004',
        username: 'NevilleLongbottom',
        email: 'neville.longbottom@hogwarts.edu',
        role: 'user',
        status: 'suspended',
        balance: 150,
        registrationDate: '2025-01-25',
        lastLogin: '2025-06-15',
        totalBets: 15,
        totalWinnings: 230,
      },
      {
        id: 'user_005',
        username: 'GinnyWeasley',
        email: 'ginny.weasley@hogwarts.edu',
        role: 'user',
        status: 'active',
        balance: 1750,
        registrationDate: '2025-02-10',
        lastLogin: '2025-06-21',
        totalBets: 55,
        totalWinnings: 2890,
      },
      {
        id: 'user_006',
        username: 'DracoMalfoy',
        email: 'draco.malfoy@slytherin.edu',
        role: 'user',
        status: 'active',
        balance: 3200,
        registrationDate: '2025-01-12',
        lastLogin: '2025-06-20',
        totalBets: 89,
        totalWinnings: 5670,
      },
      {
        id: 'user_007',
        username: 'CedricDiggory',
        email: 'cedric.diggory@hufflepuff.edu',
        role: 'admin',
        status: 'active',
        balance: 0,
        registrationDate: '2025-01-05',
        lastLogin: '2025-06-21',
        totalBets: 0,
        totalWinnings: 0,
      },
      {
        id: 'user_008',
        username: 'ChoChang',
        email: 'cho.chang@ravenclaw.edu',
        role: 'user',
        status: 'inactive',
        balance: 450,
        registrationDate: '2025-03-01',
        lastLogin: '2025-05-20',
        totalBets: 8,
        totalWinnings: 120,
      },
    ];

    setUsers(mockUsers);
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
    setCurrentPage(1);
  }, [users, filters]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      role: 'all',
      status: 'all',
      search: '',
    });
  };

  const handleCreateUser = () => {
    setFormData({
      username: '',
      email: '',
      role: 'user',
      status: 'active',
      balance: '150',
    });
    setShowCreateModal(true);
  };

  const handleEditUser = (user: User) => {
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

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };
  const submitCreate = () => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      username: formData.username,
      email: formData.email,
      role: formData.role,
      status: formData.status,
      balance: Number(formData.balance),
      registrationDate: new Date().toISOString().split('T')[0],
      lastLogin: new Date().toISOString().split('T')[0],
      totalBets: 0,
      totalWinnings: 0,
    };

    setUsers(prev => [...prev, newUser]);
    setShowCreateModal(false);
    console.log('Usuario creado:', newUser);
    
    // Mostrar alerta de éxito
    alert(`✨ ¡Usuario creado exitosamente! 🧙‍♂️\n\nSe ha creado el usuario "${formData.username}" con el rol de ${formData.role === 'admin' ? 'Administrador' : 'Usuario'}.`);
  };
  const submitEdit = () => {
    if (!selectedUser) return;

    const updatedUser: User = {
      ...selectedUser,
      username: formData.username,
      email: formData.email,
      role: formData.role,
      status: formData.status,
      balance: Number(formData.balance),
    };

    setUsers(prev => prev.map(user => 
      user.id === selectedUser.id ? updatedUser : user
    ));
    setShowEditModal(false);
    setSelectedUser(null);
    console.log('Usuario actualizado:', updatedUser);
    
    // Mostrar alerta de éxito
    alert(`📝 ¡Usuario actualizado correctamente! ⚡\n\nLos datos de "${formData.username}" han sido modificados exitosamente.`);
  };
  const confirmDelete = () => {
    if (!selectedUser) return;

    const deletedUserName = selectedUser.username;
    setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
    setShowDeleteModal(false);
    setSelectedUser(null);
    console.log('Usuario eliminado:', selectedUser.id);
    
    // Mostrar alerta de éxito
    alert(`🗑️ ¡Usuario eliminado exitosamente! 🏴‍☠️\n\nEl usuario "${deletedUserName}" ha sido eliminado del sistema de forma permanente.`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activo', className: styles.statusActive },
      suspended: { label: 'Suspendido', className: styles.statusSuspended },
      inactive: { label: 'Inactivo', className: styles.statusInactive },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`${styles.statusBadge} ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    return (
      <span className={`${styles.roleBadge} ${role === 'admin' ? styles.roleAdmin : styles.roleUser}`}>
        {role === 'admin' ? '👑 Admin' : '👤 Usuario'}
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
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Statistics
  const stats = {
    total: filteredUsers.length,
    active: filteredUsers.filter(user => user.status === 'active').length,
    admins: filteredUsers.filter(user => user.role === 'admin').length,
    suspended: filteredUsers.filter(user => user.status === 'suspended').length,
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando gestión de usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleIcon}>👥</span>
          Gestión de Usuarios
        </h1>
        <p className={styles.subtitle}>Administrar cuentas y permisos del sistema</p>
      </div>

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <Card className={`${styles.statCard} ${styles.total}`}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Usuarios</div>
          </div>
        </Card>
        <Card className={`${styles.statCard} ${styles.active}`}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.active}</div>
            <div className={styles.statLabel}>Usuarios Activos</div>
          </div>
        </Card>
        <Card className={`${styles.statCard} ${styles.admins}`}>
          <div className={styles.statIcon}>👑</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.admins}</div>
            <div className={styles.statLabel}>Administradores</div>
          </div>
        </Card>
        <Card className={`${styles.statCard} ${styles.suspended}`}>
          <div className={styles.statIcon}>⚠️</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.suspended}</div>
            <div className={styles.statLabel}>Suspendidos</div>
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className={styles.filtersCard}>
        <div className={styles.filtersHeader}>
          <h3 className={styles.filtersTitle}>
            <span className={styles.filterIcon}>🔍</span>
            Filtros y Acciones
          </h3>
          <Button onClick={handleCreateUser} className={styles.createButton}>
            ➕ Crear Usuario
          </Button>
        </div>
        
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Rol:</label>
            <select
              className={styles.filterSelect}
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <option value="all">Todos los roles</option>
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Estado:</label>
            <select
              className={styles.filterSelect}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="suspended">Suspendido</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
          
          <div className={`${styles.filterGroup} ${styles.searchGroup}`}>
            <label className={styles.filterLabel}>Buscar:</label>
            <input
              type="text"
              className={styles.filterInput}
              placeholder="Nombre o email..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <div className={styles.filterActions}>
            <Button variant="outline" onClick={resetFilters}>
              Limpiar
            </Button>
          </div>
        </div>
      </Card>

      {/* Users Grid */}
      <div className={styles.usersGrid}>
        {currentUsers.map((user) => (
          <Card key={user.id} className={styles.userCard}>
            <div className={styles.userHeader}>
              <div className={styles.userInfo}>
                <h3 className={styles.username}>{user.username}</h3>
                <p className={styles.userEmail}>{user.email}</p>
              </div>
              <div className={styles.userBadges}>
                {getRoleBadge(user.role)}
                {getStatusBadge(user.status)}
              </div>
            </div>
            
            <div className={styles.userStats}>
              <div className={styles.userStat}>
                <span className={styles.statIcon}>💰</span>
                <div>
                  <div className={styles.statValue}>{formatCurrency(user.balance)}</div>
                  <div className={styles.statLabel}>Saldo</div>
                </div>
              </div>
              <div className={styles.userStat}>
                <span className={styles.statIcon}>🎯</span>
                <div>
                  <div className={styles.statValue}>{user.totalBets}</div>
                  <div className={styles.statLabel}>Apuestas</div>
                </div>
              </div>
              <div className={styles.userStat}>
                <span className={styles.statIcon}>🏆</span>
                <div>
                  <div className={styles.statValue}>{formatCurrency(user.totalWinnings)}</div>
                  <div className={styles.statLabel}>Ganancias</div>
                </div>
              </div>
            </div>
            
            <div className={styles.userDetails}>
              <div className={styles.userDetail}>
                <span className={styles.detailLabel}>Registro:</span>
                <span className={styles.detailValue}>{formatDate(user.registrationDate)}</span>
              </div>
              <div className={styles.userDetail}>
                <span className={styles.detailLabel}>Último acceso:</span>
                <span className={styles.detailValue}>{formatDate(user.lastLogin)}</span>
              </div>
            </div>
              <div className={styles.userActions}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditUser(user)}
              >
                ✏️ Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteUser(user)}
                className={styles.deleteButton}
              >
                🗑️ Eliminar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <Card className={styles.paginationCard}>
        <div className={styles.paginationInfo}>
          Mostrando {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} de {filteredUsers.length} usuarios
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
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Crear Nuevo Usuario</h3>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre de usuario:</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email:</label>
                <input
                  type="email"
                  className={styles.formInput}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Rol:</label>
                <select
                  className={styles.formSelect}
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as 'user' | 'admin'})}
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Estado:</label>
                <select
                  className={styles.formSelect}
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'suspended' | 'inactive'})}
                >
                  <option value="active">Activo</option>
                  <option value="suspended">Suspendido</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Saldo inicial:</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={formData.balance}
                  onChange={(e) => setFormData({...formData, balance: e.target.value})}
                />
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button onClick={submitCreate}>
                Crear Usuario
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Editar Usuario</h3>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre de usuario:</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email:</label>
                <input
                  type="email"
                  className={styles.formInput}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Rol:</label>
                <select
                  className={styles.formSelect}
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as 'user' | 'admin'})}
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Estado:</label>
                <select
                  className={styles.formSelect}
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'suspended' | 'inactive'})}
                >
                  <option value="active">Activo</option>
                  <option value="suspended">Suspendido</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Saldo:</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={formData.balance}
                  onChange={(e) => setFormData({...formData, balance: e.target.value})}
                />
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button onClick={submitEdit}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Confirmar Eliminación</h3>
            <p className={styles.modalDescription}>
              ¿Estás seguro de que deseas eliminar al usuario <strong>{selectedUser.username}</strong>? 
              Esta acción no se puede deshacer.
            </p>
            <div className={styles.modalActions}>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmDelete} className={styles.deleteConfirmButton}>
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
