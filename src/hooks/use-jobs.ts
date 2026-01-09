'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { searchJobs, getJob, type Job, type JobSearchRequest, type PageList } from '@/lib/jobs';

// Query keys
export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: JobSearchRequest) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: number) => [...jobKeys.details(), id] as const,
  featured: (limit: number) => [...jobKeys.all, 'featured', limit] as const,
};

// Hook for searching jobs with caching (public search)
export function useJobs(request: JobSearchRequest, enabled = true) {
  return useQuery({
    queryKey: jobKeys.list(request),
    queryFn: () => searchJobs(request),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes for search results
  });
}

// Hook for recruiter jobs search (with auth token)
export function useRecruiterJobs(request: JobSearchRequest, accessToken: string | null, enabled = true) {
  return useQuery({
    queryKey: [...jobKeys.list(request), 'recruiter'],
    queryFn: async () => {
      if (!accessToken) throw new Error('Access token required');
      const { searchJobs: recruiterSearchJobs } = await import('@/lib/recruiter-search');
      const response = await recruiterSearchJobs<{ items: Job[]; count: number }>(request, accessToken);
      return { items: response.data?.items ?? [], count: response.data?.count ?? 0 };
    },
    enabled: enabled && accessToken !== null,
    staleTime: 1000 * 60 * 2,
  });
}

// Hook for getting a single job
export function useJob(jobId: number | null, enabled = true) {
  return useQuery({
    queryKey: jobKeys.detail(jobId!),
    queryFn: () => getJob(jobId!),
    enabled: enabled && jobId !== null,
    staleTime: 1000 * 60 * 5, // 5 minutes for job details
  });
}

// Hook for featured jobs
export function useFeaturedJobs(limit: number = 4, enabled = true) {
  return useQuery({
    queryKey: jobKeys.featured(limit),
    queryFn: async () => {
      const data = await searchJobs({
        pagination: { page: 0, pageSize: limit },
        filter: { statuses: ["OPEN"] },
        sortedBy: [{ field: "applicationsCount", sort: "DESC" }],
      });
      return data.items;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for prefetching job
export function usePrefetchJob() {
  const queryClient = useQueryClient();
  
  return (jobId: number) => {
    queryClient.prefetchQuery({
      queryKey: jobKeys.detail(jobId),
      queryFn: () => getJob(jobId),
      staleTime: 1000 * 60 * 5,
    });
  };
}

