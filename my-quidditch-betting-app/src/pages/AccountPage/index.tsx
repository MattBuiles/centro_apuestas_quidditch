import { useState } from 'react';
import { Link, Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import userLogoSrc from '@/assets/User_Logo.png';
import { teamLogos } from '@/assets/teamLogos';
import styles from './AccountPage.module.css';

// Icons (you can replace these with actual icon components)
const UserIcon = () => <span className="text-xl">👤</span>;
const WalletIcon = () => <span className="text-xl">💰</span>;
const BetIcon = () => <span className="text-xl">🎯</span>;
const HistoryIcon = () => <span className="text-xl">📊</span>;
const SettingsIcon = () => <span className="text-xl">⚙️</span>;
const TrophyIcon = () => <span className="text-xl">🏆</span>;

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
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-primary flex items-center gap-3">
                    <UserIcon />
                    Mi Perfil Mágico
                </h2>
                <Button 
                    variant={isEditing ? "outline" : "primary"} 
                    onClick={() => setIsEditing(!isEditing)}
                >
                    {isEditing ? 'Cancelar' : 'Editar Perfil'}
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <Card className="p-6">
                    <h3 className="text-xl font-semibold mb-4 text-primary">Información Personal</h3>
                    {user && (
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="form-group">
                                <label className="block text-sm font-medium mb-2">Nombre de Usuario:</label>
                                <input 
                                    type="text" 
                                    className={`w-full p-3 border rounded-lg ${isEditing ? '' : 'bg-gray-100'}`}
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    readOnly={!isEditing}
                                />
                            </div>
                            <div className="form-group">
                                <label className="block text-sm font-medium mb-2">Correo Electrónico:</label>
                                <input 
                                    type="email" 
                                    className={`w-full p-3 border rounded-lg ${isEditing ? '' : 'bg-gray-100'}`}
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    readOnly={!isEditing}
                                />
                            </div>
                            {isEditing && (
                                <>
                                    <div className="form-group">
                                        <label className="block text-sm font-medium mb-2">Nueva Contraseña:</label>
                                        <input 
                                            type="password" 
                                            placeholder="Dejar vacío para mantener actual"
                                            className="w-full p-3 border rounded-lg"
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="block text-sm font-medium mb-2">Confirmar Nueva Contraseña:</label>
                                        <input 
                                            type="password" 
                                            placeholder="Confirmar nueva contraseña"
                                            className="w-full p-3 border rounded-lg"
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
                    )}
                </Card>

                <Card className="p-6">
                    <h3 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
                        <TrophyIcon />
                        Estadísticas del Mago
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                            <div className="text-2xl font-bold text-yellow-700">{userStats.totalBets}</div>
                            <div className="text-sm text-yellow-600">Apuestas Totales</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                            <div className="text-2xl font-bold text-green-700">{userStats.winRate}%</div>
                            <div className="text-sm text-green-600">Tasa de Éxito</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                            <div className="text-2xl font-bold text-purple-700">{userStats.totalWinnings}</div>
                            <div className="text-sm text-purple-600">Galeones Ganados</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-center gap-2">
                                <img 
                                    src={teamLogos[userStats.favoriteTeam]} 
                                    alt={userStats.favoriteTeam}
                                    className="w-8 h-8"
                                />
                                <div className="text-sm text-blue-600">Equipo Favorito</div>
                            </div>
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
            <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
                <WalletIcon />
                Mi Bóveda de Gringotts
            </h2>

            {user && (
                <div className="mb-8">
                    <Card className="p-8 text-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-xl opacity-90 mb-2">💰 Saldo Actual</p>
                            <p className="text-5xl font-bold mb-4">{user.balance}</p>
                            <p className="text-xl">Galeones Mágicos</p>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/20 to-transparent"></div>
                        <div className="absolute -top-4 -right-4 text-8xl opacity-10">🏛️</div>
                    </Card>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Button 
                    className="p-4 h-auto flex flex-col items-center gap-2"
                    onClick={() => setShowDepositModal(true)}
                >
                    <span className="text-2xl">💳</span>
                    <span>Depositar Galeones</span>
                </Button>
                <Button 
                    variant="outline" 
                    className="p-4 h-auto flex flex-col items-center gap-2"
                >
                    <span className="text-2xl">🏦</span>
                    <span>Retirar Galeones</span>
                </Button>
            </div>

            <Card className="p-6">
                <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
                    <HistoryIcon />
                    Historial de Transacciones
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transactions.map((transaction) => (
                        <div 
                            key={transaction.id}
                            className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${
                                transaction.type === 'deposit' ? 'bg-green-50 border-green-400' :
                                transaction.type === 'win' ? 'bg-blue-50 border-blue-400' :
                                transaction.type === 'withdraw' ? 'bg-purple-50 border-purple-400' :
                                'bg-red-50 border-red-400'
                            }`}
                        >
                            <div>
                                <p className="font-medium">{transaction.description}</p>
                                <p className="text-sm text-gray-600">{transaction.date}</p>
                            </div>
                            <div className={`font-bold text-lg ${
                                transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount} G
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {showDepositModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold mb-4">Depositar Galeones</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Cantidad a depositar:</label>
                                <input
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    className="w-full p-3 border rounded-lg"
                                    placeholder="Ej: 500"
                                    min="1"
                                />
                            </div>
                            <div className="flex gap-3">
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
            <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
                <BetIcon />
                Mis Profecías de Quidditch
            </h2>

            <div className="flex gap-4 mb-6">
                <Button
                    variant={activeTab === 'active' ? 'primary' : 'outline'}
                    onClick={() => setActiveTab('active')}
                >
                    Apuestas Activas ({activeBets.length})
                </Button>
                <Button
                    variant={activeTab === 'history' ? 'primary' : 'outline'}
                    onClick={() => setActiveTab('history')}
                >
                    Historial ({betHistory.length})
                </Button>
            </div>

            {activeTab === 'active' && (
                <div className="space-y-4">
                    {activeBets.length > 0 ? (
                        activeBets.map((bet) => (
                            <Card key={bet.id} className="p-6 border-l-4 border-blue-400">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-primary">{bet.match}</h3>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                        Activa
                                    </span>
                                </div>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Fecha y Hora</p>
                                        <p className="font-medium">{bet.date} - {bet.time}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Tu Predicción</p>
                                        <p className="font-medium">{bet.option}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Apuesta</p>
                                        <p className="font-medium">{bet.amount} G (x{bet.odds})</p>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        💰 Ganancia potencial: <span className="font-bold">{bet.potentialWin} Galeones</span>
                                    </p>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card className="p-8 text-center">
                            <p className="text-gray-500">No tienes apuestas activas en este momento</p>
                            <Link to="/betting">
                                <Button className="mt-4">Hacer una Apuesta</Button>
                            </Link>
                        </Card>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-4">
                    {betHistory.map((bet) => (
                        <Card key={bet.id} className={`p-6 border-l-4 ${
                            bet.result === 'win' ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
                        }`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">{bet.match}</h3>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    bet.result === 'win' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {bet.result === 'win' ? '🎉 Ganada' : '😞 Perdida'}
                                </span>
                            </div>
                            <div className="grid md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Fecha</p>
                                    <p className="font-medium">{bet.date}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Predicción</p>
                                    <p className="font-medium">{bet.option}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Apuesta</p>
                                    <p className="font-medium">{bet.amount} G (x{bet.odds})</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Resultado</p>
                                    <p className={`font-bold ${
                                        bet.result === 'win' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {bet.result === 'win' ? `+${bet.payout} G` : '0 G'}
                                    </p>
                                </div>
                            </div>
                        </Card>
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
            <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
                <SettingsIcon />
                Configuración Mágica
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
                <Card className="p-6">
                    <h3 className="text-xl font-semibold text-primary mb-4">Notificaciones</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Recordatorios de partidos</label>
                            <input
                                type="checkbox"
                                checked={notifications.matchReminders}
                                onChange={(e) => setNotifications({
                                    ...notifications,
                                    matchReminders: e.target.checked
                                })}
                                className="w-4 h-4"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Resultados de apuestas</label>
                            <input
                                type="checkbox"
                                checked={notifications.betResults}
                                onChange={(e) => setNotifications({
                                    ...notifications,
                                    betResults: e.target.checked
                                })}
                                className="w-4 h-4"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Promociones especiales</label>
                            <input
                                type="checkbox"
                                checked={notifications.promotions}
                                onChange={(e) => setNotifications({
                                    ...notifications,
                                    promotions: e.target.checked
                                })}
                                className="w-4 h-4"
                            />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-xl font-semibold text-primary mb-4">Preferencias</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Tema</label>
                            <select className="w-full p-3 border rounded-lg">
                                <option>Modo Claro</option>
                                <option>Modo Oscuro</option>
                                <option>Automático</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Idioma</label>
                            <select className="w-full p-3 border rounded-lg">
                                <option>Español</option>
                                <option>English</option>
                                <option>Français</option>
                            </select>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="mt-8">
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
    if (path.includes('/wallet')) return 'wallet';
    if (path.includes('/bets')) return 'bets';
    if (path.includes('/settings')) return 'settings';
    return 'profile';
  };
  
  const activeTab = getActiveTab();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-primary mb-4">🪄 Acceso Restringido</h2>
          <p className="text-gray-600 mb-6">Por favor, inicia sesión para acceder a tu cuenta mágica.</p>
          <Link to="/login">
            <Button fullWidth>Iniciar Sesión</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const navItems = [
    { path: '', label: 'Mi Perfil', icon: <UserIcon />, tab: 'profile' },
    { path: 'wallet', label: 'Monedero', icon: <WalletIcon />, tab: 'wallet' },
    { path: 'bets', label: 'Mis Apuestas', icon: <BetIcon />, tab: 'bets' },
    { path: 'settings', label: 'Configuración', icon: <SettingsIcon />, tab: 'settings' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-1/4">
            <Card className="p-6 mb-6 text-center bg-gradient-to-br from-white to-purple-50">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4 overflow-hidden shadow-lg">
                <img 
                  src={userLogoSrc} 
                  alt="Usuario" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-primary mb-1">🧙‍♂️ {user.username}</h3>
              <p className="text-sm text-gray-600 mb-2">{user.email}</p>
              <div className="text-lg font-semibold text-yellow-600 mb-4">
                💰 {user.balance} Galeones
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
            </Card>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 p-4 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === item.tab
                      ? 'bg-primary text-white shadow-md transform scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
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
    </div>
  );
};

export default AccountPage;