import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { authenticationError, internalError } from "../utils/errors.js";

export interface AuthRequest extends Request {
  user?: { 
    userId: number;
    role: string;
  }; 
}

const isValidJwtPayload = (payload: unknown): payload is { userId: number; role: string } => {
  return typeof payload === 'object' && 
         payload !== null && 
         typeof (payload as Record<string, unknown>).userId === 'number' &&
         typeof (payload as Record<string, unknown>).role === 'string';
};

const SECRET = process.env.JWT_SECRET;

export const authenticateJWT: RequestHandler = (req, res, next): void => {
  if (!SECRET) {
    res.status(503).json(authenticationError("service_unavailable", "Authentication temporarily unavailable"));
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.warn("Auth failed: Missing authorization header", { 
      ip: req.ip || 'unknown', 
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent') || 'unknown'
    });
    res.status(401).json(authenticationError("missing_auth_header", "Missing Authorization header (Bearer <token>)"));
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    console.warn("Auth failed: Invalid token format", { 
      ip: req.ip || 'unknown',
      timestamp: new Date().toISOString(), 
      userAgent: req.get('User-Agent') || 'unknown'
    });
    res.status(401).json(authenticationError("invalid_token_format", "Token format invalid"));
    return;
  }

  try {
    const rawPayload = jwt.verify(token, SECRET);
    
    if (!isValidJwtPayload(rawPayload)) {
      console.warn("Auth failed: Malformed token payload", { 
        ip: req.ip || 'unknown',
        timestamp: new Date().toISOString(), 
        userAgent: req.get('User-Agent') || 'unknown'
      });
      res.status(403).json(authenticationError("malformed_token", "Token payload is invalid"));
      return;
    }
    
    (req as AuthRequest).user = { userId: rawPayload.userId, role: rawPayload.role };
    next();
  } catch (error: unknown) {
    const logContext = { 
      ip: req.ip || 'unknown', 
      timestamp: new Date().toISOString(), 
      userAgent: req.get('User-Agent') || 'unknown' 
    };

    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        console.warn("Auth failed: Token expired", logContext);
        res.status(403).json(authenticationError("token_expired", "Token has expired"));
        return;
      }
      
      if (error.name === 'JsonWebTokenError') {
        console.warn("Auth failed: Invalid token", logContext);
        res.status(403).json(authenticationError("invalid_token", "Invalid token"));
        return;
      }
    }

    console.error("Auth failed: Unexpected error", { ...logContext, error });
    res.status(500).json(internalError("Authentication error"));
    return;
  }
};