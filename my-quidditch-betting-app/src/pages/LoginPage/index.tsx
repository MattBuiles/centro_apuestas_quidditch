import Card from '@/components/common/Card'
import LoginForm from '@/components/auth/LoginForm'

const LoginPage = () => {
  return (
    <div className="container max-w-md mx-auto px-4">
      <Card className="mt-4 md:mt-8">
        <div className="text-center mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-primary">
            Bienvenido de vuelta, mago apostador
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-2">
            Inicia sesión para continuar apostando en los partidos de Quidditch
          </p>
        </div>
        
        <LoginForm />
      </Card>
    </div>
  )
}

export default LoginPage