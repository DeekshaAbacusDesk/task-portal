import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

/** Local input state for snappy typing; the debounced value is what reaches the URL and the API. */
export function SearchBar({ value, onChange }: SearchBarProps) {
  const [draft, setDraft] = useState(value);
  const debounced = useDebouncedValue(draft, 300);

  useEffect(() => {
    if (debounced.trim() !== value) onChange(debounced);
    // Intentionally keyed on the debounced draft only.
  }, [debounced]);

  // Sync external changes (back button, "clear filters") without clobbering in-progress typing.
  useEffect(() => {
    if (value !== debounced.trim()) setDraft(value);
    // Intentionally keyed on the external value only.
  }, [value]);

  return (
    <div className={styles.search}>
      <Search size={18} className={styles.icon} aria-hidden />
      <input
        type="search"
        className={styles.input}
        placeholder="Search tasks by title"
        aria-label="Search tasks by title"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={100}
      />
      {draft && (
        <button type="button" className={styles.clear} onClick={() => setDraft('')} aria-label="Clear search">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
