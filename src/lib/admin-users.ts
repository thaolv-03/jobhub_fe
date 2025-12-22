import { apiRequest } from "@/lib/api-client";
import { RoleName } from "@/lib/auth";

export type AccountStatus = "ACTIVE" | "INACTIVE" | "LOCKED";

export type AdminAccount = {
  accountId: string;
  email: string;
  status: AccountStatus;
  createdAt?: string | null;
  roles?: { roleName: RoleName }[];
};

export type JobSeekerAdmin = {
  jobSeekerId: number;
  accountId: string;
  accountEmail: string;
  fullName: string;
  dob?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt?: string | null;
  bio?: string | null;
  cvUrl?: string | null;
  accountStatus: AccountStatus;
};

export type RecruiterAdminDetail = {
  recruiterId: number;
  accountId: string;
  accountEmail: string;
  companyName?: string | null;
  phone?: string | null;
  position?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  accountStatus: AccountStatus;
};

export type CreateAccountRequest = {
  email: string;
  password?: string;
  roles?: RoleName[];
  status?: AccountStatus;
};

export type UpdateAccountRequest = {
  email?: string;
  roles?: RoleName[];
  status?: AccountStatus;
};

export type CreateJobSeekerRequest = {
  accountEmail: string;
  fullName: string;
  dob?: string | null;
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
  cvUrl?: string | null;
  accountStatus?: AccountStatus;
};

export type UpdateJobSeekerRequest = Partial<CreateJobSeekerRequest>;

export type CreateRecruiterRequest = {
  accountEmail: string;
  companyName?: string | null;
  phone?: string | null;
  position?: string | null;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  accountStatus?: AccountStatus;
};

export type UpdateRecruiterRequest = Partial<CreateRecruiterRequest>;

export async function fetchAccountsByRole(accessToken: string, role: RoleName | "NONE") {
  const response = await apiRequest<AdminAccount[]>(`/api/admin/accounts?role=${role}`, {
    method: "GET",
    accessToken,
  });
  return response.data ?? [];
}

export async function fetchJobSeekers(accessToken: string) {
  const response = await apiRequest<JobSeekerAdmin[]>("/api/admin/job-seekers", {
    method: "GET",
    accessToken,
  });
  return response.data ?? [];
}

export async function fetchRecruiters(accessToken: string) {
  const response = await apiRequest<RecruiterAdminDetail[]>("/api/admin/recruiters", {
    method: "GET",
    accessToken,
  });
  return response.data ?? [];
}

export async function createAccount(accessToken: string, payload: CreateAccountRequest) {
  const response = await apiRequest<AdminAccount>("/api/admin/accounts", {
    method: "POST",
    accessToken,
    body: payload,
  });
  return response.data ?? null;
}

export async function updateAccount(accessToken: string, accountId: string, payload: UpdateAccountRequest) {
  const response = await apiRequest<AdminAccount>(`/api/admin/accounts/${accountId}`, {
    method: "PUT",
    accessToken,
    body: payload,
  });
  return response.data ?? null;
}

export async function updateAccountStatus(
  accessToken: string,
  accountId: string,
  status: AccountStatus
) {
  const response = await apiRequest<AdminAccount>(`/api/admin/accounts/${accountId}/status`, {
    method: "PATCH",
    accessToken,
    body: { status },
  });
  return response.data ?? null;
}

export async function deleteAccount(accessToken: string, accountId: string) {
  const response = await apiRequest<null>(`/api/admin/accounts/${accountId}`, {
    method: "DELETE",
    accessToken,
  });
  return response.data ?? null;
}

export async function createJobSeeker(accessToken: string, payload: CreateJobSeekerRequest) {
  const response = await apiRequest<JobSeekerAdmin>("/api/admin/job-seekers", {
    method: "POST",
    accessToken,
    body: payload,
  });
  return response.data ?? null;
}

export async function updateJobSeeker(
  accessToken: string,
  jobSeekerId: number,
  payload: UpdateJobSeekerRequest
) {
  const response = await apiRequest<JobSeekerAdmin>(`/api/admin/job-seekers/${jobSeekerId}`, {
    method: "PUT",
    accessToken,
    body: payload,
  });
  return response.data ?? null;
}

export async function deleteJobSeeker(accessToken: string, jobSeekerId: number) {
  const response = await apiRequest<null>(`/api/admin/job-seekers/${jobSeekerId}`, {
    method: "DELETE",
    accessToken,
  });
  return response.data ?? null;
}

export async function createRecruiter(accessToken: string, payload: CreateRecruiterRequest) {
  const response = await apiRequest<RecruiterAdminDetail>("/api/admin/recruiters", {
    method: "POST",
    accessToken,
    body: payload,
  });
  return response.data ?? null;
}

export async function updateRecruiter(
  accessToken: string,
  recruiterId: number,
  payload: UpdateRecruiterRequest
) {
  const response = await apiRequest<RecruiterAdminDetail>(`/api/admin/recruiters/${recruiterId}`, {
    method: "PUT",
    accessToken,
    body: payload,
  });
  return response.data ?? null;
}

export async function deleteRecruiter(accessToken: string, recruiterId: number) {
  const response = await apiRequest<null>(`/api/admin/recruiters/${recruiterId}`, {
    method: "DELETE",
    accessToken,
  });
  return response.data ?? null;
}
