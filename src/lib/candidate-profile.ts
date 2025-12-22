import { ApiError, ApiResponse } from "./api-types";
import { apiRequest } from "./api-client";
import { fetchWithAuth } from "./fetchWithAuth";

export type CandidateProfile = {
  jobSeekerId: number;
  fullName: string;
  phone: string;
  address: string;
  dob?: string | null;
  bio?: string | null;
  cvUrl?: string | null;
  cvName?: string | null;
  cvId?: string | null;
};

export type CreateCandidateProfilePayload = {
  fullName: string;
  phone: string;
  address: string;
  dob?: string | null;
  bio?: string | null;
};

export type ApplyJobPayload = {
  cvUrl?: string | null;
  cvId?: string | null;
};

const PROFILE_ME_ENDPOINT = "/api/job-seekers/me";
const CREATE_PROFILE_ENDPOINT = "/api/job-seekers";
const APPLY_JOB_ENDPOINT = (jobId: string | number) => `/api/jobs/${jobId}/applications`;
const UPLOAD_CV_ENDPOINT = "/api/job-seekers/cv";

const isNotFound = (error: unknown) =>
  error instanceof ApiError &&
  (error.code === 404 || error.status.toLowerCase().includes("not_found"));

export async function fetchCandidateProfile(): Promise<CandidateProfile | null> {
  try {
    const response = await apiRequest<CandidateProfile>(PROFILE_ME_ENDPOINT, {
      suppressAuthFailure: true,
    });
    return response.data ?? null;
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    if (error instanceof ApiError && error.code === 401) {
      return null;
    }
    throw error;
  }
}

export async function createCandidateProfile(
  payload: CreateCandidateProfilePayload
): Promise<CandidateProfile> {
  const response = await apiRequest<CandidateProfile>(CREATE_PROFILE_ENDPOINT, {
    method: "POST",
    body: payload,
  });

  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Create profile response missing data.");
  }

  return response.data;
}

export async function applyToJob(
  jobId: string | number,
  payload: ApplyJobPayload
): Promise<ApiResponse<unknown>> {
  return apiRequest<unknown>(APPLY_JOB_ENDPOINT(jobId), {
    method: "POST",
    body: payload,
  });
}

export async function uploadCandidateCv(file: File): Promise<CandidateProfile> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithAuth<CandidateProfile>(`${baseUrl}${UPLOAD_CV_ENDPOINT}`, {
    method: "POST",
    body: formData,
    parseAs: "api",
  });

  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Upload CV response missing data.");
  }

  return response.data;
}
