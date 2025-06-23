import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

const Footer = () => {
  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* Main footer content */}
        <div className={styles.mainSection}>
          <div className={styles.mainGrid}>
            
            {/* Brand section */}
            <div className={styles.brandSection}>
              <div className={styles.brandContainer}>
                <h3 className={styles.brandTitle}>
                  Atrapa la Snitch
                </h3>
                <p className={styles.brandDescription}>
                  Plataforma líder en apuestas deportivas mágicas con más de 5 años de experiencia 
                  brindando la mejor experiencia de apuestas en el mundo del Quidditch.
                </p>
              </div>
              
              {/* Trust indicators */}
              <div className={styles.trustIndicators}>
                <div className={styles.trustItem}>
                  <div className={`${styles.trustIndicator} ${styles.green}`}></div>
                  <div className={styles.trustContent}>
                    <h4>Licencia Oficial</h4>
                    <p>MW-2025</p>
                  </div>
                </div>
                <div className={styles.trustItem}>
                  <div className={`${styles.trustIndicator} ${styles.blue}`}></div>
                  <div className={styles.trustContent}>
                    <h4>Seguridad</h4>
                    <p>SSL A+</p>
                  </div>
                </div>
                <div className={styles.trustItem}>
                  <div className={`${styles.trustIndicator} ${styles.purple}`}></div>
                  <div className={styles.trustContent}>
                    <h4>Disponibilidad</h4>
                    <p>99.9%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal & Support */}
            <div className={styles.legalSection}>
              <div className={styles.legalGrid}>
                <div className={styles.linksSection}>
                  <h4>Enlaces Legales</h4>                  
                  <div className={styles.linksList}>
                    <Link to="/about" onClick={handleLinkClick} className={styles.footerLink}>
                      Sobre Nosotros
                    </Link>
                    <Link to="/contact" onClick={handleLinkClick} className={styles.footerLink}>
                      Contacto
                    </Link>
                    <Link to="/terms" onClick={handleLinkClick} className={styles.footerLink}>
                      Términos
                    </Link>
                    <Link to="/privacy" onClick={handleLinkClick} className={styles.footerLink}>
                      Privacidad
                    </Link>
                  </div>
                </div>
                
                {/* Responsibility notice */}
                <div className={styles.responsibilityNotice}>
                  <p className={styles.responsibilityTitle}>Juego Responsable</p>
                  <p className={styles.responsibilityText}>
                    Apuesta con responsabilidad. Si tienes problemas con el juego, busca ayuda profesional.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className={styles.bottomSection}>
          <div className={styles.bottomContent}>
            <div className={styles.copyrightSection}>
              <p className={styles.copyrightText}>© 2025 Atrapa la Snitch S.A. Todos los derechos reservados.</p>
              <div className={styles.separator}></div>
              <p className={styles.licenseText}>Licencia de Operación MW-2025-001</p>
            </div>
            
            <div className={styles.developerSection}>
              <div className={styles.developerText}>
                Desarrollado con ⚡ para la comunidad mágica
              </div>            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer