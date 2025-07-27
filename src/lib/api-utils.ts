import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth";

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
}

export class ApiException extends Error {
  public readonly statusCode: number;
  public readonly code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
    this.code = code;
  }
}

// Standard error responses
export const ApiErrors = {
  UNAUTHORIZED: new ApiException("Unauthorized", 401, "UNAUTHORIZED"),
  FORBIDDEN: new ApiException("Forbidden", 403, "FORBIDDEN"),
  NOT_FOUND: new ApiException("Resource not found", 404, "NOT_FOUND"),
  BAD_REQUEST: new ApiException("Bad request", 400, "BAD_REQUEST"),
  INTERNAL_ERROR: new ApiException("Internal server error", 500, "INTERNAL_ERROR"),
  VALIDATION_ERROR: new ApiException("Validation failed", 422, "VALIDATION_ERROR"),
  CONFLICT: new ApiException("Resource already exists", 409, "CONFLICT"),
  TOO_MANY_REQUESTS: new ApiException("Too many requests", 429, "TOO_MANY_REQUESTS")
} as const;

// Helper to create custom error responses
export function createApiError(message: string, statusCode: number = 500, code?: string): ApiException {
  return new ApiException(message, statusCode, code);
}

// Standard success response
export function createSuccessResponse(data?: any, message?: string) {
  const response: any = { success: true };
  if (data !== undefined) response.data = data;
  if (message) response.message = message;
  return NextResponse.json(response);
}

// Standard error response
export function createErrorResponse(error: ApiException | Error, statusCode?: number) {
  const status = error instanceof ApiException ? error.statusCode : (statusCode || 500);
  const code = error instanceof ApiException ? error.code : undefined;
  
  return NextResponse.json(
    { 
      error: error.message, 
      ...(code && { code }),
      success: false 
    },
    { status }
  );
}

// Authentication middleware
export async function requireAuth(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user?.id) {
      throw ApiErrors.UNAUTHORIZED;
    }
    
    return session;
  } catch (error) {
    console.error("Authentication error:", error);
    throw ApiErrors.UNAUTHORIZED;
  }
}

// Request body validation
export async function validateRequestBody<T>(
  request: NextRequest, 
  validator: (body: unknown) => T
): Promise<T> {
  try {
    const body = await request.json();
    return validator(body);
  } catch (error) {
    console.error("Body validation error:", error);
    throw createApiError("Invalid request body", 400, "INVALID_BODY");
  }
}

// Query parameter helpers
export function getRequiredParam(url: URL, paramName: string): string {
  const value = url.searchParams.get(paramName);
  if (!value) {
    throw createApiError(`Missing required parameter: ${paramName}`, 400, "MISSING_PARAM");
  }
  return value;
}

export function getOptionalParam(url: URL, paramName: string, defaultValue?: string): string | undefined {
  return url.searchParams.get(paramName) || defaultValue;
}

export function getNumericParam(url: URL, paramName: string, required: boolean = true): number {
  const value = url.searchParams.get(paramName);
  
  if (!value) {
    if (required) {
      throw createApiError(`Missing required numeric parameter: ${paramName}`, 400, "MISSING_PARAM");
    }
    return 0;
  }
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw createApiError(`Invalid numeric parameter: ${paramName}`, 400, "INVALID_PARAM");
  }
  
  return parsed;
}

// Error handling wrapper for API routes
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("API route error:", error);
      
      if (error instanceof ApiException) {
        return createErrorResponse(error);
      }
      
      // Log unexpected errors but don't expose internal details
      return createErrorResponse(
        new ApiException("An unexpected error occurred", 500, "UNEXPECTED_ERROR")
      );
    }
  };
}

// Database operation helpers
export function handleDatabaseError(error: unknown, operation: string): never {
  console.error(`Database ${operation} error:`, error);
  
  if (error instanceof Error) {
    // Check for common database constraint errors
    if (error.message.includes('unique constraint') || error.message.includes('UNIQUE constraint')) {
      throw createApiError("Resource already exists", 409, "DUPLICATE_RESOURCE");
    }
    
    if (error.message.includes('foreign key constraint')) {
      throw createApiError("Referenced resource not found", 400, "INVALID_REFERENCE");
    }
  }
  
  throw ApiErrors.INTERNAL_ERROR;
}

// Pagination helpers
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export function getPaginationParams(url: URL): PaginationParams {
  const page = Math.max(1, getNumericParam(url, 'page', false) || 1);
  const limit = Math.min(100, Math.max(1, getNumericParam(url, 'limit', false) || 20));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function createPaginatedResponse<T>(
  data: T[], 
  total: number, 
  { page, limit }: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

// Validation schemas (basic implementations)
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  username: (username: string): boolean => {
    return /^[a-zA-Z0-9_-]{3,20}$/.test(username);
  },
  
  password: (password: string): boolean => {
    return password.length >= 6;
  },
  
  required: <T>(value: T): value is NonNullable<T> => {
    return value !== null && value !== undefined && value !== '';
  },
  
  positiveInteger: (value: number): boolean => {
    return Number.isInteger(value) && value > 0;
  },
  
  nonNegativeInteger: (value: number): boolean => {
    return Number.isInteger(value) && value >= 0;
  }
};

// Type-safe validator factory
export function createValidator<T>(schema: Record<keyof T, (value: any) => boolean>) {
  return (body: unknown): T => {
    if (!body || typeof body !== 'object') {
      throw createApiError("Request body must be an object", 400, "INVALID_BODY_TYPE");
    }
    
    const validated = {} as T;
    const bodyObj = body as Record<string, unknown>;
    
    for (const [key, validator] of Object.entries(schema) as [keyof T, (value: any) => boolean][]) {
      const value = bodyObj[key as string];
      
      if (!validator(value)) {
        throw createApiError(`Invalid field: ${String(key)}`, 400, "INVALID_FIELD");
      }
      
      validated[key] = value as T[keyof T];
    }
    
    return validated;
  };
}