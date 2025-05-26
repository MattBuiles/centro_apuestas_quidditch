import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NavBar.module.css'; // Assuming you'll create this CSS module

const NavBar: React.FC = () => {
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
        <li className={styles.navItem}>
          <Link to="/betting">Betting</Link>
        </li>
        <li className={styles.navItem}>
          <Link to="/account">My Account</Link>
        </li>
        <li className={styles.navItem}>
          <Link to="/login">Login</Link>
        </li>
        <li className={styles.navItem}>
          <Link to="/register">Register</Link>
        </li>
        <li className={styles.navItem}>
          <Link to="/recovery">Recovery</Link>
        </li>
      </ul>
    </nav>
  );
};

export default NavBar;