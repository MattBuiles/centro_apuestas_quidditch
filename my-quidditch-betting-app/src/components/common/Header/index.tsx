import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Button from '../Button'
import Logo from '../Logo'

const Header = () => {
  const { isAuthenticated, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Logo />
              <span className="ml-3 text-xl font-bold text-primary">Atrapa la Snitch</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'text-secondary bg-primary/10' : 'text-primary hover:text-secondary hover:bg-primary/5'
                }`
              }
              end
            >
              Inicio
            </NavLink>
            <NavLink 
              to="/matches" 
              className={({ isActive }) => 
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'text-secondary bg-primary/10' : 'text-primary hover:text-secondary hover:bg-primary/5'
                }`
              }
            >
              Partidos
            </NavLink>
            <NavLink 
              to="/teams" 
              className={({ isActive }) => 
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'text-secondary bg-primary/10' : 'text-primary hover:text-secondary hover:bg-primary/5'
                }`
              }
            >
              Equipos
            </NavLink>
            <NavLink 
              to="/betting" 
              className={({ isActive }) => 
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'text-secondary bg-primary/10' : 'text-primary hover:text-secondary hover:bg-primary/5'
                }`
              }
            >
              Apostar
            </NavLink>
            <NavLink 
              to="/standings" 
              className={({ isActive }) => 
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'text-secondary bg-primary/10' : 'text-primary hover:text-secondary hover:bg-primary/5'
                }`
              }
            >
              Clasificación
            </NavLink>
            <NavLink 
              to="/results" 
              className={({ isActive }) => 
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'text-secondary bg-primary/10' : 'text-primary hover:text-secondary hover:bg-primary/5'
                }`
              }
            >
              Resultados
            </NavLink>
            {isAuthenticated && (
              <NavLink 
                to="/account" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? 'text-secondary bg-primary/10' : 'text-primary hover:text-secondary hover:bg-primary/5'
                  }`
                }
              >
                Mi Cuenta
              </NavLink>
            )}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center ml-4 space-x-2">
            {isAuthenticated ? (
              <Button variant="outline" onClick={logout}>
                Cerrar Sesión
              </Button>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline">Iniciar Sesión</Button>
                </Link>
                <Link to="/register">
                  <Button>Registrarse</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-primary hover:text-secondary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">Abrir menú principal</span>
              {/* Hamburger icon */}
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* X icon */}
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `block px-3 py-2 rounded-md text-base font-medium ${
                isActive ? 'text-secondary bg-primary/10' : 'text-primary hover:text-secondary hover:bg-primary/5'
              }`
            }
            end
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Inicio
          </NavLink>
          <NavLink 
            to="/matches" 
            className={({ isActive }) => 
              `block px-3 py-2 rounded-md text-base font-medium ${
                isActive ? 'text-secondary bg-primary/10' : 'text-primary hover:text-secondary hover:bg-primary/5'
              }`
            }
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Partidos
          </NavLink>
          <NavLink 
            to="/teams" 
            className={({ isActive }) => 
              `block px-3 py-2 rounded-md text-base font-medium ${
                isActive ? 'text-secondary bg-primary/10' : 'text-primary hover:text-secondary hover:bg-primary/5'
              }`
            }
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Equipos
          </NavLink>
          <NavLink 
            to="/betting" 
            className={({ isActive }) => 
              `block px-3 py-2 rounded-md text-base font-medium ${
                isActive ? 'text-secondary bg-primary/10' : 'text-primary hover:text-secondary hover:bg-primary/5'
              }`
            }
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Apostar
          </NavLink>
          <NavLink 
            to="/standings" 
            className={({ isActive }) => 
              `block px-3 py-2 rounded-md text-base font-medium ${
                isActive ? 'text-secondary bg-primary/10' : 'text-primary hover:text-secondary hover:bg-primary/5'
              }`
            }
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Clasificación
          </NavLink>
          <NavLink 
            to="/results" 
            className={({ isActive }) => 
              `block px-3 py-2 rounded-md text-base font-medium ${
                isActive ? 'text-secondary bg-primary/10' : 'text-primary hover:text-secondary hover:bg-primary/5'
              }`
            }
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Resultados
          </NavLink>
          {isAuthenticated && (
            <NavLink 
              to="/account" 
              className={({ isActive }) => 
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive ? 'text-secondary bg-primary/10' : 'text-primary hover:text-secondary hover:bg-primary/5'
                }`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Mi Cuenta
            </NavLink>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="flex items-center px-4 space-x-2">
            {isAuthenticated ? (
              <Button variant="outline" onClick={() => { logout(); setIsMobileMenuOpen(false); }} fullWidth>
                Cerrar Sesión
              </Button>
            ) : (
              <div className="w-full space-y-2">
                <Link to="/login" className="block w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" fullWidth>Iniciar Sesión</Button>
                </Link>
                <Link to="/register" className="block w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button fullWidth>Registrarse</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header