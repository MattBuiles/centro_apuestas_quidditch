import Card from '@/components/common/Card'
import styles from './TermsPage.module.css'

const TermsPage = () => {
  return (
    <div className={styles.termsPageContainer}>
      <div className={styles.container}>
        <Card className={styles.termsCard}>
          <h1 className={styles.mainTitle}>
            Términos y Condiciones
          </h1>
          
          <p className={styles.lastUpdated}>
            Última actualización: 19 de junio de 2025
          </p>

          <div className={styles.proseContent}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                1. Aceptación de los Términos
              </h2>
              <p className={styles.paragraph}>
                Al acceder y utilizar la plataforma <span className={styles.highlight}>Atrapa la Snitch</span>, usted acepta estar sujeto a estos 
                Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, 
                no debe utilizar nuestros servicios.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                2. Elegibilidad
              </h2>
              <p className={styles.paragraph}>
                Para utilizar nuestros servicios, debe:
              </p>
              <ul className={styles.list}>
                <li className={styles.listItem}>Tener al menos 18 años de edad o la mayoría de edad en su jurisdicción</li>
                <li className={styles.listItem}>Poseer una varita mágica válida y registrada</li>
                <li className={styles.listItem}>Estar legalmente autorizado para participar en apuestas mágicas</li>
                <li className={styles.listItem}>No estar en la lista de magos oscuros prohibidos del Ministerio</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                3. Cuenta de Usuario
              </h2>
              <p className={styles.paragraph}>
                Al crear una cuenta, usted se compromete a:
              </p>
              <ul className={styles.list}>
                <li className={styles.listItem}>Proporcionar información veraz y actualizada</li>
                <li className={styles.listItem}>Mantener la confidencialidad de sus credenciales mágicas</li>
                <li className={styles.listItem}>Notificar inmediatamente cualquier uso no autorizado</li>
                <li className={styles.listItem}>Ser responsable de todas las actividades en su cuenta</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                4. Apuestas y Pagos
              </h2>
              <p className={styles.paragraph}>
                Todas las transacciones se realizan en <span className={styles.highlight}>Galeones, Sickles y Knuts</span>. Los pagos se procesan 
                a través de Gringotts Bank con encriptación mágica de nivel bancario.
              </p>
              <ul className={styles.list}>
                <li className={styles.listItem}>Los depósitos son instantáneos</li>
                <li className={styles.listItem}>Los retiros pueden tardar 1-3 días hábiles mágicos</li>
                <li className={styles.listItem}>Se requiere verificación de identidad para retiros superiores a 1000 Galeones</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                5. Juego Responsable
              </h2>
              <p className={styles.paragraph}>
                Nos comprometemos a promover el <span className={styles.highlight}>juego responsable</span>. Ofrecemos herramientas como:
              </p>
              <ul className={styles.list}>
                <li className={styles.listItem}>Límites de depósito y apuesta</li>
                <li className={styles.listItem}>Autoexclusión temporal o permanente</li>
                <li className={styles.listItem}>Acceso a recursos de ayuda para adicción al juego</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                6. Prohibiciones
              </h2>
              <p className={styles.paragraph}>
                Está estrictamente prohibido:
              </p>
              <ul className={styles.list}>
                <li className={styles.listItem}>Uso de pociones de suerte o hechizos de adivinación</li>
                <li className={styles.listItem}>Manipulación de resultados mediante magia</li>
                <li className={styles.listItem}>Creación de múltiples cuentas</li>
                <li className={styles.listItem}>Apuestas por parte de menores de edad</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                7. Modificaciones
              </h2>
              <p className={styles.paragraph}>
                Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                Los cambios serán notificados mediante <span className={styles.highlight}>lechuza oficial</span> y publicados en nuestra plataforma.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                8. Contacto
              </h2>
              <div className={styles.contactInfo}>
                <p className={styles.paragraph}>
                  Para consultas sobre estos términos, contáctenos en: 
                </p>
                <p className={styles.paragraph}>
                  <strong>📧 legal@atrapalSnitch.com</strong>
                  <br />
                  <strong>🦉 Lechuza oficial al Callejón Diagon #93</strong>
                </p>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default TermsPage
