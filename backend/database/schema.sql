-- Users table for storing user information
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Hashed password
  preferred_currency TEXT DEFAULT 'USD',
  preferred_date_format TEXT DEFAULT 'MM/DD/YYYY',
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Account categories
CREATE TABLE IF NOT EXISTS account_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Currencies table
CREATE TABLE IF NOT EXISTS currencies (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES account_categories(id)
);

-- Account currencies (many-to-many relationship)
CREATE TABLE IF NOT EXISTS account_currencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  currency_code TEXT NOT NULL,
  balance REAL DEFAULT 0.0,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (currency_code) REFERENCES currencies(code),
  UNIQUE(account_id, currency_code)
);

-- Transaction categories for expenses
CREATE TABLE IF NOT EXISTS expense_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  user_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transaction categories for income
CREATE TABLE IF NOT EXISTS income_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  user_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transaction types enum: 'expense', 'income', 'transfer'
-- Transactions table for storing all transactions
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  amount REAL NOT NULL,
  currency_code TEXT NOT NULL,
  account_id INTEGER NOT NULL,
  category_id INTEGER,
  description TEXT,
  transaction_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (currency_code) REFERENCES currencies(code)
);

-- Transfer transactions table (extends transactions)
CREATE TABLE IF NOT EXISTS transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id INTEGER NOT NULL,
  from_account_id INTEGER NOT NULL,
  to_account_id INTEGER NOT NULL,
  from_amount REAL NOT NULL,
  from_currency_code TEXT NOT NULL,
  to_amount REAL NOT NULL,
  to_currency_code TEXT NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (from_account_id) REFERENCES accounts(id),
  FOREIGN KEY (to_account_id) REFERENCES accounts(id),
  FOREIGN KEY (from_currency_code) REFERENCES currencies(code),
  FOREIGN KEY (to_currency_code) REFERENCES currencies(code)
);

-- Insert default data
-- Default currencies
INSERT OR IGNORE INTO currencies (code, name, symbol) VALUES 
('USD', 'US Dollar', '$'),
('EUR', 'Euro', '€'),
('GBP', 'British Pound', '£'),
('JPY', 'Japanese Yen', '¥'),
('CAD', 'Canadian Dollar', 'C$'),
('AUD', 'Australian Dollar', 'A$'),
('CHF', 'Swiss Franc', 'CHF'),
('CNY', 'Chinese Yuan', '¥');

-- Default expense categories
INSERT OR IGNORE INTO expense_categories (id, name, user_id) VALUES 
(1, 'Food', NULL),
(2, 'Transport', NULL),
(3, 'Entertainment', NULL),
(4, 'Health', NULL),
(5, 'Education', NULL),
(6, 'Other', NULL);

-- Default income categories
INSERT OR IGNORE INTO income_categories (id, name, user_id) VALUES 
(1, 'Salary', NULL),
(2, 'Bonus', NULL),
(3, 'Gift', NULL),
(4, 'Investment', NULL),
(5, 'Other', NULL);

-- Default account categories
INSERT OR IGNORE INTO account_categories (id, name) VALUES 
(1, 'Cash'),
(2, 'Bank Account'),
(3, 'Credit Card'),
(4, 'Savings'),
(5, 'Investment');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_account_currencies_account_id ON account_currencies(account_id); 