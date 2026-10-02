import { Columns3, List } from 'lucide-react';
import type { TaskView } from '../../types/task';
import styles from './ViewToggle.module.css';

const VIEWS: Array<{ value: TaskView; label: string; icon: typeof List }> = [
  { value: 'list', label: 'List', icon: List },
  { value: 'board', label: 'Board', icon: Columns3 },
];

export function ViewToggle({ value, onChange }: { value: TaskView; onChange: (view: TaskView) => void }) {
  return (
    <div className={styles.toggle} role="group" aria-label="View">
      {VIEWS.map(({ value: view, label, icon: Icon }) => (
        <button
          key={view}
          type="button"
          className={`${styles.option} ${value === view ? styles.active : ''}`}
          aria-pressed={value === view}
          aria-label={`${label} view`}
          onClick={() => onChange(view)}
        >
          <Icon size={16} aria-hidden />
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </div>
  );
}
