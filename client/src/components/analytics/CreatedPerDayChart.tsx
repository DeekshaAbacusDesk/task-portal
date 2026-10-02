import { useMemo, useState } from 'react';
import { formatDay, formatNumber } from '../../lib/format';
import type { DailyCount } from '../../types/analytics';
import styles from './analytics.module.css';

interface CreatedPerDayChartProps {
  data: DailyCount[];
}

/** Clean axis: the smallest 1/2/5×10ⁿ step giving ≤4 intervals that covers the max. */
function niceScale(max: number): { top: number; ticks: number[] } {
  const target = Math.max(max, 4);
  const raw = target / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw;
  const top = Math.ceil(target / step) * step;
  return { top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step) };
}

/**
 * Single-series column chart (magnitude over time → one hue, no legend; the title names the series).
 * Each column's full-height slot is its hover/focus target; only the peak gets a direct label.
 */
export function CreatedPerDayChart({ data }: CreatedPerDayChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(0, ...data.map((d) => d.count));
  const { top, ticks } = useMemo(() => niceScale(max), [max]);
  // Most recent occurrence of the peak (lastIndexOf keeps us on the ES2022 lib).
  const peakIndex = max > 0 ? data.map((d) => d.count).lastIndexOf(max) : -1;
  const lastIndex = data.length - 1;

  return (
    <div className={styles.columnChart}>
      <div className={styles.plot}>
        <div className={styles.yAxis} aria-hidden>
          {[...ticks].reverse().map((tick) => (
            <span key={tick}>{formatNumber(tick)}</span>
          ))}
        </div>

        <div className={styles.plotArea}>
          {ticks.map((tick) => (
            <span key={tick} className={styles.gridline} style={{ bottom: `${(tick / top) * 100}%` }} aria-hidden />
          ))}

          <div className={styles.columns} onPointerLeave={() => setActive(null)}>
            {data.map((day, i) => {
              const height = (day.count / top) * 100;
              const isActive = active === i;
              return (
                <button
                  key={day.date}
                  type="button"
                  className={`${styles.slot} ${isActive ? styles.slotActive : ''}`}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  aria-label={`${formatDay(day.date)}: ${day.count} ${day.count === 1 ? 'task' : 'tasks'} created`}
                >
                  {day.count > 0 && (
                    <span className={styles.column} style={{ height: `${height}%` }}>
                      {/* The tooltip carries the value while hovered, so the label steps aside. */}
                      {i === peakIndex && !isActive && (
                        <span className={styles.peakLabel}>{formatNumber(day.count)}</span>
                      )}
                    </span>
                  )}
                  {isActive && (
                    <span
                      className={`${styles.tooltip} ${styles.columnTooltip} ${
                        i > lastIndex - 2 ? styles.alignRight : i < 2 ? styles.alignLeft : ''
                      }`}
                      style={{ bottom: `calc(${height}% + 10px)` }}
                      role="status"
                    >
                      <strong>{formatNumber(day.count)}</strong>
                      <span>{day.count === 1 ? 'task' : 'tasks'} · {formatDay(day.date)}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.xAxis} aria-hidden>
        {data.map((day, i) => (
          // Label every other day, anchored so the most recent day is always labelled.
          <span key={day.date} className={(lastIndex - i) % 2 === 0 ? '' : styles.xHidden}>
            {formatDay(day.date)}
          </span>
        ))}
      </div>

      {max === 0 && <p className={styles.chartEmpty}>No tasks created in this period.</p>}

      <details className={styles.dataTable}>
        <summary>View as table</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Day (UTC)</th>
              <th scope="col">Tasks created</th>
            </tr>
          </thead>
          <tbody>
            {data.map((day) => (
              <tr key={day.date}>
                <td>{formatDay(day.date)}</td>
                <td>{formatNumber(day.count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
