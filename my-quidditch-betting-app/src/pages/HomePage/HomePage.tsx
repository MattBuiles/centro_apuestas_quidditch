import { Link } from 'react-router-dom'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'

const HomePage = () => {
  return (
    <div className="space-y-12">
      {/* Hero section */}
      <section className="flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-8">
        <div className="flex-1 space-y-4">
          <h1 className="text-4xl font-bold text-primary">La magia de las apuestas de Quidditch</h1>
          <p className="text-lg text-gray-700">
            Predice resultados, gana Galeones y disfruta de la emoción del juego más mágico del mundo.
          </p>
          <div className="pt-4">
            <Link to="/register">
              <Button size="lg">¡Atrapa tu Suerte!</Button>
            </Link>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-md h-64 bg-gray-200 rounded-lg flex items-center justify-center animate-float">
            <span className="text-4xl text-gray-400">X</span>
          </div>
        </div>
      </section>

      {/* Featured matches section */}
      <section>
        <h2 className="text-2xl font-bold text-primary mb-6">Partidos Destacados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Match card 1 */}
          <Card className="overflow-hidden">
            <div className="h-40 bg-gray-200 flex items-center justify-center">
              <span className="text-2xl text-gray-400">X</span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg text-primary">Gryffindor vs Slytherin</h3>
              <p className="text-gray-600 my-2">Hoy • 19:00</p>
              <Link to="/matches/1">
                <Button variant="secondary" fullWidth>Apostar</Button>
              </Link>
            </div>
          </Card>

          {/* Match card 2 */}
          <Card className="overflow-hidden">
            <div className="h-40 bg-gray-200 flex items-center justify-center">
              <span className="text-2xl text-gray-400">X</span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg text-primary">Hufflepuff vs Ravenclaw</h3>
              <p className="text-gray-600 my-2">Mañana • 17:30</p>
              <Link to="/matches/2">
                <Button variant="secondary" fullWidth>Apostar</Button>
              </Link>
            </div>
          </Card>

          {/* Match card 3 */}
          <Card className="overflow-hidden">
            <div className="h-40 bg-gray-200 flex items-center justify-center">
              <span className="text-2xl text-gray-400">X</span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg text-primary">Chudley Cannons vs Holyhead Harpies</h3>
              <p className="text-gray-600 my-2">Domingo • 15:00</p>
              <Link to="/matches/3">
                <Button variant="secondary" fullWidth>Apostar</Button>
              </Link>
            </div>
          </Card>
        </div>
        <div className="mt-6 text-center">
          <Link to="/matches" className="text-primary hover:text-primary-dark inline-flex items-center">
            Ver todos los partidos
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </section>

      {/* How it works section */}
      <section>
        <h2 className="text-2xl font-bold text-primary mb-6">Cómo Funciona</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl text-primary">1</span>
            </div>
            <h3 className="font-bold text-lg text-primary mb-2">Regístrate</h3>
            <p className="text-gray-600">Crea tu cuenta y obtén Galeones de bienvenida</p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl text-primary">2</span>
            </div>
            <h3 className="font-bold text-lg text-primary mb-2">Elige un Partido</h3>
            <p className="text-gray-600">Selecciona hasta 3 partidos diarios</p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl text-primary">3</span>
            </div>
            <h3 className="font-bold text-lg text-primary mb-2">¡Apuesta!</h3>
            <p className="text-gray-600">Predice resultados y gana Galeones</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage