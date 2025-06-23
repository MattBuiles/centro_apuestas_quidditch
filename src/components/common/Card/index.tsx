import { ReactNode } from 'react'
import clsx from 'clsx'
import styles from './Card.module.css'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'magical' | 'gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff'
}

const Card = ({ children, className, variant = 'default' }: CardProps) => {
  const cardClass = variant === 'default' 
    ? styles.card 
    : variant === 'magical' 
      ? styles.cardMagical 
      : variant === 'gryffindor' 
        ? styles.cardGryffindor 
        : variant === 'slytherin' 
          ? styles.cardSlytherin 
          : variant === 'ravenclaw' 
            ? styles.cardRavenclaw 
            : styles.cardHufflepuff;

  return (
    <div className={clsx(cardClass, className)}>
      {children}
    </div>
  )
}

export default Card