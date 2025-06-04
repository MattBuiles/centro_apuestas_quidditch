import styles from './Logo.module.css'

const Logo = () => {
  return (
    <div className={styles.logoContainer}>
      <div className={styles.logoInner}>
        <div className={styles.logoText}>S</div>
      </div>
      <div className={styles.logoGlow} />
    </div>
  )
}

export default Logo