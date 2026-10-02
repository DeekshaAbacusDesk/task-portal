import { formatNumber, formatPercent } from '../../lib/format';
import styles from './analytics.module.css';

interface CompletionMeterProps {
  completed: number;
  total: number;
  rate: number;
}

/** Hero figure + meter. The track is a lighter step of the fill's own hue, per the meter spec. */
export function CompletionMeter({ completed, total, rate }: CompletionMeterProps) {
  return (
    <div className={styles.completion}>
      <span className={styles.hero}>{formatPercent(rate)}</span>
      <div
        className={styles.meter}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(rate * 100)}
        aria-label="Completion rate"
      >
        <span className={styles.meterFill} style={{ width: `${rate * 100}%` }} />
      </div>
      <p className={styles.muted}>
        {total === 0
          ? 'No tasks yet — create one to start tracking progress.'
          : `${formatNumber(completed)} of ${formatNumber(total)} tasks completed`}
      </p>
    </div>
  );
}
