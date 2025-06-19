import Card from '@/components/common/Card'

const PrivacyPage = () => {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Card className="p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold font-playfair text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Política de Privacidad
        </h1>
        
        <div className="prose prose-lg max-w-none text-sm">
          <p className="text-center text-gray-600 mb-8">
            Última actualización: 19 de junio de 2025
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold font-playfair mb-4 text-purple-700">
              1. Información que Recopilamos
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Recopilamos información para proporcionarle la mejor experiencia mágica posible:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Información personal:</strong> Nombre, dirección, fecha de nacimiento, registro de varita</li>
              <li><strong>Información de cuenta:</strong> Email, preferencias de juego, historial de apuestas</li>
              <li><strong>Información financiera:</strong> Datos bancarios de Gringotts, historial de transacciones</li>
              <li><strong>Información técnica:</strong> Dirección IP mágica, tipo de varita, hechizos utilizados</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold font-playfair mb-4 text-purple-700">
              2. Cómo Utilizamos su Información
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Utilizamos su información para:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Procesar sus apuestas y transacciones</li>
              <li>Verificar su identidad y prevenir fraudes mágicos</li>
              <li>Personalizar su experiencia de usuario</li>
              <li>Enviar notificaciones importantes sobre partidos y promociones</li>
              <li>Cumplir con regulaciones del Ministerio de Magia</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold font-playfair mb-4 text-purple-700">
              3. Protección de Datos Mágicos
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Implementamos las siguientes medidas de seguridad:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Encriptación Proteus:</strong> Todos los datos están protegidos con hechizos de nivel bancario</li>
              <li><strong>Fidelius Charm:</strong> Su información personal está bajo el hechizo Fidelius</li>
              <li><strong>Autenticación Mágica:</strong> Verificación biométrica mediante huella de varita</li>
              <li><strong>Monitoreo 24/7:</strong> Aurors especializados supervisan nuestra seguridad</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold font-playfair mb-4 text-purple-700">
              4. Compartir Información
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Compartimos información limitada únicamente con:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Gringotts Bank:</strong> Para procesamiento de pagos seguros</li>
              <li><strong>Ministerio de Magia:</strong> Cuando sea requerido por ley mágica</li>
              <li><strong>Proveedores de servicios:</strong> Terceros verificados que nos ayudan a operar</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Nunca</strong> vendemos, alquilamos o compartimos su información con fines comerciales.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold font-playfair mb-4 text-purple-700">
              5. Sus Derechos Mágicos
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Usted tiene derecho a:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Acceder a toda su información personal</li>
              <li>Corregir datos inexactos</li>
              <li>Solicitar la eliminación de su cuenta (Obliviate completo)</li>
              <li>Portabilidad de datos a otras casas de apuestas mágicas</li>
              <li>Retirar consentimiento en cualquier momento</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold font-playfair mb-4 text-purple-700">
              6. Cookies y Rastreo Mágico
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Utilizamos "cookies mágicas" (pequeños hechizos de memoria) para:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Recordar sus preferencias de apuesta</li>
              <li>Mantenerlo conectado de forma segura</li>
              <li>Analizar el rendimiento de nuestra plataforma</li>
              <li>Personalizar contenido relevante</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold font-playfair mb-4 text-purple-700">
              7. Retención de Datos
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Conservamos su información durante el tiempo necesario para cumplir con nuestras 
              obligaciones legales y regulatorias. Los datos de transacciones se mantienen 
              durante 7 años según las regulaciones del Ministerio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-playfair mb-4 text-purple-700">
              8. Contacto para Privacidad
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Para consultas sobre privacidad, contáctenos:
              <br />
              📧 privacidad@atrapalSnitch.com
              <br />
              🦉 Oficial de Privacidad - Callejón Diagon #93
              <br />
              📞 Red Flu: "Atrapa la Snitch Privacidad"
            </p>
          </section>
        </div>
      </Card>
    </div>
  )
}

export default PrivacyPage
