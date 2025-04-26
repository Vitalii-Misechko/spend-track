import { Context, Next } from 'koa';
import jwt from 'jsonwebtoken';
import { AppError } from './error';

// Interface for JWT payload
interface JwtPayload {
  id: number;
  email: string;
  iat?: number;
  exp?: number;
}

// Add user property to Koa context
declare module 'koa' {
  interface Context {
    user?: {
      id: number;
      email: string;
    };
  }
}

// Authentication middleware
export default async (ctx: Context, next: Next) => {
  try {
    // Get token from Authorization header
    const authHeader = ctx.header.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please log in.', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AppError('Invalid token format. Please log in again.', 401);
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_production'
      ) as JwtPayload;
      
      // Add user data to context
      ctx.user = {
        id: decoded.id,
        email: decoded.email
      };
      
      // Continue to next middleware/route handler
      await next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Your session has expired. Please log in again.', 401);
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token. Please log in again.', 401);
      } else {
        throw new AppError('Authentication failed. Please log in again.', 401);
      }
    }
  } catch (error) {
    // Let the error middleware handle the error
    throw error;
  }
}; 