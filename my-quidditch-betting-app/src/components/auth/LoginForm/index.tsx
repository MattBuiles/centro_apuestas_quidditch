import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/common/Button'

const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const { login, isLoading, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(email, password, remember) // Keep the original logic for now
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="email" className="form-label">Correo electrónico:</label>
        <input
          id="email"
          type="email"
          className="form-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="password" className="form-label">Contraseña:</label>
        <input
          id="password"
          type="password"
          className="form-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <div className="form-group flex items-center">
        <input
          id="remember"
          type="checkbox"
          className="h-4 w-4 text-primary focus:ring-primary-light border-gray-300 rounded"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
          Mantener sesión iniciada
        </label>
      </div>
      
      <Button type="submit" fullWidth isLoading={isLoading}>
        Iniciar Sesión
      </Button>
      
      <div className="text-center space-y-4 mt-6">
        <div>
          <Link to="/recovery" className="text-primary hover:text-primary-dark text-sm">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="text-sm text-gray-600">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="text-primary hover:text-primary-dark font-medium">
            Regístrate ahora
          </Link>
        </div>
      </div>
    </form>
  )
}

export default LoginForm