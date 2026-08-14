import type { ApiErrorCode } from "@/shared/contracts/api";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, options?: { details?: unknown; status?: number }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = options?.status ?? STATUS_BY_CODE[code];
    this.details = options?.details;
  }

  static validation(message: string, details?: unknown): ApiError {
    return new ApiError("VALIDATION_ERROR", message, { details });
  }

  static unauthorized(message = "Authentication required"): ApiError {
    return new ApiError("UNAUTHORIZED", message);
  }

  static forbidden(message = "You do not have permission to perform this action"): ApiError {
    return new ApiError("FORBIDDEN", message);
  }

  static notFound(message = "Resource not found"): ApiError {
    return new ApiError("NOT_FOUND", message);
  }

  static conflict(message: string, details?: unknown): ApiError {
    return new ApiError("CONFLICT", message, { details });
  }

  static rateLimited(message = "Too many requests"): ApiError {
    return new ApiError("RATE_LIMITED", message);
  }

  static payloadTooLarge(message = "Request body is too large"): ApiError {
    return new ApiError("PAYLOAD_TOO_LARGE", message);
  }

  static internal(message = "An unexpected error occurred"): ApiError {
    return new ApiError("INTERNAL_ERROR", message);
  }
}
