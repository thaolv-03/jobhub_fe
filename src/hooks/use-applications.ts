'use client';

import { useQuery } from '@tanstack/react-query';
import { searchApplications } from '@/lib/recruiter-search';
import type { ApplicationDTO } from '@/lib/applications';

// Query keys
export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  list: (jobId: number, filters: any) => [...applicationKeys.lists(), jobId, filters] as const,
  details: () => [...applicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
  counts: () => [...applicationKeys.all, 'counts'] as const,
  count: (jobId: number) => [...applicationKeys.counts(), jobId] as const,
};

// Hook for searching applications
export function useApplications(jobId: number | null, request: any, accessToken: string | null, enabled = true) {
  return useQuery({
    queryKey: applicationKeys.list(jobId ?? 0, request),
    queryFn: () => {
      if (!jobId || !accessToken) throw new Error('Missing jobId or accessToken');
      return searchApplications<{ items: ApplicationDTO[]; count: number }>(jobId, request, accessToken);
    },
    enabled: enabled && jobId !== null && accessToken !== null,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook for getting application count (lightweight)
export function useApplicationCount(jobId: number | null, accessToken: string | null, enabled = true) {
  return useQuery({
    queryKey: applicationKeys.count(jobId!),
    queryFn: async () => {
      const result = await searchApplications<{ items: unknown[]; count: number }>(
        jobId!,
        {
          pagination: { page: 0, pageSize: 1 },
          sortBy: undefined,
          sortOrder: undefined,
          searchedBy: '',
          filter: null,
        },
        accessToken!
      );
      return result.data?.count ?? 0;
    },
    enabled: enabled && jobId !== null && accessToken !== null,
    staleTime: 1000 * 60 * 2,
  });
}

