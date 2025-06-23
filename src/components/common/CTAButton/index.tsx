import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Button from '../Button'
import styles from './CTAButton.module.css'

interface CTAButtonProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
}

const CTAButton = ({ 
  className = '', 
  size = 'lg',
  fullWidth = false 
}: CTAButtonProps) => {
  const { isAuthenticated, canBet } = useAuth()
  const navigate = useNavigate()

  // Don't show CTA button for admins since they can't bet
  if (!canBet) {
    return null
  }

  const handleClick = () => {
    if (isAuthenticated) {
      navigate('/betting')
    } else {
      navigate('/register')
    }
  }

  const buttonText = isAuthenticated ? '¡Hacer Apuestas!' : '¡Atrapa tu Suerte!'
  const buttonTitle = isAuthenticated 
    ? 'Ir a la sección de apuestas'
    : 'Registrarse para empezar a apostar'

  // Agregar icono según el estado
  const buttonIcon = isAuthenticated ? '🎯' : '✨'

  return (
    <Button
      variant="magical"
      size={size}
      animated
      onClick={handleClick}
      className={`${styles.ctaButton} ${className}`}
      data-authenticated={isAuthenticated}
      title={buttonTitle}
      fullWidth={fullWidth}
    >
      <span className={styles.buttonContent}>
        <span className={styles.buttonIcon}>{buttonIcon}</span>
        <span className={styles.buttonText}>{buttonText}</span>
      </span>
    </Button>
  )
}

export default CTAButton
