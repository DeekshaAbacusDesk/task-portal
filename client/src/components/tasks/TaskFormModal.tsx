import { useState, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { useCreateTask, useUpdateTask } from '../../hooks/useTaskMutations';
import { formatDate } from '../../lib/format';
import { STATUS_LABELS, TASK_STATUSES, type Task, type TaskChanges, type TaskInput, type TaskStatus } from '../../types/task';
import { Button } from '../ui/Button/Button';
import { Modal } from '../ui/Modal/Modal';
import { SelectField } from '../ui/TextField/SelectField';
import { TextAreaField } from '../ui/TextField/TextAreaField';
import { TextField } from '../ui/TextField/TextField';
import styles from './TaskFormModal.module.css';

interface TaskFormModalProps {
  /** Omit to create a new task. */
  task?: Task;
  /** Pre-selected status when creating (e.g. from a board column's + button). */
  initialStatus?: TaskStatus;
  onClose: () => void;
}

type FieldErrors = Partial<Record<keyof TaskInput, string>>;

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 1000;
const STATUS_OPTIONS = TASK_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));

// Mirrors the server's zod rules for instant feedback; the server remains the authority.
function validate({ title, description }: TaskInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!title.trim()) errors.title = 'Title is required';
  else if (title.trim().length > TITLE_MAX) errors.title = `Title must be at most ${TITLE_MAX} characters`;
  if (description.trim().length > DESCRIPTION_MAX) {
    errors.description = `Description must be at most ${DESCRIPTION_MAX} characters`;
  }
  return errors;
}

/** Only send fields that actually changed, so a PATCH never overwrites a concurrent edit to another field. */
function diff(task: Task, values: TaskInput): TaskChanges {
  const changes: TaskChanges = {};
  if (values.title !== task.title) changes.title = values.title;
  if (values.description !== task.description) changes.description = values.description;
  if (values.status !== task.status) changes.status = values.status;
  if (values.dueDate !== task.dueDate) changes.dueDate = values.dueDate;
  return changes;
}

export function TaskFormModal({ task, initialStatus = 'pending', onClose }: TaskFormModalProps) {
  const isEdit = Boolean(task);
  const [values, setValues] = useState<TaskInput>({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? initialStatus,
    dueDate: task?.dueDate ?? null,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const mutation = isEdit ? updateTask : createTask;

  const set = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    // Clear a field's error as soon as the user edits it.
    setFieldErrors(({ [key]: _cleared, ...rest }) => rest);
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalised = { ...values, title: values.title.trim(), description: values.description.trim() };

    const errors = validate(normalised);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (task) {
      const changes = diff(task, normalised);
      if (Object.keys(changes).length === 0) return onClose();
      updateTask.mutate({ id: task.id, changes }, { onSuccess: onClose });
    } else {
      createTask.mutate(normalised, { onSuccess: onClose });
    }
  }

  // Surface server-side validation errors next to the matching field.
  const serverFieldErrors: FieldErrors = {};
  if (mutation.error?.code === 'VALIDATION_ERROR' && Array.isArray(mutation.error.details)) {
    for (const detail of mutation.error.details as Array<{ field: string | null; message: string }>) {
      if (detail.field && detail.field in values) serverFieldErrors[detail.field as keyof TaskInput] = detail.message;
    }
  }
  const errors = { ...serverFieldErrors, ...fieldErrors };
  const showGeneralError = mutation.isError && Object.keys(serverFieldErrors).length === 0;

  return (
    <Modal
      title={isEdit ? 'Edit task' : 'Create task'}
      onClose={onClose}
      dismissible={!mutation.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" loading={mutation.isPending}>
            {isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <form id="task-form" className={styles.form} onSubmit={handleSubmit} noValidate>
        {showGeneralError && (
          <div className={styles.alert} role="alert">
            <AlertCircle size={18} aria-hidden />
            <span>{mutation.error?.message}</span>
          </div>
        )}

        <TextField
          label="Title"
          placeholder="e.g. Prepare sprint demo"
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          error={errors.title}
          maxLength={TITLE_MAX}
          autoFocus
        />

        <TextAreaField
          label="Description"
          placeholder="Add more detail (optional)"
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          error={errors.description}
          maxLength={DESCRIPTION_MAX}
          rows={4}
        />

        <div className={styles.row}>
          <SelectField
            label="Status"
            options={STATUS_OPTIONS}
            value={values.status}
            onChange={(e) => set('status', e.target.value as TaskInput['status'])}
            error={errors.status}
          />
          <TextField
            label="Due date"
            type="date"
            value={values.dueDate ?? ''}
            // An emptied date input clears the due date.
            onChange={(e) => set('dueDate', e.target.value || null)}
            error={errors.dueDate}
          />
        </div>

        {task && (
          <dl className={styles.meta}>
            <div>
              <dt>Assigned on</dt>
              <dd>{formatDate(task.createdAt)}</dd>
            </div>
            <div>
              <dt>Completed on</dt>
              <dd>{task.completedAt ? formatDate(task.completedAt) : 'Not completed yet'}</dd>
            </div>
          </dl>
        )}
      </form>
    </Modal>
  );
}
