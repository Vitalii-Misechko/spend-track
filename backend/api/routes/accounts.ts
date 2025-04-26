import Router from '@koa/router';
import accountModel, { CreateAccountData, UpdateAccountData } from '../../models/account';
import { AppError } from '../middleware/error';
import { Context } from 'koa';

const router = new Router();

// Get all accounts for current user
router.get('/', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const accounts = await accountModel.findByUserId(ctx.user.id);
    
    ctx.body = {
      success: true,
      data: accounts
    };
  } catch (error) {
    throw error;
  }
});

// Get account by ID
router.get('/:id', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const id = parseInt(ctx.params.id);
    
    if (isNaN(id)) {
      throw new AppError('Invalid account ID', 400);
    }
    
    const account = await accountModel.findById(id, ctx.user.id);
    
    if (!account) {
      throw new AppError('Account not found', 404);
    }
    
    ctx.body = {
      success: true,
      data: account
    };
  } catch (error) {
    throw error;
  }
});

// Create new account
router.post('/', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const accountData: CreateAccountData = ctx.request.body as CreateAccountData;
    
    // Create account
    const account = await accountModel.create(ctx.user.id, accountData);
    
    ctx.status = 201;
    ctx.body = {
      success: true,
      data: account
    };
  } catch (error) {
    throw error;
  }
});

// Update account
router.put('/:id', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const id = parseInt(ctx.params.id);
    
    if (isNaN(id)) {
      throw new AppError('Invalid account ID', 400);
    }
    
    const accountData: UpdateAccountData = ctx.request.body as UpdateAccountData;
    
    // Update account
    const account = await accountModel.update(id, ctx.user.id, accountData);
    
    ctx.body = {
      success: true,
      data: account
    };
  } catch (error) {
    throw error;
  }
});

// Delete account
router.delete('/:id', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const id = parseInt(ctx.params.id);
    
    if (isNaN(id)) {
      throw new AppError('Invalid account ID', 400);
    }
    
    // Delete account
    const success = await accountModel.delete(id, ctx.user.id);
    
    if (!success) {
      throw new AppError('Failed to delete account', 500);
    }
    
    ctx.body = {
      success: true,
      message: 'Account deleted successfully'
    };
  } catch (error) {
    throw error;
  }
});

// Get account categories
router.get('/categories/all', async (ctx: Context) => {
  try {
    const categories = await accountModel.getCategories();
    
    ctx.body = {
      success: true,
      data: categories
    };
  } catch (error) {
    throw error;
  }
});

export default router; 