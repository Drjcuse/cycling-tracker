import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";

/**
 * Global error handler
 * Catches all errors and returns consistent JSON responses
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging
  console.error("Error caught by global handler:", {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  // Handle custom AppError instances
  if (error instanceof AppError) {
    res.status(error.statusCode).json(error.toJSON());
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    error: {
      type: "internal_error",
      code: "internal_error",
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : "An unexpected error occurred"
    }
  });
};