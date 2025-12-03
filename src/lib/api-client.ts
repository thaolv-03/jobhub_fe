
export class ApiError extends Error {
    public readonly code: number;
    public readonly status: string;
    public readonly details?: any;

    constructor(code: number, status: string, message: string, details?: any) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

export interface ApiResponse<T = any> {
    code: number;
    status: string;
    message: string | Record<string, string>;
    data: T;
}

const buildApiErrorMessage = (responseMessage: string | Record<string, string>): string => {
    if (typeof responseMessage === 'string') {
        return responseMessage;
    }
    if (typeof responseMessage === 'object' && responseMessage !== null) {
        return Object.values(responseMessage).join('; ');
    }
    return 'An unknown error occurred.';
}


export async function apiRequest<T>(
    path: string,
    options: {
        method?: string;
        body?: any;
        accessToken?: string | null;
        refreshToken?: string | null;
    } = {}
): Promise<ApiResponse<T>> {
    const { method = 'GET', body, accessToken, refreshToken } = options;

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
        headers['Refresh-Token'] = refreshToken;
    }

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        const responseData: ApiResponse<T> = await response.json();

        if (responseData.code < 200 || responseData.code >= 300) {
            throw new ApiError(
                responseData.code,
                responseData.status,
                buildApiErrorMessage(responseData.message),
                typeof responseData.message === 'object' ? responseData.message : undefined
            );
        }

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
