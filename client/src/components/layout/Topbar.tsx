import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { initials } from '../../lib/format';
import styles from './Topbar.module.css';

interface TopbarProps {
  title: string;
  children?: ReactNode;
}

export function Topbar({ title, children }: TopbarProps) {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  function handleLogout() {
    logout();
    // Drop cached data so nothing from this session is visible to the next user.
    queryClient.clear();
  }

  return (
    <header className={styles.topbar}>
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.actions}>
        {children && <div className={styles.pageControls}>{children}</div>}

        {user && (
          <div className={styles.user}>
            <span className={styles.name}>{user.name}</span>
            <span className={styles.avatar} aria-hidden>
              {initials(user.name)}
            </span>
          </div>
        )}

        <button type="button" className={styles.iconButton} onClick={handleLogout} aria-label="Log out" title="Log out">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
