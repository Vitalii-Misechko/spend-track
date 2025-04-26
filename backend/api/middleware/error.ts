import { Context, Next } from 'koa';

// Custom error class with status code
export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Koa Centralized error handling middleware
export default async (ctx: Context, next: Next) => {
  try {
    await next();
    
    // Handle 404 errors
    if (ctx.status === 404 && !ctx.body) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: `Not Found - ${ctx.request.url}`
      };
    }
  } catch (error) {
    console.error('Error caught by middleware:', error);
    
    // Default to 500 internal server error
    ctx.status = error instanceof AppError ? error.statusCode : 500;
    
    // Format error response
    ctx.body = {
      success: false,
      message: error instanceof Error ? error.message : 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && error instanceof Error && {
        stack: error.stack,
        details: error
      })
    };
    
    // Emit error for Koa to handle
    ctx.app.emit('error', error, ctx);
  }
}; 