import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware.js";
import { authenticationError } from "../utils/errors.js";

export const mockAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json(authenticationError("unauthorized", "Missing authorization header"));
    return;
  }
  
  // Mock authentication - set test user with role
  (req as AuthRequest).user = { 
    userId: 51,
    role: 'user'  // ✅ Added role to match new AuthRequest interface
  }; 
  next();
};