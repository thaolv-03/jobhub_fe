import { ApiError } from "./api-types";
import type { ApiResponse } from "./api-types";
import { apiRequest } from "./api-client";
import { fetchWithAuth } from "./fetchWithAuth";

export type RecruiterProfile = {
  recruiterId: number;
  companyId?: number | null;
  companyName?: string | null;
  position?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  status?: "PENDING" | "APPROVED" | "REJECTED" | null;
};

const PROFILE_ME_ENDPOINT = "/api/recruiters/me";
const UPLOAD_AVATAR_ENDPOINT = "/api/recruiters/me/avatar";

const isNotFound = (error: unknown) =>
  error instanceof ApiError &&
  (error.code === 404 || error.status.toLowerCase().includes("not_found"));

export async function fetchRecruiterProfile(): Promise<RecruiterProfile | null> {
  try {
    const response = await apiRequest<RecruiterProfile>(PROFILE_ME_ENDPOINT);
    return response.data ?? null;
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

export async function uploadRecruiterAvatar(file: File): Promise<RecruiterProfile> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetchWithAuth<RecruiterProfile>(`${baseUrl}${UPLOAD_AVATAR_ENDPOINT}`, {
    method: "PATCH",
    body: formData,
    parseAs: "api",
  });

  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Upload avatar response missing data.");
  }

  return response.data;
}
