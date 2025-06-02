// filepath: d:\Coding\Projects\centro_apuestas_quidditch\my-quidditch-betting-app\src\pages\HomePage\HomePage.tsx
import { Link } from 'react-router-dom'
import Button from '@/components/common/Button'
// Card component is used, ensure its styling is compatible or create a .match-card style

const HomePage = () => {
  return (
    <div className="home-page-container space-y-12"> {/* Added a container class */}
      {/* Hero section */}
      <section className="hero-section md:flex md:gap-8 items-center"> {/* Using classes from wireframe */}
        <div className="hero-content flex-1 space-y-4">
          <h2 className="text-4xl font-bold text-primary">La magia de las apuestas de Quidditch</h2>
          <p className="text-lg text-gray-700">
            Predice resultados, gana Galeones y disfruta de la emoción del juego más mágico del mundo.
          </p>
          <div className="pt-4">
            <Link to="/register">
              <Button size="lg" className="cta-button">¡Atrapa tu Suerte!</Button> {/* Added cta-button class */}
            </Link>
          </div>
        </div>
        <div className="hero-image-placeholder flex-1 flex justify-center mt-8 md:mt-0">
          <div className="placeholder-x w-full max-w-md h-64 bg-gray-200 rounded-lg flex items-center justify-center animate-float">
            <span className="text-4xl text-gray-400">X</span>
          </div>
        </div>
      </section>

      {/* Featured matches section */}
      <section className="featured-matches">
        <h3 className="text-2xl font-bold text-primary mb-6">Partidos Destacados</h3>
        <div className="matches-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Match card 1 */}
          <div className="match-card"> {/* Using match-card class from wireframe */}
            <div className="teams-placeholder h-40 bg-gray-200 flex items-center justify-center">
              <span className="placeholder-x text-2xl text-gray-400">X</span>
            </div>
            <div className="match-info p-4">
              <h4 className="font-bold text-lg text-primary">Gryffindor vs Slytherin</h4>
              <p className="text-gray-600 my-2">Hoy • 19:00</p>
              <Link to="/matches/1">
                <Button variant="secondary" fullWidth className="button-secondary">Apostar</Button>
              </Link>
            </div>
          </div>

          {/* Match card 2 */}
          <div className="match-card">
            <div className="teams-placeholder h-40 bg-gray-200 flex items-center justify-center">
              <span className="placeholder-x text-2xl text-gray-400">X</span>
            </div>
            <div className="match-info p-4">
              <h4 className="font-bold text-lg text-primary">Hufflepuff vs Ravenclaw</h4>
              <p className="text-gray-600 my-2">Mañana • 17:30</p>
              <Link to="/matches/2">
                <Button variant="secondary" fullWidth className="button-secondary">Apostar</Button>
              </Link>
            </div>
          </div>

          {/* Match card 3 */}
          <div className="match-card">
            <div className="teams-placeholder h-40 bg-gray-200 flex items-center justify-center">
              <span className="placeholder-x text-2xl text-gray-400">X</span>
            </div>
            <div className="match-info p-4">
              <h4 className="font-bold text-lg text-primary">Chudley Cannons vs Holyhead Harpies</h4>
              <p className="text-gray-600 my-2">Domingo • 15:00</p>
              <Link to="/matches/3">
                <Button variant="secondary" fullWidth className="button-secondary">Apostar</Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link to="/matches" className="button button-text text-primary hover:underline inline-flex items-center">
            Ver todos los partidos →
          </Link>
        </div>
      </section>

      {/* How it works section */}
      <section className="how-it-works">
        <h3 className="text-2xl font-bold text-primary mb-6">Cómo Funciona</h3>
        <div className="steps-container grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="step text-center">
            <div className="step-icon-placeholder mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="placeholder-x text-2xl text-primary">1</span>
            </div>
            <h4 className="font-bold text-lg text-primary mb-2">Regístrate</h4>
            <p className="text-gray-600">Crea tu cuenta y obtén Galeones de bienvenida</p>
          </div>

          <div className="step text-center">
            <div className="step-icon-placeholder mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="placeholder-x text-2xl text-primary">2</span>
            </div>
            <h4 className="font-bold text-lg text-primary mb-2">Elige un Partido</h4>
            <p className="text-gray-600">Selecciona hasta 3 partidos diarios</p>
          </div>

          <div className="step text-center">
            <div className="step-icon-placeholder mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="placeholder-x text-2xl text-primary">3</span>
            </div>
            <h4 className="font-bold text-lg text-primary mb-2">¡Apuesta!</h4>
            <p className="text-gray-600">Predice resultados y gana Galeones</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage