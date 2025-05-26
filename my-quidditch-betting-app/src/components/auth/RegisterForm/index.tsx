import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/common/Button'

const RegisterForm = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [terms, setTerms] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  
  const { register, isLoading, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Basic validation: check for empty fields
    if (!username || !email || !password || !confirmPassword || !birthdate || !terms) {
      setFormError('Por favor, completa todos los campos y acepta los términos.')
      return
    }

    // Basic email format validation (can be more robust)
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError('Por favor, introduce un correo electrónico válido.')
      return
    }
    
    // Validate password
    if (password !== confirmPassword) {
      setFormError('Las contraseñas no coinciden')
      return
    }
    
    // Validate birthdate (must be 18 years or older)
    const birthdateDate = new Date(birthdate)
    const today = new Date()
    const age = today.getFullYear() - birthdateDate.getFullYear()
    const isBirthdayPassed = 
      today.getMonth() > birthdateDate.getMonth() || 
      (today.getMonth() === birthdateDate.getMonth() && today.getDate() >= birthdateDate.getDate())
    
    if (age < 18 || (age === 18 && !isBirthdayPassed)) {
      setFormError('Debes ser mayor de 18 años para registrarte')
      return
    }
    
    // Validate terms
    if (!terms) {
      setFormError('Debes aceptar los términos y condiciones')
      return
    }
    
    await register(username, email, password, birthdate)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(error || formError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error || formError}
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="username" className="form-label">Nombre de usuario:</label>
        <input
          id="username"
          type="text"
          className="form-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      
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
          minLength={8}
        />
        <p className="mt-1 text-xs text-gray-500">
          La contraseña debe tener al menos 8 caracteres, incluyendo letras y números
        </p>
      </div>
      
      <div className="form-group">
        <label htmlFor="confirm-password" className="form-label">Confirmar contraseña:</label>
        <input
          id="confirm-password"
          type="password"
          className="form-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="birthdate" className="form-label">Fecha de nacimiento:</label>
        <input
          id="birthdate"
          type="date"
          className="form-input"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Debes ser mayor de 18 años para registrarte
        </p>
      </div>
      
      <div className="form-group flex items-start">
        <input
          id="terms"
          type="checkbox"
          className="h-4 w-4 mt-1 text-primary focus:ring-primary-light border-gray-300 rounded"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          required
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
          He leído y acepto los{' '}
          <Link to="/terms" className="text-primary hover:underline">
            Términos y Condiciones
          </Link>{' '}
          y la{' '}
          <Link to="/privacy" className="text-primary hover:underline">
            Política de Privacidad
          </Link>
        </label>
      </div>
      
      <Button type="submit" fullWidth isLoading={isLoading}>
        Crear Cuenta
      </Button>
      
      <div className="text-center mt-6">
        <div className="text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="text-primary hover:text-primary-dark font-medium">
            Inicia sesión
          </Link>
        </div>
      </div>
    </form>
  )
}

export default RegisterForm