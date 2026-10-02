import { STATUS_LABELS, TASK_STATUSES, type StatusCounts, type TaskStatus } from '../../types/task';
import styles from './StatusTabs.module.css';

interface StatusTabsProps {
  value?: TaskStatus;
  onChange: (status?: TaskStatus) => void;
  /** Per-tab totals for the current search. Omitted while the first page is loading. */
  counts?: StatusCounts;
}

const OPTIONS: ReadonlyArray<{ value?: TaskStatus; key: keyof StatusCounts; label: string }> = [
  { value: undefined, key: 'all', label: 'All' },
  ...TASK_STATUSES.map((status) => ({ value: status, key: status, label: STATUS_LABELS[status] })),
];

export function StatusTabs({ value, onChange, counts }: StatusTabsProps) {
  return (
    <div className={styles.tabs} role="group" aria-label="Filter by status">
      {OPTIONS.map((option) => {
        const active = option.value === value;
        const count = counts?.[option.key];
        return (
          <button
            key={option.key}
            type="button"
            className={`${styles.tab} ${active ? styles.active : ''}`}
            aria-pressed={active}
            aria-label={count === undefined ? option.label : `${option.label}, ${count} tasks`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {count !== undefined && <span className={styles.count}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
