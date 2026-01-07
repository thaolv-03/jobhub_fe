import { apiRequest } from "./api-client";
import { ApiError } from "./api-types";
import type { PageList } from "./jobs";

export type Favorite = {
  favoriteId: number;
  jobId: number;
  jobSeekerId: number;
  createdAt?: string | null;
};

type Pagination = {
  page: number;
  pageSize: number;
};

type SortItem = {
  field: string;
  sort: "ASC" | "DESC";
};

type BaseSearchRequest<T> = {
  pagination: Pagination;
  sortedBy?: SortItem[];
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  searchedBy?: string;
  filter?: T;
};

export async function listFavorites(
  page = 0,
  pageSize = 50,
  searchedBy = "",
  sortBy?: string | null,
  sortOrder?: "ASC" | "DESC" | null
): Promise<PageList<Favorite>> {
  const sortedBy =
    sortBy && sortOrder
      ? [{ field: sortBy, sort: sortOrder }]
      : [{ field: "favoriteId", sort: "DESC" }];
  const response = await apiRequest<PageList<Favorite>>("/api/favorites/search", {
    method: "POST",
    body: {
      pagination: { page, pageSize },
      sortedBy,
      sortBy: undefined,
      sortOrder: undefined,
      searchedBy: searchedBy.trim() || undefined,
    } as BaseSearchRequest<Favorite>,
    suppressAuthFailure: true,
  });
  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Favorite list response missing data.");
  }
  return response.data;
}

export async function addFavorite(jobId: number): Promise<Favorite> {
  const response = await apiRequest<Favorite>(`/api/favorites/${jobId}`, {
    method: "POST",
    suppressAuthFailure: true,
  });
  if (!response.data) {
    throw new ApiError(500, "INVALID_RESPONSE", "Add favorite response missing data.");
  }
  return response.data;
}

export async function removeFavorite(jobId: number): Promise<void> {
  await apiRequest(`/api/favorites/${jobId}`, {
    method: "DELETE",
    suppressAuthFailure: true,
  });
}
