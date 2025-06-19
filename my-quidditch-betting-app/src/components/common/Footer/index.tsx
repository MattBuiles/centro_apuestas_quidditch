import { Link } from 'react-router-dom'

const Footer = () => {
  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main footer content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Brand section */}
            <div className="md:col-span-2 lg:col-span-7">
              <div className="mb-8">
                <h3 className="text-3xl font-bold font-cinzel mb-4 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Atrapa la Snitch
                </h3>
                <p className="text-gray-400 text-base leading-relaxed max-w-2xl">
                  Plataforma líder en apuestas deportivas mágicas con más de 5 años de experiencia 
                  brindando la mejor experiencia de apuestas en el mundo del Quidditch.
                </p>
              </div>
              
              {/* Trust indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-800/30 border border-gray-700/50 hover:bg-gray-800/50 transition-colors">
                  <div className="w-3 h-3 bg-green-400 rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-xs text-gray-500">Licencia Oficial</p>
                    <p className="text-sm text-white font-medium">MW-2025</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-800/30 border border-gray-700/50 hover:bg-gray-800/50 transition-colors">
                  <div className="w-3 h-3 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-xs text-gray-500">Seguridad</p>
                    <p className="text-sm text-white font-medium">SSL A+</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-800/30 border border-gray-700/50 hover:bg-gray-800/50 transition-colors">
                  <div className="w-3 h-3 bg-purple-400 rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-xs text-gray-500">Disponibilidad</p>
                    <p className="text-sm text-white font-medium">99.9%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal & Support */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold mb-6 text-white font-playfair">Enlaces Legales</h4>                  <div className="space-y-3">
                    <Link to="/about" onClick={handleLinkClick} className="block text-gray-400 hover:text-white transition-colors duration-200 text-sm py-1">
                      Sobre Nosotros
                    </Link>
                    <Link to="/contact" onClick={handleLinkClick} className="block text-gray-400 hover:text-white transition-colors duration-200 text-sm py-1">
                      Contacto
                    </Link>
                    <Link to="/terms" onClick={handleLinkClick} className="block text-gray-400 hover:text-white transition-colors duration-200 text-sm py-1">
                      Términos
                    </Link>
                    <Link to="/privacy" onClick={handleLinkClick} className="block text-gray-400 hover:text-white transition-colors duration-200 text-sm py-1">
                      Privacidad
                    </Link>
                  </div>
                </div>
                
                {/* Responsibility notice */}
                <div className="md:mt-0 mt-6">
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 h-full flex flex-col justify-center">
                    <p className="text-xs text-amber-300 font-medium mb-2">Juego Responsable</p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Apuesta con responsabilidad. Si tienes problemas con el juego, busca ayuda profesional.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-gray-500">
              <p>© 2025 Atrapa la Snitch S.A. Todos los derechos reservados.</p>
              <div className="hidden md:block w-1 h-1 bg-gray-600 rounded-full"></div>
              <p>Licencia de Operación MW-2025-001</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-xs text-gray-500">
                Desarrollado con ⚡ para la comunidad mágica
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer