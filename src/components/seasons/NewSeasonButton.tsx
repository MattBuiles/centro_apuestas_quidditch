import { useState } from 'react';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { seasonsService } from '@/services/seasonsService';
import { apiClient } from '@/utils/apiClient';
import { useAuth } from '@/context/AuthContext';
import styles from './NewSeasonButton.module.css';

interface NewSeasonButtonProps {
  onSeasonCreated: () => void;
  className?: string;
}

const NewSeasonButton = ({ onSeasonCreated, className = '' }: NewSeasonButtonProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  const handleCreateSeason = async () => {
    setIsCreating(true);
    setError(null);
    
    try {
      console.log('🌟 Creating new season...');
      const newSeason = await seasonsService.createDefaultSeason();
      
      if (newSeason) {
        console.log('✅ Season created successfully:', newSeason.name);
        onSeasonCreated();
      } else {
        throw new Error('Failed to create season');
      }
    } catch (error) {
      console.error('❌ Error creating season:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido al crear la temporada');
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetDatabase = async () => {
    // Verificar que el usuario sea admin
    if (!isAdmin) {
      setError('Solo los administradores pueden resetear la base de datos');
      return;
    }

    const confirmReset = window.confirm(
      '⚠️ ¿Estás seguro de que quieres resetear la base de datos?\n\n' +
      'Esta acción:\n' +
      '• Eliminará todos los datos existentes\n' +
      '• Creará una nueva temporada\n' +
      '• Generará nuevos equipos y partidos\n' +
      '• NO se puede deshacer\n\n' +
      '¿Continuar?'
    );

    if (!confirmReset) return;

    setIsResetting(true);
    setError(null);
    
    try {
      console.log('🔄 Resetting database...');
      
      // Get auth token for admin user
      const authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      if (!authToken) {
        throw new Error('No hay token de autenticación disponible');
      }
      
      // Call the reset endpoint with authentication using apiClient (with RequestQueue)
      const response = await apiClient.post('/admin/reset-database', {});

      if (!response.success) {
        throw new Error(response.error || 'Reset failed');
      }

      console.log('✅ Database reset successfully');
      
      // Wait a moment for backend to fully process the reset
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Trigger refresh in parent component
      onSeasonCreated();
    } catch (error) {
      console.error('❌ Error resetting database:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido al resetear la base de datos');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className={`${styles.newSeasonContainer} ${className}`}>
      <Card className={styles.newSeasonCard}>
        <div className={styles.newSeasonContent}>
          <div className={styles.newSeasonIcon}>🏆</div>
          <h3 className={styles.newSeasonTitle}>
            ¡Inicia una Nueva Temporada!
          </h3>
          <p className={styles.newSeasonDescription}>
            No hay temporada activa en el sistema. Crea una nueva temporada para comenzar a simular partidos y gestionar tu liga de Quidditch.
          </p>
          
          {error && (
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          
          <Button 
            onClick={handleCreateSeason}
            disabled={isCreating}
            variant="primary"
            size="lg"
            className={styles.createButton}
          >
            {isCreating ? (
              <>
                <span className={styles.spinner}></span>
                Creando temporada...
              </>
            ) : (
              '✨ Iniciar Nueva Temporada'
            )}
          </Button>
          
          <div className={styles.alternativeActions}>
            <p className={styles.alternativeText}>¿Necesitas hacer cambios al sistema?</p>
            {isAdmin && (
              <Button 
                onClick={handleResetDatabase}
                disabled={isCreating || isResetting}
                variant="outline"
                size="md"
                className={styles.resetButton}
              >
                {isResetting ? (
                  <>
                    <span className={styles.spinner}></span>
                    Reseteando...
                  </>
                ) : (
                  '🔄 Resetear Base de Datos'
                )}
              </Button>
            )}
            {!isAdmin && (
              <p className={styles.adminOnlyText}>
                🔒 El reseteo de la base de datos solo está disponible para administradores
              </p>
            )}
          </div>
          
          <div className={styles.seasonDetails}>
            <p className={styles.detailsTitle}>La nueva temporada incluirá:</p>
            <ul className={styles.detailsList}>
              <li>Todos los equipos disponibles</li>
              <li>120 días de duración</li>
              <li>Partidos distribuidos a lo largo de la temporada</li>
              <li>Sistema de clasificación automático</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NewSeasonButton;
