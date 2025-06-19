import RegisterForm from '@/components/auth/RegisterForm'

const RegisterPage = () => {
  return (
    <div className="container max-w-md mx-auto px-4">
      <section className="auth-section card mt-4 md:mt-8 p-4 md:p-6"> 
        <div className="text-center mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-primary">
            Únete a nuestra comunidad mágica
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-2">
            Regístrate para comenzar a apostar en los mejores partidos de Quidditch
          </p>
        </div>
        
        <RegisterForm />
      </section>
    </div>
  )
}

export default RegisterPage