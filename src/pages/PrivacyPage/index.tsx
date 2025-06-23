import Card from '@/components/common/Card'
import styles from './PrivacyPage.module.css'

const PrivacyPage = () => {
  return (
    <div className={styles.privacyPageContainer}>
      <div className={styles.container}>
        <Card className={styles.privacyCard}>
          <h1 className={styles.mainTitle}>
            Política de Privacidad
          </h1>
          
          <p className={styles.lastUpdated}>
            Última actualización: 19 de junio de 2025
          </p>

          <div className={styles.proseContent}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                1. Información que Recopilamos
              </h2>
              <p className={styles.paragraph}>
                Recopilamos información para proporcionarle la mejor experiencia mágica posible:
              </p>
              <ul className={styles.list}>
                <li className={styles.listItem}><span className={styles.highlight}>Información personal:</span> Nombre, dirección, fecha de nacimiento, registro de varita</li>
                <li className={styles.listItem}><span className={styles.highlight}>Información de cuenta:</span> Email, preferencias de juego, historial de apuestas</li>
                <li className={styles.listItem}><span className={styles.highlight}>Información financiera:</span> Datos bancarios de Gringotts, historial de transacciones</li>
                <li className={styles.listItem}><span className={styles.highlight}>Información técnica:</span> Dirección IP mágica, tipo de varita, hechizos utilizados</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                2. Cómo Utilizamos su Información
              </h2>
              <p className={styles.paragraph}>
                Utilizamos su información para:
              </p>
              <ul className={styles.list}>
                <li className={styles.listItem}>Procesar sus apuestas y transacciones</li>
                <li className={styles.listItem}>Verificar su identidad y prevenir fraudes mágicos</li>
                <li className={styles.listItem}>Personalizar su experiencia de usuario</li>
                <li className={styles.listItem}>Enviar notificaciones importantes sobre partidos y promociones</li>
                <li className={styles.listItem}>Cumplir con regulaciones del Ministerio de Magia</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                3. Protección de Datos Mágicos
              </h2>
              <p className={styles.paragraph}>
                Implementamos las siguientes medidas de seguridad:
              </p>
              <ul className={styles.list}>
                <li className={styles.listItem}><span className={styles.highlight}>Encriptación Proteus:</span> Todos los datos están protegidos con hechizos de nivel bancario</li>
                <li className={styles.listItem}><span className={styles.highlight}>Fidelius Charm:</span> Su información personal está bajo el hechizo Fidelius</li>
                <li className={styles.listItem}><span className={styles.highlight}>Autenticación Mágica:</span> Verificación biométrica mediante huella de varita</li>
                <li className={styles.listItem}><span className={styles.highlight}>Monitoreo 24/7:</span> Aurors especializados supervisan nuestra seguridad</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                4. Compartir Información
              </h2>
              <p className={styles.paragraph}>
                Compartimos información limitada únicamente con:
              </p>
              <ul className={styles.list}>
                <li className={styles.listItem}><span className={styles.highlight}>Gringotts Bank:</span> Para procesamiento de pagos seguros</li>
                <li className={styles.listItem}><span className={styles.highlight}>Ministerio de Magia:</span> Cuando sea requerido por ley mágica</li>
                <li className={styles.listItem}><span className={styles.highlight}>Proveedores de servicios:</span> Terceros verificados que nos ayudan a operar</li>
              </ul>
              <p className={styles.paragraph}>
                <span className={styles.highlight}>Nunca</span> vendemos, alquilamos o compartimos su información con fines comerciales.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                5. Sus Derechos Mágicos
              </h2>
              <p className={styles.paragraph}>
                Usted tiene derecho a:
              </p>
              <ul className={styles.list}>
                <li className={styles.listItem}>Acceder a toda su información personal</li>
                <li className={styles.listItem}>Corregir datos inexactos</li>
                <li className={styles.listItem}>Solicitar la eliminación de su cuenta (Obliviate completo)</li>
                <li className={styles.listItem}>Portabilidad de datos a otras casas de apuestas mágicas</li>
                <li className={styles.listItem}>Retirar consentimiento en cualquier momento</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                6. Cookies y Rastreo Mágico
              </h2>
              <p className={styles.paragraph}>
                Utilizamos <span className={styles.highlight}>"cookies mágicas"</span> (pequeños hechizos de memoria) para:
              </p>
              <ul className={styles.list}>
                <li className={styles.listItem}>Recordar sus preferencias de apuesta</li>
                <li className={styles.listItem}>Mantenerlo conectado de forma segura</li>
                <li className={styles.listItem}>Analizar el rendimiento de nuestra plataforma</li>
                <li className={styles.listItem}>Personalizar contenido relevante</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                7. Retención de Datos
              </h2>
              <p className={styles.paragraph}>
                Conservamos su información durante el tiempo necesario para cumplir con nuestras 
                obligaciones legales y regulatorias. Los datos de transacciones se mantienen 
                durante <span className={styles.highlight}>7 años</span> según las regulaciones del Ministerio.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                8. Contacto para Privacidad
              </h2>
              <div className={styles.contactInfo}>
                <p className={styles.paragraph}>
                  Para consultas sobre privacidad, contáctenos:
                </p>
                <p className={styles.paragraph}>
                  <strong>📧 privacidad@atrapalSnitch.com</strong>
                  <br />
                  <strong>🦉 Oficial de Privacidad - Callejón Diagon #93</strong>
                  <br />
                  <strong>📞 Red Flu: "Atrapa la Snitch Privacidad"</strong>
                </p>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default PrivacyPage
