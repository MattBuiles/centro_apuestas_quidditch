import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { useAuth } from '@/context/AuthContext';
import styles from './RecoveryPage.module.css';

const RecoveryPage: React.FC = () => {
  const [step, setStep] = useState<'email' | 'newPassword'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showOwlAnimation, setShowOwlAnimation] = useState(false);  const [validatedUserId, setValidatedUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { checkEmailForRecovery, resetPasswordByEmail, validatePassword } = useAuth();
  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setMessageType(null);

    if (!email) {
      setMessage('Por favor complete todos los campos');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    // Verificar si el email está registrado usando el backend
    try {
      const emailExists = await checkEmailForRecovery(email);
      
      if (emailExists) {
        setValidatedUserId(email); // Usamos el email como identificador temporal
        setShowOwlAnimation(true);
        setMessage('🦉 ¡Una lechuza ha llevado tu solicitud a Madame Pomfrey! Email verificado exitosamente...');
        setMessageType('success');
        
        // After owl animation, proceed to password reset
        setTimeout(() => {
          setShowOwlAnimation(false);
          setStep('newPassword');
          setMessage(null);
        }, 3000);
      } else {
        setMessage('Este correo electrónico no está registrado en el mundo mágico de Quidditch. Verifica que sea correcto o regístrate primero.');
        setMessageType('error');
      }
      setIsLoading(false);
    } catch (error) {
      setMessage('Ha ocurrido un error mágico al verificar el correo. Inténtalo nuevamente.');
      setMessageType('error');
      setIsLoading(false);
    }
  };  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setMessage('Por favor complete todos los campos');
      setMessageType('error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage('Las contraseñas no coinciden. Incluso la magia requiere precisión.');
      setMessageType('error');
      return;
    }

    // Validar contraseña usando la función del contexto
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setMessage(passwordError);
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // Actualizar contraseña usando la función del contexto
    try {
      if (validatedUserId) {
        const success = await resetPasswordByEmail(validatedUserId, newPassword);
        if (success) {
          setMessage('✨ ¡La nueva contraseña ha sido hechizada con éxito! Ahora puedes iniciar sesión con tu nueva contraseña mágica.');
          setMessageType('success');
          setIsLoading(false);
          
          // Redirect to login after success
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setMessage('Ha ocurrido un error mágico. Por favor, inténtalo nuevamente.');
          setMessageType('error');
          setIsLoading(false);
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ha ocurrido un error mágico. Por favor, inténtalo nuevamente.');
      setMessageType('error');
      setIsLoading(false);
    }
  };return (
    <div className={styles.recoveryPageContainer}>
      <Card className={styles.recoveryCard}>
        <div className="text-center">
          {step === 'email' ? (
            <>
              <h1 className={styles.recoveryPageTitle}>🧙‍♀️ Recuperación Mágica de Contraseña</h1>
              <p className={styles.recoveryPageDescription}>
                ¿Olvidaste tu contraseña? No te preocupes, el mundo mágico tiene soluciones para todo.
                Introduce tu correo electrónico registrado en Hogwarts y una lechuza llevará tu solicitud 
                a Madame Pomfrey para que puedas recuperar el acceso a tu cuenta.
              </p>
            </>
          ) : (
            <>
              <h1 className={styles.recoveryPageTitle}>🔮 Establecer Nueva Contraseña Mágica</h1>
              <p className={styles.recoveryPageDescription}>
                ¡Excelente! Madame Pomfrey ha verificado tu identidad mágica. 
                Ahora puedes crear una nueva contraseña segura para proteger tu cuenta del mundo mágico.
              </p>
            </>
          )}
        </div>        {showOwlAnimation && (
          <div className={styles.owlAnimation}>
            <div className={styles.owl}>🦉</div>
            <p className={styles.owlMessage}>
              ¡Volando hacia el castillo con tu solicitud mágica!
            </p>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className={styles.recoveryForm}>
            {message && (
              <div 
                className={`${styles.message} ${messageType === 'success' ? styles.messageSuccess : styles.messageError}`}
              >
                {message}
              </div>
            )}            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>
                📧 Correo Electrónico Mágico
              </label>
              <input
                id="email"
                type="email"
                className={styles.formInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.correo@hogwarts.edu"
                required
                aria-describedby={messageType === 'error' ? 'email-error' : undefined}
              />
              <small className={styles.formHint}>
                El correo que usaste para registrarte en el mundo mágico de Quidditch
              </small>
            </div>            <Button type="submit" fullWidth isLoading={isLoading} className={styles.submitButton}>
              {isLoading ? '🦉 Enviando lechuza mágica...' : '✨ Enviar Solicitud de Recuperación'}
            </Button>
            <div className={styles.authLinks}>
              <p>
                ¿Recordaste tu contraseña?{' '}
                <Link to="/login" className={styles.authLink}>
                  ⚡ Volver al inicio de sesión
                </Link>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className={styles.recoveryForm}>
            {message && (
              <div 
                className={`${styles.message} ${messageType === 'success' ? styles.messageSuccess : styles.messageError}`}
              >
                {message}
              </div>
            )}            <div className={styles.formGroup}>
              <label htmlFor="newPassword" className={styles.formLabel}>
                🔒 Nueva Contraseña Mágica
              </label>              <input
                id="newPassword"
                type="password"
                className={styles.formInput}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Crea una contraseña poderosa y secreta"
                required
                minLength={8}
              />
              <small className={styles.formHint}>
                Mínimo 8 caracteres con número y letra mayúscula para una protección mágica adecuada
              </small>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.formLabel}>
                🔐 Confirmar Contraseña Mágica
              </label>              <input
                id="confirmPassword"
                type="password"
                className={styles.formInput}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu nueva contraseña mágica"
                required
                minLength={8}
              />
              <small className={styles.formHint}>
                Debe coincidir exactamente con la contraseña anterior
              </small>
            </div>            <Button type="submit" fullWidth isLoading={isLoading} className={styles.submitButton}>
              {isLoading ? '🔮 Hechizando nueva contraseña...' : '⚡ Establecer Nueva Contraseña'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default RecoveryPage;