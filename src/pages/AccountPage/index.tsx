import { useState, useEffect } from 'react';
import { Link, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import userLogoSrc from '@/assets/User_Logo.png';
import user2LogoSrc from '@/assets/User2_Logo.png';
import { teamLogos } from '@/assets/teamLogos';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminBetsHistory from '@/components/admin/AdminBetsHistory';
import AdminBetsStatistics from '@/components/admin/AdminBetsStatistics';
import AdminUsersManagement from '@/components/admin/AdminUsersManagement';
import styles from './AccountPage.module.css';

// Icons (you can replace these with actual icon components)
const UserIcon = () => <span className={styles.icon}>👤</span>;
const WalletIcon = () => <span className={styles.icon}>💰</span>;
const BetIcon = () => <span className={styles.icon}>🎯</span>;
const HistoryIcon = () => <span className={styles.icon}>📊</span>;
const TrophyIcon = () => <span className={styles.icon}>🏆</span>;

// Define sub-components for each account section
const ProfileSection = () => {
    const { user, updateUserProfile, validateCurrentPassword, validatePassword, updatePassword } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingAvatar, setIsChangingAvatar] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });// Available avatar options
    const avatarOptions = [
        { id: 'wizard1', src: userLogoSrc, name: 'Mago Clásico' },
        { id: 'wizard2', src: user2LogoSrc, name: 'Mago Moderno' },
        { id: 'gryffindor', src: '/src/assets/Gryffindor_Logo.png', name: 'Gryffindor' },
        { id: 'slytherin', src: '/src/assets/Slytherin_Logo.png', name: 'Slytherin' },
        { id: 'ravenclaw', src: '/src/assets/Ravenclaw_Logo.png', name: 'Ravenclaw' },
        { id: 'hufflepuff', src: '/src/assets/Hufflepuff_Logo.png', name: 'Hufflepuff' },
        { id: 'cannons', src: '/src/assets/Chudley Cannons_Logo.png', name: 'Chudley Cannons' },
        { id: 'harpies', src: '/src/assets/Holyhead Harpies_Logo.png', name: 'Holyhead Harpies' },
    ];// Update form data when user changes (important for real-time sync)
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                username: user.username,
                email: user.email
            }));
        }
    }, [user]);

    const handleAvatarChange = (avatarSrc: string) => {
        updateUserProfile({ avatar: avatarSrc });
        setIsChangingAvatar(false);
    };    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.username || !formData.email) {
            alert('Por favor complete todos los campos');
            return;
        }
        
        // Update user profile in context (this will update the sidebar automatically)
        updateUserProfile({
            username: formData.username,
            email: formData.email
        });

        // Here you would typically call an API to update user info
        console.log('Saving user data:', {
            username: formData.username,
            email: formData.email
        });
        
        // Exit edit mode
        setIsEditing(false);
        
        // Show success message
        alert('Perfil actualizado exitosamente');
    };    const handleCancel = () => {
        // Reset form data to current user data
        if (user) {
            setFormData({
                username: user.username,
                email: user.email
            });
        }
        setIsEditing(false);
    };    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            alert('Por favor complete todos los campos');
            return;
        }
        
        // Validar contraseña actual usando la función del contexto
        if (!validateCurrentPassword(passwordData.currentPassword)) {
            alert('La contraseña actual no es correcta. Peeves está riéndose de ti. 🃏');
            return;
        }// Validar nueva contraseña
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Las contraseñas no coinciden. Incluso la magia requiere precisión. ✨');
            return;
        }

        // Validar contraseña usando la función del contexto
        const passwordError = validatePassword(passwordData.newPassword);
        if (passwordError) {
            alert(`${passwordError} 🔮`);
            return;
        }

        try {
            // Actualizar contraseña usando la función del contexto
            updatePassword(passwordData.newPassword);
        } catch (error) {
            if (error instanceof Error) {
                alert(`Error al cambiar contraseña: ${error.message} 🔮`);
                return;
            }
        }

        console.log('Password updated successfully:', {
            userId: user?.id,
            timestamp: new Date().toISOString()
        });

        // Reset form
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setIsChangingPassword(false);
        
        // Mostrar mensaje de éxito
        alert('✨ ¡Tu nueva contraseña ha sido encantada por el mismísimo Dumbledore! Tu cuenta está ahora más segura que la bóveda de Gringotts. 🏛️');
    };

    const handlePasswordCancel = () => {
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setIsChangingPassword(false);
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

            <div className={styles.contentGrid}>
                {/* Avatar Section */}
                <Card className={styles.card}>
                    <h3 className={styles.cardTitle}>
                        📸 Foto de Perfil
                    </h3>
                    <div className={styles.avatarSection}>
                        <div className={styles.currentAvatar}>
                            <img 
                                src={user?.avatar || userLogoSrc} 
                                alt="Avatar actual"
                                className={styles.avatarPreview}
                            />
                            <p className={styles.avatarLabel}>Avatar Actual</p>
                        </div>
                        
                        {!isChangingAvatar ? (
                            <div className={styles.buttonContainer}>
                                <Button 
                                    variant="primary" 
                                    onClick={() => setIsChangingAvatar(true)}
                                    fullWidth
                                >
                                    🎭 Cambiar Avatar
                                </Button>
                            </div>
                        ) : (
                            <div className={styles.avatarSelector}>
                                <h4 className={styles.selectorTitle}>Elige tu nuevo avatar:</h4>
                                <div className={styles.avatarGrid}>
                                    {avatarOptions.map((avatar) => (
                                        <div 
                                            key={avatar.id}
                                            className={styles.avatarOption}
                                            onClick={() => handleAvatarChange(avatar.src)}
                                        >
                                            <img 
                                                src={avatar.src} 
                                                alt={avatar.name}
                                                className={styles.avatarThumbnail}
                                            />
                                            <span className={styles.avatarName}>{avatar.name}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.buttonGroup}>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setIsChangingAvatar(false)}
                                    >
                                        ❌ Cancelar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className={styles.card}>
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
                            </div>                            {isEditing && (
                                <div className={styles.buttonGroup}>
                                    <Button type="submit" variant="primary">
                                        💾 Guardar Cambios
                                    </Button>
                                    <Button type="button" variant="outline" onClick={handleCancel}>
                                        ❌ Cancelar
                                    </Button>
                                </div>
                            )}
                        </form>
                    )}                    {!isEditing && (
                        <div className={styles.buttonContainer}>
                            <Button 
                                variant="primary" 
                                onClick={() => setIsEditing(true)}
                                fullWidth
                            >
                                ✏️ Editar Perfil
                            </Button>
                        </div>                    )}
                </Card>                {/* Nueva tarjeta para cambio de contraseña - Solo para usuarios regulares */}
                {user?.role !== 'admin' && (
                    <Card className={styles.card}>
                        <h3 className={styles.cardTitle}>🔐 Seguridad Mágica</h3>
                        {!isChangingPassword ? (
                            <div className={styles.passwordInfo}>
                                <p className={styles.passwordDescription}>
                                    Mantén tu cuenta segura con una contraseña fuerte que ni siquiera Voldemort pueda descifrar.
                                </p>
                                <div className={styles.buttonContainer}>
                                    <Button 
                                        variant="primary" 
                                        onClick={() => setIsChangingPassword(true)}
                                        fullWidth
                                    >
                                        🪄 Cambiar Contraseña
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handlePasswordChange} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>🔒 Contraseña Actual:</label>
                                    <input 
                                        type="password" 
                                        placeholder="Tu contraseña actual"
                                        className={styles.formInput}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                        required
                                    />
                                    <small className={styles.formHelp}>
                                        Ingresa tu contraseña actual para verificar tu identidad
                                    </small>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>🔮 Nueva Contraseña:</label>                                    <input 
                                        type="password" 
                                        placeholder="Tu nueva contraseña mágica"
                                        className={styles.formInput}
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                        minLength={8}
                                        required
                                    />
                                    <small className={styles.formHelp}>
                                        Mínimo 8 caracteres con número y letra mayúscula para una protección mágica adecuada
                                    </small>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>🔐 Confirmar Nueva Contraseña:</label>
                                    <input 
                                        type="password" 
                                        placeholder="Repite tu nueva contraseña"
                                        className={styles.formInput}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                        minLength={8}
                                        required
                                    />
                                    <small className={styles.formHelp}>
                                        Debe coincidir exactamente con la nueva contraseña
                                    </small>
                                </div>
                                <div className={styles.buttonGroup}>
                                    <Button type="submit" variant="primary">
                                        ✨ Actualizar Contraseña
                                    </Button>
                                    <Button type="button" variant="outline" onClick={handlePasswordCancel}>
                                        ❌ Cancelar
                                    </Button>
                                </div>
                            </form>
                        )}
                    </Card>
                )}<Card className={`${styles.card} ${styles.statsCard}`}>
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
    const { user, updateUserBalance, getUserTransactions, addTransaction, loadUserTransactionsFromBackend } = useAuth();
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [balanceUpdated, setBalanceUpdated] = useState(false);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

    // Cargar transacciones del backend cuando se monta el componente
    useEffect(() => {
        const loadTransactions = async () => {
            setIsLoadingTransactions(true);
            try {
                await loadUserTransactionsFromBackend();
            } catch (error) {
                console.error('Error loading user transactions:', error);
            } finally {
                setIsLoadingTransactions(false);
            }
        };
        
        loadTransactions();
    }, []); // Solo ejecutar una vez al montar el componente

    // Obtener transacciones del contexto, ordenadas por fecha descendente
    const transactions = getUserTransactions().sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        
        // Si las fechas son diferentes, ordenar por fecha descendente
        if (dateA !== dateB) {
            return dateB - dateA;
        }
        
        // Si las fechas son iguales, ordenar por ID descendente (más reciente primero)
        return b.id - a.id;    });

    const showSuccessNotification = (message: string) => {
        setNotificationMessage(message);
        setShowNotification(true);
        setBalanceUpdated(true);
        setTimeout(() => setShowNotification(false), 4000);
        setTimeout(() => setBalanceUpdated(false), 600);
    };

    const handleDeposit = async () => {
        if (depositAmount && Number(depositAmount) > 0) {
            setIsProcessing(true);
            
            try {
                const amount = Number(depositAmount);
                
                // Hacer la transacción a través del backend
                await addTransaction({
                    type: 'deposit',
                    amount: amount,
                    description: `Depósito de ${amount} galeones`
                });
                
                setShowDepositModal(false);
                setDepositAmount('');
                
                // Mostrar notificación de éxito
                showSuccessNotification(`✨ ¡Depósito exitoso! +${amount} galeones añadidos a tu bóveda`);
            } catch (error) {
                console.error('Error en depósito:', error);
                alert('❌ Error al procesar el depósito. Inténtalo nuevamente.');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleWithdraw = async () => {
        if (withdrawAmount && Number(withdrawAmount) > 0) {
            const amount = Number(withdrawAmount);
            
            // Verificar que hay suficiente saldo
            if (amount > (user?.balance || 0)) {
                alert('🚫 ¡No tienes suficientes galeones para este retiro!');
                return;
            }
            
            setIsProcessing(true);
            
            try {
                // Hacer la transacción a través del backend
                await addTransaction({
                    type: 'withdraw',
                    amount: -amount, // Negativo para retiros
                    description: `Retiro de ${amount} galeones a Gringotts`
                });
                
                setShowWithdrawModal(false);
                setWithdrawAmount('');
                
                // Mostrar notificación de éxito
                showSuccessNotification(`🏦 ¡Retiro exitoso! ${amount} galeones transferidos a Gringotts`);
            } catch (error) {
                console.error('Error en retiro:', error);
                alert('❌ Error al procesar el retiro. Inténtalo nuevamente.');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    return (
        <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>
                <WalletIcon />
                Mi Bóveda de Gringotts
            </h2>            {user && (
                <div className={`${styles.walletBalance} ${balanceUpdated ? styles.balanceUpdate : ''}`}>
                    <div className={styles.balanceLabel}>💰 Saldo Actual</div>
                    <div className={styles.balanceValue}>{user.balance}</div>
                    <div className={styles.balanceCurrency}>Galeones Mágicos</div>
                </div>
            )}<div className={styles.actionButtons}>
                <button 
                    className={`${styles.actionButton} ${styles.primary}`}
                    onClick={() => setShowDepositModal(true)}
                    disabled={isProcessing}
                >
                    <span>💳</span>
                    <span>Depositar Galeones</span>
                </button>
                <button 
                    className={styles.actionButton}
                    onClick={() => setShowWithdrawModal(true)}
                    disabled={isProcessing}
                >
                    <span>🏦</span>
                    <span>Retirar Galeones</span>
                </button>
            </div><Card className={styles.card}>
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
            </Card>            {showDepositModal && (
                <div className={styles.modal}>
                    <Card className={styles.modalContent}>
                        <h3 className={styles.modalTitle}>💰 Depositar Galeones</h3>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Cantidad a depositar:</label>
                                <input
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    className={styles.formInput}
                                    placeholder="Ej: 500"
                                    min="1"
                                    disabled={isProcessing}
                                />
                                <small className={styles.formHelp}>
                                    💡 Los galeones se añadirán instantáneamente a tu bóveda
                                </small>
                            </div>
                            <div className={styles.modalButtons}>
                                <Button 
                                    onClick={handleDeposit} 
                                    fullWidth
                                    isLoading={isProcessing}
                                    disabled={!depositAmount || Number(depositAmount) <= 0}
                                >
                                    {isProcessing ? (
                                        <>
                                            <span className={styles.processingSpinner}></span>
                                            Procesando...
                                        </>
                                    ) : 'Depositar'}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setShowDepositModal(false)}
                                    fullWidth
                                    disabled={isProcessing}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}{showWithdrawModal && (
                <div className={styles.modal}>
                    <Card className={styles.modalContent}>
                        <h3 className={styles.modalTitle}>🏦 Retirar Galeones</h3>
                        <div className={styles.modalBody}>
                            <div className={styles.currentBalance}>
                                <p>💰 Saldo disponible: <strong>{user?.balance || 0} G</strong></p>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Cantidad a retirar:</label>
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className={styles.formInput}
                                    placeholder="Ej: 200"
                                    min="1"
                                    max={user?.balance || 0}
                                    disabled={isProcessing}
                                />
                                <small className={styles.formHelp}>
                                    🏛️ Los galeones se transferirán a tu cuenta de Gringotts
                                </small>
                            </div>
                            <div className={styles.modalButtons}>
                                <Button 
                                    onClick={handleWithdraw} 
                                    fullWidth
                                    isLoading={isProcessing}
                                    disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > (user?.balance || 0)}
                                >
                                    {isProcessing ? (
                                        <>
                                            <span className={styles.processingSpinner}></span>
                                            Procesando...
                                        </>
                                    ) : 'Retirar'}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setShowWithdrawModal(false)}
                                    fullWidth
                                    disabled={isProcessing}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Notificación de éxito */}
            {showNotification && (
                <div className={styles.successNotification}>
                    <p>{notificationMessage}</p>
                </div>
            )}
        </div>
    );
};

const BetsSection = () => {
    const { getUserBets, loadUserBetsFromBackend } = useAuth();
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [isLoading, setIsLoading] = useState(false);
    
    // Cargar apuestas del backend cuando se monta el componente
    useEffect(() => {
        const loadBets = async () => {
            setIsLoading(true);
            try {
                await loadUserBetsFromBackend();
            } catch (error) {
                console.error('Error loading user bets:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadBets();
    }, []); // Solo ejecutar una vez al montar el componente
    
    // Función para formatear la fecha virtual
    const formatVirtualDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Fecha inválida';
        }
    };
    
    // Get user bets from AuthContext
    const allUserBets = getUserBets();
    
    // Separate active and historical bets
    const activeBets = allUserBets.filter(bet => bet.status === 'active');
    const betHistory = allUserBets.filter(bet => bet.status !== 'active');

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
                    {isLoading ? (
                        <div className={styles.loadingContainer}>
                            <p>⚡ Consultando las profecías mágicas...</p>
                        </div>
                    ) : activeBets.length > 0 ? (                        activeBets.map((bet) => (
                            <div key={bet.id} className={`${styles.betCard} ${styles.active}`}>
                                <div className={styles.betHeader}>
                                    <h3 className={styles.betMatch}>{bet.matchName}</h3>
                                    <span className={`${styles.betStatus} ${styles.active}`}>
                                        Activa
                                    </span>
                                </div>
                                <div className={styles.betDetails}>
                                    <div className={styles.betDetail}>
                                        <p className={styles.betDetailLabel}>Fecha de Apuesta (Tiempo Virtual)</p>
                                        <p className={styles.betDetailValue}>{formatVirtualDate(bet.date)}</p>
                                    </div>
                                    <div className={styles.betDetail}>
                                        <p className={styles.betDetailLabel}>Tipo de Apuesta</p>
                                        <p className={styles.betDetailValue}>
                                            {bet.options.length === 1 ? 'Simple' : `Combinada (${bet.options.length})`}
                                        </p>
                                    </div>
                                    <div className={styles.betDetail}>
                                        <p className={styles.betDetailLabel}>Apuesta</p>
                                        <p className={styles.betDetailValue}>{bet.amount} G (x{bet.combinedOdds.toFixed(2)})</p>
                                    </div>
                                </div>
                                <div className={styles.potentialWin}>
                                    <p className={styles.potentialWinText}>
                                        💰 Ganancia potencial
                                    </p>
                                    <p className={styles.potentialWinAmount}>{bet.potentialWin.toFixed(2)} Galeones</p>
                                </div>
                                {/* Show bet options details */}
                                <div className={styles.betOptionsDetails}>
                                    <h4 className={styles.betOptionsTitle}>Detalles de las Apuestas:</h4>
                                    {bet.options.map((option) => (
                                        <div key={option.id} className={styles.betOptionItem}>
                                            <span className={styles.betOptionText}>{option.description}</span>
                                            <span className={styles.betOptionOdds}>x{option.odds}</span>
                                        </div>
                                    ))}
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
                    {isLoading ? (
                        <div className={styles.loadingContainer}>
                            <p>⚡ Consultando el historial de profecías...</p>
                        </div>
                    ) : betHistory.length > 0 ? (
                        betHistory.map((bet) => (
                            <div key={bet.id} className={`${styles.betCard} ${styles[bet.status]}`}>
                                <div className={styles.betHeader}>
                                    <h3 className={styles.betMatch}>{bet.matchName}</h3>
                                    <span className={`${styles.betStatus} ${styles[bet.status]}`}>
                                        {bet.status === 'won' ? '🎉 Ganada' : bet.status === 'lost' ? '😞 Perdida' : 'Pendiente'}
                                    </span>
                                </div>
                                <div className={styles.betDetails}>
                                    <div className={styles.betDetail}>
                                        <p className={styles.betDetailLabel}>Fecha (Tiempo Virtual)</p>
                                        <p className={styles.betDetailValue}>{formatVirtualDate(bet.date)}</p>
                                    </div>
                                    <div className={styles.betDetail}>
                                        <p className={styles.betDetailLabel}>Tipo de Apuesta</p>
                                        <p className={styles.betDetailValue}>
                                            {bet.options.length === 1 ? 'Simple' : `Combinada (${bet.options.length})`}
                                        </p>
                                    </div>
                                    <div className={styles.betDetail}>
                                        <p className={styles.betDetailLabel}>Apuesta</p>
                                        <p className={styles.betDetailValue}>{bet.amount} G (x{bet.combinedOdds.toFixed(2)})</p>
                                    </div>
                                    <div className={styles.betDetail}>
                                        <p className={styles.betDetailLabel}>Resultado</p>
                                        <p className={`${styles.betDetailValue} ${
                                            bet.status === 'won' ? styles.winResult : styles.lossResult
                                        }`}>
                                            {bet.status === 'won' ? `+${bet.potentialWin.toFixed(2)} G` : '0 G'}
                                        </p>
                                    </div>
                                </div>
                                {/* Show bet options details */}
                                <div className={styles.betOptionsDetails}>
                                    <h4 className={styles.betOptionsTitle}>Detalles de las Apuestas:</h4>
                                    {bet.options.map((option) => (
                                        <div key={option.id} className={styles.betOptionItem}>
                                            <span className={styles.betOptionText}>{option.description}</span>
                                            <span className={styles.betOptionOdds}>x{option.odds}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyStateIcon}>📊</div>
                            <div className={styles.emptyStateTitle}>No tienes historial de apuestas</div>
                            <p className={styles.emptyStateDescription}>
                                Cuando realices apuestas, aparecerán aquí una vez finalizadas
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const AccountPage = () => {
  const { user, logout } = useAuth();

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

  // If user is admin, show admin interface
  if (user.role === 'admin') {
    return <AdminAccountPage user={user} logout={logout} />;
  }

  // Regular user interface
  return <RegularAccountPage user={user} logout={logout} />;
};

// Admin Account Interface
const AdminAccountPage = ({ user, logout }: { user: any; logout: () => void }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };
    const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/account/bets-history') return 'bets-history';
    if (path === '/account/bets-statistics') return 'bets-statistics';
    if (path === '/account/users-management') return 'users-management';
    if (path === '/account' || path === '/account/') return 'dashboard';
    return 'dashboard';
  };
  
  const activeTab = getActiveTab();
  const adminNavItems = [
    { 
      path: '/account', 
      label: 'Panel General', 
      icon: <span className={styles.icon}>🏰</span>, 
      tab: 'dashboard' 
    },
    { 
      path: '/account/bets-history', 
      label: 'Historial de Apuestas', 
      icon: <span className={styles.icon}>📊</span>, 
      tab: 'bets-history' 
    },
    { 
      path: '/account/bets-statistics', 
      label: 'Estadísticas Avanzadas', 
      icon: <span className={styles.icon}>📈</span>, 
      tab: 'bets-statistics' 
    },
    { 
      path: '/account/users-management', 
      label: 'Gestión de Usuarios', 
      icon: <span className={styles.icon}>👥</span>, 
      tab: 'users-management' 
    }
  ];

  return (
    <div className={styles.accountPageContainer}>
      <div className={styles.accountLayout}>
        {/* Admin Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.userProfile}>            <div className={styles.userAvatar}>
              <img src={user.avatar || userLogoSrc} alt="Administrator" />
            </div>
            <h3 className={styles.userName}>👑 {user.username}</h3>
            <p className={styles.userEmail}>{user.email}</p>            <div className={styles.adminBadge}>
              🛡️ Administrador
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogoutClick} 
              fullWidth
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Cerrar Sesión
            </Button>
          </div>

          <nav className={styles.accountNav}>
            {adminNavItems.map((item) => (
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

        {/* Admin Main Content */}
        <main className={styles.mainContent}>          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="bets-history" element={<AdminBetsHistory />} />
            <Route path="bets-statistics" element={<AdminBetsStatistics />} />
            <Route path="users-management" element={<AdminUsersManagement />} />            <Route path="*" element={<Navigate to="/account" replace />} />
          </Routes>
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>
              🚪 ¿Seguro que quieres cerrar sesión?
            </h3>
            <div className={styles.modalButtons}>
              <Button
                variant="outline"
                onClick={handleCancelLogout}
                size="sm"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmLogout}
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                Aceptar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Regular User Account Interface
const RegularAccountPage = ({ user, logout }: { user: any; logout: () => void }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };
  
  // Determine active tab based on URL, default to profile
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/account/wallet') return 'wallet';
    if (path === '/account/bets') return 'bets';
    if (path === '/account' || path === '/account/') return 'profile';
    return 'profile';
  };
  
  const activeTab = getActiveTab();

  const navItems = [
    { path: '/account', label: 'Mi Perfil', icon: <UserIcon />, tab: 'profile' },
    { path: '/account/wallet', label: 'Monedero', icon: <WalletIcon />, tab: 'wallet' },
    { path: '/account/bets', label: 'Mis Apuestas', icon: <BetIcon />, tab: 'bets' }
  ];

  return (
    <div className={styles.accountPageContainer}>
      <div className={styles.accountLayout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.userProfile}>            <div className={styles.userAvatar}>
              <img 
                src={user.avatar || userLogoSrc} 
                alt="Usuario" 
              />
            </div>
            <h3 className={styles.userName}>🧙‍♂️ {user.username}</h3>
            <p className={styles.userEmail}>{user.email}</p>            <div className={styles.userBalance}>
              {user.balance} Galeones
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogoutClick} 
              fullWidth
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Cerrar Sesión
            </Button>
          </div>

          <nav className={styles.accountNav}>
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
            <Route path="*" element={<Navigate to="/account" replace />} />
          </Routes>          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>
              🚪 ¿Seguro que quieres cerrar sesión?
            </h3>
            <div className={styles.modalButtons}>
              <Button
                variant="outline"
                onClick={handleCancelLogout}
                size="sm"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmLogout}
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                Aceptar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;