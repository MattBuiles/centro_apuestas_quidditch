import Card from '@/components/common/Card'
import LoginForm from '@/components/auth/LoginForm'

const LoginPage = () => {
  return (
    <div className="max-w-md mx-auto">
      <Card className="mt-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-primary">Bienvenido de vuelta, mago apostador</h2>
          <p className="text-gray-600 mt-2">
            Inicia sesión para continuar apostando en los partidos de Quidditch
          </p>
        </div>
        
        <LoginForm />
      </Card>
    </div>
  )
}

export default LoginPage