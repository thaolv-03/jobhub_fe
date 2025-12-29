import { apiRequest } from "./api-client";
import { ApiError } from "./api-types";
import type { Job, JobSearchRequest } from "./jobs";

export type Company = {
  companyId: number;
  companyName: string;
  location?: string | null;
  website?: string | null;
  introduction?: string | null;
  avatarUrl?: string | null;
};

export type CompanySuggestion = {
  companyId: number;
  companyName: string;
};

export type PageList<T> = {
  items: T[];
  count: number;
};

type SortDirection = "asc" | "desc" | "ASC" | "DESC";

type SortItem = {
  field: string;
  sort: SortDirection;
};

type Pagination = {
  page: number;
  pageSize: number;
};

export type CompanySearchRequest = {
  pagination: Pagination;
  sortedBy?: SortItem[];
  searchedBy?: string;
  filter?: Company | null;
};

export async function getCompany(companyId: number): Promise<Company> {
  const response = await apiRequest<Company>(`/api/companies/${companyId}`, {
    method: "GET",
  });
  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Company response missing data.");
  }
  return response.data;
}

export async function searchCompanies(request: CompanySearchRequest): Promise<PageList<Company>> {
  const response = await apiRequest<PageList<Company>>("/api/companies/search", {
    method: "POST",
    body: request,
  });
  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Company search response missing data.");
  }
  return response.data;
}

export async function getCompanyJobs(
  companyId: number,
  request: JobSearchRequest
): Promise<PageList<Job>> {
  const response = await apiRequest<PageList<Job>>(`/api/companies/${companyId}/jobs`, {
    method: "GET",
    body: request,
  });
  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Company jobs response missing data.");
  }
  return response.data;
}

export async function suggestCompanies(query: string): Promise<CompanySuggestion[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const response = await fetch(`${baseUrl}/api/companies/suggestions?q=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new ApiError(response.status || 500, "CLIENT_ERROR", "Failed to fetch company suggestions.");
  }
  return (await response.json()) as CompanySuggestion[];
}
