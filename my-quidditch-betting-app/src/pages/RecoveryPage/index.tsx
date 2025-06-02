import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import RecoveryForm from '../../components/auth/RecoveryForm'; // Adjust path as needed
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import styles from './RecoveryPage.module.css'; // Assuming you'll create this CSS module

const RecoveryPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    // Simulate API call for password recovery
    setTimeout(() => {
      if (email.includes('@')) { // Basic validation
        setMessage(`Se ha enviado un enlace de recuperación a ${email}. (Simulado)`);
      } else {
        setMessage('Por favor, introduce un correo electrónico válido.');
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className={styles.recoveryPageContainer}>
      <h1 className={styles.recoveryPageTitle}>Password Recovery</h1>
      <p className={styles.recoveryPageDescription}>
        Enter your email address to receive a password reset link.
      </p>
      <Card>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-primary">Recuperar Contraseña</h2>
          <p className="text-gray-600 mt-2">
            Introduce tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form space-y-4">
          {message && (
            <div className={`message-container p-3 rounded-md text-sm ${message.includes('válido') ? 'bg-red-100 border border-red-200 text-red-700' : 'bg-green-100 border border-green-200 text-green-700'}`}>
              {message}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email" className="form-label">Correo electrónico:</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" fullWidth isLoading={isLoading}>
            Enviar Enlace de Recuperación
          </Button>
          <div className="auth-links text-center mt-4">
            <p className="text-sm text-gray-600">
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