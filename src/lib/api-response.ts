/**
 * Standardized JSON response helpers for the /api/v1/* REST API.
 *
 * All responses follow this envelope:
 *   { data: T }                   — success (200/201)
 *   { error: { code, message } }  — error (4xx/5xx)
 *   { data: T[], meta: { ... } }  — paginated list
 */
import { NextResponse } from "next/server";
import type { RateLimitResult } from "./rate-limit";
import { rateLimitHeaders } from "./rate-limit";

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function apiCreated<T>(data: T): NextResponse {
  return NextResponse.json({ data }, { status: 201 });
}

export function apiList<T>(
  data: T[],
  meta: PaginationMeta,
): NextResponse {
  return NextResponse.json({ data, meta }, { status: 200 });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown,
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status },
  );
}

export function apiUnauthorized(message = "Invalid or missing API key"): NextResponse {
  return apiError("unauthorized", message, 401);
}

export function apiForbidden(message = "Insufficient permissions"): NextResponse {
  return apiError("forbidden", message, 403);
}

export function apiNotFound(resource = "Resource"): NextResponse {
  return apiError("not_found", `${resource} not found`, 404);
}

export function apiValidationError(details: unknown): NextResponse {
  return apiError("validation_error", "Request validation failed", 400, details);
}

export function apiRateLimited(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: { code: "rate_limited", message: "Too many requests", retryAfterSec: result.retryAfterSec } },
    { status: 429, headers: rateLimitHeaders(result) },
  );
}

/**
 * Parse pagination params from URL search params.
 */
export function parsePagination(url: URL): { page: number; perPage: number; skip: number } {
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("per_page") ?? "25", 10) || 25));
  return { page, perPage, skip: (page - 1) * perPage };
}
