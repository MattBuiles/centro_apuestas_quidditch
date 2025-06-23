import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import styles from '@/pages/LoginPage/LoginPage.module.css'

const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const { login, isLoading, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!email || !password) {
      setFormError('Por favor complete todos los campos')
      return
    }

    await login(email, password, remember)
  }

  return (    <form onSubmit={handleSubmit} className={styles.loginForm}>
      {(error || formError) && (
        <div className={styles.errorMessage}>
          {error || formError}
        </div>
      )}
      
      <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.formLabel}>Correo electrónico</label>
        <input
          id="email"
          type="email"
          name="email"
          className={styles.formInput}
          placeholder="tu.correo@hogwarts.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <small className={styles.formHint}>
          📧 El correo que usaste para registrarte en el mundo mágico
        </small>
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="password" className={styles.formLabel}>Contraseña</label>
        <input
          id="password"
          type="password"
          name="password"
          className={styles.formInput}
          placeholder="Tu contraseña secreta"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <small className={styles.formHint}>
          🔒 La contraseña que protege tu cuenta de apuestas mágicas
        </small>
      </div>
      
      <div className={styles.rememberGroup}>
        <input
          id="remember"
          type="checkbox"
          name="remember"
          className={styles.rememberCheckbox}
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        <label htmlFor="remember" className={styles.rememberLabel}>
          Mantener sesión iniciada por más tiempo
        </label>
      </div>
      
      <button 
        type="submit" 
        className={styles.submitButton}
        disabled={isLoading}
        data-loading={isLoading}
      >
        {isLoading ? 'Accediendo al mundo mágico...' : '⚡ Iniciar Sesión Mágica'}
      </button>
        <div className={styles.authLinks}>
        <Link to="/recovery" className={styles.recoveryLink}>
          🧙‍♀️ ¿Olvidaste tu contraseña? Haz clic aquí para que Madame Pomfrey te ayude a recordarla.
        </Link>
        
        <p className={styles.authLinksText}>
          ¿Aún no formas parte del mundo mágico?{' '}
          <Link to="/register" className={styles.authLink}>
            ✨ Regístrate aquí
          </Link>
        </p>
      </div>
    </form>
  )
}

export default LoginForm