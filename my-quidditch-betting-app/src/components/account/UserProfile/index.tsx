import React from 'react';
import styles from './UserProfile.module.css';

interface UserProfileProps {
  name: string;
  email?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ name, email }) => {
  return (
    <div className={styles.userProfileContainer}>
      <h2>User Information</h2>
      <p><strong>Name:</strong> {name}</p>
      {email && <p><strong>Email:</strong> {email}</p>}
    </div>
  );
};

export default UserProfile;