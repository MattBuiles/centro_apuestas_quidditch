import RegisterForm from '@/components/auth/RegisterForm'
import styles from './RegisterPage.module.css'

const RegisterPage = () => {
  return (
    <div className={styles.registerPageContainer}>
      <div className={styles.registerFormContainer}>
        <div className={styles.registerCard}>
          <div className={styles.registerHeader}>
            <h1 className={styles.registerTitle}>
              Únete a nuestra comunidad mágica
            </h1>
            <p className={styles.registerSubtitle}>
              Regístrate para comenzar a apostar en los mejores partidos de Quidditch y vive la magia del deporte más emocionante del mundo mágico
            </p>
          </div>
          
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}

export default RegisterPage