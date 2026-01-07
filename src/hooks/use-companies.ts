'use client';

import { useQuery } from '@tanstack/react-query';
import { getCompany, searchCompanies, type Company, type PageList } from '@/lib/companies';

// Query keys
export const companyKeys = {
  all: ['companies'] as const,
  lists: () => [...companyKeys.all, 'list'] as const,
  list: (filters: any) => [...companyKeys.lists(), filters] as const,
  details: () => [...companyKeys.all, 'detail'] as const,
  detail: (id: number) => [...companyKeys.details(), id] as const,
  top: (limit: number) => [...companyKeys.all, 'top', limit] as const,
};

// Hook for getting a single company
export function useCompany(companyId: number | null, enabled = true) {
  return useQuery({
    queryKey: companyKeys.detail(companyId!),
    queryFn: () => getCompany(companyId!),
    enabled: enabled && companyId !== null,
    staleTime: 1000 * 60 * 10, // 10 minutes for company details
  });
}

// Hook for batch fetching companies
export function useCompanies(companyIds: number[], enabled = true) {
  return useQuery({
    queryKey: [...companyKeys.all, 'batch', companyIds.sort().join(',')],
    queryFn: async () => {
      const requestMap = new Map<number, Promise<Company | null>>();
      const fetchCompany = (id: number) => {
        const existing = requestMap.get(id);
        if (existing) return existing;
        const request = getCompany(id).catch(() => null);
        requestMap.set(id, request);
        return request;
      };
      const companies = await Promise.all(companyIds.map((id) => fetchCompany(id)));
      return companies.filter((c): c is Company => c !== null);
    },
    enabled: enabled && companyIds.length > 0,
    staleTime: 1000 * 60 * 10,
  });
}

// Hook for top companies
export function useTopCompanies(limit: number = 6, enabled = true) {
  return useQuery({
    queryKey: companyKeys.top(limit),
    queryFn: async () => {
      const data = await searchCompanies({
        pagination: { page: 0, pageSize: 50 },
        sortBy: "companyName",
        sortOrder: "ASC",
        searchedBy: '',
        filter: null,
      });
      return data.items;
    },
    enabled,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

