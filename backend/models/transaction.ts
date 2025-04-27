import db from '../database';
import { AppError } from '../api/middleware/error';

// Transaction type enum
export type TransactionType = 'expense' | 'income' | 'transfer';

// Base transaction interface
export interface Transaction {
  id: number;
  user_id: number;
  type: TransactionType;
  amount: number;
  currency_code: string;
  account_id: number;
  category_id: number | null;
  description: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

// Transaction with additional details
export interface TransactionWithDetails extends Transaction {
  account_name: string;
  category_name?: string;
  currency_symbol: string;
}

// Transfer details interface
export interface TransferDetails {
  id: number;
  transaction_id: number;
  from_account_id: number;
  to_account_id: number;
  from_amount: number;
  from_currency_code: string;
  to_amount: number;
  to_currency_code: string;
  from_account_name?: string;
  to_account_name?: string;
  from_currency_symbol?: string;
  to_currency_symbol?: string;
}

// Transaction with transfer details
export interface TransactionWithTransfer extends TransactionWithDetails {
  transfer: TransferDetails;
}

// Create expense/income transaction data
export interface CreateTransactionData {
  type: 'expense' | 'income';
  amount: number;
  currency_code: string;
  account_id: number;
  category_id: number;
  description?: string;
  transaction_date: string;
}

// Create transfer transaction data
export interface CreateTransferData {
  from_account_id: number;
  to_account_id: number;
  from_amount: number;
  from_currency_code: string;
  to_amount: number;
  to_currency_code: string;
  description?: string;
  transaction_date: string;
}

// Update transaction data
export interface UpdateTransactionData {
  amount?: number;
  currency_code?: string;
  account_id?: number;
  category_id?: number;
  description?: string;
  transaction_date?: string;
}

// Update transfer data
export interface UpdateTransferData {
  from_account_id?: number;
  to_account_id?: number;
  from_amount?: number;
  from_currency_code?: string;
  to_amount?: number;
  to_currency_code?: string;
  description?: string;
  transaction_date?: string;
}

// Filter options for transactions
export interface TransactionFilterOptions {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  accountId?: number;
  categoryId?: number;
  description?: string;
  page?: number;
  limit?: number;
}

// Transaction model class
class TransactionModel {
  // Create expense/income transaction
  async createTransaction(userId: number, transactionData: CreateTransactionData): Promise<TransactionWithDetails> {
    try {
      // Validate transaction data
      if (!transactionData.type || !['expense', 'income'].includes(transactionData.type)) {
        throw new AppError('Valid transaction type (expense/income) is required', 400);
      }
      
      if (!transactionData.amount || isNaN(transactionData.amount) || transactionData.amount <= 0) {
        throw new AppError('Valid positive amount is required', 400);
      }
      
      if (!transactionData.currency_code) {
        throw new AppError('Currency code is required', 400);
      }
      
      if (!transactionData.account_id) {
        throw new AppError('Account ID is required', 400);
      }
      
      if (!transactionData.category_id) {
        throw new AppError('Category ID is required', 400);
      }
      
      if (!transactionData.transaction_date) {
        throw new AppError('Transaction date is required', 400);
      }
      
      // Check if account exists and belongs to user
      const account = await db.get(
        'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
        [transactionData.account_id, userId]
      );
      
      if (!account) {
        throw new AppError('Invalid account', 400);
      }
      
      // Check if account has the specified currency
      const accountCurrency = await db.get(
        'SELECT * FROM account_currencies WHERE account_id = ? AND currency_code = ?',
        [transactionData.account_id, transactionData.currency_code]
      );
      
      if (!accountCurrency) {
        throw new AppError(`Account does not support ${transactionData.currency_code} currency`, 400);
      }
      
      // Check if category exists and is of correct type
      const categoryTable = transactionData.type === 'expense' 
        ? 'expense_categories' 
        : 'income_categories';
        
      const category = await db.get(
        `SELECT * FROM ${categoryTable} WHERE id = ? AND (user_id IS NULL OR user_id = ?)`,
        [transactionData.category_id, userId]
      );
      
      if (!category) {
        throw new AppError(`Invalid ${transactionData.type} category`, 400);
      }
      
      return await db.transaction(async (tx) => {
        // Create transaction
        const transactionResult = await tx.run(
          `INSERT INTO transactions (
            user_id, 
            type, 
            amount, 
            currency_code, 
            account_id, 
            category_id, 
            description, 
            transaction_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            transactionData.type,
            transactionData.amount,
            transactionData.currency_code,
            transactionData.account_id,
            transactionData.category_id,
            transactionData.description || null,
            transactionData.transaction_date
          ]
        );
        
        const transactionId = transactionResult.lastID;
        
        // Update account balance
        const balanceChange = transactionData.type === 'income' 
          ? transactionData.amount 
          : -transactionData.amount;
          
        await tx.run(
          `UPDATE account_currencies 
           SET balance = balance + ? 
           WHERE account_id = ? AND currency_code = ?`,
          [balanceChange, transactionData.account_id, transactionData.currency_code]
        );
        
        // Fetch created transaction with details
        const transaction = await this.getTransactionById(transactionId, userId);
        
        if (!transaction) {
          throw new AppError('Failed to create transaction', 500);
        }
        
        return transaction;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error creating transaction:', error);
      throw new AppError('Failed to create transaction', 500);
    }
  }
  
  // Create transfer transaction
  async createTransfer(userId: number, transferData: CreateTransferData): Promise<TransactionWithTransfer> {
    try {
      // Validate transfer data
      if (!transferData.from_account_id || !transferData.to_account_id) {
        throw new AppError('Source and destination account IDs are required', 400);
      }
      
      if (transferData.from_account_id === transferData.to_account_id) {
        throw new AppError('Source and destination accounts must be different', 400);
      }
      
      if (!transferData.from_amount || isNaN(transferData.from_amount) || transferData.from_amount <= 0) {
        throw new AppError('Valid positive source amount is required', 400);
      }
      
      if (!transferData.to_amount || isNaN(transferData.to_amount) || transferData.to_amount <= 0) {
        throw new AppError('Valid positive destination amount is required', 400);
      }
      
      if (!transferData.from_currency_code || !transferData.to_currency_code) {
        throw new AppError('Source and destination currency codes are required', 400);
      }
      
      if (!transferData.transaction_date) {
        throw new AppError('Transaction date is required', 400);
      }
      
      // Check if accounts exist and belong to user
      const fromAccount = await db.get(
        'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
        [transferData.from_account_id, userId]
      );
      
      if (!fromAccount) {
        throw new AppError('Invalid source account', 400);
      }
      
      const toAccount = await db.get(
        'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
        [transferData.to_account_id, userId]
      );
      
      if (!toAccount) {
        throw new AppError('Invalid destination account', 400);
      }
      
      // Check if accounts have the specified currencies
      const fromAccountCurrency = await db.get(
        'SELECT * FROM account_currencies WHERE account_id = ? AND currency_code = ?',
        [transferData.from_account_id, transferData.from_currency_code]
      );
      
      if (!fromAccountCurrency) {
        throw new AppError(`Source account does not support ${transferData.from_currency_code} currency`, 400);
      }
      
      const toAccountCurrency = await db.get(
        'SELECT * FROM account_currencies WHERE account_id = ? AND currency_code = ?',
        [transferData.to_account_id, transferData.to_currency_code]
      );
      
      if (!toAccountCurrency) {
        throw new AppError(`Destination account does not support ${transferData.to_currency_code} currency`, 400);
      }
      
      // Check if source account has sufficient balance
      if (fromAccountCurrency.balance < transferData.from_amount) {
        throw new AppError('Insufficient balance in source account', 400);
      }
      
      return await db.transaction(async (tx) => {
        // Create transaction
        const transactionResult = await tx.run(
          `INSERT INTO transactions (
            user_id, 
            type, 
            amount, 
            currency_code, 
            account_id, 
            description, 
            transaction_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            'transfer',
            transferData.from_amount,
            transferData.from_currency_code,
            transferData.from_account_id,
            transferData.description || null,
            transferData.transaction_date
          ]
        );
        
        const transactionId = transactionResult.lastID;
        
        // Create transfer details
        await tx.run(
          `INSERT INTO transfers (
            transaction_id, 
            from_account_id, 
            to_account_id, 
            from_amount, 
            from_currency_code, 
            to_amount, 
            to_currency_code
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            transactionId,
            transferData.from_account_id,
            transferData.to_account_id,
            transferData.from_amount,
            transferData.from_currency_code,
            transferData.to_amount,
            transferData.to_currency_code
          ]
        );
        
        // Update account balances
        await tx.run(
          `UPDATE account_currencies 
           SET balance = balance - ? 
           WHERE account_id = ? AND currency_code = ?`,
          [transferData.from_amount, transferData.from_account_id, transferData.from_currency_code]
        );
        
        await tx.run(
          `UPDATE account_currencies 
           SET balance = balance + ? 
           WHERE account_id = ? AND currency_code = ?`,
          [transferData.to_amount, transferData.to_account_id, transferData.to_currency_code]
        );
        
        // Fetch created transfer with details
        const transfer = await this.getTransactionById(transactionId, userId);
        
        if (!transfer || transfer.type !== 'transfer') {
          throw new AppError('Failed to create transfer', 500);
        }
        
        return transfer as TransactionWithTransfer;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error creating transfer:', error);
      throw new AppError('Failed to create transfer', 500);
    }
  }
  
  // Update transaction
  async updateTransaction(id: number, userId: number, transactionData: UpdateTransactionData): Promise<TransactionWithDetails> {
    try {
      // Get current transaction
      const transaction = await this.getTransactionById(id, userId);
      
      if (!transaction) {
        throw new AppError('Transaction not found', 404);
      }
      
      // Cannot update transfers with this method
      if (transaction.type === 'transfer') {
        throw new AppError('Use updateTransfer method for transfer transactions', 400);
      }
      
      // Validate transaction data
      if (transactionData.amount !== undefined && (isNaN(transactionData.amount) || transactionData.amount <= 0)) {
        throw new AppError('Amount must be a positive number', 400);
      }
      
      // Check if account exists and belongs to user if provided
      if (transactionData.account_id) {
        const account = await db.get(
          'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
          [transactionData.account_id, userId]
        );
        
        if (!account) {
          throw new AppError('Invalid account', 400);
        }
      }
      
      // Check if category exists and is of correct type if provided
      if (transactionData.category_id) {
        const categoryTable = transaction.type === 'expense' 
          ? 'expense_categories' 
          : 'income_categories';
          
        const category = await db.get(
          `SELECT * FROM ${categoryTable} WHERE id = ? AND (user_id IS NULL OR user_id = ?)`,
          [transactionData.category_id, userId]
        );
        
        if (!category) {
          throw new AppError(`Invalid ${transaction.type} category`, 400);
        }
      }
      
      // Check if currency is supported by account
      const accountId = transactionData.account_id || transaction.account_id;
      const currencyCode = transactionData.currency_code || transaction.currency_code;
      
      if (transactionData.account_id || transactionData.currency_code) {
        const accountCurrency = await db.get(
          'SELECT * FROM account_currencies WHERE account_id = ? AND currency_code = ?',
          [accountId, currencyCode]
        );
        
        if (!accountCurrency) {
          throw new AppError(`Account does not support ${currencyCode} currency`, 400);
        }
      }
      
      return await db.transaction(async (tx) => {
        // Revert original account balance
        const originalBalanceChange = transaction.type === 'income' 
          ? -transaction.amount 
          : transaction.amount;
          
        await tx.run(
          `UPDATE account_currencies 
           SET balance = balance + ? 
           WHERE account_id = ? AND currency_code = ?`,
          [originalBalanceChange, transaction.account_id, transaction.currency_code]
        );
        
        // Build update query
        const updates: string[] = [];
        const values: any[] = [];
        
        if (transactionData.amount !== undefined) {
          updates.push('amount = ?');
          values.push(transactionData.amount);
        }
        
        if (transactionData.currency_code) {
          updates.push('currency_code = ?');
          values.push(transactionData.currency_code);
        }
        
        if (transactionData.account_id) {
          updates.push('account_id = ?');
          values.push(transactionData.account_id);
        }
        
        if (transactionData.category_id) {
          updates.push('category_id = ?');
          values.push(transactionData.category_id);
        }
        
        if (transactionData.description !== undefined) {
          updates.push('description = ?');
          values.push(transactionData.description || null);
        }
        
        if (transactionData.transaction_date) {
          updates.push('transaction_date = ?');
          values.push(transactionData.transaction_date);
        }
        
        updates.push('updated_at = CURRENT_TIMESTAMP');
        
        // Add transaction ID and user ID to values
        values.push(id);
        values.push(userId);
        
        // Update transaction
        await tx.run(
          `UPDATE transactions SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
          values
        );
        
        // Update new account balance
        const amount = transactionData.amount !== undefined ? transactionData.amount : transaction.amount;
        const newBalanceChange = transaction.type === 'income' 
          ? amount 
          : -amount;
          
        await tx.run(
          `UPDATE account_currencies 
           SET balance = balance + ? 
           WHERE account_id = ? AND currency_code = ?`,
          [newBalanceChange, accountId, currencyCode]
        );
        
        // Fetch updated transaction with details
        const updatedTransaction = await this.getTransactionById(id, userId);
        
        if (!updatedTransaction) {
          throw new AppError('Failed to update transaction', 500);
        }
        
        return updatedTransaction;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error updating transaction:', error);
      throw new AppError('Failed to update transaction', 500);
    }
  }
  
  // Update transfer
  async updateTransfer(id: number, userId: number, transferData: UpdateTransferData): Promise<TransactionWithTransfer> {
    try {
      // Get current transaction
      const transaction = await this.getTransactionById(id, userId);
      
      if (!transaction) {
        throw new AppError('Transaction not found', 404);
      }
      
      // Must be a transfer
      if (transaction.type !== 'transfer') {
        throw new AppError('Transaction is not a transfer', 400);
      }
      
      // Get transfer details
      const transferDetails = await db.get<TransferDetails>(
        `SELECT * FROM transfers WHERE transaction_id = ?`,
        [id]
      );
      
      if (!transferDetails) {
        throw new AppError('Transfer details not found', 404);
      }
      
      // Validate transfer data
      if (transferData.from_amount !== undefined && (isNaN(transferData.from_amount) || transferData.from_amount <= 0)) {
        throw new AppError('Source amount must be a positive number', 400);
      }
      
      if (transferData.to_amount !== undefined && (isNaN(transferData.to_amount) || transferData.to_amount <= 0)) {
        throw new AppError('Destination amount must be a positive number', 400);
      }
      
      const fromAccountId = transferData.from_account_id || transferDetails.from_account_id;
      const toAccountId = transferData.to_account_id || transferDetails.to_account_id;
      
      if (fromAccountId === toAccountId) {
        throw new AppError('Source and destination accounts must be different', 400);
      }
      
      // Check if accounts exist and belong to user
      if (transferData.from_account_id) {
        const fromAccount = await db.get(
          'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
          [transferData.from_account_id, userId]
        );
        
        if (!fromAccount) {
          throw new AppError('Invalid source account', 400);
        }
      }
      
      if (transferData.to_account_id) {
        const toAccount = await db.get(
          'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
          [transferData.to_account_id, userId]
        );
        
        if (!toAccount) {
          throw new AppError('Invalid destination account', 400);
        }
      }
      
      // Check if currencies are supported by accounts
      const fromCurrencyCode = transferData.from_currency_code || transferDetails.from_currency_code;
      const toCurrencyCode = transferData.to_currency_code || transferDetails.to_currency_code;
      
      if (transferData.from_account_id || transferData.from_currency_code) {
        const fromAccountCurrency = await db.get(
          'SELECT * FROM account_currencies WHERE account_id = ? AND currency_code = ?',
          [fromAccountId, fromCurrencyCode]
        );
        
        if (!fromAccountCurrency) {
          throw new AppError(`Source account does not support ${fromCurrencyCode} currency`, 400);
        }
      }
      
      if (transferData.to_account_id || transferData.to_currency_code) {
        const toAccountCurrency = await db.get(
          'SELECT * FROM account_currencies WHERE account_id = ? AND currency_code = ?',
          [toAccountId, toCurrencyCode]
        );
        
        if (!toAccountCurrency) {
          throw new AppError(`Destination account does not support ${toCurrencyCode} currency`, 400);
        }
      }
      
      return await db.transaction(async (tx) => {
        // Revert original account balances
        await tx.run(
          `UPDATE account_currencies 
           SET balance = balance + ? 
           WHERE account_id = ? AND currency_code = ?`,
          [transferDetails.from_amount, transferDetails.from_account_id, transferDetails.from_currency_code]
        );
        
        await tx.run(
          `UPDATE account_currencies 
           SET balance = balance - ? 
           WHERE account_id = ? AND currency_code = ?`,
          [transferDetails.to_amount, transferDetails.to_account_id, transferDetails.to_currency_code]
        );
        
        // Update transaction
        if (transferData.description !== undefined || transferData.transaction_date) {
          const updates: string[] = [];
          const values: any[] = [];
          
          if (transferData.description !== undefined) {
            updates.push('description = ?');
            values.push(transferData.description || null);
          }
          
          if (transferData.transaction_date) {
            updates.push('transaction_date = ?');
            values.push(transferData.transaction_date);
          }
          
          updates.push('updated_at = CURRENT_TIMESTAMP');
          
          // Add transaction ID and user ID to values
          values.push(id);
          values.push(userId);
          
          await tx.run(
            `UPDATE transactions SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
            values
          );
        }
        
        // Update main transaction amount and currency if from amount or currency changed
        if (transferData.from_amount !== undefined || transferData.from_currency_code) {
          const fromAmount = transferData.from_amount !== undefined 
            ? transferData.from_amount 
            : transferDetails.from_amount;
            
          await tx.run(
            `UPDATE transactions 
             SET amount = ?, currency_code = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ? AND user_id = ?`,
            [
              fromAmount, 
              fromCurrencyCode, 
              id, 
              userId
            ]
          );
        }
        
        // Update from account if changed
        if (transferData.from_account_id) {
          await tx.run(
            `UPDATE transactions 
             SET account_id = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ? AND user_id = ?`,
            [
              transferData.from_account_id, 
              id, 
              userId
            ]
          );
        }
        
        // Update transfer details
        const transferUpdates: string[] = [];
        const transferValues: any[] = [];
        
        if (transferData.from_account_id) {
          transferUpdates.push('from_account_id = ?');
          transferValues.push(transferData.from_account_id);
        }
        
        if (transferData.to_account_id) {
          transferUpdates.push('to_account_id = ?');
          transferValues.push(transferData.to_account_id);
        }
        
        if (transferData.from_amount !== undefined) {
          transferUpdates.push('from_amount = ?');
          transferValues.push(transferData.from_amount);
        }
        
        if (transferData.from_currency_code) {
          transferUpdates.push('from_currency_code = ?');
          transferValues.push(transferData.from_currency_code);
        }
        
        if (transferData.to_amount !== undefined) {
          transferUpdates.push('to_amount = ?');
          transferValues.push(transferData.to_amount);
        }
        
        if (transferData.to_currency_code) {
          transferUpdates.push('to_currency_code = ?');
          transferValues.push(transferData.to_currency_code);
        }
        
        // Add transfer ID to values
        transferValues.push(transferDetails.id);
        
        if (transferUpdates.length > 0) {
          await tx.run(
            `UPDATE transfers SET ${transferUpdates.join(', ')} WHERE id = ?`,
            transferValues
          );
        }
        
        // Apply new account balances
        const fromAmount = transferData.from_amount !== undefined 
          ? transferData.from_amount 
          : transferDetails.from_amount;
          
        const toAmount = transferData.to_amount !== undefined 
          ? transferData.to_amount 
          : transferDetails.to_amount;
          
        await tx.run(
          `UPDATE account_currencies 
           SET balance = balance - ? 
           WHERE account_id = ? AND currency_code = ?`,
          [fromAmount, fromAccountId, fromCurrencyCode]
        );
        
        await tx.run(
          `UPDATE account_currencies 
           SET balance = balance + ? 
           WHERE account_id = ? AND currency_code = ?`,
          [toAmount, toAccountId, toCurrencyCode]
        );
        
        // Fetch updated transfer with details
        const updatedTransfer = await this.getTransactionById(id, userId);
        
        if (!updatedTransfer || updatedTransfer.type !== 'transfer') {
          throw new AppError('Failed to update transfer', 500);
        }
        
        return updatedTransfer as TransactionWithTransfer;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error updating transfer:', error);
      throw new AppError('Failed to update transfer', 500);
    }
  }
  
  // Delete transaction
  async deleteTransaction(id: number, userId: number): Promise<boolean> {
    try {
      // Get current transaction
      const transaction = await this.getTransactionById(id, userId);
      
      if (!transaction) {
        throw new AppError('Transaction not found', 404);
      }
      
      return await db.transaction(async (tx) => {
        if (transaction.type === 'transfer') {
          // Get transfer details
          const transferDetails = await tx.get<TransferDetails>(
            `SELECT * FROM transfers WHERE transaction_id = ?`,
            [id]
          );
          
          if (transferDetails) {
            // Revert account balances for transfer
            await tx.run(
              `UPDATE account_currencies 
               SET balance = balance + ? 
               WHERE account_id = ? AND currency_code = ?`,
              [
                transferDetails.from_amount, 
                transferDetails.from_account_id, 
                transferDetails.from_currency_code
              ]
            );
            
            await tx.run(
              `UPDATE account_currencies 
               SET balance = balance - ? 
               WHERE account_id = ? AND currency_code = ?`,
              [
                transferDetails.to_amount, 
                transferDetails.to_account_id, 
                transferDetails.to_currency_code
              ]
            );
            
            // Delete transfer
            await tx.run('DELETE FROM transfers WHERE transaction_id = ?', [id]);
          }
        } else {
          // Revert account balance for expense/income
          const balanceChange = transaction.type === 'income' 
            ? -transaction.amount 
            : transaction.amount;
            
          await tx.run(
            `UPDATE account_currencies 
             SET balance = balance + ? 
             WHERE account_id = ? AND currency_code = ?`,
            [balanceChange, transaction.account_id, transaction.currency_code]
          );
        }
        
        // Delete transaction
        const result = await tx.run(
          'DELETE FROM transactions WHERE id = ? AND user_id = ?',
          [id, userId]
        );
        
        return result.changes > 0;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error deleting transaction:', error);
      throw new AppError('Failed to delete transaction', 500);
    }
  }
  
  // Get transaction by ID
  async getTransactionById(id: number, userId: number): Promise<TransactionWithDetails | TransactionWithTransfer | null> {
    try {
      // Get transaction with basic details
      const transaction = await db.get<TransactionWithDetails>(
        `SELECT t.*, 
                a.name as account_name, 
                c.symbol as currency_symbol, 
                CASE 
                  WHEN t.type = 'expense' THEN ec.name
                  WHEN t.type = 'income' THEN ic.name
                  ELSE NULL 
                END as category_name
         FROM transactions t
         JOIN accounts a ON t.account_id = a.id
         JOIN currencies c ON t.currency_code = c.code
         LEFT JOIN expense_categories ec ON t.type = 'expense' AND t.category_id = ec.id
         LEFT JOIN income_categories ic ON t.type = 'income' AND t.category_id = ic.id
         WHERE t.id = ? AND t.user_id = ?`,
        [id, userId]
      );
      
      if (!transaction) {
        return null;
      }
      
      // If transfer, get transfer details
      if (transaction.type === 'transfer') {
        const transferDetails = await db.get<TransferDetails>(
          `SELECT tr.*, 
                  from_a.name as from_account_name, 
                  to_a.name as to_account_name,
                  from_c.symbol as from_currency_symbol,
                  to_c.symbol as to_currency_symbol
           FROM transfers tr
           JOIN accounts from_a ON tr.from_account_id = from_a.id
           JOIN accounts to_a ON tr.to_account_id = to_a.id
           JOIN currencies from_c ON tr.from_currency_code = from_c.code
           JOIN currencies to_c ON tr.to_currency_code = to_c.code
           WHERE tr.transaction_id = ?`,
          [id]
        );
        
        if (transferDetails) {
          return {
            ...transaction,
            transfer: transferDetails
          };
        }
      }
      
      return transaction;
    } catch (error) {
      console.error('Error getting transaction by ID:', error);
      throw new AppError('Failed to get transaction', 500);
    }
  }
  
  // Get transactions for user with filters
  async getTransactions(userId: number, filters: TransactionFilterOptions = {}): Promise<(TransactionWithDetails | TransactionWithTransfer)[]> {
    try {
      // Build query
      let sql = `
        SELECT t.*, 
               a.name as account_name, 
               c.symbol as currency_symbol, 
               CASE 
                 WHEN t.type = 'expense' THEN ec.name
                 WHEN t.type = 'income' THEN ic.name
                 ELSE NULL 
               END as category_name
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        JOIN currencies c ON t.currency_code = c.code
        LEFT JOIN expense_categories ec ON t.type = 'expense' AND t.category_id = ec.id
        LEFT JOIN income_categories ic ON t.type = 'income' AND t.category_id = ic.id
        WHERE t.user_id = ?
      `;
      
      const queryParams: any[] = [userId];
      
      // Add filters
      if (filters.startDate) {
        sql += ' AND t.transaction_date >= ?';
        queryParams.push(filters.startDate);
      }
      
      if (filters.endDate) {
        sql += ' AND t.transaction_date <= ?';
        queryParams.push(filters.endDate);
      }
      
      if (filters.type) {
        sql += ' AND t.type = ?';
        queryParams.push(filters.type);
      }
      
      if (filters.accountId) {
        sql += ' AND t.account_id = ?';
        queryParams.push(filters.accountId);
      }
      
      if (filters.categoryId) {
        sql += ' AND t.category_id = ?';
        queryParams.push(filters.categoryId);
      }
      
      if (filters.description) {
        sql += ' AND t.description LIKE ?';
        queryParams.push(`%${filters.description}%`);
      }
      
      // Add order and pagination
      sql += ' ORDER BY t.transaction_date DESC, t.id DESC';
      
      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
      const offset = (page - 1) * limit;
      
      sql += ' LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
      
      // Execute query
      const transactions = await db.query<TransactionWithDetails>(sql, queryParams);
      
      // Get transfer details for transfer transactions
      const result: (TransactionWithDetails | TransactionWithTransfer)[] = [];
      
      for (const transaction of transactions) {
        if (transaction.type === 'transfer') {
          const transferDetails = await db.get<TransferDetails>(
            `SELECT tr.*, 
                    from_a.name as from_account_name, 
                    to_a.name as to_account_name,
                    from_c.symbol as from_currency_symbol,
                    to_c.symbol as to_currency_symbol
             FROM transfers tr
             JOIN accounts from_a ON tr.from_account_id = from_a.id
             JOIN accounts to_a ON tr.to_account_id = to_a.id
             JOIN currencies from_c ON tr.from_currency_code = from_c.code
             JOIN currencies to_c ON tr.to_currency_code = to_c.code
             WHERE tr.transaction_id = ?`,
            [transaction.id]
          );
          
          if (transferDetails) {
            result.push({
              ...transaction,
              transfer: transferDetails
            });
          } else {
            result.push(transaction);
          }
        } else {
          result.push(transaction);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw new AppError('Failed to get transactions', 500);
    }
  }
  
  // Get recent transactions for user
  async getRecentTransactions(userId: number, limit: number = 10): Promise<(TransactionWithDetails | TransactionWithTransfer)[]> {
    return this.getTransactions(userId, { limit });
  }
  
  // Count transactions for pagination
  async countTransactions(userId: number, filters: TransactionFilterOptions = {}): Promise<number> {
    try {
      // Build query
      let sql = 'SELECT COUNT(*) as count FROM transactions t WHERE t.user_id = ?';
      const queryParams: any[] = [userId];
      
      // Add filters
      if (filters.startDate) {
        sql += ' AND t.transaction_date >= ?';
        queryParams.push(filters.startDate);
      }
      
      if (filters.endDate) {
        sql += ' AND t.transaction_date <= ?';
        queryParams.push(filters.endDate);
      }
      
      if (filters.type) {
        sql += ' AND t.type = ?';
        queryParams.push(filters.type);
      }
      
      if (filters.accountId) {
        sql += ' AND t.account_id = ?';
        queryParams.push(filters.accountId);
      }
      
      if (filters.categoryId) {
        sql += ' AND t.category_id = ?';
        queryParams.push(filters.categoryId);
      }
      
      if (filters.description) {
        sql += ' AND t.description LIKE ?';
        queryParams.push(`%${filters.description}%`);
      }
      
      // Execute query
      const result = await db.get<{ count: number }>(sql, queryParams);
      
      return result ? result.count : 0;
    } catch (error) {
      console.error('Error counting transactions:', error);
      throw new AppError('Failed to count transactions', 500);
    }
  }
}

export default new TransactionModel(); 