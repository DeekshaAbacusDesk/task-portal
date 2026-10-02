import { NavLink } from 'react-router-dom';
import { Logo } from '../brand/Logo';
import { NAV_ITEMS } from './navItems';
import styles from './Sidebar.module.css';

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Logo tone="light" />
      </div>

      <nav className={styles.nav} aria-label="Main">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            title={label}
          >
            <Icon size={18} aria-hidden />
            <span className={styles.label}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
