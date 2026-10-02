import { STATUS_LABELS, type TaskStatus } from '../../types/task';
import styles from './StatusBadge.module.css';

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={styles.badge}>
      <span className={`${styles.dot} ${styles[status]}`} aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}
