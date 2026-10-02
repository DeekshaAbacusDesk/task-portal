import type { AnalyticsSummary } from '../types/analytics';
import { httpClient } from './httpClient';

export const analyticsApi = {
  async summary(params: { days: number }): Promise<AnalyticsSummary> {
    const { data } = await httpClient.get<{ data: AnalyticsSummary }>('/analytics/summary', { params });
    return data.data;
  },
};
