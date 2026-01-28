/**
 * Base application error class
 * All custom errors should extend this class
 */
export abstract class AppError extends Error {
  abstract statusCode: number;
  abstract errorCode: string;
  abstract errorType: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        type: this.errorType,
        code: this.errorCode,
        message: this.message
      }
    };
  }
}

/**
 * Resource not found (404)
 */
export class NotFoundError extends AppError {
  statusCode = 404;
  errorType = "not_found";
  errorCode = "resource_not_found";

  constructor(resource: string, id?: number | string) {
    const message = id 
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    super(message);
  }
}

/**
 * Validation failed (400)
 */
export class ValidationError extends AppError {
  statusCode = 400;
  errorType = "validation_error";
  errorCode = "validation_failed";

  constructor(message: string) {
    super(message);
  }
}

/**
 * Unauthorized - missing or invalid credentials (401)
 */
export class UnauthorizedError extends AppError {
  statusCode = 401;
  errorType = "authentication_error";
  errorCode: string;

  constructor(code: string, message: string) {
    super(message);
    this.errorCode = code;
  }
}

/**
 * Forbidden - authenticated but not authorized (403)
 */
export class ForbiddenError extends AppError {
  statusCode = 403;
  errorType = "authorization_error";
  errorCode = "access_denied";

  constructor(message: string = "You don't have permission to access this resource") {
    super(message);
  }
}

/**
 * Conflict - resource already exists (409)
 */
export class ConflictError extends AppError {
  statusCode = 409;
  errorType = "conflict";
  errorCode = "resource_conflict";

  constructor(message: string) {
    super(message);
  }
}

/**
 * Internal server error (500)
 */
export class InternalError extends AppError {
  statusCode = 500;
  errorType = "internal_error";
  errorCode = "internal_error";

  constructor(message: string = "An unexpected error occurred") {
    super(message);
  }
}