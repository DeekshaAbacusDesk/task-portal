import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics.api';
import type { ApiError } from '../api/apiError';
import type { AnalyticsSummary } from '../types/analytics';

export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: (days: number) => [...analyticsKeys.all, 'summary', days] as const,
};

export function useAnalyticsSummary(days: number) {
  return useQuery<AnalyticsSummary, ApiError>({
    queryKey: analyticsKeys.summary(days),
    queryFn: () => analyticsApi.summary({ days }),
    placeholderData: keepPreviousData,
  });
}
