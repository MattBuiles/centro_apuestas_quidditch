import RegisterForm from '@/components/auth/RegisterForm'

const RegisterPage = () => {
  return (
    // auth-section class can be applied here or within RegisterForm if preferred
    <section className="auth-section card max-w-md mx-auto mt-8"> 
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-primary">Únete a nuestra comunidad mágica</h2>
        <p className="text-gray-600 mt-2">
          Regístrate para comenzar a apostar en los mejores partidos de Quidditch
        </p>
      </div>
      
      <RegisterForm />
    </section>
  )
}

export default RegisterPage