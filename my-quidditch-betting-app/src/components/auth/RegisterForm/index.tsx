// filepath: d:\Coding\Projects\centro_apuestas_quidditch\my-quidditch-betting-app\src\components\auth\RegisterForm\index.tsx
import { useState, FormEvent } from 'react' // Added FormEvent
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
  
  const { register, isLoading, error: authError } = useAuth() // Renamed error to authError

  const handleSubmit = async (e: FormEvent) => { // Typed event
    e.preventDefault()
    setFormError(null)

    if (!username || !email || !password || !confirmPassword || !birthdate) {
      setFormError('Por favor, completa todos los campos.')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError('Por favor, introduce un correo electrónico válido.')
      return
    }
    if (password !== confirmPassword) {
      setFormError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
        setFormError('La contraseña debe tener al menos 8 caracteres, incluyendo letras y números.');
        return;
    }
    const birthdateDate = new Date(birthdate)
    const today = new Date()
    let age = today.getFullYear() - birthdateDate.getFullYear()
    const m = today.getMonth() - birthdateDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthdateDate.getDate())) {
        age--;
    }
    if (age < 18) {
      setFormError('Debes ser mayor de 18 años para registrarte')
      return
    }
    if (!terms) {
      setFormError('Debes aceptar los términos y condiciones')
      return
    }
    
    await register(username, email, password, birthdate)
  }

  return (
    // auth-form class from wireframe
    <form onSubmit={handleSubmit} className="auth-form space-y-4"> {/* Reduced space-y for closer match */}
      {(authError || formError) && (
        // message-container class from wireframe
        <div className="message-container bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {authError || formError}
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="username" className="form-label">Nombre de usuario:</label>
        <input
          id="username"
          type="text"
          name="username" // Added name attribute
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
          name="email" // Added name attribute
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
          name="password" // Added name attribute
          className="form-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <small className="text-xs text-gray-500 mt-1 block">La contraseña debe tener al menos 8 caracteres, incluyendo letras y números</small>
      </div>
      
      <div className="form-group">
        <label htmlFor="confirm-password" className="form-label">Confirmar contraseña:</label>
        <input
          id="confirm-password"
          type="password"
          name="confirm-password" // Added name attribute
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
          name="birthdate" // Added name attribute
          className="form-input"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          required
        />
        <small className="text-xs text-gray-500 mt-1 block">Debes ser mayor de 18 años para registrarte</small>
      </div>
      
      {/* terms-and-conditions class from wireframe */}
      <div className="form-group terms-and-conditions flex items-start">
        <input
          id="terms"
          type="checkbox"
          name="terms" // Added name attribute
          className="h-4 w-4 mt-1 mr-2" // Adjusted for alignment
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          required
        />
        <label htmlFor="terms" className="text-sm text-gray-700">
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
      
      {/* cta-button class from wireframe */}
      <Button type="submit" fullWidth isLoading={isLoading} className="cta-button">
        Crear Cuenta
      </Button>
      
      {/* auth-links class from wireframe */}
      <div className="auth-links text-center mt-4">
        <p className="text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </form>
  )
}

export default RegisterForm