import Router from '@koa/router';
import categoryModel, { CreateCategoryData, UpdateCategoryData, CategoryType } from '../../models/category';
import { AppError } from '../middleware/error';
import { Context } from 'koa';

const router = new Router();

// Get expense categories
router.get('/expense', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const categories = await categoryModel.getExpenseCategories(ctx.user.id);
    
    ctx.body = {
      success: true,
      data: categories
    };
  } catch (error) {
    throw error;
  }
});

// Get income categories
router.get('/income', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const categories = await categoryModel.getIncomeCategories(ctx.user.id);
    
    ctx.body = {
      success: true,
      data: categories
    };
  } catch (error) {
    throw error;
  }
});

// Create category
router.post('/', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const categoryData: CreateCategoryData = ctx.request.body as CreateCategoryData;
    
    // Validate category type
    if (!categoryData.type || !['expense', 'income'].includes(categoryData.type)) {
      throw new AppError('Valid category type (expense/income) is required', 400);
    }
    
    const category = await categoryModel.create(ctx.user.id, categoryData);
    
    ctx.status = 201;
    ctx.body = {
      success: true,
      data: category
    };
  } catch (error) {
    throw error;
  }
});

// Update category
router.put('/:type/:id', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const { type, id } = ctx.params;
    const categoryId = parseInt(id);
    
    if (isNaN(categoryId)) {
      throw new AppError('Invalid category ID', 400);
    }
    
    // Validate category type
    if (!type || !['expense', 'income'].includes(type)) {
      throw new AppError('Valid category type (expense/income) is required', 400);
    }
    
    const categoryData: UpdateCategoryData = ctx.request.body as UpdateCategoryData;
    
    const category = await categoryModel.update(
      categoryId, 
      ctx.user.id, 
      type as CategoryType, 
      categoryData
    );
    
    ctx.body = {
      success: true,
      data: category
    };
  } catch (error) {
    throw error;
  }
});

// Delete category
router.delete('/:type/:id', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const { type, id } = ctx.params;
    const categoryId = parseInt(id);
    
    if (isNaN(categoryId)) {
      throw new AppError('Invalid category ID', 400);
    }
    
    // Validate category type
    if (!type || !['expense', 'income'].includes(type)) {
      throw new AppError('Valid category type (expense/income) is required', 400);
    }
    
    const success = await categoryModel.delete(
      categoryId, 
      ctx.user.id, 
      type as CategoryType
    );
    
    if (!success) {
      throw new AppError('Failed to delete category', 500);
    }
    
    ctx.body = {
      success: true,
      message: 'Category deleted successfully'
    };
  } catch (error) {
    throw error;
  }
});

export default router;

 