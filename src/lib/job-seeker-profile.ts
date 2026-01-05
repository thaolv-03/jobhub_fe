import { ApiError } from "./api-types";
import type { ApiResponse } from "./api-types";
import { apiRequest } from "./api-client";
import { fetchWithAuth } from "./fetchWithAuth";
import { applyForJob } from "./applications";

export type JobSeekerProfile = {
  jobSeekerId: number;
  fullName: string;
  phone: string;
  address: string;
  dob?: string | null;
  bio?: string | null;
  cvUrl?: string | null;
  cvName?: string | null;
  cvId?: string | null;
  avatarUrl?: string | null;
  skills?: { skillId?: number | null; skillName?: string | null; proficiencyLevel?: string | null }[] | null;
};

export type CvParseResponse = {
  fileKey: string;
  rawText: string;
  parsedData: Record<string, unknown>;
};

export type ParsedCvDTO = {
  cvId: string;
  jobSeekerId: number;
  fileUrl?: string | null;
  extractedText?: string | null;
  embedding?: string | null;
  parsedData?: Record<string, unknown> | null;
  createdAt?: string | null;
};

export type CreateJobSeekerProfilePayload = {
  fullName: string;
  phone: string;
  address: string;
  dob?: string | null;
  bio?: string | null;
};

export type UpdateJobSeekerProfilePayload = {
  fullName?: string | null;
  phone?: string | null;
  address?: string | null;
  dob?: string | null;
  bio?: string | null;
};

export type ApplyJobPayload = {
  parsedCvId?: string | null;
};

const PROFILE_ME_ENDPOINT = "/api/job-seekers/me";
const CREATE_PROFILE_ENDPOINT = "/api/job-seekers";
const UPLOAD_CV_ENDPOINT = "/api/job-seekers/cv";
const DELETE_CV_ENDPOINT = "/api/job-seekers/cv";
const UPLOAD_AVATAR_ENDPOINT = "/api/job-seekers/avatar";
const PARSE_CV_ENDPOINT = "/api/job-seekers/cv/parse";
const SAVE_CV_ONLINE_ENDPOINT = "/api/job-seekers/cv/online";
const FETCH_CV_ONLINE_LATEST_ENDPOINT = "/api/job-seekers/cv/online/latest";

const isNotFound = (error: unknown) =>
  error instanceof ApiError &&
  (error.code === 404 || error.status.toLowerCase().includes("not_found"));

const isUnauthenticated = (error: unknown) =>
  error instanceof ApiError && (error.code === 401 || error.code === 403);

export async function fetchJobSeekerProfile(options?: { allowUnauthenticated?: boolean }): Promise<JobSeekerProfile | null> {
  try {
    const response = await apiRequest<JobSeekerProfile>(PROFILE_ME_ENDPOINT, {
      suppressAuthFailure: options?.allowUnauthenticated ?? false,
    });
    return response.data ?? null;
  } catch (error) {
    if (isNotFound(error) || (options?.allowUnauthenticated && isUnauthenticated(error))) {
      return null;
    }
    throw error;
  }
}

export async function fetchJobSeekerById(
  jobSeekerId: number,
  accessToken?: string | null
): Promise<JobSeekerProfile> {
  const response = await apiRequest<JobSeekerProfile>(`/api/job-seekers/${jobSeekerId}`, {
    accessToken,
  });

  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Job seeker response missing data.");
  }

  return response.data;
}

export async function createJobSeekerProfile(
  payload: CreateJobSeekerProfilePayload
): Promise<JobSeekerProfile> {
  const response = await apiRequest<JobSeekerProfile>(CREATE_PROFILE_ENDPOINT, {
    method: "POST",
    body: payload,
    suppressAuthFailure: true,
  });

  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Create profile response missing data.");
  }

  return response.data;
}

export async function updateJobSeekerProfile(
  payload: UpdateJobSeekerProfilePayload
): Promise<JobSeekerProfile> {
  const response = await apiRequest<JobSeekerProfile>(PROFILE_ME_ENDPOINT, {
    method: "PATCH",
    body: payload,
    suppressAuthFailure: true,
  });

  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Update profile response missing data.");
  }

  return response.data;
}

export async function applyToJob(
  jobId: string | number,
  payload: ApplyJobPayload
): Promise<ApiResponse<unknown>> {
  const response = await applyForJob(Number(jobId), payload.parsedCvId ?? null);
  return { code: 201, status: "CREATED", message: "Applied", data: response };
}

export async function uploadJobSeekerCv(file: File): Promise<JobSeekerProfile> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithAuth<JobSeekerProfile>(`${baseUrl}${UPLOAD_CV_ENDPOINT}`, {
    method: "POST",
    body: formData,
    parseAs: "api",
  });

  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Upload CV response missing data.");
  }

  return response.data;
}

export async function deleteJobSeekerCv(): Promise<void> {
  await apiRequest(DELETE_CV_ENDPOINT, {
    method: "DELETE",
    suppressAuthFailure: true,
  });
}

export async function parseJobSeekerCv(file: File): Promise<CvParseResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithAuth<CvParseResponse>(`${baseUrl}${PARSE_CV_ENDPOINT}`, {
    method: "POST",
    body: formData,
    parseAs: "api",
  });

  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Parse CV response missing data.");
  }

  return response.data;
}

export async function saveCvOnline(
  payload: { fileKey: string; rawText: string; parsedData: Record<string, unknown> }
): Promise<ParsedCvDTO> {
  const response = await apiRequest<ParsedCvDTO>(SAVE_CV_ONLINE_ENDPOINT, {
    method: "POST",
    body: payload,
  });

  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Save CV response missing data.");
  }

  return response.data;
}

export async function fetchLatestCvOnline(): Promise<ParsedCvDTO | null> {
  try {
    const response = await apiRequest<ParsedCvDTO>(FETCH_CV_ONLINE_LATEST_ENDPOINT, {
      suppressAuthFailure: true,
    });
    return response.data ?? null;
  } catch (error) {
    if (error instanceof ApiError && error.code === 404) {
      return null;
    }
    throw error;
  }
}

export async function uploadJobSeekerAvatar(file: File): Promise<JobSeekerProfile> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetchWithAuth<JobSeekerProfile>(`${baseUrl}${UPLOAD_AVATAR_ENDPOINT}`, {
    method: "PATCH",
    body: formData,
    parseAs: "api",
  });

  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Upload avatar response missing data.");
  }

  return response.data;
}
