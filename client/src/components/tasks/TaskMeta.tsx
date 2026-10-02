import { CalendarDays, CircleCheck } from 'lucide-react';
import { dueState, formatCalendarDate, formatDate, formatShortDate } from '../../lib/format';
import { STATUS_LABELS, type Task, type TaskStatus } from '../../types/task';
import styles from './TaskMeta.module.css';

/** Soft-filled status pill (the reference UI's pastel pills), dot + label so it never relies on colour alone. */
export function StatusPill({ status }: { status: TaskStatus }) {
  return (
    <span className={`${styles.pill} ${styles[status]}`}>
      <span className={styles.dot} aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}

interface DueChipProps {
  task: Pick<Task, 'dueDate' | 'status'>;
  /** "05 Oct" instead of "05 Oct 2026" — for cards and phones. */
  compact?: boolean;
  /** Show "No due date" instead of rendering nothing. */
  showEmpty?: boolean;
}

export function DueChip({ task, compact = false, showEmpty = false }: DueChipProps) {
  if (!task.dueDate) return showEmpty ? <span className={styles.none}>No due date</span> : null;

  const state = dueState(task.dueDate, task.status === 'completed');
  const date = compact ? formatShortDate(task.dueDate) : formatCalendarDate(task.dueDate);
  const label =
    state === 'overdue' ? `Overdue · ${formatShortDate(task.dueDate)}` : state === 'today' ? 'Due today' : compact ? `Due ${date}` : date;

  return (
    <span className={`${styles.chip} ${state === 'overdue' ? styles.overdue : state === 'today' ? styles.today : ''}`}>
      <CalendarDays size={14} aria-hidden />
      <time dateTime={task.dueDate}>{label}</time>
    </span>
  );
}

interface CompletedOnProps {
  completedAt: string | null;
  /** Compact chip for cards and phones instead of a table cell. */
  chip?: boolean;
  /** Chip text before the date. Pass '' where a "Completed" status pill already sits beside it. */
  prefix?: string;
}

/** Table cell ("✓ 02 Oct 2026", or a dash) or, with `chip`, a card chip ("✓ Completed 02 Oct"). */
export function CompletedOn({ completedAt, chip = false, prefix = 'Completed ' }: CompletedOnProps) {
  if (!completedAt) return chip ? null : <span className={styles.none}>—</span>;
  return (
    <span className={chip ? `${styles.chip} ${styles.done}` : styles.completedOn} title="Completed on">
      <CircleCheck size={chip ? 14 : 15} aria-hidden />
      <time dateTime={completedAt}>{chip ? `${prefix}${formatShortDate(completedAt)}` : formatDate(completedAt)}</time>
    </span>
  );
}
