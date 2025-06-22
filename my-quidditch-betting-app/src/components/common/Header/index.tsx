import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Button from '../Button'
import Logo from '../Logo'
import userLogoSrc from '@/assets/User_Logo.png'
import styles from './Header.module.css'

const Header = () => {
  const { isAuthenticated, logout, user } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()

  // Cierra el menú móvil cuando la ruta cambia
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // Detecta el scroll para cambiar la apariencia del header
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }
  // Función para renderizar los NavLinks con animaciones escalonadas
  const renderNavLink = (to: string, label: string, index: number) => {
    return (
      <NavLink 
        to={to} 
        className={({ isActive }) => 
          `${styles.navLink} animate-fadeInUp ${
            isActive 
              ? styles.activeNavLink
              : ''
          }`
        }
        style={{ animationDelay: `${index * 100}ms` }}
        end={to === '/'}
      >
        {label}
      </NavLink>
    )
  }
  return (
    <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''} ${document.documentElement.classList.contains('dark') ? styles.dark : ''}`}>
      <div className={styles.headerInner}>
        {/* Logo Section - Left */}
        <div className={`${styles.logoSection} animate-fadeIn`}>
          <Link to="/" className={styles.logoContainer}>
            <Logo />
            <span className={styles.siteName}>
              Atrapa la Snitch
            </span>
          </Link>
        </div>

        {/* Desktop Navigation - Center */}
        <nav className={styles.nav}>
          <div className={styles.navLinks}>
            {renderNavLink('/', 'Inicio', 1)}
            {renderNavLink('/matches', 'Partidos', 2)}
            {renderNavLink('/teams', 'Equipos', 3)}
            {renderNavLink('/betting', 'Apostar', 4)}
            {renderNavLink('/standings', 'Clasificación', 5)}
            {renderNavLink('/results', 'Resultados', 6)}
            {isAuthenticated && renderNavLink('/account', 'Mi Cuenta', 7)}
          </div>
        </nav>

        {/* Auth Section - Right */}
        <div className={`${styles.authSection} animate-fadeIn`}>
          {/* Desktop Auth Buttons */}
          <div className={styles.authButtons}>
            {isAuthenticated ? (
              <div className={styles.userControls}>                {user && (
                  <div className={styles.userBalance}>
                    <span className={styles.balanceText}>
                      {user.balance}G
                    </span>
                    <div className={styles.userAvatar}>
                      <img 
                        src={user.avatar || userLogoSrc} 
                        alt="Usuario" 
                        className={styles.userAvatarImage}
                      />
                    </div>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => logout()}
                  className={styles.logoutButton}
                >
                  Cerrar Sesión
                </Button>
              </div>
            ) : (
              <div className={styles.guestControls}>
                <Link to="/login">
                  <Button variant="outline" size="sm" className={styles.loginButton}>
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="magical" size="sm" animated className={styles.registerButton}>
                    Registrarse
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Controls */}
          <div className={styles.mobileControls}>            {isAuthenticated && user && (
              <div className={styles.userBalance}>
                <span className={styles.balanceText}>
                  {user.balance}G
                </span>
                <div className={styles.userAvatar}>
                  <img 
                    src={user.avatar || userLogoSrc} 
                    alt="Usuario" 
                    className={styles.userAvatarImage}
                  />
                </div>
              </div>
            )}
            <button
              type="button"
              className={styles.mobileMenuButton}
              aria-expanded={isMobileMenuOpen}
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">Menú</span>
              {!isMobileMenuOpen ? (
                <svg className={styles.mobileMenuIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className={styles.mobileMenuIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>      {/* Mobile menu */}
      <div className={`${isMobileMenuOpen ? 'block animate-fadeIn' : 'hidden'} md:hidden ${styles.mobileNav}`}>
        <div className={styles.mobileNavContent}>
          <div className={styles.mobileNavLinks}>
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `${styles.mobileNavLink} ${isActive ? styles.activeMobileLink : ''}`
              }
              end
            >
              Inicio
            </NavLink>
            <NavLink 
              to="/matches" 
              className={({ isActive }) => 
                `${styles.mobileNavLink} ${isActive ? styles.activeMobileLink : ''}`
              }
            >
              Partidos
            </NavLink>
            <NavLink 
              to="/teams" 
              className={({ isActive }) => 
                `${styles.mobileNavLink} ${isActive ? styles.activeMobileLink : ''}`
              }
            >
              Equipos
            </NavLink>
            <NavLink 
              to="/betting" 
              className={({ isActive }) => 
                `${styles.mobileNavLink} ${isActive ? styles.activeMobileLink : ''}`
              }
            >
              Apostar
            </NavLink>
            <NavLink 
              to="/standings" 
              className={({ isActive }) => 
                `${styles.mobileNavLink} ${isActive ? styles.activeMobileLink : ''}`
              }
            >
              Clasificación
            </NavLink>
            <NavLink 
              to="/results" 
              className={({ isActive }) => 
                `${styles.mobileNavLink} ${isActive ? styles.activeMobileLink : ''}`
              }
            >
              Resultados
            </NavLink>
            {isAuthenticated && (
              <NavLink 
                to="/account" 
                className={({ isActive }) => 
                  `${styles.mobileNavLink} ${isActive ? styles.activeMobileLink : ''}`
                }
              >
                Mi Cuenta
              </NavLink>
            )}
          </div>
          
          {/* Mobile Auth Actions */}
          <div className={styles.mobileAuthButtons}>
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="block">
                  <Button variant="outline" fullWidth>
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link to="/register" className="block">
                  <Button variant="magical" fullWidth>
                    Registrarse
                  </Button>
                </Link>
              </>
            ) : (
              <Button 
                variant="outline" 
                fullWidth
                onClick={() => logout()}
                className={styles.mobileLogoutButton}
              >
                Cerrar Sesión
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header