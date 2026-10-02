import { useState, type DragEvent } from 'react';
import { AlertCircle, Plus, RotateCw } from 'lucide-react';
import { useBoardColumn } from '../../hooks/useBoardColumn';
import { useMoveTask } from '../../hooks/useTaskMutations';
import { formatShortDate } from '../../lib/format';
import { STATUS_LABELS, TASK_STATUSES, type Task, type TaskStatus } from '../../types/task';
import { Button } from '../ui/Button/Button';
import { RowMenu } from './RowMenu';
import { moveOptions } from './TaskList';
import { CompletedOn, DueChip } from './TaskMeta';
import styles from './TaskBoard.module.css';

interface TaskBoardProps {
  search: string;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onCreate: (status: TaskStatus) => void;
}

/**
 * Kanban view: one column per status. Status changes by dragging a card to another column (mouse) or
 * via the card's ⋯ menu "Move to" (keyboard, touch, screen readers). Moves are optimistic.
 */
export function TaskBoard({ search, onEdit, onDelete, onCreate }: TaskBoardProps) {
  const move = useMoveTask();
  const [dragging, setDragging] = useState<Task | null>(null);
  const [announcement, setAnnouncement] = useState('');

  function moveTask(task: Task, status: TaskStatus) {
    if (task.status === status) return;
    setAnnouncement(`Moved "${task.title}" to ${STATUS_LABELS[status]}`);
    move.mutate({ task, status });
  }

  return (
    <div className={styles.wrap}>
      {move.isError && (
        <p className={styles.alert} role="alert">
          <AlertCircle size={16} aria-hidden />
          Couldn&apos;t move the task: {move.error.message}. It has been put back.
        </p>
      )}

      <div className={styles.board}>
        {TASK_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            search={search}
            dragging={dragging}
            onDragStart={setDragging}
            onDragEnd={() => setDragging(null)}
            onDropTask={(task) => moveTask(task, status)}
            onMove={moveTask}
            onEdit={onEdit}
            onDelete={onDelete}
            onCreate={() => onCreate(status)}
          />
        ))}
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

interface BoardColumnProps {
  status: TaskStatus;
  search: string;
  dragging: Task | null;
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
  onDropTask: (task: Task) => void;
  onMove: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onCreate: () => void;
}

function BoardColumn({
  status,
  search,
  dragging,
  onDragStart,
  onDragEnd,
  onDropTask,
  onMove,
  onEdit,
  onDelete,
  onCreate,
}: BoardColumnProps) {
  const column = useBoardColumn(status, search);
  const [isOver, setIsOver] = useState(false);
  const tasks = column.data?.pages.flatMap((page) => page.data) ?? [];
  const total = column.data?.pages[0]?.meta.total;
  const canDrop = Boolean(dragging && dragging.status !== status);

  function handleDragOver(event: DragEvent) {
    if (!canDrop) return;
    event.preventDefault(); // allows the drop
    event.dataTransfer.dropEffect = 'move';
    setIsOver(true);
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    // Ignore leave events fired when moving between the column's own children.
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsOver(false);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setIsOver(false);
    if (dragging && canDrop) onDropTask(dragging);
  }

  return (
    <section
      className={`${styles.column} ${canDrop ? styles.droppable : ''} ${isOver ? styles.over : ''}`}
      aria-labelledby={`column-${status}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className={styles.columnHeader}>
        <div className={styles.columnTitle}>
          <span className={`${styles.dot} ${styles[status]}`} aria-hidden />
          <h3 id={`column-${status}`}>{STATUS_LABELS[status]}</h3>
          {total !== undefined && <span className={styles.count}>{total}</span>}
        </div>
        <button
          type="button"
          className={styles.add}
          onClick={onCreate}
          aria-label={`Add a task to ${STATUS_LABELS[status]}`}
          title={`Add to ${STATUS_LABELS[status]}`}
        >
          <Plus size={16} />
        </button>
      </header>

      <div className={`${styles.cards} ${column.isFetching && !column.isPending ? styles.refreshing : ''}`}>
        {column.isPending &&
          Array.from({ length: 3 }, (_, i) => <span key={i} className={styles.cardSkeleton} aria-hidden />)}

        {column.isError && !column.data && (
          <div className={styles.columnState} role="alert">
            <p>Couldn&apos;t load {STATUS_LABELS[status].toLowerCase()} tasks.</p>
            <Button variant="secondary" size="sm" onClick={() => column.refetch()}>
              <RotateCw size={14} aria-hidden /> Retry
            </Button>
          </div>
        )}

        {column.isSuccess && tasks.length === 0 && (
          <p className={styles.columnState}>{canDrop ? 'Drop here' : search ? 'No matching tasks' : 'No tasks yet'}</p>
        )}

        {tasks.map((task) => (
          <BoardCard
            key={task.id}
            task={task}
            isDragging={dragging?.id === task.id}
            onDragStart={() => onDragStart(task)}
            onDragEnd={onDragEnd}
            onEdit={() => onEdit(task)}
            onDelete={() => onDelete(task)}
            onMove={onMove}
          />
        ))}

        {column.hasNextPage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.fetchNextPage()}
            loading={column.isFetchingNextPage}
            className={styles.more}
          >
            Load more
          </Button>
        )}
      </div>
    </section>
  );
}

interface BoardCardProps {
  task: Task;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (task: Task, status: TaskStatus) => void;
}

function BoardCard({ task, isDragging, onDragStart, onDragEnd, onEdit, onDelete, onMove }: BoardCardProps) {
  function handleDragStart(event: DragEvent) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', task.id); // required for Firefox to start a drag
    onDragStart();
  }

  return (
    <article
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      aria-label={task.title}
    >
      <div className={styles.cardTop}>
        <h4 className={styles.cardTitle}>{task.title}</h4>
        <RowMenu label={task.title} onEdit={onEdit} onDelete={onDelete} moveTo={moveOptions(task, onMove)} />
      </div>

      {task.description && <p className={styles.cardDescription}>{task.description}</p>}

      {(task.dueDate || task.completedAt) && (
        <div className={styles.chips}>
          {task.completedAt ? <CompletedOn completedAt={task.completedAt} chip /> : <DueChip task={task} compact />}
        </div>
      )}

      <footer className={styles.cardFooter}>
        <span>
          Assigned <time dateTime={task.createdAt}>{formatShortDate(task.createdAt)}</time>
        </span>
        <span className={`${styles.initial} ${styles[task.status]}`} aria-hidden>
          {task.title.charAt(0).toUpperCase()}
        </span>
      </footer>
    </article>
  );
}
