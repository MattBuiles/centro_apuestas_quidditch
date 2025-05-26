import React, { useState } from 'react';
import styles from './RecoveryForm.module.css';
// Assuming authService.ts exists and has a requestPasswordRecovery function
// import { requestPasswordRecovery } from '../../../services/authService'; // Adjust path as needed

// Dummy API call for demonstration
const requestPasswordRecovery = async (email: string): Promise<void> => {
  console.log('Simulating API call for password recovery with:', email);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === 'test@example.com') { // Simulate success for a specific email
        resolve();
      } else { // Simulate failure for others
        reject(new Error('Email not found or invalid.'));
      }
    }, 1000); // Simulate network delay
  });
};

const RecoveryForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await requestPasswordRecovery(email);
      setSuccessMessage('If your email is in our system, a recovery link has been sent.');
      setEmail(''); // Clear email field on success
    } catch (err: any) {
      setError(err.message || 'Failed to send recovery email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={styles.recoveryFormContainer} onSubmit={handleSubmit}>
      <h2>Password Recovery</h2>
      {error && <p className={styles.errorMessage}>{error}</p>}
      {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
      <div className={styles.formGroup}>
        <label htmlFor="email">Email Address:</label>
        <input
          type="email"
          id="email"
          className={styles.formInput}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <button type="submit" className={styles.submitButton} disabled={isLoading}>
        Send Recovery Email
      </button>
    </form>
  );
};

export default RecoveryForm;