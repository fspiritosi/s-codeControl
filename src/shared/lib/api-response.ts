import { NextResponse } from 'next/server';

// ---- Type definitions ----

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  code?: string;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ---- Helper functions ----

/**
 * Return a standardized success response.
 * @param data - The response payload
 * @param status - HTTP status code (default 200)
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true as const, data }, { status });
}

/**
 * Return a standardized error response.
 * @param error - Human-readable error message
 * @param status - HTTP status code (default 500)
 * @param code - Optional machine-readable error code
 */
export function apiError(error: string, status = 500, code?: string): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = { success: false, error };
  if (code) {
    body.code = code;
  }
  return NextResponse.json(body, { status });
}
