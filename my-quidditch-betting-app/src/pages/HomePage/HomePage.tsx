// filepath: d:\Coding\Projects\centro_apuestas_quidditch\my-quidditch-betting-app\src\pages\HomePage\HomePage.tsx
import { Link } from 'react-router-dom'
import Button from '@/components/common/Button'
import TeamLogo from '@/components/teams/TeamLogo'
import styles from './HomePage.module.css'

const HomePage = () => {
  return (
    <div className="home-page-container space-y-8 md:space-y-16 py-4 md:py-8">
      {/* Hero section */}
      <section className={styles.heroSection}> 
        <div className="flex flex-col md:flex-row md:gap-12 items-center">
          <div className={`flex-1 space-y-4 md:space-y-6 ${styles.heroContent}`}>
            <h2 className={styles.heroTitle}>
              La Magia de las Apuestas de Quidditch
            </h2>
            <p className={styles.heroDescription}>
              Predice resultados, gana Galeones y disfruta de la emoción del juego más mágico del mundo.
            </p>
            <div className="pt-4 md:pt-6">
              <Link to="/register">
                <Button size="lg" className="cta-button bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg transform hover:scale-105 transition-all duration-300 w-full sm:w-auto">
                  ¡Atrapa tu Suerte!
                </Button>
              </Link>
            </div>
          </div>
          <div className={`flex-1 ${styles.heroImagePlaceholder}`}>
            <div className={styles.heroImageInner}>
              <div className={styles.heroImageSymbol}>
                <span>Q</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured matches section */}
      <section className={styles.featuredSection}>
        <h3 className={styles.sectionTitle}>
          Partidos Destacados
        </h3>
        <div className={styles.matchesGrid}>
          {/* Match card 1 - Enhanced styling */}
          <div className={styles.matchCard}>            <div className={styles.matchHeader}>              <div className={styles.teamLogos}>
                <TeamLogo teamName="Gryffindor" size="md" className={styles.matchTeamLogo} />
                <div className={styles.vsLabel}>VS</div>
                <TeamLogo teamName="Slytherin" size="md" className={styles.matchTeamLogo} />
              </div>
            </div>            <div className={styles.matchInfo}>
              <h4 className={styles.matchTitle}>Gryffindor vs Slytherin</h4>
              <div className={styles.matchDate}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Hoy • 19:00</p>
              </div>
              <Link to="/matches/1">
                <Button variant="secondary" size="sm" fullWidth>
                  Apostar
                </Button>
              </Link>
            </div>
          </div>

          {/* Match card 2 - Enhanced styling */}
          <div className={styles.matchCard}>            <div className={styles.matchHeader}>              <div className={styles.teamLogos}>
                <TeamLogo teamName="Hufflepuff" size="md" className={styles.matchTeamLogo} />
                <div className={styles.vsLabel}>VS</div>
                <TeamLogo teamName="Ravenclaw" size="md" className={styles.matchTeamLogo} />
              </div>
            </div>            <div className={styles.matchInfo}>
              <h4 className={styles.matchTitle}>Hufflepuff vs Ravenclaw</h4>
              <div className={styles.matchDate}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Mañana • 17:30</p>
              </div>
              <Link to="/matches/2">
                <Button variant="secondary" size="sm" fullWidth>
                  Apostar
                </Button>
              </Link>
            </div>
          </div>

          {/* Match card 3 - Enhanced styling */}
          <div className={styles.matchCard}> 
            <div className={styles.matchHeader}>              <div className={styles.teamLogos}>
                <TeamLogo teamName="Chudley Cannons" size="md" className={styles.matchTeamLogo} />
                <div className={styles.vsLabel}>VS</div>
                <TeamLogo teamName="Holyhead Harpies" size="md" className={styles.matchTeamLogo} />
              </div>
            </div>            <div className={styles.matchInfo}>
              <h4 className={styles.matchTitle}>Chudley Cannons vs Holyhead Harpies</h4>
              <div className={styles.matchDate}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Domingo • 15:00</p>
              </div>
              <Link to="/matches/3">
                <Button variant="secondary" size="sm" fullWidth>
                  Apostar
                </Button>
              </Link>
            </div>          </div>
        </div>
        <div className="text-center">
          <Link to="/matches" className={styles.viewAllLink}>
            <span>Ver todos los partidos</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </section>

      {/* How it works section - enhanced with cards and gradients */}
      <section className={styles.howItWorksSection}>
        <h3 className={styles.howItWorksTitle}>
          Cómo Funciona la Magia
        </h3>
        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <div className={styles.stepIcon}>
              <span>✨</span>
            </div>
            <h4 className={styles.stepTitle}>Regístrate en el Mundo Mágico</h4>
            <p className={styles.stepDescription}>Únete a nuestra comunidad de magos apostadores y recibe 100 Galeones de bienvenida para comenzar tu aventura mágica en el mundo del Quidditch.</p>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepIcon}>
              <span>🏆</span>
            </div>
            <h4 className={styles.stepTitle}>Elige tu Partido Favorito</h4>
            <p className={styles.stepDescription}>Explora nuestra selección de los partidos más emocionantes de Quidditch. Desde la Liga de Hogwarts hasta campeonatos profesionales internacionales.</p>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepIcon}>
              <span>⚡</span>
            </div>
            <h4 className={styles.stepTitle}>Apuesta y Multiplica tus Galeones</h4>
            <p className={styles.stepDescription}>Haz tus predicciones mágicas, siente la adrenalina del juego más emocionante del mundo y multiplica tus ganancias con cada victoria épica.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage