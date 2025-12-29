import { apiRequest } from "./api-client";
import { ApiError } from "./api-types";

export type JobSeekerSkill = {
  skillId?: number;
  skillName: string;
  proficiencyLevel?: string | null;
};

export async function listJobSeekerSkills(): Promise<JobSeekerSkill[]> {
  const response = await apiRequest<JobSeekerSkill[]>("/api/job-seekers/skills", {
    method: "GET",
  });
  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Skill list response missing data.");
  }
  return response.data;
}

export async function createJobSeekerSkill(payload: {
  skillName: string;
  proficiencyLevel?: string | null;
}): Promise<JobSeekerSkill> {
  const response = await apiRequest<JobSeekerSkill>("/api/job-seekers/skills", {
    method: "POST",
    body: payload,
  });
  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Skill create response missing data.");
  }
  return response.data;
}

export async function updateJobSeekerSkill(
  skillId: number,
  payload: { skillName?: string; proficiencyLevel?: string | null }
): Promise<JobSeekerSkill> {
  const response = await apiRequest<JobSeekerSkill>(`/api/job-seekers/skills/${skillId}`, {
    method: "PATCH",
    body: payload,
  });
  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Skill update response missing data.");
  }
  return response.data;
}

export async function deleteJobSeekerSkill(skillId: number): Promise<void> {
  await apiRequest<void>(`/api/job-seekers/skills/${skillId}`, {
    method: "DELETE",
  });
}
