import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import styles from './NavBar.module.css'; // Assuming you'll create this CSS module

const NavBar: React.FC = () => {
  const { isAuthenticated, canBet, user } = useAuth();
  return (
    <nav className={styles.navBarContainer}>
      <div className={styles.navContent}>
        <div className={styles.navBrand}>
          <Link to="/" className={styles.brandLink}>
            Quidditch Betting
          </Link>
        </div>
        
        <ul className={styles.navList}>
          <li className={styles.navItem}>
            <Link to="/" className={styles.navLink}>Home</Link>
          </li>
          <li className={styles.navItem}>
            <Link to="/matches" className={styles.navLink}>Matches</Link>
          </li>
          <li className={styles.navItem}>
            <Link to="/teams" className={styles.navLink}>Teams</Link>
          </li>
          <li className={styles.navItem}>
            <Link to="/results" className={styles.navLink}>Results</Link>
          </li>
          {/* Only show betting link for non-admin users */}
          {canBet && (
            <li className={styles.navItem}>
              <Link to="/betting" className={styles.navLink}>Betting</Link>
            </li>
          )}
        </ul>

        <div className={styles.navActions}>
          {isAuthenticated ? (
            <>
              {user?.avatar && (
                <div className={styles.userAvatar}>
                  <img 
                    src={user.avatar} 
                    alt="User Avatar" 
                    className={styles.avatarImage}
                  />
                </div>
              )}
              <Link to="/account" className={styles.accountLink}>
                My Account
              </Link>
            </>
          ) : (
            <div className={styles.authLinks}>
              <Link to="/login" className={styles.navLink}>Login</Link>
              <Link to="/register" className={styles.navLink}>Register</Link>
              <Link to="/recovery" className={styles.navLink}>Recovery</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;