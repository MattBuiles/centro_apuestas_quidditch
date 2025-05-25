import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h3 className="text-xl font-bold">Atrapa la Snitch</h3>
            <p className="text-sm mt-1 text-gray-300">La mejor casa de apuestas del mundo mágico</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-6">
            <Link to="/about" className="text-sm text-gray-300 hover:text-white">
              Sobre Nosotros
            </Link>
            <Link to="/terms" className="text-sm text-gray-300 hover:text-white">
              Términos y Condiciones
            </Link>
            <Link to="/privacy" className="text-sm text-gray-300 hover:text-white">
              Política de Privacidad
            </Link>
            <Link to="/contact" className="text-sm text-gray-300 hover:text-white">
              Contacto
            </Link>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-300">
            &copy; 2025 Atrapa la Snitch. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer