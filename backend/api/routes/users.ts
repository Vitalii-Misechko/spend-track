import Router from '@koa/router';
import userModel, { UpdateUserData } from '../../models/user';
import { AppError } from '../middleware/error';
import { Context } from 'koa';

const router = new Router();

// Get current user profile
router.get('/profile', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const user = await userModel.findById(ctx.user.id);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    ctx.body = {
      success: true,
      data: userModel.sanitizeUser(user)
    };
  } catch (error) {
    throw error;
  }
});

// Update current user profile
router.put('/profile', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const userData: UpdateUserData = ctx.request.body as UpdateUserData;
    
    // Validate email format if provided
    if (userData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new AppError('Invalid email format', 400);
      }
    }
    
    // Validate password if provided
    if (userData.password) {
      if (userData.password.length < 8) {
        throw new AppError('Password must be at least 8 characters long', 400);
      }
      
      // Password complexity validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/;
      if (!passwordRegex.test(userData.password)) {
        throw new AppError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character', 400);
      }
    }
    
    const updatedUser = await userModel.update(ctx.user.id, userData);
    
    ctx.body = {
      success: true,
      data: updatedUser
    };
  } catch (error) {
    throw error;
  }
});

// Delete current user account
router.delete('/profile', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const success = await userModel.delete(ctx.user.id);
    
    if (!success) {
      throw new AppError('Failed to delete user account', 500);
    }
    
    ctx.body = {
      success: true,
      message: 'User account deleted successfully'
    };
  } catch (error) {
    throw error;
  }
});

export default router; 