
import { ApiError } from "./api-types";
import type { ApiResponse } from "./api-types";
import { fetchWithAuth } from "./fetchWithAuth";


export async function apiRequest<T>(
    path: string,
    options: {
        method?: string;
        body?: any;
        accessToken?: string | null;
        refreshToken?: string | null;
        suppressAuthFailure?: boolean;
    } = {}
): Promise<ApiResponse<T>> {
    const { method = 'GET', body, accessToken, refreshToken, suppressAuthFailure } = options;

    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`;

    const headers: HeadersInit = {
        'Accept': 'application/json',
    };

    if (body) {
        headers['Content-Type'] = 'application/json';
    }

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    if (refreshToken) {
        headers['refresh_token'] = refreshToken;
    }

    try {
        const responseData = await fetchWithAuth<T>(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            accessToken,
            suppressAuthFailure,
        });

        return responseData;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        if (error instanceof Error) {
            throw new ApiError(500, 'CLIENT_ERROR', error.message || 'A network or client error occurred.');
        }
        throw new ApiError(500, 'UNKNOWN_ERROR', 'An unknown error occurred.');
    }
}

export { ApiError };
export type { ApiResponse };
