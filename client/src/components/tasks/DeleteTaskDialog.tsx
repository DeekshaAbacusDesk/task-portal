import { AlertCircle } from 'lucide-react';
import { useDeleteTask } from '../../hooks/useTaskMutations';
import type { Task } from '../../types/task';
import { Button } from '../ui/Button/Button';
import { Modal } from '../ui/Modal/Modal';
import styles from './TaskFormModal.module.css';

interface DeleteTaskDialogProps {
  task: Task;
  onClose: () => void;
}

export function DeleteTaskDialog({ task, onClose }: DeleteTaskDialogProps) {
  const deleteTask = useDeleteTask();

  return (
    <Modal
      title="Delete task?"
      size="sm"
      onClose={onClose}
      dismissible={!deleteTask.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={deleteTask.isPending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteTask.isPending}
            onClick={() => deleteTask.mutate(task.id, { onSuccess: onClose })}
          >
            Delete
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        {deleteTask.isError && (
          <div className={styles.alert} role="alert">
            <AlertCircle size={18} aria-hidden />
            <span>{deleteTask.error.message}</span>
          </div>
        )}
        <p className={styles.message}>
          <strong>{task.title}</strong> will be permanently removed for everyone. This can&apos;t be undone.
        </p>
      </div>
    </Modal>
  );
}
