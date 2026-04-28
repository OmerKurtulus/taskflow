'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <Link href={user ? '/dashboard' : '/'} className={styles.brand}>
          <div className={styles.logo}>T</div>
          <span className={styles.brandText}>TaskFlow</span>
        </Link>

        {user && (
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>{getInitials(user.name)}</div>
              <span className={styles.userName}>{user.name}</span>
            </div>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Çıkış</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
