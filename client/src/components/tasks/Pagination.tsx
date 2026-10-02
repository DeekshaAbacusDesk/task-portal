import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PageMeta } from '../../types/task';
import styles from './Pagination.module.css';

interface PaginationProps {
  meta: PageMeta;
  onPageChange: (page: number) => void;
}

/** Page numbers with ellipses, e.g. 1 … 4 5 6 … 12 */
export function getPageItems(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  return sorted.flatMap((page, i) => (i > 0 && page - sorted[i - 1]! > 1 ? (['gap', page] as const) : [page]));
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, limit, total, totalPages } = meta;
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <p className={styles.summary}>
        Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{total}</strong> tasks
      </p>

      {totalPages > 1 && (
        <div className={styles.pages}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>

          {getPageItems(page, totalPages).map((item, i) =>
            item === 'gap' ? (
              <span key={`gap-${i}`} className={styles.gap} aria-hidden>
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={`${styles.page} ${item === page ? styles.current : ''}`}
                onClick={() => onPageChange(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Page ${item}`}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            className={styles.arrow}
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </nav>
  );
}
