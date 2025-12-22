import { apiRequest } from "@/lib/api-client";

export type RecruiterStatus = "PENDING" | "APPROVED" | "REJECTED";

export type RecruiterAdmin = {
  recruiterId: number;
  status: RecruiterStatus;
  accountEmail?: string | null;
  companyId?: number | null;
  companyName?: string | null;
};

export type RecruiterDocument = {
  documentId: number;
  fileKey: string;
  downloadUrl: string;
  fileName: string;
  contentType: string;
};

export async function fetchPendingRecruiters(accessToken: string) {
  const response = await apiRequest<RecruiterAdmin[]>("/api/admin/recruiters/pending", {
    method: "GET",
    accessToken,
  });
  return response.data ?? [];
}

export async function updateRecruiterStatus(
  accessToken: string,
  recruiterId: number,
  status: RecruiterStatus
) {
  const response = await apiRequest<RecruiterAdmin>(
    `/api/admin/recruiters/${recruiterId}/status`,
    {
      method: "PATCH",
      accessToken,
      body: { status },
    }
  );
  return response.data ?? null;
}

export async function fetchRecruiterDocuments(accessToken: string, recruiterId: number) {
  const response = await apiRequest<RecruiterDocument[]>(
    `/api/admin/recruiters/${recruiterId}/documents`,
    {
      method: "GET",
      accessToken,
    }
  );
  return response.data ?? [];
}
