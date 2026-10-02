import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';
import styles from './MobileNav.module.css';

/** Bottom tab bar for phones, where the sidebar is hidden. Thumb-reachable, one tap per section. */
export function MobileNav() {
  return (
    <nav className={styles.bar} aria-label="Main mobile">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
          <span className={styles.iconWrap}>
            <Icon size={20} aria-hidden />
          </span>
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
