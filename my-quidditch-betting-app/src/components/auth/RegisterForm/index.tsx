import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import styles from '@/pages/RegisterPage/RegisterPage.module.css'

const RegisterForm = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [terms, setTerms] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  
  const { register, isLoading, error: authError } = useAuth()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!username || !email || !password || !confirmPassword || !birthdate) {
      setFormError('Por favor, completa todos los campos.')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError('Por favor, introduce un correo electrónico válido.')
      return
    }
    if (password !== confirmPassword) {
      setFormError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
        setFormError('La contraseña debe tener al menos 8 caracteres, incluyendo letras y números.');
        return;
    }
    const birthdateDate = new Date(birthdate)
    const today = new Date()
    let age = today.getFullYear() - birthdateDate.getFullYear()
    const m = today.getMonth() - birthdateDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthdateDate.getDate())) {
        age--;
    }
    if (age < 18) {
      setFormError('Debes ser mayor de 18 años para registrarte')
      return
    }
    if (!terms) {
      setFormError('Debes aceptar los términos y condiciones')
      return
    }
    
    await register(username, email, password, birthdate)
  }

  return (
    <form onSubmit={handleSubmit} className={styles.registerForm}>
      {(authError || formError) && (
        <div className={styles.errorMessage}>
          {authError || formError}
        </div>
      )}
      
      <div className={styles.formGroup}>
        <label htmlFor="username" className={styles.formLabel}>Nombre de usuario</label>
        <input
          id="username"
          type="text"
          name="username"
          className={styles.formInput}
          placeholder="Elige tu nombre de mago/bruja"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
        <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.formLabel}>Correo electrónico</label>
        <input
          id="email"
          type="email"
          name="email"
          className={styles.formInput}
          placeholder="tu.correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <small className={styles.formHint}>
          📧 Debe ser un correo válido (ej: mago@hogwarts.com) para recibir notificaciones mágicas
        </small>
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="password" className={styles.formLabel}>Contraseña</label>
        <input
          id="password"
          type="password"
          name="password"
          className={styles.formInput}
          placeholder="Crea una contraseña segura"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <small className={styles.formHint}>
          🔒 Mínimo 8 caracteres con letras y números para proteger tu cuenta mágica
        </small>
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="confirm-password" className={styles.formLabel}>Confirmar contraseña</label>
        <input
          id="confirm-password"
          type="password"
          name="confirm-password"
          className={styles.formInput}
          placeholder="Repite tu contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="birthdate" className={styles.formLabel}>Fecha de nacimiento</label>
        <input
          id="birthdate"
          type="date"
          name="birthdate"
          className={styles.formInput}
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          required
        />
        <small className={styles.formHint}>
          🎂 Debes ser mayor de 18 años para apostar en el mundo mágico
        </small>
      </div>
      
      <div className={styles.termsGroup}>
        <input
          id="terms"
          type="checkbox"
          name="terms"
          className={styles.termsCheckbox}
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          required
        />
        <label htmlFor="terms" className={styles.termsLabel}>
          He leído y acepto los{' '}
          <Link to="/terms" className={styles.termsLink}>
            Términos y Condiciones
          </Link>{' '}
          y la{' '}
          <Link to="/privacy" className={styles.termsLink}>
            Política de Privacidad
          </Link>{' '}
          del mundo mágico de las apuestas
        </label>
      </div>
      
      <button 
        type="submit" 
        className={styles.submitButton}
        disabled={isLoading}
        data-loading={isLoading}
      >
        {isLoading ? 'Creando tu cuenta mágica...' : '🚀 Crear Cuenta Mágica'}
      </button>
      
      <div className={styles.authLinks}>
        <p className={styles.authLinksText}>
          ¿Ya tienes una cuenta en nuestro mundo mágico?
        </p>
        <Link to="/login" className={styles.authLink}>
          ✨ Inicia sesión aquí
        </Link>
      </div>
    </form>
  )
}

export default RegisterForm