import { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
}

const Card = ({ children, className }: CardProps) => {
  return (
    <div className={clsx('bg-white rounded-xl shadow-md p-6', className)}>
      {children}
    </div>
  )
}

export default Card