import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "../errors/AppError.js";

/**
 * Validates request body against a Zod schema
 * Throws ValidationError if validation fails
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map(issue => issue.message).join(", ");
        next(new ValidationError(message));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validates request params against a Zod schema
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map(issue => issue.message).join(", ");
        next(new ValidationError(message));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validates request query against a Zod schema
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map(issue => issue.message).join(", ");
        next(new ValidationError(message));
      } else {
        next(error);
      }
    }
  };
};