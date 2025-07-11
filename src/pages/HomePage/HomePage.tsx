// filepath: d:\Coding\Projects\centro_apuestas_quidditch\my-quidditch-betting-app\src\pages\HomePage\HomePage.tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Button from '@/components/common/Button'
import CTAButton from '@/components/common/CTAButton'
import TeamLogo from '@/components/teams/TeamLogo'
import { useAuth } from '@/context/AuthContext'
import { leagueTimeService } from '@/services/leagueTimeService'
import { Match, Team } from '@/types/league'
import { FEATURES } from '@/config/features'
import welcomeLogo from '@/assets/Welcome_Logo.png'
import styles from './HomePage.module.css'

const HomePage = () => {
  const [featuredMatches, setFeaturedMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const { canBet, isAdmin } = useAuth();
  useEffect(() => {
    // Load featured matches from league time service
    const loadFeaturedMatches = async () => {
      if (FEATURES.USE_BACKEND_LEAGUE_TIME) {
        try {
          const leagueInfo = await leagueTimeService.getLeagueTimeInfo();
          if (leagueInfo.activeSeason) {
            // Get next 3 upcoming matches - use 'matches' from backend
            const upcomingMatches = leagueInfo.activeSeason.matches
              .filter((match: Match) => match.status === 'scheduled')
              .sort((a: Match, b: Match) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 3);
            
            setFeaturedMatches(upcomingMatches);
            setTeams(leagueInfo.activeSeason.teams); // use 'teams' from backend
          }
        } catch (error) {
          console.error('Failed to load league information:', error);
          setFeaturedMatches([]);
          setTeams([]);
        }
      } else {
        // No backend available, use empty state
        setFeaturedMatches([]);
        setTeams([]);
      }
    };
    
    loadFeaturedMatches();
  }, []);

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || teamId;
  };

  const getMatchStatus = (match: Match) => {
    if (match.status === 'live') return 'En Vivo';
    if (match.status === 'finished') return 'Finalizado';
    
    const matchDate = new Date(match.date); // Use 'date' from backend
    const now = new Date(); // Use real time for now
    const diffInHours = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) return 'Próximo';
    return 'Programado';
  };
  return (
    <div className={styles.homeContainer}>
      {/* Hero section */}
      <section className={styles.heroSection}>
        <div className={styles.heroBackground}>
          <div className={styles.magicalParticles}></div>
          <div className={styles.heroStars}></div>
        </div>
        
        <div className={styles.heroContent}>
          <div className={styles.heroText}>            <div className={styles.heroBadge}>
              <span className={styles.badgeIcon}>⚡</span>
              <span>{isAdmin ? 'Panel de Administración' : 'Centro Oficial de Apuestas'}</span>
            </div>
            
            <h1 className={styles.heroTitle}>
              La Magia de las <br />
              <span className={styles.titleHighlight}>
                {isAdmin ? 'Gestión de Quidditch' : 'Apuestas de Quidditch'}
              </span>
            </h1>
            
            <p className={styles.heroDescription}>
              {isAdmin 
                ? 'Administra el mundo mágico del Quidditch. Gestiona temporadas completas, supervisa partidos épicos en tiempo real y controla toda la experiencia del deporte más fascinante del mundo mágico.'
                : 'Sumérgete en el mundo mágico del Quidditch. Simula temporadas completas, experimenta partidos épicos en tiempo real y vive la emoción de apostar en el deporte más fascinante del mundo mágico.'
              }
            </p>
            
            <div className={styles.heroStats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>100+</span>
                <span className={styles.statLabel}>Partidos Simulados</span>
              </div>              <div className={styles.statItem}>
                <span className={styles.statNumber}>6</span>
                <span className={styles.statLabel}>Equipos Épicos</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>24/7</span>
                <span className={styles.statLabel}>Acción Mágica</span>
              </div>
            </div>

            <div className={styles.heroActions}>
              <CTAButton 
                size="xl" 
                className={styles.primaryCTA}
              />              <Link to="/matches" className={styles.secondaryAction}>
                <Button variant="outline" size="lg" className={styles.secondaryButton}>
                  <span className={styles.buttonIcon}>🏆</span>
                  <span>Explorar Liga</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.logoContainer}>
              <div className={styles.logoGlow}></div>
              <img 
                src={welcomeLogo} 
                alt="Centro de Apuestas Quidditch - Logo de Bienvenida" 
                className={styles.welcomeLogo}
              />
            </div>
            
            <div className={styles.floatingElements}>
              <div className={styles.floatingSnitch}>🏅</div>
              <div className={styles.floatingWand}>🪄</div>
              <div className={styles.floatingBroom}>🧹</div>
            </div>
          </div>
        </div>
      </section>      {/* Features section */}
      <section className={styles.featuresSection}>        <div className={styles.featuresHeader}>
          <h2 className={styles.featuresTitle}>
            Experiencias Mágicas que te Esperan
          </h2>
          <p className={styles.featuresSubtitle}>
            {isAdmin 
              ? 'Descubre todas las funcionalidades de administración del sistema de Quidditch'
              : 'Descubre todas las funcionalidades épicas de nuestro centro de apuestas'
            }
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <span>⏰</span>
            </div>
            <h3 className={styles.featureTitle}>Control del Tiempo Virtual</h3>
            <p className={styles.featureDescription}>
              Avanza el tiempo día por día, simula partidos bajo demanda y observa 
              como se desarrolla toda una temporada de Quidditch a tu ritmo.
            </p>
            <div className={styles.featureBenefits}>
              <span className={styles.benefit}>✨ Simulación en tiempo real</span>
              <span className={styles.benefit}>⚡ Control total de temporadas</span>
            </div>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <span>🏆</span>
            </div>
            <h3 className={styles.featureTitle}>Partidos Épicos en Vivo</h3>
            <p className={styles.featureDescription}>
              Experimenta la emoción de partidos generados dinámicamente con eventos 
              minuto a minuto, desde goles hasta la captura de la Snitch Dorada.
            </p>
            <div className={styles.featureBenefits}>
              <span className={styles.benefit}>🎯 Eventos dinámicos</span>
              <span className={styles.benefit}>🔥 Acción minuto a minuto</span>
            </div>
          </div>

          {isAdmin ? (
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <span>👥</span>
              </div>
              <h3 className={styles.featureTitle}>Gestión Administrativa</h3>
              <p className={styles.featureDescription}>
                Administra usuarios, supervisa el historial de apuestas y mantén el control 
                total sobre todas las actividades del sistema de Quidditch.
              </p>
              <div className={styles.featureBenefits}>
                <span className={styles.benefit}>🛡️ Control de usuarios</span>
                <span className={styles.benefit}>📊 Supervisión completa</span>
              </div>
            </div>
          ) : (
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <span>💎</span>
              </div>
              <h3 className={styles.featureTitle}>Apuestas Inteligentes</h3>
              <p className={styles.featureDescription}>
                Haz tus predicciones en una liga completamente simulada, sigue la 
                evolución de los equipos y multiplica tus ganancias con cada victoria épica.
              </p>
              <div className={styles.featureBenefits}>
                <span className={styles.benefit}>💰 Galeones virtuales</span>
                <span className={styles.benefit}>📊 Estadísticas detalladas</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured matches section */}
      <section className={styles.matchesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.titleIcon}>⚡</span>
            Partidos Destacados
          </h2>
          <p className={styles.sectionSubtitle}>
            Los enfrentamientos más emocionantes te esperan
          </p>
        </div>

        <div className={styles.matchesGrid}>
          {featuredMatches.length > 0 ? featuredMatches.map((match, index) => {
            const homeTeamName = getTeamName(match.localId);
            const awayTeamName = getTeamName(match.visitanteId);
            const matchStatus = getMatchStatus(match);
            
            return (
              <div key={match.id} className={styles.matchCard}>
                <div className={styles.matchBadge}>
                  <span>{matchStatus}</span>
                </div>
                
                <div className={styles.matchHeader}>
                  <div className={styles.teamLogos}>
                    <div className={styles.teamContainer}>
                      <TeamLogo teamName={homeTeamName} size="md" className={styles.matchTeamLogo} />
                      <span className={styles.teamName}>{homeTeamName}</span>
                    </div>
                    <div className={styles.vsContainer}>
                      <span className={styles.vsLabel}>VS</span>
                    </div>
                    <div className={styles.teamContainer}>
                      <TeamLogo teamName={awayTeamName} size="md" className={styles.matchTeamLogo} />
                      <span className={styles.teamName}>{awayTeamName}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.matchInfo}>
                  <div className={styles.matchMeta}>
                    <div className={styles.matchDate}>
                      <span className={styles.dateIcon}>📅</span>
                      <span>
                        {new Date(match.date).toLocaleDateString('es-ES')} • {new Date(match.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={styles.matchOdds}>
                      <span className={styles.oddsLabel}>Cuotas:</span>
                      <span className={styles.oddsValue}>{(1.5 + Math.random() * 1.5).toFixed(1)}x</span>
                    </div>
                  </div>
                  
                  <Link to={`/matches/${match.id}`} className={styles.matchAction}>                    <Button 
                      variant={index === 0 ? "magical" : index === 1 ? "secondary" : "outline"} 
                      size="sm" 
                      fullWidth
                    >
                      <span>
                        {index === 0 ? (canBet ? "⚡ Apostar Ahora" : "🔮 Ver Detalles") : index === 1 ? "🔮 Ver Detalles" : "📊 Analizar"}
                      </span>
                    </Button>
                  </Link>
                </div>
              </div>
            );
          }) : (
            // Fallback to original placeholder content if no matches available
            <>
              {/* Match card 1 */}
              <div className={styles.matchCard}>
                <div className={styles.matchBadge}>
                  <span>En Vivo</span>
                </div>
                
                <div className={styles.matchHeader}>
                  <div className={styles.teamLogos}>
                    <div className={styles.teamContainer}>
                      <TeamLogo teamName="Gryffindor" size="md" className={styles.matchTeamLogo} />
                      <span className={styles.teamName}>Gryffindor</span>
                    </div>
                    <div className={styles.vsContainer}>
                      <span className={styles.vsLabel}>VS</span>
                    </div>
                    <div className={styles.teamContainer}>
                      <TeamLogo teamName="Slytherin" size="md" className={styles.matchTeamLogo} />
                      <span className={styles.teamName}>Slytherin</span>
                    </div>
                  </div>
                </div>

                <div className={styles.matchInfo}>
                  <div className={styles.matchMeta}>
                    <div className={styles.matchDate}>
                      <span className={styles.dateIcon}>📅</span>
                      <span>Hoy • 19:00</span>
                    </div>
                    <div className={styles.matchOdds}>
                      <span className={styles.oddsLabel}>Cuotas:</span>
                      <span className={styles.oddsValue}>2.1x</span>
                    </div>
                  </div>
                    <Link to="/matches/1" className={styles.matchAction}>
                    <Button variant="magical" size="sm" fullWidth>
                      <span>{canBet ? "⚡ Apostar Ahora" : "🔮 Ver Detalles"}</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Match card 2 */}
              <div className={styles.matchCard}>
                <div className={styles.matchBadge}>
                  <span>Próximo</span>
                </div>
                
                <div className={styles.matchHeader}>
                  <div className={styles.teamLogos}>
                    <div className={styles.teamContainer}>
                      <TeamLogo teamName="Hufflepuff" size="md" className={styles.matchTeamLogo} />
                      <span className={styles.teamName}>Hufflepuff</span>
                    </div>
                    <div className={styles.vsContainer}>
                      <span className={styles.vsLabel}>VS</span>
                    </div>
                    <div className={styles.teamContainer}>
                      <TeamLogo teamName="Ravenclaw" size="md" className={styles.matchTeamLogo} />
                      <span className={styles.teamName}>Ravenclaw</span>
                    </div>
                  </div>
                </div>

                <div className={styles.matchInfo}>
                  <div className={styles.matchMeta}>
                    <div className={styles.matchDate}>
                      <span className={styles.dateIcon}>📅</span>
                      <span>Mañana • 17:30</span>
                    </div>
                    <div className={styles.matchOdds}>
                      <span className={styles.oddsLabel}>Cuotas:</span>
                      <span className={styles.oddsValue}>1.8x</span>
                    </div>
                  </div>
                  
                  <Link to="/matches/2" className={styles.matchAction}>
                    <Button variant="secondary" size="sm" fullWidth>
                      <span>🔮 Ver Detalles</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Match card 3 */}
              <div className={styles.matchCard}>
                <div className={styles.matchBadge}>
                  <span>Destacado</span>
                </div>
                
                <div className={styles.matchHeader}>
                  <div className={styles.teamLogos}>
                    <div className={styles.teamContainer}>
                      <TeamLogo teamName="Chudley Cannons" size="md" className={styles.matchTeamLogo} />
                      <span className={styles.teamName}>Cannons</span>
                    </div>
                    <div className={styles.vsContainer}>
                      <span className={styles.vsLabel}>VS</span>
                    </div>
                    <div className={styles.teamContainer}>
                      <TeamLogo teamName="Holyhead Harpies" size="md" className={styles.matchTeamLogo} />
                      <span className={styles.teamName}>Harpies</span>
                    </div>
                  </div>
                </div>

                <div className={styles.matchInfo}>
                  <div className={styles.matchMeta}>
                    <div className={styles.matchDate}>
                      <span className={styles.dateIcon}>📅</span>
                      <span>Domingo • 15:00</span>
                    </div>
                    <div className={styles.matchOdds}>
                      <span className={styles.oddsLabel}>Cuotas:</span>
                      <span className={styles.oddsValue}>2.5x</span>
                    </div>
                  </div>
                  
                  <Link to="/matches/3" className={styles.matchAction}>
                    <Button variant="outline" size="sm" fullWidth>
                      <span>📊 Analizar</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.sectionAction}>
          <Link to="/matches" className={styles.viewAllLink}>
            <span className={styles.linkText}>Ver todos los partidos</span>
            <span className={styles.linkIcon}>→</span>
          </Link>
        </div>
      </section>

      {/* Call to action section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBackground}>
          <div className={styles.ctaStars}></div>
        </div>
          <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>
            {isAdmin ? '¿Listo para Administrar la Magia?' : '¿Listo para la Aventura Mágica?'}
          </h2>
          <p className={styles.ctaDescription}>
            {isAdmin 
              ? 'Controla y supervisa toda la experiencia del Quidditch. ¡Tu panel de administración te espera!'
              : 'Únete a miles de magos que ya disfrutan de la emoción del Quidditch. ¡Tu próxima gran apuesta te espera!'
            }
          </p>
          
          <div className={styles.ctaActions}>
            {!isAdmin && <CTAButton size="xl" className={styles.ctaButton} />}
            <Link to={isAdmin ? "/account" : "/teams"} className={styles.ctaSecondary}>
              <span>{isAdmin ? 'Panel de Control' : 'Conocer Equipos'}</span>
              <span className={styles.ctaIcon}>{isAdmin ? '⚙️' : '🏆'}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage