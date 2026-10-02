import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import styles from './RowMenu.module.css';

interface RowMenuProps {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
  /** Status moves — the keyboard and touch alternative to dragging a board card. */
  moveTo?: Array<{ label: string; onSelect: () => void }>;
}

export function RowMenu({ label, onEdit, onDelete, moveTo = [] }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Fixed positioning keeps the menu out of any scrolling/clipping ancestor (e.g. the board's
  // horizontal scroller); it opens upwards when there isn't room below the trigger.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const estimatedHeight = 96 + moveTo.length * 40;
    const openUp = rect.bottom + estimatedHeight + 8 > window.innerHeight && rect.top > estimatedHeight;
    setPosition({
      position: 'fixed',
      right: Math.max(8, window.innerWidth - rect.right),
      ...(openUp ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
    });
  }, [open, moveTo.length]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    // A fixed menu would detach from its row on scroll, so close it instead.
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const select = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${label}`}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal size={20} />
      </button>

      {open && (
        <div className={styles.menu} role="menu" style={position}>
          <button type="button" role="menuitem" className={styles.item} onClick={select(onEdit)}>
            <Pencil size={15} aria-hidden /> Edit
          </button>
          {moveTo.length > 0 && (
            <div role="group" aria-label="Move to" className={styles.group}>
              <span className={styles.groupLabel} aria-hidden>
                Move to
              </span>
              {moveTo.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  role="menuitem"
                  className={styles.item}
                  onClick={select(option.onSelect)}
                >
                  <ArrowRight size={15} aria-hidden /> {option.label}
                </button>
              ))}
            </div>
          )}
          <button type="button" role="menuitem" className={`${styles.item} ${styles.danger}`} onClick={select(onDelete)}>
            <Trash2 size={15} aria-hidden /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
