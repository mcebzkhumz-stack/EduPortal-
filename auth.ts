import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

declare module 'express' {
  interface Request {
    userId?: string;
    userRoles?: string[];
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { id?: string; userId?: string; roles?: string[] };
    req.userId = decoded.id || decoded.userId;
    req.userRoles = decoded.roles || [];
    next();
  } catch {
    return res.status(403).json({ message: 'Failed to authenticate token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRoles = req.userRoles || [];
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
};

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { id?: string; userId?: string; roles?: string[] };
    req.userId = decoded.id || decoded.userId;
    req.userRoles = decoded.roles || [];
    return next();
  } catch {
    return next();
  }
};