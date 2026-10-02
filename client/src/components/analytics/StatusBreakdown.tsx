import { useState } from 'react';
import { formatNumber, formatPercent } from '../../lib/format';
import { STATUS_LABELS, TASK_STATUSES, type TaskStatus } from '../../types/task';
import styles from './analytics.module.css';

interface StatusBreakdownProps {
  byStatus: Record<TaskStatus, number>;
  total: number;
}

/**
 * Part-to-whole as one horizontal 100% stacked bar. Segments are separated by a 2px surface gap
 * (not borders); the legend always carries label + count + share, so identity is never colour-only.
 */
export function StatusBreakdown({ byStatus, total }: StatusBreakdownProps) {
  const [active, setActive] = useState<TaskStatus | null>(null);
  const segments = TASK_STATUSES.filter((status) => byStatus[status] > 0);

  return (
    <div className={styles.breakdown}>
      <div className={styles.stackWrap}>
        {total === 0 ? (
          <div className={styles.stackEmpty}>No tasks to break down yet</div>
        ) : (
          <div className={styles.stack} onPointerLeave={() => setActive(null)}>
            {segments.map((status) => (
              <button
                key={status}
                type="button"
                className={`${styles.segment} ${styles[status]} ${active && active !== status ? styles.dimmed : ''}`}
                style={{ flexGrow: byStatus[status] }}
                onPointerEnter={() => setActive(status)}
                onFocus={() => setActive(status)}
                onBlur={() => setActive(null)}
                aria-label={`${STATUS_LABELS[status]}: ${byStatus[status]} tasks, ${formatPercent(byStatus[status] / total)}`}
              />
            ))}
          </div>
        )}

        {active && total > 0 && (
          <div className={styles.tooltip} role="status">
            <strong>{formatNumber(byStatus[active])}</strong>
            <span>
              {STATUS_LABELS[active]} · {formatPercent(byStatus[active] / total)}
            </span>
          </div>
        )}
      </div>

      <ul className={styles.legend}>
        {TASK_STATUSES.map((status) => (
          <li key={status} className={`${styles.legendItem} ${active === status ? styles.legendActive : ''}`}>
            <span className={`${styles.swatch} ${styles[status]}`} aria-hidden />
            <span className={styles.legendLabel}>{STATUS_LABELS[status]}</span>
            <span className={styles.legendValue}>{formatNumber(byStatus[status])}</span>
            <span className={styles.legendShare}>{total ? formatPercent(byStatus[status] / total) : '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
