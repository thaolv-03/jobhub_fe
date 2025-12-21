import { ApiError, ApiResponse, buildApiErrorMessage } from "./api-types";
import {
  clearAuthData,
  getAccessToken,
  getAuthFailed,
  getRefreshToken,
  saveTokens,
  setAuthFailed,
} from "./auth-storage";

type FetchWithAuthOptions = RequestInit & {
  accessToken?: string | null;
  retryOnce?: boolean;
  parseAs?: "api" | "raw";
};

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

const AUTH_FAILURE_MESSAGE = "Unauthenticated";

const shouldRefresh = (response: Response, data?: ApiResponse<unknown>) => {
  if (response.status === 401) return true;
  if (!data) return false;
  if (data.code === 401) return true;
  if (typeof data.status === "string" && data.status.toLowerCase().includes("unauth")) return true;
  if (typeof data.message === "string" && data.message.toLowerCase().includes("unauthenticated")) return true;
  return false;
};

const getApiBaseUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL || "";

const handleAuthFailure = () => {
  if (getAuthFailed()) return;
  setAuthFailed(true);
  clearAuthData();
  if (typeof window !== "undefined") {
    const isLogin = window.location.pathname.startsWith("/login");
    if (!isLogin) {
      window.location.href = "/login";
    }
  }
};

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiError(401, "NO_REFRESH_TOKEN", "No refresh token available.");
  }

  const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh-token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Refresh-Token": refreshToken,
    },
    credentials: "include",
  });

  const data = (await response.json()) as ApiResponse<{ accessToken: string; refreshToken: string }>;
  if (!response.ok || !data || data.code < 200 || data.code >= 300) {
    throw new ApiError(
      data?.code || response.status || 401,
      data?.status || "UNAUTHENTICATED",
      data?.message ? buildApiErrorMessage(data.message) : AUTH_FAILURE_MESSAGE
    );
  }

  saveTokens(data.data);
};

const refreshOnce = async () => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = refreshAccessToken()
    .catch((error) => {
      handleAuthFailure();
      throw error;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  return refreshPromise;
};

export async function fetchWithAuth<T>(
  url: string,
  options?: FetchWithAuthOptions & { parseAs?: "api" }
): Promise<ApiResponse<T>>;
export async function fetchWithAuth<T>(
  url: string,
  options: FetchWithAuthOptions & { parseAs: "raw" }
): Promise<T>;
export async function fetchWithAuth<T>(
  url: string,
  options: FetchWithAuthOptions = {}
): Promise<ApiResponse<T> | T> {
  if (getAuthFailed()) {
    throw new ApiError(401, "UNAUTHENTICATED", AUTH_FAILURE_MESSAGE);
  }

  const isRefreshEndpoint = url.includes("/api/auth/refresh-token");
  const parseAs = options.parseAs ?? "api";

  const headers = new Headers(options.headers);
  const storedToken = getAccessToken();
  const token = storedToken ?? options.accessToken;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: options.credentials ?? "include",
  });

  let data: ApiResponse<T> | T | undefined;
  try {
    data = (await response.json()) as ApiResponse<T>;
  } catch (error) {
    if (!response.ok) {
      throw new ApiError(response.status || 500, "CLIENT_ERROR", "Failed to parse server response.");
    }
  }

  if (shouldRefresh(response, parseAs === "api" ? (data as ApiResponse<T>) : undefined) && !isRefreshEndpoint) {
    if (options.retryOnce) {
      handleAuthFailure();
      throw new ApiError(401, "UNAUTHENTICATED", AUTH_FAILURE_MESSAGE);
    }
    await refreshOnce();
    const nextToken = getAccessToken();
    const retryHeaders = new Headers(headers);
    if (nextToken) {
      retryHeaders.set("Authorization", `Bearer ${nextToken}`);
    }
    return fetchWithAuth<T>(url, { ...options, headers: retryHeaders, retryOnce: true });
  }

  if (!data) {
    return { code: response.status || 200, status: "OK", message: "", data: undefined as T };
  }

  if (parseAs === "raw") {
    if (!response.ok) {
      throw new ApiError(response.status || 500, "CLIENT_ERROR", "Request failed.");
    }
    return data as T;
  }

  const apiData = data as ApiResponse<T>;
  if (apiData.code < 200 || apiData.code >= 300) {
    throw new ApiError(
      apiData.code,
      apiData.status,
      buildApiErrorMessage(apiData.message),
      typeof apiData.message === "object" ? apiData.message : undefined
    );
  }

  return apiData;
}
