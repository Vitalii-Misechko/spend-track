import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

// Configure sqlite3 to use verbose mode for better error messages
sqlite3.verbose();

// Database file path
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');

// Create database directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create and initialize the database connection
let db: sqlite3.Database;

const initializeDatabase = async (): Promise<sqlite3.Database> => {
  return new Promise((resolve, reject) => {
    console.log(`Connecting to SQLite database at: ${dbPath}`);
    
    // Create a new database connection
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error connecting to database:', err.message);
        reject(err);
        return;
      }
      
      console.log('Connected to SQLite database');
      
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('Error enabling foreign keys:', err.message);
          reject(err);
          return;
        }
        
        // Load and execute schema SQL
        const schemaPath = path.join(__dirname, 'schema.sql');
        fs.readFile(schemaPath, 'utf8', (err, sql) => {
          if (err) {
            console.error('Error reading schema file:', err.message);
            reject(err);
            return;
          }
          
          // Execute schema SQL in a transaction
          db.exec(sql, (err) => {
            if (err) {
              console.error('Error initializing database schema:', err.message);
              reject(err);
              return;
            }
            
            console.log('Database schema initialized successfully');
            resolve(db);
          });
        });
      });
    });
  });
};

// Execute a query with parameters
const query = async <T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Query error:', err.message);
        console.error('SQL:', sql);
        console.error('Params:', params);
        reject(err);
        return;
      }
      resolve(rows as T[]);
    });
  });
};

// Execute a single-result query
const get = async <T = any>(
  sql: string,
  params: any[] = []
): Promise<T | null> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('Get error:', err.message);
        console.error('SQL:', sql);
        console.error('Params:', params);
        reject(err);
        return;
      }
      resolve(row as T || null);
    });
  });
};

// Execute a query that doesn't return data
const run = async (
  sql: string,
  params: any[] = []
): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('Run error:', err.message);
        console.error('SQL:', sql);
        console.error('Params:', params);
        reject(err);
        return;
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

// Execute multiple statements in a transaction
const transaction = async <T = void>(
  callback: (db: { query: typeof query; get: typeof get; run: typeof run }) => Promise<T>
): Promise<T> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      callback({ query, get, run })
        .then((result) => {
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error committing transaction:', err.message);
              db.run('ROLLBACK');
              reject(err);
              return;
            }
            resolve(result);
          });
        })
        .catch((err) => {
          console.error('Error in transaction:', err.message);
          db.run('ROLLBACK');
          reject(err);
        });
    });
  });
};

// Close the database connection
const close = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        reject(err);
        return;
      }
      console.log('Database connection closed');
      resolve();
    });
  });
};

export default {
  initializeDatabase,
  query,
  get,
  run,
  transaction,
  close
}; 