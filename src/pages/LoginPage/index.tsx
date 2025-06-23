import LoginForm from '@/components/auth/LoginForm'
import styles from './LoginPage.module.css'

const LoginPage = () => {
  return (
    <div className={styles.loginPageContainer}>
      <div className={styles.loginFormContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <h1 className={styles.loginTitle}>
              ¡Bienvenido de vuelta!
            </h1>
            <p className={styles.loginSubtitle}>
              Inicia sesión para continuar apostando en los partidos más emocionantes de Quidditch y vive la magia del deporte
            </p>
          </div>
          
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

export default LoginPage