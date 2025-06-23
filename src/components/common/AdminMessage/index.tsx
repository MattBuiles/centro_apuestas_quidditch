import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../Button';
import styles from './AdminMessage.module.css';

interface AdminMessageProps {
  title?: string;
  message?: string;
  redirectTo?: string;
  redirectLabel?: string;
  icon?: string;
  className?: string;
}

const AdminMessage: React.FC<AdminMessageProps> = ({
  title = "Acceso Restringido",
  message = "Los administradores no pueden realizar apuestas. Tu rol está destinado a la gestión y supervisión del sistema.",
  redirectTo = "/account",
  redirectLabel = "Ir al Panel de Control",
  icon = "🛡️",
  className = ""
}) => {
  return (
    <div className={`${styles.adminMessage} ${className}`}>
      <div className={styles.messageContainer}>
        <div className={styles.messageIcon}>
          <span className={styles.icon}>{icon}</span>
        </div>
        
        <div className={styles.messageContent}>
          <h2 className={styles.messageTitle}>{title}</h2>
          <p className={styles.messageText}>{message}</p>
        </div>
        
        <div className={styles.messageActions}>
          <Link to={redirectTo}>
            <Button variant="primary" size="lg">
              <span className={styles.buttonIcon}>⚙️</span>
              <span>{redirectLabel}</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminMessage;
