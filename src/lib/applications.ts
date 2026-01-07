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
  matchingScore?: number | null;
};

export type ApplicationDetail = {
  applicationId: string;
  jobId: number;
  jobTitle?: string | null;
  jobSeekerId: number;
  appliedAt?: string | null;
  status?: string | null;
  parsedCvId?: string | null;
  parsedCvJson?: string | null;
  matchingScore?: number | null;
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
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
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

export async function listApplications(
  page = 0,
  pageSize = 20,
  options?: { searchedBy?: string; sortBy?: string | null; sortOrder?: "ASC" | "DESC" | null }
): Promise<PageList<Application>> {
  const sortedBy =
    options?.sortBy && options.sortOrder
      ? [{ field: options.sortBy, sort: options.sortOrder }]
      : [{ field: "appliedAt", sort: "DESC" }];
  const response = await apiRequest<PageList<Application>>("/api/applications/search", {
    method: "POST",
    body: {
      pagination: { page, pageSize },
      sortedBy,
      sortBy: undefined,
      sortOrder: undefined,
      searchedBy: options?.searchedBy ?? undefined,
    } as BaseSearchRequest<Application>,
    suppressAuthFailure: true,
  });
  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Application list response missing data.");
  }
  return response.data;
}

export async function getApplicationDetail(
  applicationId: string,
  accessToken?: string | null
): Promise<ApplicationDetail> {
  const response = await apiRequest<ApplicationDetail>(`/api/applications/${applicationId}`, {
    method: "GET",
    accessToken,
  });
  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Application detail response missing data.");
  }
  return response.data;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string,
  note?: string | null,
  accessToken?: string | null
): Promise<Application> {
  const response = await apiRequest<Application>(`/api/applications/${applicationId}/status`, {
    method: "PATCH",
    accessToken,
    body: {
      status,
      note: note ?? null,
    },
  });
  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Application status response missing data.");
  }
  return response.data;
}
