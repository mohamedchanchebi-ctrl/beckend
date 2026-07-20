import React, { useContext } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import styles from './Layout.module.css';

export default function Layout() {
  const { user, isAuthenticated, logout } = useContext(AuthContext);

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={`container ${styles.headerContainer}`}>
          <Link to="/" className={styles.brand}>StickerShop</Link>
          <nav className={styles.nav}>
            <Link to="/products">Catalog</Link>
            <Link to="/cart">Cart</Link>
            {isAuthenticated ? (
              <>
                <Link to="/account">Account</Link>
                <button onClick={logout} className="btn">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register" className="btn">Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className={`container ${styles.main}`}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className="container">
          &copy; {new Date().getFullYear()} StickerShop. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
