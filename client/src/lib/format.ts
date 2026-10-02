const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

// Built by hand rather than Intl: en-GB renders September as "Sept", which breaks the 3-letter rhythm.
/** "2026-10-02T09:15:00Z" → "02 Oct 2026" (local time) */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

const numberFormatter = new Intl.NumberFormat('en-GB');
const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** 0–1 → "60%" */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/** UTC calendar day "2026-10-02" → "02 Oct" */
export function formatDay(isoDay: string): string {
  const d = new Date(`${isoDay}T00:00:00Z`);
  return `${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]}`;
}

const RELATIVE_STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
  ['week', 4.35],
  ['month', 12],
  ['year', Infinity],
];

/** "just now", "5 minutes ago", "yesterday" */
export function formatRelative(iso: string, now: number = Date.now()): string {
  let value = (new Date(iso).getTime() - now) / 1000;
  if (Math.abs(value) < 45) return 'just now';
  for (const [unit, size] of RELATIVE_STEPS) {
    if (Math.abs(value) < size) return relativeFormatter.format(Math.round(value), unit);
    value /= size;
  }
  return formatDate(iso);
}

/** Today's calendar day in the viewer's time zone, YYYY-MM-DD — the frame a due date is read in. */
export function todayIsoDate(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** "2026-10-05" → "05 Oct 2026". Parsed as a plain date so no time-zone shift can move it a day. */
export function formatCalendarDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${pad(day!)} ${MONTHS[month! - 1]} ${year}`;
}

export type DueTone = 'overdue' | 'today' | 'upcoming';

/** Deadline state for an open task; completed tasks are never overdue. */
export function dueState(dueDate: string | null, isCompleted: boolean, today = todayIsoDate()): DueTone | null {
  if (!dueDate || isCompleted) return null;
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  return 'upcoming';
}

/** Compact form for tight spaces: "05 Oct" (timestamp read in local time, or a YYYY-MM-DD calendar date). */
export function formatShortDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return formatCalendarDate(value).slice(0, 6);
  return formatDate(value).slice(0, 6);
}
