import { useState } from 'react'
import Button from '@/components/common/Button'
import FormInput from '@/components/common/FormInput'
import styles from './ContactPage.module.css'

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simular envío
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
    }, 2000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }
  return (
    <div className={`${styles.contactPage} ${styles.container}`}>
      {/* Header principal */}
      <div className={styles.header}>
        <h1 className={styles.mainTitle}>
          Contáctanos
        </h1>
        <p className={styles.subtitle}>
          ¿Tienes alguna pregunta, sugerencia o necesitas ayuda? Nuestro equipo de magos especializados 
          está aquí para asistirte las 24 horas del día.
        </p>
      </div>

      {/* Grid principal */}
      <div className={styles.mainGrid}>
        
        {/* Contact Information */}
        <div className={`${styles.card} ${styles.contactInfo}`}>
          <h2 className={styles.contactTitle}>
            Información de Contacto
          </h2>
          
          <p className={styles.contactDescription}>
            Conecta con nosotros a través de cualquiera de nuestros canales mágicos disponibles.
          </p>

          <div className={styles.contactList}>
            <div className={styles.contactItem}>
              <div className={styles.iconWrapper}>
                <span>📍</span>
              </div>
              <div className={styles.contactItemContent}>
                <h3>Oficina Principal</h3>
                <p>
                  Callejón Diagon #93<br />
                  Londres, Reino Unido<br />
                  Mundo Mágico
                </p>
              </div>
            </div>

            <div className={styles.contactItem}>
              <div className={styles.iconWrapper}>
                <span>📧</span>
              </div>
              <div className={styles.contactItemContent}>
                <h3>Email</h3>
                <p>soporte@atrapalSnitch.com</p>
              </div>
            </div>

            <div className={styles.contactItem}>
              <div className={styles.iconWrapper}>
                <span>🦉</span>
              </div>
              <div className={styles.contactItemContent}>
                <h3>Lechuza Postal</h3>
                <p>
                  Servicio 24/7<br />
                  Respuesta garantizada en 2 horas
                </p>
              </div>
            </div>

            <div className={styles.contactItem}>
              <div className={styles.iconWrapper}>
                <span>📞</span>
              </div>
              <div className={styles.contactItemContent}>
                <h3>Red Flu</h3>
                <p>
                  "Atrapa la Snitch Soporte"<br />
                  Disponible las 24 horas
                </p>
              </div>
            </div>
          </div>

          <div className={styles.prioritySupport}>
            <h3 className={styles.priorityTitle}>🚀 Soporte Prioritario</h3>
            <p>
              ¿Eres usuario VIP? Accede a nuestro soporte prioritario mediante la Chimenea Dorada 
              para atención inmediata con nuestros mejores magos especialistas.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className={`${styles.card} ${styles.contactForm}`}>
          <h2 className={styles.formTitle}>
            Envíanos un Mensaje
          </h2>

          {submitted ? (
            <div className={styles.successState}>
              <div className={styles.successIcon}>
                <span>✨</span>
              </div>
              <h3 className={styles.successTitle}>¡Mensaje Enviado!</h3>
              <p className={styles.successMessage}>
                Tu mensaje ha sido enviado exitosamente. Nuestro equipo te responderá pronto.
              </p>
              <Button 
                onClick={() => setSubmitted(false)} 
                variant="outline" 
              >
                Enviar Otro Mensaje
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <FormInput
                label="Nombre Completo"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Tu nombre mágico"
              />

              <FormInput
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="tu@email.com"
              />

              <FormInput
                label="Asunto"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="¿En qué te podemos ayudar?"
              />

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Mensaje <span className={styles.required}>*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className={styles.textarea}
                  placeholder="Describe tu consulta o problema con detalle..."
                />
              </div>

              <Button
                type="submit"
                variant="magical"
                fullWidth
                isLoading={isSubmitting}
                disabled={!formData.name || !formData.email || !formData.subject || !formData.message}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Mensaje ✨'}
              </Button>

              <p className={styles.submitInfo}>
                Tiempo de respuesta promedio: 2-4 horas
              </p>
            </form>
          )}
        </div>
      </div>

      {/* FAQ Section */}
      <div className={`${styles.card} ${styles.faqSection}`}>
        <h2 className={styles.faqTitle}>
          Preguntas Frecuentes
        </h2>
        
        <div className={styles.faqGrid}>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>¿Cómo puedo depositar Galeones?</h3>
            <p className={styles.faqAnswer}>
              Puedes depositar mediante transferencia desde tu bóveda de Gringotts o usando 
              el sistema de pago instantáneo con varita verificada.
            </p>
          </div>
          
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>¿Cuánto tiempo tardan los retiros?</h3>
            <p className={styles.faqAnswer}>
              Los retiros se procesan en 1-3 días hábiles mágicos. Los usuarios VIP tienen 
              acceso a retiros instantáneos.
            </p>
          </div>
          
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>¿Es segura la plataforma?</h3>
            <p className={styles.faqAnswer}>
              Sí, utilizamos encriptación de nivel bancario Gringotts y estamos licenciados 
              por el Ministerio de Magia.
            </p>
          </div>
          
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>¿Ofrecen apuestas en vivo?</h3>
            <p className={styles.faqAnswer}>
              ¡Por supuesto! Ofrecemos apuestas en tiempo real con las mejores cuotas 
              del mercado mágico.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
