import { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { DeleteTaskDialog } from '../../components/tasks/DeleteTaskDialog';
import { GreetingBanner } from '../../components/tasks/GreetingBanner';
import { EmptyState, ErrorState } from '../../components/tasks/ListStates';
import { Pagination } from '../../components/tasks/Pagination';
import { SearchBar } from '../../components/tasks/SearchBar';
import { StatusTabs } from '../../components/tasks/StatusTabs';
import { TaskBoard } from '../../components/tasks/TaskBoard';
import { TaskFormModal } from '../../components/tasks/TaskFormModal';
import { TaskList, TaskListSkeleton } from '../../components/tasks/TaskList';
import { ViewToggle } from '../../components/tasks/ViewToggle';
import { Button } from '../../components/ui/Button/Button';
import { useAuth } from '../../hooks/useAuth';
import { useTaskFilters } from '../../hooks/useTaskFilters';
import { useUpdateTask } from '../../hooks/useTaskMutations';
import { useTasks } from '../../hooks/useTasks';
import type { Task, TaskStatus } from '../../types/task';
import styles from './TasksPage.module.css';

const PAGE_SIZE = 8;

type Dialog =
  | { kind: 'create'; status?: TaskStatus }
  | { kind: 'edit'; task: Task }
  | { kind: 'delete'; task: Task }
  | null;

export function TasksPage() {
  const { user } = useAuth();
  const filters = useTaskFilters();
  const [dialog, setDialog] = useState<Dialog>(null);
  const updateTask = useUpdateTask();
  const isBoard = filters.view === 'board';

  // The list query also supplies the header total and tab counts, so it runs in both views
  // (cheap: one page). In board view it is unfiltered by status, matching the board's columns.
  const tasksQuery = useTasks({
    page: isBoard ? 1 : filters.page,
    limit: PAGE_SIZE,
    status: filters.status,
    search: filters.search || undefined,
  });
  const page = tasksQuery.data;
  const { setPage } = filters;

  // If the current page no longer exists (e.g. its last task was deleted), step back to the last real page.
  useEffect(() => {
    if (isBoard) return;
    if (page && !tasksQuery.isPlaceholderData && page.meta.page > Math.max(page.meta.totalPages, 1)) {
      setPage(Math.max(page.meta.totalPages, 1));
    }
  }, [isBoard, page, tasksQuery.isPlaceholderData, setPage]);

  const openCreate = (status?: TaskStatus) => setDialog({ kind: 'create', status });
  const closeDialog = () => setDialog(null);
  const openEdit = (task: Task) => setDialog({ kind: 'edit', task });
  const openDelete = (task: Task) => setDialog({ kind: 'delete', task });
  const moveFromList = (task: Task, status: TaskStatus) => updateTask.mutate({ id: task.id, changes: { status } });

  function renderList() {
    if (tasksQuery.isPending) return <TaskListSkeleton rows={PAGE_SIZE} />;

    if (tasksQuery.isError && !page) {
      return (
        <ErrorState
          title="Couldn't load tasks"
          message={tasksQuery.error.message}
          action={
            <Button variant="secondary" size="sm" onClick={() => tasksQuery.refetch()} loading={tasksQuery.isFetching}>
              <RotateCw size={15} aria-hidden /> Try again
            </Button>
          }
        />
      );
    }

    if (!page || page.data.length === 0) {
      return filters.hasFilters ? (
        <EmptyState
          title="No matching tasks"
          message="No tasks match the current filter or search. Try a different status or search term."
          action={
            <Button variant="secondary" size="sm" onClick={filters.clear}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="No tasks yet"
          message="Create your first task to start tracking work. It will appear here for everyone in real time."
          action={
            <Button size="sm" onClick={() => openCreate()}>
              Create task
            </Button>
          }
        />
      );
    }

    return (
      <>
        <TaskList
          tasks={page.data}
          stale={tasksQuery.isPlaceholderData}
          onEdit={openEdit}
          onDelete={openDelete}
          onMove={moveFromList}
        />
        <Pagination meta={page.meta} onPageChange={filters.setPage} />
      </>
    );
  }

  return (
    <AppLayout title="Tasks" topbarContent={<SearchBar value={filters.search} onChange={filters.setSearch} />}>
      <GreetingBanner name={user?.name ?? ''} onCreate={() => openCreate()} />

      <section className={styles.section} aria-labelledby="tasks-heading">
        <div className={styles.sectionHeader}>
          <h2 id="tasks-heading" className={styles.sectionTitle}>
            All Tasks
            {page && <span className={styles.count}>{page.meta.statusCounts.all}</span>}
          </h2>
          <ViewToggle value={filters.view} onChange={filters.setView} />
        </div>

        {/* Status tabs filter the list; on the board each status already has its own column. */}
        {!isBoard && (
          <StatusTabs value={filters.status} onChange={filters.setStatus} counts={page?.meta.statusCounts} />
        )}

        {updateTask.isError && !dialog && (
          <p className={styles.inlineError} role="alert">
            Couldn&apos;t update the task: {updateTask.error.message}
          </p>
        )}

        {/* A background refetch failed but we still have data: keep it on screen and say so. */}
        {!isBoard && tasksQuery.isError && page && (
          <p className={styles.inlineError} role="alert">
            Couldn&apos;t refresh tasks: {tasksQuery.error.message}
          </p>
        )}

        {isBoard ? (
          <TaskBoard search={filters.search} onEdit={openEdit} onDelete={openDelete} onCreate={openCreate} />
        ) : (
          renderList()
        )}
      </section>

      {dialog?.kind === 'create' && <TaskFormModal initialStatus={dialog.status} onClose={closeDialog} />}
      {dialog?.kind === 'edit' && <TaskFormModal task={dialog.task} onClose={closeDialog} />}
      {dialog?.kind === 'delete' && <DeleteTaskDialog task={dialog.task} onClose={closeDialog} />}
    </AppLayout>
  );
}
