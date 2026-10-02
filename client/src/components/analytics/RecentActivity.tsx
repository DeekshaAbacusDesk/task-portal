import { Link } from 'react-router-dom';
import { formatRelative } from '../../lib/format';
import type { Task } from '../../types/task';
import { StatusBadge } from '../tasks/StatusBadge';
import styles from './analytics.module.css';

export function RecentActivity({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <p className={styles.muted}>Nothing yet. Activity appears here as tasks are created and updated.</p>;
  }

  return (
    <ul className={styles.activity}>
      {tasks.map((task) => (
        <li key={task.id} className={styles.activityItem}>
          <div className={styles.activityText}>
            <span className={styles.activityTitle}>{task.title}</span>
            <time className={styles.muted} dateTime={task.updatedAt}>
              {task.updatedAt === task.createdAt ? 'Created' : 'Updated'} {formatRelative(task.updatedAt)}
            </time>
          </div>
          <StatusBadge status={task.status} />
        </li>
      ))}
      <li>
        <Link to="/tasks" className={styles.viewAll}>
          View all tasks
        </Link>
      </li>
    </ul>
  );
}
