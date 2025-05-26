import React from 'react';
import styles from './Header.module.css';
import NavBar from '../NavBar'; // Assuming NavBar is in the correct relative path

const Header: React.FC = () => {
  return (
    <header className={styles.headerContainer}>
      <div className={styles.siteTitle}>Quidditch Betting App</div> {/* Example site title */}
      <NavBar /> {/* Include the NavBar component */}
    </header>
  );
};

export default Header;