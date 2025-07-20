import React from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './BalanceSync.module.css';

/**
 * Componente para sincronizar manualmente el balance del usuario
 */
export const BalanceSync: React.FC = () => {
  const { syncUserBalance, user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSync = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await syncUserBalance();
      console.log('✅ Balance synchronized successfully');
    } catch (error) {
      console.error('❌ Error syncing balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <button 
      className={styles.syncButton}
      onClick={handleSync}
      disabled={isLoading}
      title="Sincronizar balance del servidor"
    >
      {isLoading ? (
        <span className={styles.loadingIcon}>🔄</span>
      ) : (
        <span className={styles.syncIcon}>🔄</span>
      )}
      {isLoading ? 'Sincronizando...' : 'Sincronizar'}
    </button>
  );
};

export default BalanceSync;
