import Card from '@/components/common/Card'

const AboutPage = () => {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Card className="p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold font-playfair text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Sobre Nosotros
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <div className="text-center mb-8">
            <p className="text-xl text-gray-600 font-inter">
              Bienvenido al mundo mágico de las apuestas de Quidditch
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-playfair mb-4 text-purple-700">
              Nuestra Historia
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Fundada en 2020 por un grupo de entusiastas del Quidditch, <strong>Atrapa la Snitch</strong> 
              nació con la visión de crear la plataforma de apuestas más confiable y emocionante del mundo mágico.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Desde nuestros humildes comienzos en el Callejón Diagon, hemos crecido hasta convertirnos en 
              la casa de apuestas preferida por magos y brujas de todo el mundo, ofreciendo las mejores 
              cuotas y la experiencia más inmersiva.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-playfair mb-4 text-purple-700">
              Nuestra Misión
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Democratizar el acceso a las apuestas de Quidditch, proporcionando una plataforma segura, 
              justa y emocionante donde tanto novatos como expertos puedan disfrutar de la magia del 
              deporte más popular del mundo brujo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-playfair mb-4 text-purple-700">
              ¿Por qué elegir Atrapa la Snitch?
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-700 mb-2">🏆 Confianza Absoluta</h3>
                <p className="text-sm text-gray-600">
                  Licenciados por el Ministerio de Magia y regulados por las más altas autoridades mágicas.
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-700 mb-2">⚡ Tecnología Mágica</h3>
                <p className="text-sm text-gray-600">
                  Plataforma desarrollada con los últimos hechizos tecnológicos para una experiencia fluida.
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-700 mb-2">🛡️ Seguridad Total</h3>
                <p className="text-sm text-gray-600">
                  Tus datos y galeones están protegidos por encantamientos de seguridad inquebrantables.
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-700 mb-2">🎯 Mejores Cuotas</h3>
                <p className="text-sm text-gray-600">
                  Ofrecemos las cuotas más competitivas del mercado mágico de apuestas.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-playfair mb-4 text-purple-700">
              Nuestro Compromiso
            </h2>
            <p className="text-gray-700 leading-relaxed">
              En Atrapa la Snitch, promovemos el <strong>juego responsable</strong> y estamos comprometidos 
              con proporcionar herramientas y recursos para que nuestros usuarios disfruten de las apuestas 
              de manera segura y controlada. El Quidditch es diversión, y las apuestas deben serlo también.
            </p>
          </section>
        </div>
      </Card>
    </div>
  )
}

export default AboutPage
