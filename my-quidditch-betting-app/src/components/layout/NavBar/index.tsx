import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import styles from './NavBar.module.css'; // Assuming you'll create this CSS module

const NavBar: React.FC = () => {
  const { isAuthenticated, canBet } = useAuth();

  return (
    <nav className={styles.navBarContainer}>
      <ul className={styles.navList}>
        <li className={styles.navItem}>
          <Link to="/">Home</Link>
        </li>
        <li className={styles.navItem}>
          <Link to="/matches">Matches</Link>
        </li>
        <li className={styles.navItem}>
          <Link to="/teams">Teams</Link>
        </li>
        <li className={styles.navItem}>
          <Link to="/results">Results</Link>
        </li>
        {/* Only show betting link for non-admin users */}
        {canBet && (
          <li className={styles.navItem}>
            <Link to="/betting">Betting</Link>
          </li>
        )}
        {isAuthenticated ? (
          <li className={styles.navItem}>
            <Link to="/account">My Account</Link>
          </li>
        ) : (
          <>
            <li className={styles.navItem}>
              <Link to="/login">Login</Link>
            </li>
            <li className={styles.navItem}>
              <Link to="/register">Register</Link>
            </li>
            <li className={styles.navItem}>
              <Link to="/recovery">Recovery</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default NavBar;