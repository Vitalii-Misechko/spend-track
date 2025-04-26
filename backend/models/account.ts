import db from '../database';
import { AppError } from '../api/middleware/error';

// Account interface
export interface Account {
  id: number;
  user_id: number;
  name: string;
  category_id: number;
  created_at: string;
  updated_at: string;
}

// Account with category name
export interface AccountWithCategory extends Account {
  category_name: string;
}

// Account with currencies
export interface AccountWithCurrencies extends AccountWithCategory {
  currencies: AccountCurrency[];
}

// Account currency interface
export interface AccountCurrency {
  id: number;
  account_id: number;
  currency_code: string;
  balance: number;
  currency_name?: string;
  currency_symbol?: string;
}

// Create account data
export interface CreateAccountData {
  name: string;
  category_id: number;
  currencies: string[];
}

// Update account data
export interface UpdateAccountData {
  name?: string;
  category_id?: number;
  currencies?: string[];
}

// Account model class
class AccountModel {
  // Create a new account
  async create(userId: number, accountData: CreateAccountData): Promise<AccountWithCurrencies> {
    try {
      // Validate account data
      if (!accountData.name || !accountData.category_id) {
        throw new AppError('Account name and category are required', 400);
      }
      
      if (!accountData.currencies || accountData.currencies.length === 0) {
        throw new AppError('At least one currency is required', 400);
      }
      
      // Check if category exists
      const category = await db.get(
        'SELECT id FROM account_categories WHERE id = ?',
        [accountData.category_id]
      );
      
      if (!category) {
        throw new AppError('Invalid account category', 400);
      }
      
      // Check if currencies exist
      for (const currencyCode of accountData.currencies) {
        const currency = await db.get(
          'SELECT code FROM currencies WHERE code = ?',
          [currencyCode]
        );
        
        if (!currency) {
          throw new AppError(`Invalid currency code: ${currencyCode}`, 400);
        }
      }
      
      // Insert account
      return await db.transaction(async (tx) => {
        // Create account
        const result = await tx.run(
          'INSERT INTO accounts (user_id, name, category_id) VALUES (?, ?, ?)',
          [userId, accountData.name, accountData.category_id]
        );
        
        const accountId = result.lastID;
        
        // Add currencies to account
        for (const currencyCode of accountData.currencies) {
          await tx.run(
            'INSERT INTO account_currencies (account_id, currency_code, balance) VALUES (?, ?, ?)',
            [accountId, currencyCode, 0]
          );
        }
        
        // Fetch the created account with currencies
        const account = await this.findById(accountId, userId);
        if (!account) throw new AppError('Failed to retrieve created account', 500);
        return account;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error creating account:', error);
      throw new AppError('Failed to create account', 500);
    }
  }
  
  // Find account by ID
  async findById(id: number, userId: number): Promise<AccountWithCurrencies | null> {
    try {
      // Get account with category
      const account = await db.get<AccountWithCategory>(
        `SELECT a.*, c.name as category_name 
         FROM accounts a 
         JOIN account_categories c ON a.category_id = c.id 
         WHERE a.id = ? AND a.user_id = ?`,
        [id, userId]
      );
      
      if (!account) {
        return null;
      }
      
      // Get account currencies
      const currencies = await db.query<AccountCurrency>(
        `SELECT ac.*, c.name as currency_name, c.symbol as currency_symbol 
         FROM account_currencies ac 
         JOIN currencies c ON ac.currency_code = c.code 
         WHERE ac.account_id = ?`,
        [id]
      );
      
      return {
        ...account,
        currencies
      };
    } catch (error) {
      console.error('Error finding account by ID:', error);
      throw new AppError('Failed to find account', 500);
    }
  }
  
  // Get all accounts for a user
  async findByUserId(userId: number): Promise<AccountWithCurrencies[]> {
    try {
      // Get all accounts with categories
      const accounts = await db.query<AccountWithCategory>(
        `SELECT a.*, c.name as category_name 
         FROM accounts a 
         JOIN account_categories c ON a.category_id = c.id 
         WHERE a.user_id = ?
         ORDER BY a.category_id, a.name`,
        [userId]
      );
      
      // Get all account currencies
      const accountsWithCurrencies: AccountWithCurrencies[] = [];
      
      for (const account of accounts) {
        const currencies = await db.query<AccountCurrency>(
          `SELECT ac.*, c.name as currency_name, c.symbol as currency_symbol 
           FROM account_currencies ac 
           JOIN currencies c ON ac.currency_code = c.code 
           WHERE ac.account_id = ?`,
          [account.id]
        );
        
        accountsWithCurrencies.push({
          ...account,
          currencies
        });
      }
      
      return accountsWithCurrencies;
    } catch (error) {
      console.error('Error finding accounts by user ID:', error);
      throw new AppError('Failed to find accounts', 500);
    }
  }
  
  // Update account
  async update(id: number, userId: number, accountData: UpdateAccountData): Promise<AccountWithCurrencies> {
    try {
      // Check if account exists and belongs to user
      const account = await this.findById(id, userId);
      
      if (!account) {
        throw new AppError('Account not found', 404);
      }
      
      // Check if category exists if provided
      if (accountData.category_id) {
        const category = await db.get(
          'SELECT id FROM account_categories WHERE id = ?',
          [accountData.category_id]
        );
        
        if (!category) {
          throw new AppError('Invalid account category', 400);
        }
      }
      
      // Check if currencies exist if provided
      if (accountData.currencies && accountData.currencies.length > 0) {
        for (const currencyCode of accountData.currencies) {
          const currency = await db.get(
            'SELECT code FROM currencies WHERE code = ?',
            [currencyCode]
          );
          
          if (!currency) {
            throw new AppError(`Invalid currency code: ${currencyCode}`, 400);
          }
        }
      }
      
      // Update account
      return await db.transaction(async (tx) => {
        // Update account fields
        if (accountData.name || accountData.category_id) {
          const updates: string[] = [];
          const values: any[] = [];
          
          if (accountData.name) {
            updates.push('name = ?');
            values.push(accountData.name);
          }
          
          if (accountData.category_id) {
            updates.push('category_id = ?');
            values.push(accountData.category_id);
          }
          
          updates.push('updated_at = CURRENT_TIMESTAMP');
          values.push(id);
          values.push(userId);
          
          await tx.run(
            `UPDATE accounts SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
            values
          );
        }
        
        // Update currencies if provided
        if (accountData.currencies && accountData.currencies.length > 0) {
          // Get current account currencies
          const currentCurrencies = await tx.query<AccountCurrency>(
            'SELECT * FROM account_currencies WHERE account_id = ?',
            [id]
          );
          
          const currentCurrencyCodes = currentCurrencies.map(c => c.currency_code);
          
          // Add new currencies
          for (const currencyCode of accountData.currencies) {
            if (!currentCurrencyCodes.includes(currencyCode)) {
              await tx.run(
                'INSERT INTO account_currencies (account_id, currency_code, balance) VALUES (?, ?, ?)',
                [id, currencyCode, 0]
              );
            }
          }
          
          // Remove currencies not in the updated list
          for (const currentCurrency of currentCurrencies) {
            if (!accountData.currencies.includes(currentCurrency.currency_code)) {
              // Check if balance is zero before removing
              if (currentCurrency.balance !== 0) {
                throw new AppError(
                  `Cannot remove currency ${currentCurrency.currency_code} with non-zero balance`,
                  400
                );
              }
              
              await tx.run(
                'DELETE FROM account_currencies WHERE id = ?',
                [currentCurrency.id]
              );
            }
          }
        }
        
        // Fetch the updated account with currencies
        const updatedAccount = await this.findById(id, userId);
        if (!updatedAccount) throw new AppError('Failed to retrieve updated account', 500);
        return updatedAccount;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error updating account:', error);
      throw new AppError('Failed to update account', 500);
    }
  }
  
  // Delete account
  async delete(id: number, userId: number): Promise<boolean> {
    try {
      // Check if account exists and belongs to user
      const account = await this.findById(id, userId);
      
      if (!account) {
        throw new AppError('Account not found', 404);
      }
      
      // Check if account has transactions
      const transactions = await db.get(
        'SELECT COUNT(*) as count FROM transactions WHERE account_id = ?',
        [id]
      );
      
      if (transactions && transactions.count > 0) {
        throw new AppError('Cannot delete account with transactions', 400);
      }
      
      // Check if account has any non-zero balances
      for (const currency of account.currencies) {
        if (currency.balance !== 0) {
          throw new AppError(`Cannot delete account with non-zero balance in ${currency.currency_code}`, 400);
        }
      }
      
      // Delete account
      return await db.transaction(async (tx) => {
        // Delete account currencies
        await tx.run('DELETE FROM account_currencies WHERE account_id = ?', [id]);
        
        // Delete account
        const result = await tx.run('DELETE FROM accounts WHERE id = ? AND user_id = ?', [id, userId]);
        
        return result.changes > 0;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error deleting account:', error);
      throw new AppError('Failed to delete account', 500);
    }
  }
  
  // Get account categories
  async getCategories(): Promise<{ id: number; name: string }[]> {
    try {
      return await db.query('SELECT id, name FROM account_categories ORDER BY name');
    } catch (error) {
      console.error('Error getting account categories:', error);
      throw new AppError('Failed to get account categories', 500);
    }
  }
}

export default new AccountModel(); 