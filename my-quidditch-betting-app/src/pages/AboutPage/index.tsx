import Card from '@/components/common/Card'
import styles from './AboutPage.module.css'

const AboutPage = () => {
  return (
    <div className={styles.aboutContainer}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroBackground}>
          <div className={styles.magicalParticles}></div>
          <div className={styles.heroStars}></div>
        </div>
        
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.badgeIcon}>🏆</span>
            <span>Centro Oficial de Apuestas de Quidditch</span>
          </div>
          
          <h1 className={styles.heroTitle}>
            Sobre <span className={styles.titleHighlight}>Atrapa la Snitch</span>
          </h1>
          
          <p className={styles.heroDescription}>
            Descubre la historia y los valores que nos convierten en la plataforma de apuestas 
            más confiable y emocionante del mundo mágico.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className={styles.storySection}>
        <div className={styles.sectionContainer}>
          <div className={styles.storyGrid}>
            <div className={styles.storyContent}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>📜</span>
                <h2 className={styles.sectionTitle}>Nuestra Historia</h2>
              </div>
              
              <div className={styles.storyText}>
                <p className={styles.paragraph}>
                  Fundada en 2020 por un grupo de entusiastas del Quidditch, <strong>Atrapa la Snitch</strong> 
                  nació con la visión de crear la plataforma de apuestas más confiable y emocionante del mundo mágico.
                </p>
                <p className={styles.paragraph}>
                  Desde nuestros humildes comienzos en el Callejón Diagon, hemos crecido hasta convertirnos en 
                  la casa de apuestas preferida por magos y brujas de todo el mundo, ofreciendo las mejores 
                  cuotas y la experiencia más inmersiva.
                </p>
              </div>
            </div>
            
            <div className={styles.storyVisual}>
              <div className={styles.timelineCard}>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineIcon}>🏰</div>
                  <div className={styles.timelineContent}>
                    <h4>2020</h4>
                    <p>Fundación en el Callejón Diagon</p>
                  </div>
                </div>
                
                <div className={styles.timelineItem}>
                  <div className={styles.timelineIcon}>⚡</div>
                  <div className={styles.timelineContent}>
                    <h4>2022</h4>
                    <p>Primera Liga Mundial Digital</p>
                  </div>
                </div>
                
                <div className={styles.timelineItem}>
                  <div className={styles.timelineIcon}>🏆</div>
                  <div className={styles.timelineContent}>
                    <h4>2025</h4>
                    <p>Líder en Apuestas Mágicas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className={styles.missionSection}>
        <div className={styles.sectionContainer}>
          <Card className={styles.missionCard}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🎯</span>
              <h2 className={styles.sectionTitle}>Nuestra Misión</h2>
            </div>
            
            <p className={styles.missionText}>
              Democratizar el acceso a las apuestas de Quidditch, proporcionando una plataforma segura, 
              justa y emocionante donde tanto novatos como expertos puedan disfrutar de la magia del 
              deporte más popular del mundo brujo.
            </p>
            
            <div className={styles.missionStats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>10,000+</span>
                <span className={styles.statLabel}>Magos Activos</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>500+</span>
                <span className={styles.statLabel}>Partidos Simulados</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>99.9%</span>
                <span className={styles.statLabel}>Tiempo Activo</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Values Section */}
      <section className={styles.valuesSection}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>✨</span>
            <h2 className={styles.sectionTitle}>¿Por qué elegir Atrapa la Snitch?</h2>
            <p className={styles.sectionSubtitle}>
              Los valores que nos distinguen en el mundo mágico de las apuestas
            </p>
          </div>
          
          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <span>🏆</span>
              </div>
              <h3 className={styles.valueTitle}>Confianza Absoluta</h3>
              <p className={styles.valueDescription}>
                Licenciados por el Ministerio de Magia y regulados por las más altas autoridades mágicas.
              </p>
              <div className={styles.valueFeatures}>
                <span className={styles.feature}>🛡️ Regulación oficial</span>
                <span className={styles.feature}>📋 Licencias verificadas</span>
              </div>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <span>⚡</span>
              </div>
              <h3 className={styles.valueTitle}>Tecnología Mágica</h3>
              <p className={styles.valueDescription}>
                Plataforma desarrollada con los últimos hechizos tecnológicos para una experiencia fluida.
              </p>
              <div className={styles.valueFeatures}>
                <span className={styles.feature}>🔮 Algoritmos avanzados</span>
                <span className={styles.feature}>📱 Experiencia responsive</span>
              </div>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <span>🛡️</span>
              </div>
              <h3 className={styles.valueTitle}>Seguridad Total</h3>
              <p className={styles.valueDescription}>
                Tus datos y galeones están protegidos por encantamientos de seguridad inquebrantables.
              </p>
              <div className={styles.valueFeatures}>
                <span className={styles.feature}>🔐 Encriptación mágica</span>
                <span className={styles.feature}>🏦 Transacciones seguras</span>
              </div>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <span>🎯</span>
              </div>
              <h3 className={styles.valueTitle}>Mejores Cuotas</h3>
              <p className={styles.valueDescription}>
                Ofrecemos las cuotas más competitivas del mercado mágico de apuestas.
              </p>
              <div className={styles.valueFeatures}>
                <span className={styles.feature}>💰 Cuotas dinámicas</span>
                <span className={styles.feature}>📊 Análisis en tiempo real</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commitment Section */}
      <section className={styles.commitmentSection}>
        <div className={styles.sectionContainer}>
          <Card className={styles.commitmentCard}>
            <div className={styles.commitmentContent}>
              <div className={styles.commitmentIcon}>
                <span>🤝</span>
              </div>
              
              <div className={styles.commitmentText}>
                <h2 className={styles.commitmentTitle}>Nuestro Compromiso</h2>
                <p className={styles.commitmentDescription}>
                  En Atrapa la Snitch, promovemos el <strong>juego responsable</strong> y estamos comprometidos 
                  con proporcionar herramientas y recursos para que nuestros usuarios disfruten de las apuestas 
                  de manera segura y controlada. El Quidditch es diversión, y las apuestas deben serlo también.
                </p>
                
                <div className={styles.commitmentFeatures}>
                  <div className={styles.commitmentFeature}>
                    <span className={styles.featureIcon}>🎮</span>
                    <span>Juego Responsable</span>
                  </div>
                  <div className={styles.commitmentFeature}>
                    <span className={styles.featureIcon}>⏰</span>
                    <span>Límites Personalizados</span>
                  </div>
                  <div className={styles.commitmentFeature}>
                    <span className={styles.featureIcon}>💬</span>
                    <span>Soporte 24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
