import type { ApiResponse } from "./api-types";
import { fetchWithAuth } from "./fetchWithAuth";

async function proxyRequest<T>(path: string, body: unknown, accessToken?: string | null): Promise<ApiResponse<T>> {
  return fetchWithAuth<T>(path, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
    accessToken,
  });
}

export function searchJobs<T>(body: unknown, accessToken?: string | null) {
  return proxyRequest<T>("/api/recruiter/jobs/search", body, accessToken);
}

export function searchApplications<T>(jobId: number, body: unknown, accessToken?: string | null) {
  return proxyRequest<T>(`/api/recruiter/jobs/${jobId}/applications/search`, body, accessToken);
}
