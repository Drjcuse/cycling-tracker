
import { Request, Response, NextFunction } from "express";

interface ErrorResponse { errors: string[] }


export const validateIdParam = (paramName: string) => (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const raw = req.params[paramName];
  const id = Number(raw);

  if (isNaN(id)) {
    const errorResponse: ErrorResponse = { errors: ["Invalid ID"] };
    res.status(400).json(errorResponse);
    return;
  }
  next();
};