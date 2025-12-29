'use client';

import { useQuery } from '@tanstack/react-query';
import { searchJobs } from '@/lib/jobs';

// Query key for categories
export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
};

// Hook for fetching job categories
export function useJobCategories(enabled = true) {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: async () => {
      // Only fetch a small sample to extract categories
      const data = await searchJobs({
        pagination: { page: 0, pageSize: 50 },
        sortedBy: [{ field: 'createAt', sort: 'DESC' }],
      });
      const categorySet = new Set<string>();
      data.items.forEach((job) => {
        (job.categories ?? []).forEach((name) => {
          if (name) categorySet.add(name);
        });
      });
      return Array.from(categorySet).sort();
    },
    enabled,
    staleTime: 1000 * 60 * 30, // 30 minutes - categories don't change often
  });
}

