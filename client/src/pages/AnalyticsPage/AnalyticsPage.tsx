import { RotateCw } from 'lucide-react';
import { ChartCard } from '../../components/analytics/ChartCard';
import { CompletionMeter } from '../../components/analytics/CompletionMeter';
import { CreatedPerDayChart } from '../../components/analytics/CreatedPerDayChart';
import { RecentActivity } from '../../components/analytics/RecentActivity';
import { StatTile } from '../../components/analytics/StatTile';
import { StatusBreakdown } from '../../components/analytics/StatusBreakdown';
import { AppLayout } from '../../components/layout/AppLayout';
import { ErrorState } from '../../components/tasks/ListStates';
import { Button } from '../../components/ui/Button/Button';
import { useAnalyticsSummary } from '../../hooks/useAnalytics';
import { formatNumber, formatPercent } from '../../lib/format';
import { STATUS_LABELS, type TaskStatus } from '../../types/task';
import styles from './AnalyticsPage.module.css';

const WINDOW_DAYS = 14;
const STATUS_TILES: TaskStatus[] = ['completed', 'in-progress', 'pending'];

export function AnalyticsPage() {
  const summaryQuery = useAnalyticsSummary(WINDOW_DAYS);
  const summary = summaryQuery.data;

  function renderContent() {
    if (summaryQuery.isPending) return <AnalyticsSkeleton />;

    if (!summary) {
      return (
        <ErrorState
          title="Couldn't load analytics"
          message={summaryQuery.error?.message ?? 'Something went wrong.'}
          action={
            <Button variant="secondary" size="sm" onClick={() => summaryQuery.refetch()} loading={summaryQuery.isFetching}>
              <RotateCw size={15} aria-hidden /> Try again
            </Button>
          }
        />
      );
    }

    const share = (count: number) => (summary.total ? `${formatPercent(count / summary.total)} of all tasks` : 'No tasks yet');

    return (
      <>
        {summaryQuery.isError && (
          <p className={styles.inlineError} role="alert">
            Couldn&apos;t refresh analytics: {summaryQuery.error.message}
          </p>
        )}

        <div className={styles.kpis}>
          <StatTile label="Total tasks" value={formatNumber(summary.total)} caption="All statuses" />
          {STATUS_TILES.map((status) => (
            <StatTile
              key={status}
              status={status}
              label={STATUS_LABELS[status]}
              value={formatNumber(summary.byStatus[status])}
              caption={share(summary.byStatus[status])}
            />
          ))}
        </div>

        <div className={styles.split}>
          <ChartCard title="Completion rate" subtitle="Share of all tasks marked completed">
            <CompletionMeter completed={summary.byStatus.completed} total={summary.total} rate={summary.completionRate} />
          </ChartCard>
          <ChartCard title="Status breakdown" subtitle="Where every task currently stands">
            <StatusBreakdown byStatus={summary.byStatus} total={summary.total} />
          </ChartCard>
        </div>

        <div className={styles.wide}>
          <ChartCard title="Tasks created" subtitle={`Per day, last ${WINDOW_DAYS} days (UTC)`}>
            <CreatedPerDayChart data={summary.createdPerDay} />
          </ChartCard>
          <ChartCard title="Recent activity" subtitle="Latest created or updated tasks">
            <RecentActivity tasks={summary.recentlyUpdated} />
          </ChartCard>
        </div>
      </>
    );
  }

  return (
    <AppLayout title="Analytics">
      <p className={styles.intro}>A live view of your task data. Figures update as soon as anyone changes a task.</p>
      {renderContent()}
    </AppLayout>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className={styles.skeleton} aria-busy="true" aria-label="Loading analytics">
      <div className={styles.kpis}>
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className={`${styles.block} ${styles.tileBlock}`} />
        ))}
      </div>
      <div className={styles.split}>
        <span className={`${styles.block} ${styles.cardBlock}`} />
        <span className={`${styles.block} ${styles.cardBlock}`} />
      </div>
      <span className={`${styles.block} ${styles.chartBlock}`} />
    </div>
  );
}
