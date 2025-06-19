import Card from '@/components/common/Card'

const TermsPage = () => {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Card className="p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold font-playfair text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Términos y Condiciones
        </h1>
        
        <div className="prose prose-lg max-w-none text-sm">
          <p className="text-center text-gray-600 mb-8">
            Última actualización: 19 de junio de 2025
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold font-playfair mb-4 text-purple-700">
              1. Aceptación de los Términos
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Al acceder y utilizar la plataforma Atrapa la Snitch, usted acepta estar sujeto a estos 
              Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, 
              no debe utilizar nuestros servicios.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold font-playfair mb-4 text-purple-700">
              2. Elegibilidad
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para utilizar nuestros servicios, debe:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Tener al menos 18 años de edad o la mayoría de edad en su jurisdicción</li>
              <li>Poseer una varita mágica válida y registrada</li>
              <li>Estar legalmente autorizado para participar en apuestas mágicas</li>
              <li>No estar en la lista de magos oscuros prohibidos del Ministerio</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold font-playfair mb-4 text-purple-700">
              3. Cuenta de Usuario
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Al crear una cuenta, usted se compromete a:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Proporcionar información veraz y actualizada</li>
              <li>Mantener la confidencialidad de sus credenciales mágicas</li>
              <li>Notificar inmediatamente cualquier uso no autorizado</li>
              <li>Ser responsable de todas las actividades en su cuenta</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold font-playfair mb-4 text-purple-700">
              4. Apuestas y Pagos
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Todas las transacciones se realizan en Galeones, Sickles y Knuts. Los pagos se procesan 
              a través de Gringotts Bank con encriptación mágica de nivel bancario.
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Los depósitos son instantáneos</li>
              <li>Los retiros pueden tardar 1-3 días hábiles mágicos</li>
              <li>Se requiere verificación de identidad para retiros superiores a 1000 Galeones</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold font-playfair mb-4 text-purple-700">
              5. Juego Responsable
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nos comprometemos a promover el juego responsable. Ofrecemos herramientas como:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Límites de depósito y apuesta</li>
              <li>Autoexclusión temporal o permanente</li>
              <li>Acceso a recursos de ayuda para adicción al juego</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold font-playfair mb-4 text-purple-700">
              6. Prohibiciones
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Está estrictamente prohibido:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Uso de pociones de suerte o hechizos de adivinación</li>
              <li>Manipulación de resultados mediante magia</li>
              <li>Creación de múltiples cuentas</li>
              <li>Apuestas por parte de menores de edad</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold font-playfair mb-4 text-purple-700">
              7. Modificaciones
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Nos reservamos el derecho de modificar estos términos en cualquier momento. 
              Los cambios serán notificados mediante lechuza oficial y publicados en nuestra plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-playfair mb-4 text-purple-700">
              8. Contacto
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Para consultas sobre estos términos, contáctenos en: 
              <br />
              📧 legal@atrapalSnitch.com
              <br />
              🦉 Lechuza oficial al Callejón Diagon #93
            </p>
          </section>
        </div>
      </Card>
    </div>
  )
}

export default TermsPage
