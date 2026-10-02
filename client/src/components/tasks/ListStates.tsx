import type { ReactNode } from 'react';
import { AlertTriangle, ClipboardList } from 'lucide-react';
import styles from './ListStates.module.css';

interface StateProps {
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ title, message, action }: StateProps) {
  return (
    <div className={styles.state}>
      <span className={styles.icon}>
        <ClipboardList size={26} aria-hidden />
      </span>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
      {action}
    </div>
  );
}

export function ErrorState({ title, message, action }: StateProps) {
  return (
    <div className={styles.state} role="alert">
      <span className={`${styles.icon} ${styles.error}`}>
        <AlertTriangle size={26} aria-hidden />
      </span>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
      {action}
    </div>
  );
}
