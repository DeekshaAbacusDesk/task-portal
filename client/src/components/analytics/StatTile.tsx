import type { TaskStatus } from '../../types/task';
import styles from './analytics.module.css';

interface StatTileProps {
  label: string;
  value: string;
  caption?: string;
  /** Adds the status key (dot) beside the label, so the tile ties to the charts' colours. */
  status?: TaskStatus;
}

export function StatTile({ label, value, caption, status }: StatTileProps) {
  return (
    <div className={styles.tile}>
      <span className={styles.tileLabel}>
        {status && <span className={`${styles.key} ${styles[status]}`} aria-hidden />}
        {label}
      </span>
      <span className={styles.tileValue}>{value}</span>
      {caption && <span className={styles.tileCaption}>{caption}</span>}
    </div>
  );
}
