import Router from '@koa/router';
import jwt from 'jsonwebtoken';
import userModel, { CreateUserData } from '../../models/user';
import { AppError } from '../middleware/error';
import { Context } from 'koa';

const router = new Router();

// Register a new user
router.post('/register', async (ctx: Context) => {
  try {
    const userData: CreateUserData = ctx.request.body as CreateUserData;
    
    // Validate required fields
    if (!userData.name || !userData.email || !userData.password) {
      throw new AppError('Name, email, and password are required', 400);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new AppError('Invalid email format', 400);
    }
    
    // Validate password strength
    if (userData.password.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400);
    }
    
    // Password complexity validation (at least one uppercase, one lowercase, one number, one special character)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/;
    if (!passwordRegex.test(userData.password)) {
      throw new AppError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character', 400);
    }
    
    // Create user
    const user = await userModel.create(userData);
    
    // Ensure secret and expiresIn are valid
    const secret = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_production';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      secret,
      { expiresIn } as jwt.SignOptions
    );
    
    // Return user and token
    ctx.status = 201;
    ctx.body = {
      success: true,
      data: {
        user,
        token
      }
    };
  } catch (error) {
    throw error;
  }
});

// Login user
router.post('/login', async (ctx: Context) => {
  try {
    const { email, password } = ctx.request.body as { email: string; password: string };
    
    // Validate required fields
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }
    
    // Find user by email
    const user = await userModel.findByEmail(email);
    
    // Check if user exists
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }
    
    // Verify password
    const isPasswordValid = await userModel.verifyPassword(user, password);
    
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }
    
    // Ensure secret and expiresIn are valid
    const secret = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_production';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      secret,
      { expiresIn } as jwt.SignOptions
    );
    
    // Return user and token
    ctx.body = {
      success: true,
      data: {
        user: userModel.sanitizeUser(user),
        token
      }
    };
  } catch (error) {
    throw error;
  }
});

export default router;