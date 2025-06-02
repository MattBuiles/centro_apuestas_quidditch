import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
// import RecoveryForm from '../../components/auth/RecoveryForm'; // Not used in the current structure
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import styles from './RecoveryPage.module.css';

const RecoveryPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setMessageType(null);

    // Simulate API call for password recovery
    setTimeout(() => {
      if (email.includes('@') && email.length > 5) { // Basic validation
        setMessage(`Se ha enviado un enlace de recuperación a ${email}. (Simulado)`);
        setMessageType('success');
        setEmail(''); // Clear email field on success
      } else {
        setMessage('Por favor, introduce un correo electrónico válido.');
        setMessageType('error');
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className={styles.recoveryPageContainer}>
      {/* This h1 and p are from your active file, let's keep them if desired, or merge with Card content */}
      {/* <h1 className={styles.recoveryPageTitle}>Password Recovery</h1> */}
      {/* <p className={styles.recoveryPageDescription}>
        Enter your email address to receive a password reset link.
      </p> */}

      <Card className={styles.recoveryCard}> {/* Apply specific card style if needed */}
        <div className="text-center mb-6"> {/* Using global utility class */}
          <h2 className={styles.recoveryPageTitle}>Recuperar Contraseña</h2>
          <p className={styles.recoveryPageDescription}>
            Introduce tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.recoveryForm}> {/* Use CSS module class */}
          {message && (
            <div 
              className={`${styles.message} ${messageType === 'success' ? styles.messageSuccess : styles.messageError}`}
            >
              {message}
            </div>
          )}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>Correo electrónico:</label>
            <input
              id="email"
              type="email"
              className={styles.formInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu.correo@ejemplo.com"
              required
              aria-describedby={messageType === 'error' ? 'email-error' : undefined}
            />
            {messageType === 'error' && email.length > 0 && !email.includes('@') && (
                 <small id="email-error" className={styles.messageError} style={{padding: 'var(--spacing-1) 0', background: 'none', border: 'none'}}>
                    El formato del correo no es válido.
                 </small>
            )}
          </div>
          <Button type="submit" fullWidth isLoading={isLoading} className={styles.submitButton}>
            {isLoading ? 'Enviando...' : 'Enviar Enlace'}
          </Button>
          <div className={styles.authLinks}>
            <p>
              ¿Recordaste tu contraseña?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Inicia sesión
              </Link>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default RecoveryPage;