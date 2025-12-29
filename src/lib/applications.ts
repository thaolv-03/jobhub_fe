import { apiRequest } from "./api-client";
import { ApiError } from "./api-types";
import type { PageList } from "./jobs";

export type Application = {
  applicationId: string;
  jobId: number;
  jobSeekerId: number;
  appliedAt?: string | null;
  status?: string | null;
  parsedCvId?: string | null;
};

type Pagination = {
  page: number;
  pageSize: number;
};

type SortItem = {
  field: string;
  sort: "ASC" | "DESC";
};

type BaseSearchRequest<T> = {
  pagination: Pagination;
  sortedBy?: SortItem[];
  searchedBy?: string;
  filter?: T;
};

export async function applyForJob(jobId: number, parsedCvId?: string | null): Promise<Application> {
  const response = await apiRequest<Application>("/api/applications", {
    method: "POST",
    body: {
      jobId,
      parsedCvId: parsedCvId ?? null,
    },
    suppressAuthFailure: true,
  });
  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Apply response missing data.");
  }
  return response.data;
}

export async function withdrawApplication(applicationId: string): Promise<Application> {
  const response = await apiRequest<Application>(`/api/applications/${applicationId}/withdraw`, {
    method: "PATCH",
    suppressAuthFailure: true,
  });
  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Withdraw response missing data.");
  }
  return response.data;
}

export async function listApplications(page = 0, pageSize = 20): Promise<PageList<Application>> {
  const response = await apiRequest<PageList<Application>>("/api/applications/search", {
    method: "POST",
    body: {
      pagination: { page, pageSize },
      sortedBy: [{ field: "appliedAt", sort: "DESC" }],
    } as BaseSearchRequest<Application>,
    suppressAuthFailure: true,
  });
  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Application list response missing data.");
  }
  return response.data;
}
