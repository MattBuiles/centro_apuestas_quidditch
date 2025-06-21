import { useState } from 'react';
import { Link, Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import userLogoSrc from '@/assets/User_Logo.png';
import { teamLogos } from '@/assets/teamLogos';
import styles from './AccountPage.module.css';

// Icons (you can replace these with actual icon components)
const UserIcon = () => <span className={styles.icon}>👤</span>;
const WalletIcon = () => <span className={styles.icon}>💰</span>;
const BetIcon = () => <span className={styles.icon}>🎯</span>;
const HistoryIcon = () => <span className={styles.icon}>📊</span>;
const SettingsIcon = () => <span className={styles.icon}>⚙️</span>;
const TrophyIcon = () => <span className={styles.icon}>🏆</span>;

// Define sub-components for each account section
const ProfileSection = () => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically call an API to update user info
        console.log('Saving user data:', formData);
        setIsEditing(false);
    };

    const userStats = {
        totalBets: 47,
        winRate: 68,
        totalWinnings: 1250,
        favoriteTeam: 'Gryffindor'
    };

    return (
        <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>
                <UserIcon />
                Mi Perfil Mágico
            </h2>

            <div className={styles.contentGrid}>                <Card className={styles.card}>
                    <h3 className={styles.cardTitle}>Información Personal</h3>
                    {user && (
                        <form onSubmit={handleSave} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Nombre de Usuario:</label>                                <input 
                                    type="text" 
                                    className={`${styles.formInput} ${!isEditing ? styles.disabled : ''}`}
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    readOnly={!isEditing}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Correo Electrónico:</label>                                <input 
                                    type="email" 
                                    className={`${styles.formInput} ${!isEditing ? styles.disabled : ''}`}
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    readOnly={!isEditing}
                                />
                            </div>
                            {isEditing && (
                                <>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Nueva Contraseña:</label>
                                        <input 
                                            type="password" 
                                            placeholder="Dejar vacío para mantener actual"
                                            className={styles.formInput}
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Confirmar Nueva Contraseña:</label>
                                        <input 
                                            type="password" 
                                            placeholder="Confirmar nueva contraseña"
                                            className={styles.formInput}
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                        />
                                    </div>
                                    <Button type="submit" fullWidth>
                                        Guardar Cambios
                                    </Button>
                                </>
                            )}
                        </form>
                    )}                    <div className={styles.buttonContainer}>
                        <Button 
                            variant={isEditing ? "outline" : "primary"} 
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            {isEditing ? 'Cancelar' : 'Editar Perfil'}
                        </Button>
                    </div>
                </Card>                <Card className={styles.card}>
                    <h3 className={`${styles.cardTitle} ${styles.titleWithIcon}`}>
                        <TrophyIcon />
                        Estadísticas del Mago
                    </h3>
                    <div className={styles.statsGrid}>
                        <div className={`${styles.statCard} ${styles.yellow}`}>
                            <div className={styles.statValue}>{userStats.totalBets}</div>
                            <div className={styles.statLabel}>Apuestas Totales</div>
                        </div>
                        <div className={`${styles.statCard} ${styles.green}`}>
                            <div className={styles.statValue}>{userStats.winRate}%</div>
                            <div className={styles.statLabel}>Tasa de Éxito</div>
                        </div>
                        <div className={`${styles.statCard} ${styles.purple}`}>
                            <div className={styles.statValue}>{userStats.totalWinnings}</div>
                            <div className={styles.statLabel}>Galeones Ganados</div>
                        </div>                        <div className={`${styles.statCard} ${styles.blue}`}>
                            <div className={styles.teamFavoriteIcon}>
                                <img 
                                    src={teamLogos[userStats.favoriteTeam]} 
                                    alt={userStats.favoriteTeam}
                                    className={styles.teamLogo}
                                />
                            </div>
                            <div className={styles.statLabel}>Equipo Favorito</div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const WalletSection = () => {
    const { user } = useAuth();
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');

    const transactions = [
        { id: 1, type: 'deposit', amount: 500, date: '2025-06-15', description: 'Depósito inicial' },
        { id: 2, type: 'bet', amount: -50, date: '2025-06-16', description: 'Apuesta: Gryffindor vs Slytherin' },
        { id: 3, type: 'win', amount: 100, date: '2025-06-16', description: 'Ganancia: Gryffindor vs Slytherin' },
        { id: 4, type: 'bet', amount: -30, date: '2025-06-17', description: 'Apuesta: Hufflepuff vs Ravenclaw' },
        { id: 5, type: 'withdraw', amount: -200, date: '2025-06-17', description: 'Retiro a cuenta Gringotts' }
    ];

    const handleDeposit = () => {
        if (depositAmount && Number(depositAmount) > 0) {
            console.log('Depositing:', depositAmount);
            setShowDepositModal(false);
            setDepositAmount('');
        }
    };

    return (
        <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>
                <WalletIcon />
                Mi Bóveda de Gringotts
            </h2>

            {user && (
                <div className={styles.walletBalance}>
                    <div className={styles.balanceLabel}>💰 Saldo Actual</div>
                    <div className={styles.balanceValue}>{user.balance}</div>
                    <div className={styles.balanceCurrency}>Galeones Mágicos</div>
                </div>
            )}

            <div className={styles.actionButtons}>
                <button 
                    className={`${styles.actionButton} ${styles.primary}`}
                    onClick={() => setShowDepositModal(true)}
                >
                    <span>💳</span>
                    <span>Depositar Galeones</span>
                </button>
                <button className={styles.actionButton}>
                    <span>🏦</span>
                    <span>Retirar Galeones</span>
                </button>
            </div>            <Card className={styles.card}>
                <h3 className={`${styles.cardTitle} ${styles.titleWithIcon}`}>
                    <HistoryIcon />
                    Historial de Transacciones
                </h3>
                <div className={styles.transactionList}>
                    {transactions.map((transaction) => (
                        <div 
                            key={transaction.id}
                            className={`${styles.transactionItem} ${styles[transaction.type]}`}
                        >
                            <div className={styles.transactionInfo}>
                                <p className={styles.transactionDescription}>{transaction.description}</p>
                                <p className={styles.transactionDate}>{transaction.date}</p>
                            </div>
                            <div className={`${styles.transactionAmount} ${
                                transaction.amount > 0 ? styles.positive : styles.negative
                            }`}>
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount} G
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {showDepositModal && (
                <div className={styles.modal}>
                    <Card className={styles.modalContent}>
                        <h3 className={styles.modalTitle}>💰 Depositar Galeones</h3>                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Cantidad a depositar:</label>
                                <input
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    className={styles.formInput}
                                    placeholder="Ej: 500"
                                    min="1"
                                />
                            </div>
                            <div className={styles.modalButtons}>
                                <Button onClick={handleDeposit} fullWidth>
                                    Depositar
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setShowDepositModal(false)}
                                    fullWidth
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

const BetsSection = () => {
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    const activeBets = [
        {
            id: 1,
            match: 'Gryffindor vs Slytherin',
            date: '2025-06-20',
            time: '15:00',
            option: 'Gryffindor Victoria',
            amount: 50,
            odds: 2.1,
            potentialWin: 105,
            status: 'active'
        },
        {
            id: 2,
            match: 'Hufflepuff vs Ravenclaw',
            date: '2025-06-21',
            time: '18:00',
            option: 'Más de 150 puntos',
            amount: 30,
            odds: 1.8,
            potentialWin: 54,
            status: 'active'
        }
    ];

    const betHistory = [
        {
            id: 3,
            match: 'Chudley Cannons vs Holyhead Harpies',
            date: '2025-06-15',
            option: 'Holyhead Harpies Victoria',
            amount: 25,
            odds: 1.5,
            result: 'win',
            payout: 37.5
        },
        {
            id: 4,
            match: 'Gryffindor vs Hufflepuff',
            date: '2025-06-12',
            option: 'Empate',
            amount: 40,
            odds: 3.2,
            result: 'loss',
            payout: 0
        },
        {
            id: 5,
            match: 'Ravenclaw vs Slytherin',
            date: '2025-06-10',
            option: 'Ravenclaw Victoria',
            amount: 60,
            odds: 1.9,
            result: 'win',
            payout: 114
        }
    ];

    return (
        <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>
                <BetIcon />
                Mis Profecías de Quidditch
            </h2>

            <div className={styles.betTabs}>
                <button
                    className={`${styles.betTab} ${activeTab === 'active' ? styles.active : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    Apuestas Activas ({activeBets.length})
                </button>
                <button
                    className={`${styles.betTab} ${activeTab === 'history' ? styles.active : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    Historial ({betHistory.length})
                </button>
            </div>            {activeTab === 'active' && (
                <div className={styles.betsContainer}>
                    {activeBets.length > 0 ? (
                        activeBets.map((bet) => (
                            <div key={bet.id} className={`${styles.betCard} ${styles.active}`}>
                                <div className={styles.betHeader}>
                                    <h3 className={styles.betMatch}>{bet.match}</h3>
                                    <span className={`${styles.betStatus} ${styles.active}`}>
                                        Activa
                                    </span>
                                </div>
                                <div className={styles.betDetails}>
                                    <div className={styles.betDetail}>
                                        <p className={styles.betDetailLabel}>Fecha y Hora</p>
                                        <p className={styles.betDetailValue}>{bet.date} - {bet.time}</p>
                                    </div>
                                    <div className={styles.betDetail}>
                                        <p className={styles.betDetailLabel}>Tu Predicción</p>
                                        <p className={styles.betDetailValue}>{bet.option}</p>
                                    </div>
                                    <div className={styles.betDetail}>
                                        <p className={styles.betDetailLabel}>Apuesta</p>
                                        <p className={styles.betDetailValue}>{bet.amount} G (x{bet.odds})</p>
                                    </div>
                                </div>
                                <div className={styles.potentialWin}>
                                    <p className={styles.potentialWinText}>
                                        💰 Ganancia potencial
                                    </p>
                                    <p className={styles.potentialWinAmount}>{bet.potentialWin} Galeones</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyStateIcon}>🎯</div>
                            <div className={styles.emptyStateTitle}>No tienes apuestas activas</div>
                            <p className={styles.emptyStateDescription}>
                                No tienes apuestas activas en este momento
                            </p>
                            <Link to="/betting">
                                <Button className="mt-4">Hacer una Apuesta</Button>
                            </Link>
                        </div>
                    )}
                </div>
            )}            {activeTab === 'history' && (
                <div className={styles.betsContainer}>
                    {betHistory.map((bet) => (
                        <div key={bet.id} className={`${styles.betCard} ${styles[bet.result]}`}>
                            <div className={styles.betHeader}>
                                <h3 className={styles.betMatch}>{bet.match}</h3>
                                <span className={`${styles.betStatus} ${styles[bet.result]}`}>
                                    {bet.result === 'win' ? '🎉 Ganada' : '😞 Perdida'}
                                </span>
                            </div>
                            <div className={styles.betDetails}>
                                <div className={styles.betDetail}>
                                    <p className={styles.betDetailLabel}>Fecha</p>
                                    <p className={styles.betDetailValue}>{bet.date}</p>
                                </div>
                                <div className={styles.betDetail}>
                                    <p className={styles.betDetailLabel}>Predicción</p>
                                    <p className={styles.betDetailValue}>{bet.option}</p>
                                </div>
                                <div className={styles.betDetail}>
                                    <p className={styles.betDetailLabel}>Apuesta</p>
                                    <p className={styles.betDetailValue}>{bet.amount} G (x{bet.odds})</p>
                                </div>
                                <div className={styles.betDetail}>
                                    <p className={styles.betDetailLabel}>Resultado</p>                                    <p className={`${styles.betDetailValue} ${
                                        bet.result === 'win' ? styles.winResult : styles.lossResult
                                    }`}>
                                        {bet.result === 'win' ? `+${bet.payout} G` : '0 G'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SettingsSection = () => {
    const [notifications, setNotifications] = useState({
        matchReminders: true,
        betResults: true,
        promotions: false
    });

    return (
        <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>
                <SettingsIcon />
                Configuración Mágica
            </h2>

            <div className={styles.settingsGrid}>
                <Card className={styles.card}>
                    <h3 className={styles.cardTitle}>Notificaciones</h3>
                    <div className={styles.settingsGroup}>
                        <div className={styles.settingItem}>
                            <label className={styles.settingLabel}>Recordatorios de partidos</label>                            <input
                                type="checkbox"
                                checked={notifications.matchReminders}
                                onChange={(e) => setNotifications({
                                    ...notifications,
                                    matchReminders: e.target.checked
                                })}
                                className={styles.checkbox}
                            />
                        </div>
                        <div className={styles.settingItem}>
                            <label className={styles.settingLabel}>Resultados de apuestas</label>
                            <input
                                type="checkbox"
                                checked={notifications.betResults}
                                onChange={(e) => setNotifications({
                                    ...notifications,
                                    betResults: e.target.checked
                                })}
                                className={styles.checkbox}
                            />
                        </div>
                        <div className={styles.settingItem}>
                            <label className={styles.settingLabel}>Promociones especiales</label>
                            <input
                                type="checkbox"
                                checked={notifications.promotions}
                                onChange={(e) => setNotifications({
                                    ...notifications,
                                    promotions: e.target.checked
                                })}
                                className={styles.checkbox}
                            />
                        </div>
                    </div>
                </Card>

                <Card className={styles.card}>
                    <h3 className={styles.cardTitle}>Preferencias</h3>
                    <div className={styles.settingsGroup}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Tema</label>
                            <select className={styles.select}>
                                <option>Modo Claro</option>
                                <option>Modo Oscuro</option>
                                <option>Automático</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Idioma</label>
                            <select className={styles.select}>
                                <option>Español</option>
                                <option>English</option>
                                <option>Français</option>
                            </select>
                        </div>
                    </div>
                </Card>
            </div>

            <div className={styles.saveButtonContainer}>
                <Button>Guardar Configuración</Button>
            </div>
        </div>
    );
};


const AccountPage = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  // Determine active tab based on URL, default to profile
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/account/wallet') return 'wallet';
    if (path === '/account/bets') return 'bets';
    if (path === '/account/settings') return 'settings';
    if (path === '/account' || path === '/account/') return 'profile';
    return 'profile';
  };
  
  const activeTab = getActiveTab();

  if (!user) {
    return (
      <div className={styles.accountPageContainer}>
        <div className={styles.accountLayout}>
          <Card className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>🪄</div>
            <h2 className={styles.emptyStateTitle}>Acceso Restringido</h2>
            <p className={styles.emptyStateDescription}>
              Por favor, inicia sesión para acceder a tu cuenta mágica.
            </p>
            <Link to="/login">
              <Button fullWidth>Iniciar Sesión</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }
  const navItems = [
    { path: '/account', label: 'Mi Perfil', icon: <UserIcon />, tab: 'profile' },
    { path: '/account/wallet', label: 'Monedero', icon: <WalletIcon />, tab: 'wallet' },
    { path: '/account/bets', label: 'Mis Apuestas', icon: <BetIcon />, tab: 'bets' },
    { path: '/account/settings', label: 'Configuración', icon: <SettingsIcon />, tab: 'settings' }
  ];

  return (
    <div className={styles.accountPageContainer}>
      <div className={styles.accountLayout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>
              <img 
                src={userLogoSrc} 
                alt="Usuario" 
              />
            </div>
            <h3 className={styles.userName}>🧙‍♂️ {user.username}</h3>
            <p className={styles.userEmail}>{user.email}</p>
            <div className={styles.userBalance}>
              {user.balance} Galeones
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout} 
              fullWidth
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Cerrar Sesión
            </Button>
          </div>          <nav className={styles.accountNav}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${
                  activeTab === item.tab ? styles.active : ''
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          <Routes>
            <Route index element={<ProfileSection />} />
            <Route path="wallet" element={<WalletSection />} />
            <Route path="bets" element={<BetsSection />} />
            <Route path="settings" element={<SettingsSection />} />
            <Route path="*" element={<Navigate to="/account" replace />} />
          </Routes>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AccountPage;