import styles from './Logo.module.css'
import pageLogoSrc from '@/assets/Page_Logo.png'

const Logo = () => {
  return (
    <div className={styles.logoContainer}>
      <div className={styles.logoInner}>
        <img 
          src={pageLogoSrc} 
          alt="Atrapa la Snitch Logo" 
          className={styles.logoImage}
        />
      </div>
      <div className={styles.logoGlow} />
    </div>
  )
}

export default Logo