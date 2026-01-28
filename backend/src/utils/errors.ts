export type ErrorType = 
  | "validation_error"
  | "authentication_error"
  | "authorization_error"
  | "not_found"
  | "internal_error";

interface ApiError {
  type: ErrorType;
  code: string;
  message: string;
}

interface ErrorResponse {
  error: ApiError;
}

export const createError = (
  type: ErrorType,
  code: string,
  message: string
): ErrorResponse => ({
  error: {
    type,
    code,
    message
  }
});


export const validationError = (message: string): ErrorResponse => 
  createError("validation_error", "validation_failed", message);

export const authenticationError = (code: string, message: string): ErrorResponse => 
  createError("authentication_error", code, message);

export const authorizationError = (message: string): ErrorResponse => 
  createError("authorization_error", "access_denied", message);

export const notFoundError = (resource: string): ErrorResponse => 
  createError("not_found", "resource_not_found", `${resource} not found`);

export const internalError = (message: string = "Internal server error"): ErrorResponse => 
  createError("internal_error", "internal_error", message);