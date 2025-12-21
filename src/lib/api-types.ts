export class ApiError extends Error {
  public readonly code: number;
  public readonly status: string;
  public readonly details?: unknown;

  constructor(code: number, status: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface ApiResponse<T = unknown> {
  code: number;
  status: string;
  message: string | Record<string, string>;
  data: T;
}

export const buildApiErrorMessage = (responseMessage: string | Record<string, string>): string => {
  if (typeof responseMessage === "string") {
    return responseMessage;
  }
  if (typeof responseMessage === "object" && responseMessage !== null) {
    return Object.values(responseMessage).join("; ");
  }
  return "An unknown error occurred.";
};
