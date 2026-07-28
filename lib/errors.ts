/**
 * Error handling utilities for the M-Pesa application
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(400, message, code || 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Unauthorized', code?: string) {
    super(401, message, code || 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Forbidden', code?: string) {
    super(403, message, code || 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not found', code?: string) {
    super(404, message, code || 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code?: string) {
    super(409, message, code || 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(429, message, 'RATE_LIMITED')
    this.name = 'RateLimitError'
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', code?: string) {
    super(500, message, code || 'INTERNAL_SERVER_ERROR')
    this.name = 'InternalServerError'
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}

export function getErrorStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode
  }
  return 500
}

/**
 * Log errors securely without exposing sensitive data
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  const timestamp = new Date().toISOString()
  const message = getErrorMessage(error)
  const statusCode = getErrorStatusCode(error)

  console.error('[ERROR]', {
    timestamp,
    message,
    statusCode,
    context: {
      ...context,
      // Don't log sensitive data
      password: undefined,
      secret: undefined,
      token: undefined,
    },
  })
}
