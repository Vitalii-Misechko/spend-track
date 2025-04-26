import Router from '@koa/router';
import db from '../../database';
import { AppError } from '../middleware/error';
import { Context } from 'koa';

// Currency interface
interface Currency {
  code: string;
  name: string;
  symbol: string;
}

const router = new Router();

// Get all currencies
router.get('/', async (ctx: Context) => {
  try {
    const currencies = await db.query<Currency>('SELECT * FROM currencies ORDER BY name');
    
    ctx.body = {
      success: true,
      data: currencies
    };
  } catch (error) {
    console.error('Error getting currencies:', error);
    throw new AppError('Failed to get currencies', 500);
  }
});

// Get currency by code
router.get('/:code', async (ctx: Context) => {
  try {
    const { code } = ctx.params;
    
    if (!code || typeof code !== 'string') {
      throw new AppError('Currency code is required', 400);
    }
    
    const currency = await db.get<Currency>('SELECT * FROM currencies WHERE code = ?', [code.toUpperCase()]);
    
    if (!currency) {
      throw new AppError('Currency not found', 404);
    }
    
    ctx.body = {
      success: true,
      data: currency
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error getting currency by code:', error);
    throw new AppError('Failed to get currency', 500);
  }
});

export default router; 