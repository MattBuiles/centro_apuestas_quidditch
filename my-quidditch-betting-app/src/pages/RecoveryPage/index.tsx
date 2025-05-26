import React from 'react';
import RecoveryForm from '../../components/auth/RecoveryForm'; // Adjust path as needed
import styles from './RecoveryPage.module.css'; // Assuming you'll create this CSS module

const RecoveryPage: React.FC = () => {
  return (
    <div className={styles.recoveryPageContainer}>
      <h1 className={styles.recoveryPageTitle}>Password Recovery</h1>
      <p className={styles.recoveryPageDescription}>
        Enter your email address to receive a password reset link.
      </p>
      <RecoveryForm />
    </div>
  );
};

export default RecoveryPage;