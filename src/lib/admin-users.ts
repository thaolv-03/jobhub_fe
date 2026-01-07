import { apiRequest } from "@/lib/api-client";

export type AccountStatus = "ACTIVE" | "INACTIVE" | "LOCKED";
export type RecruiterStatus = "PENDING" | "APPROVED" | "REJECTED";

export type PageListDTO<T> = {
  items: T[];
  count: number;
};

type SortDirection = "asc" | "desc";
type SortOrder = "ASC" | "DESC";

type SortDTO = {
  field: string;
  sort: SortDirection;
};

type PaginationDTO = {
  page: number;
  pageSize: number;
};

type BaseSearchDTO<TFilter> = {
  pagination: PaginationDTO;
  sortedBy?: SortDTO[];
  searchedBy?: string;
  filter?: TFilter | null;
};

export type JobSeekerAdmin = {
  jobSeekerId: number;
  accountId: string;
  email: string;
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
  email: string;
  companyId?: number | null;
  companyName?: string | null;
  phone?: string | null;
  position?: string | null;
  status: RecruiterStatus;
  accountStatus: AccountStatus;
};

export async function searchJobSeekers(params: {
  page: number;
  pageSize: number;
  searchedBy?: string;
  sortedBy?: SortDTO[];
  sortBy?: string | null;
  sortOrder?: SortOrder | null;
}) {
  const normalizedSort =
    params.sortBy && params.sortOrder
      ? [{ field: params.sortBy, sort: params.sortOrder.toLowerCase() as SortDirection }]
      : params.sortedBy;
  const body: BaseSearchDTO<null> = {
    pagination: { page: params.page, pageSize: params.pageSize },
    sortedBy: normalizedSort ?? [{ field: "createAt", sort: "desc" }],
    searchedBy: params.searchedBy ?? "",
    filter: null,
  };

  const response = await apiRequest<PageListDTO<JobSeekerAdmin>>("/api/job-seekers/search", {
    method: "POST",
    body,
  });

  return response.data ?? { items: [], count: 0 };
}

export async function searchRecruiters(params: {
  page: number;
  pageSize: number;
  searchedBy?: string;
  sortedBy?: SortDTO[];
  sortBy?: string | null;
  sortOrder?: SortOrder | null;
}) {
  const normalizedSort =
    params.sortBy && params.sortOrder
      ? [{ field: params.sortBy, sort: params.sortOrder.toLowerCase() as SortDirection }]
      : params.sortedBy;
  const body: BaseSearchDTO<null> = {
    pagination: { page: params.page, pageSize: params.pageSize },
    sortedBy: normalizedSort ?? [{ field: "account.email", sort: "asc" }],
    searchedBy: params.searchedBy ?? "",
    filter: null,
  };

  const response = await apiRequest<PageListDTO<RecruiterAdminDetail>>("/api/recruiters/search", {
    method: "POST",
    body,
  });

  return response.data ?? { items: [], count: 0 };
}

export async function updateJobSeekerAccountStatus(jobSeekerId: number, status: AccountStatus) {
  const response = await apiRequest<JobSeekerAdmin>(
    `/api/admin/job-seekers/${jobSeekerId}/account-status`,
    {
      method: "PATCH",
      body: { status },
    }
  );
  return response.data ?? null;
}

export async function updateRecruiterAccountStatus(recruiterId: number, status: AccountStatus) {
  const response = await apiRequest<RecruiterAdminDetail>(
    `/api/admin/recruiters/${recruiterId}/account-status`,
    {
      method: "PATCH",
      body: { status },
    }
  );
  return response.data ?? null;
}
