import { apiRequest } from "./api-client";
import { ApiError } from "./api-types";
import type { ApiResponse } from "./api-types";

export type SortDirection = "ASC" | "DESC";

export type JobType = "FULL_TIME" | "PART_TIME" | "INTERN" | "CONTRACT" | "FREELANCE";

export type Job = {
  jobId: number;
  companyId: number;
  recruiterId: number;
  companyName: string | null;
  companyAvatarUrl?: string | null;
  title: string;
  description?: string | null;
  location?: string | null;
  status?: string | null;
  minSalary?: number | null;
  maxSalary?: number | null;
  jobType?: JobType | null;
  deadline?: string | null;
  createdAt?: string | null;
  categories?: string[] | null;
  tags?: string[] | null;
  requirements?: string[] | null;
};

export type PageList<T> = {
  items: T[];
  count: number;
};

export type JobFilter = {
  locations?: string[];
  jobTypes?: JobType[];
  salaryMin?: number | null;
  salaryMax?: number | null;
  categoryIds?: number[];
  tagIds?: number[];
  companyIds?: number[];
};

export type Pagination = {
  page: number;
  pageSize: number;
};

export type SortItem = {
  field: string;
  sort: SortDirection;
};

export type JobSearchRequest = {
  pagination: Pagination;
  sortedBy?: SortItem[];
  searchedBy?: string;
  filter?: JobFilter;
};

const JOB_TYPE_LABELS: Record<JobType, string> = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  INTERN: "Thực tập",
  CONTRACT: "Hợp đồng",
  FREELANCE: "Freelance",
};

export const formatJobType = (jobType?: JobType | null) => {
  if (!jobType) return "";
  return JOB_TYPE_LABELS[jobType] ?? jobType;
};

export async function searchJobs(request: JobSearchRequest): Promise<PageList<Job>> {
  const response = await apiRequest<PageList<Job>>("/api/jobs/search", {
    method: "POST",
    body: request,
  });
  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Job search response missing data.");
  }
  return response.data;
}

export async function recommendJobs(request: JobSearchRequest): Promise<PageList<Job>> {
  const response = await apiRequest<PageList<Job>>("/api/jobs/recommended", {
    method: "POST",
    body: request,
  });
  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Job recommendation response missing data.");
  }
  return response.data;
}

export async function getJob(jobId: number): Promise<Job> {
  const response = await apiRequest<Job>(`/api/jobs/${jobId}`, {
    method: "GET",
  });
  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Job detail response missing data.");
  }
  return response.data;
}

export async function getFeaturedJobs(limit: number): Promise<Job[]> {
  const data = await searchJobs({
    pagination: { page: 0, pageSize: limit },
    sortedBy: [{ field: "createAt", sort: "DESC" }],
  });
  return data.items;
}
