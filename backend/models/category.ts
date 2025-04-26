import db from '../database';
import { AppError } from '../api/middleware/error';

// Category type enum
export type CategoryType = 'expense' | 'income';

// Base category interface
export interface Category {
  id: number;
  name: string;
  user_id: number | null;
  created_at: string;
}

// Create category data
export interface CreateCategoryData {
  name: string;
  type: CategoryType;
}

// Update category data
export interface UpdateCategoryData {
  name: string;
}

// Category model class
class CategoryModel {
  // Create a new category
  async create(userId: number, categoryData: CreateCategoryData): Promise<Category> {
    try {
      // Validate category data
      if (!categoryData.name) {
        throw new AppError('Category name is required', 400);
      }
      
      if (!categoryData.type || !['expense', 'income'].includes(categoryData.type)) {
        throw new AppError('Valid category type (expense/income) is required', 400);
      }
      
      // Check if category with same name already exists for user
      const tableName = categoryData.type === 'expense' ? 'expense_categories' : 'income_categories';
      const existingCategory = await db.get(
        `SELECT * FROM ${tableName} WHERE name = ? AND user_id = ?`,
        [categoryData.name, userId]
      );
      
      if (existingCategory) {
        throw new AppError(`${categoryData.type} category with this name already exists`, 400);
      }
      
      // Insert category
      const result = await db.run(
        `INSERT INTO ${tableName} (name, user_id) VALUES (?, ?)`,
        [categoryData.name, userId]
      );
      
      // Fetch created category
      const category = await db.get<Category>(
        `SELECT * FROM ${tableName} WHERE id = ?`,
        [result.lastID]
      );
      
      if (!category) {
        throw new AppError('Failed to create category', 500);
      }
      
      return category;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error creating category:', error);
      throw new AppError('Failed to create category', 500);
    }
  }
  
  // Update category
  async update(id: number, userId: number, type: CategoryType, categoryData: UpdateCategoryData): Promise<Category> {
    try {
      // Validate category data
      if (!categoryData.name) {
        throw new AppError('Category name is required', 400);
      }
      
      if (!type || !['expense', 'income'].includes(type)) {
        throw new AppError('Valid category type (expense/income) is required', 400);
      }
      
      const tableName = type === 'expense' ? 'expense_categories' : 'income_categories';
      
      // Check if category exists and belongs to user
      const category = await db.get<Category>(
        `SELECT * FROM ${tableName} WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      
      if (!category) {
        throw new AppError('Category not found or cannot be modified', 404);
      }
      
      // Check if category with same name already exists for user
      const existingCategory = await db.get(
        `SELECT * FROM ${tableName} WHERE name = ? AND user_id = ? AND id != ?`,
        [categoryData.name, userId, id]
      );
      
      if (existingCategory) {
        throw new AppError(`${type} category with this name already exists`, 400);
      }
      
      // Update category
      await db.run(
        `UPDATE ${tableName} SET name = ? WHERE id = ? AND user_id = ?`,
        [categoryData.name, id, userId]
      );
      
      // Fetch updated category
      const updatedCategory = await db.get<Category>(
        `SELECT * FROM ${tableName} WHERE id = ?`,
        [id]
      );
      
      if (!updatedCategory) {
        throw new AppError('Failed to update category', 500);
      }
      
      return updatedCategory;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error updating category:', error);
      throw new AppError('Failed to update category', 500);
    }
  }
  
  // Delete category
  async delete(id: number, userId: number, type: CategoryType): Promise<boolean> {
    try {
      if (!type || !['expense', 'income'].includes(type)) {
        throw new AppError('Valid category type (expense/income) is required', 400);
      }
      
      const tableName = type === 'expense' ? 'expense_categories' : 'income_categories';
      
      // Check if category exists and belongs to user
      const category = await db.get<Category>(
        `SELECT * FROM ${tableName} WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      
      if (!category) {
        throw new AppError('Category not found or cannot be deleted', 404);
      }
      
      // Check if category is used in any transactions
      const transactionCount = await db.get(
        `SELECT COUNT(*) as count FROM transactions 
         WHERE category_id = ? AND user_id = ? AND type = ?`,
        [id, userId, type]
      );
      
      if (transactionCount && transactionCount.count > 0) {
        throw new AppError('Cannot delete category that is used in transactions', 400);
      }
      
      // Delete category
      const result = await db.run(
        `DELETE FROM ${tableName} WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      
      return result.changes > 0;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error deleting category:', error);
      throw new AppError('Failed to delete category', 500);
    }
  }
  
  // Get expense categories for user
  async getExpenseCategories(userId: number): Promise<Category[]> {
    try {
      return await db.query<Category>(
        `SELECT * FROM expense_categories 
         WHERE user_id IS NULL OR user_id = ? 
         ORDER BY name`,
        [userId]
      );
    } catch (error) {
      console.error('Error getting expense categories:', error);
      throw new AppError('Failed to get expense categories', 500);
    }
  }
  
  // Get income categories for user
  async getIncomeCategories(userId: number): Promise<Category[]> {
    try {
      return await db.query<Category>(
        `SELECT * FROM income_categories 
         WHERE user_id IS NULL OR user_id = ? 
         ORDER BY name`,
        [userId]
      );
    } catch (error) {
      console.error('Error getting income categories:', error);
      throw new AppError('Failed to get income categories', 500);
    }
  }
}

export default new CategoryModel(); 