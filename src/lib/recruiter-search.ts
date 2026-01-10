import type { ApiResponse } from "./api-types";
import { fetchWithAuth } from "./fetchWithAuth";

type SortOrder = "ASC" | "DESC";

const normalizeSort = (body: unknown) => {
  if (!body || typeof body !== "object") return body;
  const payload = body as Record<string, unknown>;
  const sortBy = typeof payload.sortBy === "string" ? payload.sortBy : null;
  const sortOrder = payload.sortOrder === "ASC" || payload.sortOrder === "DESC" ? payload.sortOrder : null;
  const sortedBy = sortBy && sortOrder ? [{ field: sortBy, sort: sortOrder }] : payload.sortedBy;
  const { sortBy: _sortBy, sortOrder: _sortOrder, ...rest } = payload;
  return { ...rest, sortedBy };
};

async function proxyRequest<T>(path: string, body: unknown, accessToken?: string | null): Promise<ApiResponse<T>> {
  const normalized = normalizeSort(body);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
  return fetchWithAuth<T>(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(normalized ?? {}),
    accessToken,
  });
}

export function searchJobs<T>(body: unknown, accessToken?: string | null) {
  return proxyRequest<T>("/api/recruiter/jobs/search", body, accessToken);
}

export function searchApplications<T>(jobId: number, body: unknown, accessToken?: string | null) {
  return proxyRequest<T>(`/api/recruiter/jobs/${jobId}/applications/search`, body, accessToken);
}
export function getApplicationsCount<T>(jobIds: number[], accessToken?: string | null) {
  return proxyRequest<T>("/api/jobs/applications/count", { jobIds }, accessToken);
}
