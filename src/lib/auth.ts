
'use client';
import { apiRequest } from './api-client';
import { ApiError } from './api-types';
import type { ApiResponse } from './api-types';
import {
  ACCOUNT_KEY,
  clearAuthData,
  getAccount,
  getAccessToken,
  getRefreshToken,
  saveAuthData,
  saveTokens,
} from './auth-storage';

// ===== TYPE DEFINITIONS =====
export type RoleName = "ADMIN" | "RECRUITER" | "JOB_SEEKER" | "RECRUITER_PENDING";

export interface Permission {
    permissionId: number;
    permissionName: string;
    permissionDescription: string;
}

export interface Role {
    roleId: number;
    roleName: RoleName;
    roleDescription: string;
    permissions: Permission[];
}

export interface Account {
  accountId: string;
  email: string;
  status: string;
  createdAt: string | null;
  roles: Role[];
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  account: Account;
}

export interface RegisterRequest {
  email: string;
  password?: string;
}

export interface VerifyRegistrationRequest {
    email: string;
    otp: string;
}

export type ForgotPasswordRequest = {
    email: string;
}

export type VerifyOtpRequest = {
    email: string;
    otp: string;
}

export type ResetPasswordRequest = {
    email: string;
    newPassword?: string;
}

export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
}

export interface UpgradeRecruiterRequest {
    companyId?: number;
    companyName: string;
    location?: string;
    website?: string;
    position: string;
    phone: string;
}

export interface UpgradeRecruiterResponse {
    recruiterId: number;
    companyId: number;
    companyName: string;
}


// ===== TOKEN & ACCOUNT MANAGEMENT =====

export { clearAuthData, getAccount, getAccessToken, getRefreshToken };

// ===== API FUNCTIONS =====

export async function login(payload: LoginRequest): Promise<Account> {
  const response = await apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: payload,
  });
  const loginData = response.data;
  if (!loginData) {
      throw new ApiError(500, 'INTERNAL_ERROR', 'Login response did not contain data.');
  }
  saveAuthData(loginData);
  return loginData.account;
}

export async function logout(): Promise<void> {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  // No need to call API if tokens aren't present.
  if (!accessToken && !refreshToken) {
      clearAuthData();
      return;
  }
  
  try {
      // Only call API if we have something to invalidate
      if (accessToken || refreshToken) {
        await apiRequest('/api/auth/logout', {
          method: 'POST',
          accessToken,
          refreshToken,
        });
      }
  } catch (error: any) {
     console.error("Logout failed on server, clearing client data.", error.message);
  } finally {
      clearAuthData();
  }
}

export async function forgotPassword(email: string): Promise<ApiResponse<null>> {
  return apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export async function verifyOtp(params: VerifyOtpRequest): Promise<ApiResponse<null>> {
  return apiRequest('/api/auth/verify-otp', {
    method: 'POST',
    body: params,
  });
}

export async function resetPassword(params: ResetPasswordRequest): Promise<ApiResponse<null>> {
  return apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: params,
  });
}

export async function refreshToken(): Promise<RefreshTokenResponse> {
    const currentRefreshToken = getRefreshToken();
    if (!currentRefreshToken) {
        throw new ApiError(401, 'NO_REFRESH_TOKEN', 'No refresh token available.');
    }
    const response = await apiRequest<RefreshTokenResponse>('/api/auth/refresh-token', {
        method: 'POST',
        refreshToken: currentRefreshToken,
    });
    const tokenData = response.data;
    if (!tokenData) {
        throw new ApiError(500, 'INTERNAL_ERROR', 'Refresh token response did not contain data.');
    }
    saveTokens(tokenData);
    return tokenData;
}

export async function register(payload: RegisterRequest): Promise<ApiResponse<null>> {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: payload,
  });
}

export async function verifyRegistration(params: VerifyRegistrationRequest): Promise<ApiResponse<null>> {
  return apiRequest('/api/auth/verify-registration', {
    method: 'POST',
    body: params,
  });
}


export async function upgradeToRecruiter(payload: UpgradeRecruiterRequest): Promise<UpgradeRecruiterResponse> {
    const accessToken = getAccessToken();
    if (!accessToken) {
        throw new ApiError(401, 'UNAUTHORIZED', 'Authentication token not found.');
    }

    const response = await apiRequest<UpgradeRecruiterResponse>('/api/recruiters/upgrade', {
        method: 'POST',
        body: payload,
        accessToken: accessToken,
    });

    // Optimistically mark account as pending so layout can redirect immediately.
    try {
        const cached = getAccount<Account>();
        const hasPending = cached?.roles?.some(r => r.roleName === 'RECRUITER_PENDING');
        if (cached && !hasPending) {
            const updated = {
                ...cached,
                roles: [
                    ...(cached.roles || []),
                    {
                        roleId: -1,
                        roleName: 'RECRUITER_PENDING' as RoleName,
                        roleDescription: 'Pending recruiter upgrade (client fallback)',
                        permissions: [],
                    },
                ],
            };
            localStorage.setItem(ACCOUNT_KEY, JSON.stringify(updated));
        }
    } catch (optimisticError) {
        console.error('Failed to set pending role optimistically', optimisticError);
    }
    
    // Refresh account info to get updated roles, but do not block or throw if it fails.
    const refreshAccount = async () => {
        try {
            const accountResponse = await apiRequest<Account>('/api/accounts/me', {
                method: 'GET',
                accessToken: accessToken,
            });

            if (accountResponse.data) {
                localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accountResponse.data));
                return;
            }
        } catch (error) {
            // swallow; fallback below
        }

        // Fallback: tag cached account with RECRUITER_PENDING so UI can redirect correctly.
        try {
            const cached = getAccount<Account>();
            const hasPending = cached?.roles?.some(r => r.roleName === 'RECRUITER_PENDING');
            if (cached && !hasPending) {
                const updated = {
                    ...cached,
                    roles: [
                        ...(cached.roles || []),
                        {
                            roleId: -1,
                            roleName: 'RECRUITER_PENDING' as RoleName,
                            roleDescription: 'Pending recruiter upgrade (client fallback)',
                            permissions: [],
                        },
                    ],
                };
                localStorage.setItem(ACCOUNT_KEY, JSON.stringify(updated));
            }
        } catch (fallbackError) {
            console.error('Failed to update local account after upgrade', fallbackError);
        }
    };

    // Fire and forget; we don't want this to throw to the caller.
    void refreshAccount();

    return response.data;
}
