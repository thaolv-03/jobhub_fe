import { apiRequest, ApiError } from "./api-client";

export type CandidateChatResponse = {
  applicationId: string;
  jobSeekerId: number;
  fullName: string;
  matchingScore: number;
  reason: string;
};

export async function chatMatchCandidate(
  jobId: number,
  prompt: string,
  accessToken?: string | null
): Promise<CandidateChatResponse> {
  const response = await apiRequest<CandidateChatResponse>(`/api/jobs/${jobId}/candidates/chat`, {
    method: "POST",
    body: { prompt },
    accessToken,
  });

  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Candidate chat response missing data.");
  }

  return response.data;
}
