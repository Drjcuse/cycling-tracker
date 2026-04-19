import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware.js";
import { authenticationError } from "../utils/errors.js";
import jwt from "jsonwebtoken";


export const mockAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json(authenticationError("unauthorized", "Missing authorization header"));
    return;
  }

const token = authHeader.split(' ')[1];
  
  if (!token) {
    res.status(401).json(authenticationError("unauthorized", "Invalid authorization format"));
    return;
  }

  try {
 
    const secret = process.env.JWT_SECRET || "dev_secret";
    const decoded = jwt.verify(token, secret) as { userId: number; role?: string };
    
    (req as AuthRequest).user = { 
      userId: decoded.userId,
      role: decoded.role || 'user'
    };
    
    next();
  } catch (error) {
    
    const decoded = jwt.decode(token) as { userId: number; role?: string } | null;
    
    if (decoded && decoded.userId) {
      (req as AuthRequest).user = { 
        userId: decoded.userId,
        role: decoded.role || 'user'
      };
      next();
    } else {
      res.status(401).json(authenticationError("unauthorized", "Invalid token"));
    }
  }
};

/**
 
 */
export const mockAuthMiddlewareHardcoded = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json(authenticationError("unauthorized", "Missing authorization header"));
    return;
  }
  
 
  (req as AuthRequest).user = { 
    userId: 51,
    role: 'user'
  }; 
  next();
};