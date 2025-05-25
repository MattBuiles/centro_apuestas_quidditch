import Card from '@/components/common/Card/index.tsx'
import RegisterForm from '@/components/auth/RegisterForm'

const RegisterPage = () => {
  return (
    <div className="max-w-md mx-auto">
      <Card className="mt-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-primary">Únete a nuestra comunidad mágica</h2>
          <p className="text-gray-600 mt-2">
            Regístrate para comenzar a apostar en los mejores partidos de Quidditch
          </p>
        </div>
        
        <RegisterForm />
      </Card>
    </div>
  )
}

export default RegisterPage