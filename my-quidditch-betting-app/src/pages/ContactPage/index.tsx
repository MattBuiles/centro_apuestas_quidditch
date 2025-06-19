import { useState } from 'react'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import FormInput from '@/components/common/FormInput'

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
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Contact Information */}
        <Card className="p-6 md:p-8">
          <h1 className="text-3xl font-bold font-playfair mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Contáctanos
          </h1>
          
          <p className="text-gray-600 mb-8">
            ¿Tienes alguna pregunta, sugerencia o necesitas ayuda? Nuestro equipo de magos especializados 
            está aquí para asistirte las 24 horas del día.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600">📍</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Oficina Principal</h3>
                <p className="text-gray-600 text-sm">
                  Callejón Diagon #93<br />
                  Londres, Reino Unido<br />
                  Mundo Mágico
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600">📧</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Email</h3>
                <p className="text-gray-600 text-sm">soporte@atrapalSnitch.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600">🦉</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Lechuza Postal</h3>
                <p className="text-gray-600 text-sm">
                  Servicio 24/7<br />
                  Respuesta garantizada en 2 horas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600">📞</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Red Flu</h3>
                <p className="text-gray-600 text-sm">
                  "Atrapa la Snitch Soporte"<br />
                  Disponible las 24 horas
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <h3 className="font-semibold text-purple-700 mb-2">🚀 Soporte Prioritario</h3>
            <p className="text-sm text-gray-600">
              ¿Eres usuario VIP? Accede a nuestro soporte prioritario mediante la Chimenea Dorada 
              para atención inmediata con nuestros mejores magos especialistas.
            </p>
          </div>
        </Card>

        {/* Contact Form */}
        <Card className="p-6 md:p-8">
          <h2 className="text-2xl font-bold font-playfair mb-6 text-gray-800">
            Envíanos un Mensaje
          </h2>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-xl font-semibold text-green-700 mb-2">¡Mensaje Enviado!</h3>
              <p className="text-gray-600">
                Tu mensaje ha sido enviado exitosamente. Nuestro equipo te responderá pronto.
              </p>
              <Button 
                onClick={() => setSubmitted(false)} 
                variant="outline" 
                className="mt-4"
              >
                Enviar Otro Mensaje
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Mensaje <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
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

              <p className="text-xs text-gray-500 text-center">
                Tiempo de respuesta promedio: 2-4 horas
              </p>
            </form>
          )}
        </Card>
      </div>

      {/* FAQ Section */}
      <Card className="mt-8 p-6 md:p-8">
        <h2 className="text-2xl font-bold font-playfair mb-6 text-center text-gray-800">
          Preguntas Frecuentes
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-purple-700 mb-2">¿Cómo puedo depositar Galeones?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Puedes depositar mediante transferencia desde tu bóveda de Gringotts o usando 
              el sistema de pago instantáneo con varita verificada.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-purple-700 mb-2">¿Cuánto tiempo tardan los retiros?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Los retiros se procesan en 1-3 días hábiles mágicos. Los usuarios VIP tienen 
              acceso a retiros instantáneos.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-purple-700 mb-2">¿Es segura la plataforma?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Sí, utilizamos encriptación de nivel bancario Gringotts y estamos licenciados 
              por el Ministerio de Magia.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-purple-700 mb-2">¿Ofrecen apuestas en vivo?</h3>
            <p className="text-sm text-gray-600 mb-4">
              ¡Por supuesto! Ofrecemos apuestas en tiempo real con las mejores cuotas 
              del mercado mágico.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ContactPage
