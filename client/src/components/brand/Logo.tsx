import { CheckCheck } from 'lucide-react';
import styles from './Logo.module.css';

interface LogoProps {
  tone?: 'light' | 'dark';
}

export function Logo({ tone = 'dark' }: LogoProps) {
  return (
    <div className={`${styles.logo} ${styles[tone]}`}>
      <span className={styles.mark} aria-hidden>
        <CheckCheck size={18} strokeWidth={2.5} />
      </span>
      <span className={styles.word}>TaskPortal</span>
    </div>
  );
}
