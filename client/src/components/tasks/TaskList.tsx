import { formatDate } from '../../lib/format';
import { STATUS_LABELS, TASK_STATUSES, type Task, type TaskStatus } from '../../types/task';
import { RowMenu } from './RowMenu';
import { CompletedOn, DueChip, StatusPill } from './TaskMeta';
import styles from './TaskList.module.css';

interface TaskListProps {
  tasks: Task[];
  /** True while a newer page/filter is loading behind the currently shown data. */
  stale?: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMove: (task: Task, status: TaskStatus) => void;
}

/** Menu entries for every status other than the task's current one. */
export function moveOptions(task: Task, onMove: (task: Task, status: TaskStatus) => void) {
  return TASK_STATUSES.filter((s) => s !== task.status).map((status) => ({
    label: STATUS_LABELS[status],
    onSelect: () => onMove(task, status),
  }));
}

export function TaskList({ tasks, stale = false, onEdit, onDelete, onMove }: TaskListProps) {
  return (
    <div className={styles.table} role="table" aria-label="Tasks" aria-busy={stale}>
      <TaskListHeader />
      <div role="rowgroup" className={`${styles.rows} ${stale ? styles.stale : ''}`}>
        {tasks.map((task) => (
          <div key={task.id} role="row" className={styles.row}>
            <div role="cell" className={styles.titleCell}>
              <span className={`${styles.avatar} ${styles[task.status]}`} aria-hidden>
                {task.title.charAt(0).toUpperCase()}
              </span>
              <div className={styles.text}>
                <span className={styles.title}>{task.title}</span>
                {task.description && <span className={styles.description}>{task.description}</span>}
              </div>
            </div>
            <div role="cell" className={styles.status}>
              <StatusPill status={task.status} />
              {/* Phones hide the date columns; one chip carries the date that matters most. */}
              <span className={styles.mobileChip}>
                {task.completedAt ? (
                  <CompletedOn completedAt={task.completedAt} chip prefix="" />
                ) : (
                  <DueChip task={task} compact />
                )}
              </span>
            </div>
            <div role="cell" className={`${styles.assigned} ${styles.hideOnTablet}`}>
              <time dateTime={task.createdAt}>{formatDate(task.createdAt)}</time>
            </div>
            <div role="cell" className={styles.due}>
              <DueChip task={task} showEmpty />
            </div>
            <div role="cell" className={styles.completedCell}>
              <CompletedOn completedAt={task.completedAt} />
            </div>
            <div role="cell" className={styles.actions}>
              <RowMenu
                label={task.title}
                onEdit={() => onEdit(task)}
                onDelete={() => onDelete(task)}
                moveTo={moveOptions(task, onMove)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TaskListHeader() {
  return (
    <div role="row" className={styles.header}>
      <span role="columnheader">Task</span>
      <span role="columnheader">Status</span>
      <span role="columnheader" className={styles.hideOnTablet}>
        Assigned on
      </span>
      <span role="columnheader">Due date</span>
      <span role="columnheader">Completed on</span>
      <span role="columnheader">
        <span className={styles.srOnly}>Actions</span>
      </span>
    </div>
  );
}

export function TaskListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className={styles.table} aria-busy="true" aria-label="Loading tasks">
      <TaskListHeader />
      <div className={styles.rows}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className={`${styles.row} ${styles.skeletonRow}`}>
            <div className={styles.titleCell}>
              <span className={`${styles.avatar} ${styles.shimmer}`} />
              <span className={`${styles.bar} ${styles.shimmer}`} style={{ width: `${55 + ((i * 13) % 30)}%` }} />
            </div>
            <span className={`${styles.bar} ${styles.shimmer} ${styles.status}`} style={{ width: 90 }} />
            <span className={`${styles.bar} ${styles.shimmer} ${styles.hideOnTablet}`} style={{ width: 80 }} />
            <span className={`${styles.bar} ${styles.shimmer} ${styles.due}`} style={{ width: 90 }} />
            <span className={`${styles.bar} ${styles.shimmer} ${styles.completedCell}`} style={{ width: 80 }} />
            <span />
          </div>
        ))}
      </div>
    </div>
  );
}
