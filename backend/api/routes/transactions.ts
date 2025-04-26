import Router from '@koa/router';
import transactionModel, { 
  CreateTransactionData, 
  CreateTransferData, 
  UpdateTransactionData, 
  UpdateTransferData,
  TransactionFilterOptions
} from '../../models/transaction';
import { AppError } from '../middleware/error';
import { Context } from 'koa';

const router = new Router();

// Get all transactions with filters
router.get('/', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    // Parse filter parameters
    const filters: TransactionFilterOptions = {};
    
    if (ctx.query.startDate) {
      filters.startDate = ctx.query.startDate as string;
    }
    
    if (ctx.query.endDate) {
      filters.endDate = ctx.query.endDate as string;
    }
    
    if (ctx.query.type && ['expense', 'income', 'transfer'].includes(ctx.query.type as string)) {
      filters.type = ctx.query.type as 'expense' | 'income' | 'transfer';
    }
    
    if (ctx.query.accountId) {
      filters.accountId = parseInt(ctx.query.accountId as string);
    }
    
    if (ctx.query.categoryId) {
      filters.categoryId = parseInt(ctx.query.categoryId as string);
    }
    
    if (ctx.query.description) {
      filters.description = ctx.query.description as string;
    }
    
    if (ctx.query.page) {
      filters.page = parseInt(ctx.query.page as string);
    }
    
    if (ctx.query.limit) {
      filters.limit = parseInt(ctx.query.limit as string);
    }
    
    // Get transactions
    const transactions = await transactionModel.getTransactions(ctx.user.id, filters);
    
    // Get total count for pagination
    const total = await transactionModel.countTransactions(ctx.user.id, filters);
    
    ctx.body = {
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: filters.page || 1,
          limit: filters.limit || 10,
          pages: Math.ceil(total / (filters.limit || 10))
        }
      }
    };
  } catch (error) {
    throw error;
  }
});

// Get recent transactions
router.get('/recent', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const limit = ctx.query.limit ? parseInt(ctx.query.limit as string) : 10;
    
    const transactions = await transactionModel.getRecentTransactions(ctx.user.id, limit);
    
    ctx.body = {
      success: true,
      data: transactions
    };
  } catch (error) {
    throw error;
  }
});

// Get transaction by ID
router.get('/:id', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const id = parseInt(ctx.params.id);
    
    if (isNaN(id)) {
      throw new AppError('Invalid transaction ID', 400);
    }
    
    const transaction = await transactionModel.getTransactionById(id, ctx.user.id);
    
    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }
    
    ctx.body = {
      success: true,
      data: transaction
    };
  } catch (error) {
    throw error;
  }
});

// Create expense/income transaction
router.post('/', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const transactionData = ctx.request.body as CreateTransactionData;
    
    // Validate transaction type
    if (!transactionData.type || !['expense', 'income'].includes(transactionData.type)) {
      throw new AppError('Valid transaction type (expense/income) is required', 400);
    }
    
    const transaction = await transactionModel.createTransaction(ctx.user.id, transactionData);
    
    ctx.status = 201;
    ctx.body = {
      success: true,
      data: transaction
    };
  } catch (error) {
    throw error;
  }
});

// Create transfer transaction
router.post('/transfer', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const transferData = ctx.request.body as CreateTransferData;
    
    const transfer = await transactionModel.createTransfer(ctx.user.id, transferData);
    
    ctx.status = 201;
    ctx.body = {
      success: true,
      data: transfer
    };
  } catch (error) {
    throw error;
  }
});

// Update expense/income transaction
router.put('/:id', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const id = parseInt(ctx.params.id);
    
    if (isNaN(id)) {
      throw new AppError('Invalid transaction ID', 400);
    }
    
    const transactionData = ctx.request.body as UpdateTransactionData;
    
    const transaction = await transactionModel.updateTransaction(id, ctx.user.id, transactionData);
    
    ctx.body = {
      success: true,
      data: transaction
    };
  } catch (error) {
    throw error;
  }
});

// Update transfer transaction
router.put('/transfer/:id', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const id = parseInt(ctx.params.id);
    
    if (isNaN(id)) {
      throw new AppError('Invalid transaction ID', 400);
    }
    
    const transferData: UpdateTransferData = ctx.request.body as UpdateTransferData;
    
    const transfer = await transactionModel.updateTransfer(id, ctx.user.id, transferData);
    
    ctx.body = {
      success: true,
      data: transfer
    };
  } catch (error) {
    throw error;
  }
});

// Delete transaction
router.delete('/:id', async (ctx: Context) => {
  try {
    if (!ctx.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const id = parseInt(ctx.params.id);
    
    if (isNaN(id)) {
      throw new AppError('Invalid transaction ID', 400);
    }
    
    const success = await transactionModel.deleteTransaction(id, ctx.user.id);
    
    if (!success) {
      throw new AppError('Failed to delete transaction', 500);
    }
    
    ctx.body = {
      success: true,
      message: 'Transaction deleted successfully'
    };
  } catch (error) {
    throw error;
  }
});

export default router; 