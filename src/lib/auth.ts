
'use client';
import { apiRequest, ApiError, ApiResponse } from './api-client';

// ===== TYPE DEFINITIONS =====
export type RoleName = "ADMIN" | "RECRUITER" | "JOB_SEEKER";

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

// ===== TOKEN & ACCOUNT MANAGEMENT =====

const ACCESS_TOKEN_KEY = 'jobhub_access_token';
const ACCOUNT_KEY = 'jobhub_account';
const REFRESH_TOKEN_COOKIE_KEY = 'jobhub_refresh_token';

export function setCookie(name: string, value: string, days: number = 7) {
    if (typeof window === 'undefined') return;
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

export function getCookie(name: string): string | null {
    if (typeof window === 'undefined') return null;
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name: string) {
    if (typeof window === 'undefined') return;
    document.cookie = name + '=; Max-Age=-99999999; path=/; SameSite=Lax;';
}

export function saveAuthData(data: LoginResponse): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        localStorage.setItem(ACCOUNT_KEY, JSON.stringify(data.account));
        setCookie(REFRESH_TOKEN_COOKIE_KEY, data.refreshToken);
    }
}

export function saveTokens(data: RefreshTokenResponse): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        setCookie(REFRESH_TOKEN_COOKIE_KEY, data.refreshToken);
    }
}

export function getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return null;
}

export function getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
        return getCookie(REFRESH_TOKEN_COOKIE_KEY);
    }
    return null;
}

export function getAccount(): Account | null {
    if (typeof window !== 'undefined') {
        const accountJson = localStorage.getItem(ACCOUNT_KEY);
        return accountJson ? JSON.parse(accountJson) : null;
    }
    return null;
}

export function clearAuthData(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(ACCOUNT_KEY);
        eraseCookie(REFRESH_TOKEN_COOKIE_KEY);
    }
}

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

    if (!accessToken || !refreshToken) {
        clearAuthData();
        return;
    }

    try {
        await apiRequest('/api/auth/logout', {
            method: 'POST',
            accessToken,
            refreshToken,
        });
    } catch (error: any) {
        console.error("Logout failed:", error.message);
        if (error instanceof ApiError && (error.code === 401 || error.status === 'INVALID_TOKEN' || error.status === 'UNAUTHORIZED' || error.status === 'UNAUTHENTICATED')) {
            // continue to finally block to clear data
        } else {
            throw error; // re-throw other errors
        }
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
